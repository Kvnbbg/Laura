/**
 * Laura local memory RAG — optimized embeddings + ranked recall.
 * - Disk cache of vectors by content hash (no re-embed on every chat)
 * - Batch embed via Ollama /api/embed when available, else /api/embeddings
 * - Chunk long notes; RRF-style fusion of keyword + vector scores
 * - Compatible with AGENT_MEMORY_STORE / LAURA_MEMORY_STORE markdown truth
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_STORE = path.join(os.homedir(), '.laura-memory');
const CHUNK_CHARS = Number(process.env.LAURA_RAG_CHUNK_CHARS) || 1200;
const CHUNK_OVERLAP = Number(process.env.LAURA_RAG_CHUNK_OVERLAP) || 150;
const EMBED_BATCH = Number(process.env.LAURA_RAG_EMBED_BATCH) || 16;

export function memoryStoreRoot(env = process.env) {
  return (
    env.LAURA_MEMORY_STORE ||
    env.AGENT_MEMORY_STORE ||
    DEFAULT_STORE
  ).replace(/^~(?=$|[/\\])/, os.homedir());
}

export function ensureMemoryStore(root = memoryStoreRoot()) {
  mkdirSync(path.join(root, 'notes'), { recursive: true });
  mkdirSync(path.join(root, '.embed-cache'), { recursive: true });
  const indexMd = path.join(root, 'MEMORY.md');
  if (!existsSync(indexMd)) {
    writeFileSync(
      indexMd,
      '# Laura memory index\n\nMarkdown under `notes/` is the source of truth. `.embed-cache/` is disposable.\n',
      'utf8',
    );
  }
  return root;
}

function walkMarkdown(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMarkdown(full, acc);
    else if (/\.md$/i.test(name)) acc.push(full);
  }
  return acc;
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^a-z0-9àâäéèêëïîôùûüç_+.-]+/i)
    .filter((t) => t.length > 1);
}

function keywordScore(query, body) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;
  const qSet = new Map();
  for (const t of qTokens) qSet.set(t, (qSet.get(t) || 0) + 1);
  const tokens = tokenize(body);
  if (!tokens.length) return 0;
  let hits = 0;
  for (const t of tokens) if (qSet.has(t)) hits += 1;
  // slight boost for title-like first line
  const head = body.slice(0, 200).toLowerCase();
  for (const t of qSet.keys()) if (head.includes(t)) hits += 0.5;
  return hits / Math.sqrt(tokens.length + 1);
}

function chunkText(text, size = CHUNK_CHARS, overlap = CHUNK_OVERLAP) {
  const clean = String(text || '').trim();
  if (clean.length <= size) return [clean];
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    chunks.push(clean.slice(i, i + size));
    i += Math.max(size - overlap, 1);
  }
  return chunks;
}

function contentHash(text) {
  return createHash('sha256').update(text).digest('hex').slice(0, 24);
}

function cachePath(root, hash) {
  return path.join(root, '.embed-cache', `${hash}.json`);
}

function readCache(root, hash) {
  const p = cachePath(root, hash);
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    return Array.isArray(j.embedding) ? j.embedding : null;
  } catch {
    return null;
  }
}

function writeCache(root, hash, embedding, model) {
  writeFileSync(
    cachePath(root, hash),
    JSON.stringify({ model, embedding, at: new Date().toISOString() }),
    'utf8',
  );
}

async function ollamaEmbedBatch(texts, env = process.env) {
  const url = (env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  // Prefer batch endpoint
  try {
    const res = await fetch(`${url}/api/embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, input: texts }),
      signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.embeddings) && json.embeddings.length === texts.length) {
        return { model, vectors: json.embeddings };
      }
      if (Array.isArray(json.embedding) && texts.length === 1) {
        return { model, vectors: [json.embedding] };
      }
    }
  } catch {
    /* fall through */
  }
  // Sequential fallback
  const vectors = [];
  for (const text of texts) {
    try {
      const res = await fetch(`${url}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt: text.slice(0, 8000) }),
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!Array.isArray(json.embedding)) return null;
      vectors.push(json.embedding);
    } catch {
      return null;
    }
  }
  return { model, vectors };
}

function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Reciprocal rank fusion helper */
function rrfScore(rank, k = 60) {
  return 1 / (k + rank);
}

export function recordMemory({ title, body, type = 'note', root = memoryStoreRoot() }) {
  ensureMemoryStore(root);
  const slug =
    String(title || 'note')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'note';
  const hash = createHash('sha1').update(`${title}\n${body}`).digest('hex').slice(0, 8);
  const file = path.join(root, 'notes', `${type}-${slug}-${hash}.md`);
  const md = `---\ntitle: ${JSON.stringify(String(title || 'note'))}\ntype: ${type}\ncreated: ${new Date().toISOString()}\n---\n\n${body}\n`;
  writeFileSync(file, md, 'utf8');
  const indexPath = path.join(root, 'MEMORY.md');
  const line = `- [${title}](${path.relative(root, file)}) — ${String(body).slice(0, 120).replace(/\n/g, ' ')}\n`;
  writeFileSync(indexPath, readFileSync(indexPath, 'utf8') + line, 'utf8');
  return file;
}

async function embedTextsCached(texts, root, env) {
  const hashes = texts.map(contentHash);
  const vectors = new Array(texts.length).fill(null);
  const missingIdx = [];
  const missingTexts = [];
  for (let i = 0; i < texts.length; i++) {
    const cached = readCache(root, hashes[i]);
    if (cached) vectors[i] = cached;
    else {
      missingIdx.push(i);
      missingTexts.push(texts[i].slice(0, 8000));
    }
  }
  if (!missingTexts.length) return { vectors, mode: 'cache-hit', model: env.OLLAMA_EMBED_MODEL || 'nomic-embed-text' };

  for (let offset = 0; offset < missingTexts.length; offset += EMBED_BATCH) {
    const slice = missingTexts.slice(offset, offset + EMBED_BATCH);
    const batch = await ollamaEmbedBatch(slice, env);
    if (!batch) return null;
    for (let j = 0; j < slice.length; j++) {
      const idx = missingIdx[offset + j];
      vectors[idx] = batch.vectors[j];
      writeCache(root, hashes[idx], batch.vectors[j], batch.model);
    }
  }
  return {
    vectors,
    mode: missingIdx.length === texts.length ? 'embed-fresh' : 'cache-mixed',
    model: env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  };
}

export async function recallMemory(query, { limit = 6, root = memoryStoreRoot(), env = process.env } = {}) {
  ensureMemoryStore(root);
  const files = walkMarkdown(path.join(root, 'notes'));
  const units = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const chunks = chunkText(text);
    chunks.forEach((chunk, ci) => {
      units.push({
        file,
        chunkIndex: ci,
        text: chunk,
        abstract: chunk.split('\n').slice(0, 6).join(' ').slice(0, 220),
      });
    });
  }
  if (!units.length) return { hits: [], mode: 'empty', store: root };

  // Keyword ranking
  const byKeyword = units
    .map((u) => ({ ...u, kScore: keywordScore(query, u.text) }))
    .sort((a, b) => b.kScore - a.kScore);

  const embedPack = await embedTextsCached([query, ...units.map((u) => u.text)], root, env);
  let mode = 'keyword';
  let scored;

  if (embedPack && embedPack.vectors.every(Boolean)) {
    const [qVec, ...docVecs] = embedPack.vectors;
    const byVector = units
      .map((u, i) => ({ ...u, vScore: cosine(qVec, docVecs[i]) }))
      .sort((a, b) => b.vScore - a.vScore);

    const kRank = new Map(byKeyword.map((u, i) => [`${u.file}#${u.chunkIndex}`, i + 1]));
    const vRank = new Map(byVector.map((u, i) => [`${u.file}#${u.chunkIndex}`, i + 1]));

    scored = units.map((u) => {
      const key = `${u.file}#${u.chunkIndex}`;
      const k = kRank.get(key) || units.length;
      const v = vRank.get(key) || units.length;
      const fused = rrfScore(k) + rrfScore(v);
      const kScore = byKeyword.find((x) => x.file === u.file && x.chunkIndex === u.chunkIndex)?.kScore || 0;
      const vScore = byVector.find((x) => x.file === u.file && x.chunkIndex === u.chunkIndex)?.vScore || 0;
      return { ...u, score: fused + 0.01 * kScore + 0.02 * vScore, kScore, vScore };
    });
    mode = `rrf+${embedPack.mode}`;
  } else {
    scored = byKeyword.map((u) => ({ ...u, score: u.kScore }));
  }

  scored.sort((a, b) => b.score - a.score);
  // Dedupe by file, keep best chunk
  const seen = new Set();
  const hits = [];
  for (const h of scored) {
    if (h.score <= 0.001) continue;
    if (seen.has(h.file)) continue;
    seen.add(h.file);
    hits.push({
      path: h.file,
      abstract: h.abstract,
      score: Number(h.score.toFixed(5)),
      snippet: h.text.slice(0, 700),
      chunkIndex: h.chunkIndex,
    });
    if (hits.length >= limit) break;
  }
  return { hits, mode, store: root };
}

export async function buildRagContext(query, options = {}) {
  const result = await recallMemory(query, options);
  if (!result.hits.length) return { context: '', result };
  const blocks = result.hits.map(
    (h, i) =>
      `[mem ${i + 1} score=${h.score}] ${path.basename(h.path)}#${h.chunkIndex}\n${h.snippet}`,
  );
  return {
    context: `Long-term memory (local Markdown RAG, mode=${result.mode}):\n\n${blocks.join('\n\n')}`,
    result,
  };
}
