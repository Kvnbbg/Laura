/**
 * Laura local memory RAG (Markdown truth + ranked recall).
 * Compatible in spirit with tigerless-labs/agent-memory:
 * files under LAURA_MEMORY_STORE / AGENT_MEMORY_STORE are the source of truth.
 * Optional Ollama embeddings (OLLAMA_EMBED_MODEL, default nomic-embed-text).
 * Falls back to keyword BM25-ish scoring with no network beyond Ollama.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_STORE = path.join(os.homedir(), '.laura-memory');

export function memoryStoreRoot(env = process.env) {
  return (
    env.LAURA_MEMORY_STORE ||
    env.AGENT_MEMORY_STORE ||
    DEFAULT_STORE
  ).replace(/^~(?=$|[/\\])/, os.homedir());
}

export function ensureMemoryStore(root = memoryStoreRoot()) {
  const dir = path.join(root, 'notes');
  mkdirSync(dir, { recursive: true });
  const indexMd = path.join(root, 'MEMORY.md');
  if (!existsSync(indexMd)) {
    writeFileSync(
      indexMd,
      '# Laura memory index\n\nMarkdown files under `notes/` are the source of truth.\n',
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
    .split(/[^a-z0-9àâäéèêëïîôùûüç_+-]+/i)
    .filter((t) => t.length > 1);
}

function keywordScore(query, body) {
  const q = new Set(tokenize(query));
  if (!q.size) return 0;
  const tokens = tokenize(body);
  if (!tokens.length) return 0;
  let hits = 0;
  for (const t of tokens) if (q.has(t)) hits += 1;
  return hits / Math.sqrt(tokens.length);
}

async function ollamaEmbed(texts, env = process.env) {
  const url = (env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  const out = [];
  for (const text of texts) {
    try {
      const res = await fetch(`${url}/api/embeddings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt: text.slice(0, 8000) }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!Array.isArray(json.embedding)) return null;
      out.push(json.embedding);
    } catch {
      return null;
    }
  }
  return out;
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

export async function recallMemory(query, { limit = 6, root = memoryStoreRoot(), env = process.env } = {}) {
  ensureMemoryStore(root);
  const files = walkMarkdown(path.join(root, 'notes'));
  const docs = files.map((file) => {
    const text = readFileSync(file, 'utf8');
    return { file, text, abstract: text.split('\n').slice(0, 8).join(' ').slice(0, 240) };
  });
  if (!docs.length) return { hits: [], mode: 'empty', store: root };

  const embeds = await ollamaEmbed([query, ...docs.map((d) => d.text.slice(0, 4000))], env);
  let scored;
  if (embeds && embeds.length === docs.length + 1) {
    const [qVec, ...docVecs] = embeds;
    scored = docs.map((d, i) => ({
      ...d,
      score: cosine(qVec, docVecs[i]) * 0.85 + keywordScore(query, d.text) * 0.15,
    }));
  } else {
    scored = docs.map((d) => ({ ...d, score: keywordScore(query, d.text) }));
  }
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.slice(0, limit).filter((h) => h.score > 0.01);
  return {
    hits: hits.map((h) => ({
      path: h.file,
      abstract: h.abstract,
      score: Number(h.score.toFixed(4)),
      snippet: h.text.slice(0, 600),
    })),
    mode: embeds ? 'ollama-embed+keyword' : 'keyword',
    store: root,
  };
}

export async function buildRagContext(query, options = {}) {
  const result = await recallMemory(query, options);
  if (!result.hits.length) return { context: '', result };
  const blocks = result.hits.map(
    (h, i) =>
      `[mem ${i + 1} score=${h.score}] ${path.basename(h.path)}\n${h.snippet}`,
  );
  return {
    context: `Long-term memory (local Markdown RAG, mode=${result.mode}):\n\n${blocks.join('\n\n')}`,
    result,
  };
}
