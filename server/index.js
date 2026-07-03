import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST =
  process.env.HOST ||
  process.env.LAURA_API_HOST ||
  (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

const CHAT_MODELS = new Set(['mistral-small', 'mistral-medium', 'mistral-large', 'codestral-latest']);
const DEFAULT_CHAT_MODEL = 'mistral-small';
const EMBED_MODEL = 'mistral-embed';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['text/plain', 'text/markdown']);
const BLOCKED_FILE_EXTENSIONS = new Set(['.bat', '.cmd', '.com', '.exe', '.js', '.mjs', '.ps1', '.sh']);
const FILE_SIZE_LABEL = '2MB';
const REQUEST_BODY_LIMIT = '1mb';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_CHUNK_LIMIT = 3;
const SIMILARITY_THRESHOLD = 0.2;
const DEFAULT_TEMPERATURE = 0.4;
const MAX_FILES_PER_UPLOAD = 5;
const MAX_DOCUMENTS_PER_SESSION = 8;
const MAX_CHUNKS_PER_SESSION = 240;
const MAX_TEXT_CHARS = 160_000;
const DOCUMENT_SESSION_HEADER = 'x-laura-session';
const DOCUMENT_SESSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;
const DOCUMENT_TTL_MS = 30 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.LAURA_RATE_LIMIT_PER_MINUTE) || 120;
const VALID_BRIDGE_MODES = new Set(["chat", "agent", "broadcast", "social"]);
const UI_BUILDING_BLOCKS =
  "Card, Accordion, Modal, Drawer, Toast, Skeleton, Badge, Table, Pagination, Breadcrumb";
const TRUSTED_MATRIX_PUBLIC_ORIGIN = "https://techandstream.com";
const TRUSTED_MATRIX_TARGET_REPOSITORY = "french-dev-ai-tools";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = CHAT_MODELS.has(process.env.MISTRAL_MODEL ?? '')
  ? process.env.MISTRAL_MODEL
  : CHAT_MODELS.has(process.env.VITE_MISTRAL_MODEL ?? '')
    ? process.env.VITE_MISTRAL_MODEL
    : DEFAULT_CHAT_MODEL;

// Local Ollama fallback for streaming: lets the terminal chat work fully
// offline (no Mistral key needed) by pointing at a locally pulled model,
// e.g. `ollama pull laura-local` then OLLAMA_MODEL=laura-local.
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || process.env.LAURA_LOCAL_MODEL || '';
const REDACT_USER_SECRETS = process.env.LAURA_REDACT_USER_SECRETS !== 'false';
const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://techandstream.com',
  'https://www.techandstream.com',
]);
const CONFIGURED_ALLOWED_ORIGINS = new Set(
  (process.env.LAURA_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const DAILY_FALLBACK_LINKS = [
  'https://techandstream.com',
  'https://techandstream.com/matrix-citizen',
  'https://github.com/Kvnbbg/Laura',
  'https://github.com/Kvnbbg/french-dev-ai-tools',
];

const logger = {
  info: (message, meta = {}) => {
    process.stdout.write(
      `${JSON.stringify({ level: 'info', message, ...meta })}\n`
    );
  },
  warn: (message, meta = {}) => {
    process.stderr.write(
      `${JSON.stringify({ level: 'warn', message, ...meta })}\n`
    );
  },
  error: (message, meta = {}) => {
    process.stderr.write(
      `${JSON.stringify({ level: 'error', message, ...meta })}\n`
    );
  },
};

const redactLogText = (value) =>
  String(value ?? '')
    .replace(/(api[_-]?key|token|secret|password)["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .slice(0, 500);

const errorLogMeta = (error) => ({
  error: redactLogText(error?.message || error),
});

const sensitivePatterns = [
  {
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    replacement: '[REDACTED_PRIVATE_KEY]',
  },
  {
    pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
    replacement: 'Bearer [REDACTED]',
  },
  {
    pattern: /\b(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g,
    replacement: '[REDACTED_TOKEN]',
  },
  {
    pattern: /\b([A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*)\s*([:=])\s*["']?([^"'\s,;]{8,})["']?/gi,
    replacement: '$1$2[REDACTED]',
  },
];

const redactSensitiveText = (text) =>
  sensitivePatterns.reduce(
    (value, { pattern, replacement }) => value.replace(pattern, replacement),
    String(text ?? '')
  );

const containsSensitiveText = (text) =>
  sensitivePatterns.some(({ pattern }) => {
    pattern.lastIndex = 0;
    return pattern.test(String(text ?? ''));
  });

const sanitizeProviderMessages = (messages) => {
  if (!REDACT_USER_SECRETS) {
    return messages;
  }
  return messages.map((message) => ({
    ...message,
    content: redactSensitiveText(message.content),
  }));
};

const lastUserText = (messages) =>
  [...messages]
    .reverse()
    .find((message) => message?.role === 'user')
    ?.content?.trim() || '';

const buildLocalFallbackContent = (message) => {
  const intent = redactSensitiveText(message).slice(0, 260) || 'daily Laura work';
  const lower = intent.toLowerCase();
  const wantsCode = /code|script|bug|fix|go|react|node|api|build|test|deploy|cli/.test(lower);
  const wantsPlan = /daily|jour|routine|plan|todo|today|aujourd/.test(lower);

  const lines = [
    'Mode local sans clé Mistral.',
    '',
    `Signal reçu: ${intent}`,
    '',
    'Liens utiles:',
    '- Techandstream: https://techandstream.com',
    '- MatrixCitizen: https://techandstream.com/matrix-citizen',
    '- Laura GitHub: https://github.com/Kvnbbg/Laura',
    '- french-dev-ai-tools: https://github.com/Kvnbbg/french-dev-ai-tools',
    '',
    'Dialogue rapide:',
    'Laura: Je peux fonctionner sans API externe pour structurer ton travail.',
    'Toi: Que faire maintenant ?',
    'Laura: Choisis une action courte, lance une vérification, puis garde seulement les données publiques.',
    '',
  ];

  if (wantsPlan) {
    lines.push(
      'Routine quotidienne:',
      '1. Décrire l’objectif en une phrase.',
      '2. Demander un plan court à Laura.',
      '3. Lancer les checks locaux.',
      '4. Convertir le résultat en note publique si aucun secret n’est présent.',
      ''
    );
  }

  lines.push(
    'Commandes sûres du jour:',
    '```bash',
    'npm run security:scan',
    'npm run lint',
    'npm run build',
    'npm run check:go',
    '```',
    ''
  );

  if (wantsCode) {
    lines.push(
      'Snippet local sans API:',
      '```ts',
      'export function publicSafeSummary(input: string) {',
      '  return input',
      '    .replace(/Bearer\\s+\\S+/gi, "Bearer [REDACTED]")',
      '    .replace(/(API_KEY|TOKEN|SECRET)=\\S+/gi, "$1=[REDACTED]")',
      '    .slice(0, 600);',
      '}',
      '```',
      ''
    );
  }

  lines.push(
    'Pour activer Mistral plus tard: configure seulement `MISTRAL_API_KEY` côté serveur, jamais dans une variable `VITE_*`.'
  );

  return lines.join('\n');
};

const buildLocalFallbackResponse = (messages, bridgeMeta) => {
  const content = buildLocalFallbackContent(lastUserText(messages));
  const syntheticMessage = { role: 'user', content: lastUserText(messages) };
  return {
    message: { role: 'assistant', content },
    citations: DAILY_FALLBACK_LINKS,
    thinkingFeedback: [
      'Mode local sans API',
      'Liens publics prepares',
      'Code snippet public-safe',
    ],
    agentHints: [
      'local_fallback',
      'public_links',
      'daily_workflow',
      'no_provider_key',
    ],
    nextActions: [
      'Use the clickable links for navigation.',
      'Copy the code snippet only after reviewing it locally.',
      'Set server-only MISTRAL_API_KEY when external chat is required.',
    ],
    networkThoughts: buildNetworkThoughts(bridgeMeta),
    bridge: {
      provider: 'local-fallback',
      endpoint: '/api/chat',
      source: bridgeMeta.source,
      target: bridgeMeta.target,
      thread: bridgeMeta.thread,
      mode: bridgeMeta.mode,
      progress: getMatrixProgress(bridgeMeta),
      actions: getMatrixActions(bridgeMeta),
      relayDrafts: getMatrixRelayDrafts(bridgeMeta),
      lastSignal: syntheticMessage.content,
    },
  };
};

const normalizeDocumentName = (name) => {
  const base = String(name || 'document.txt').split(/[\\/]/).pop() || 'document.txt';
  return base.replace(/[\u0000-\u001f<>:"|?*]/g, '_').slice(0, 120) || 'document.txt';
};

const getFileExtension = (name) => {
  const cleanName = normalizeDocumentName(name).toLowerCase();
  const index = cleanName.lastIndexOf('.');
  return index >= 0 ? cleanName.slice(index) : '';
};

const isLocalOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(origin);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (DEFAULT_ALLOWED_ORIGINS.has(origin) || CONFIGURED_ALLOWED_ORIGINS.has(origin)) return true;
  return process.env.NODE_ENV !== 'production' && isLocalOrigin(origin);
};

if (!MISTRAL_API_KEY) {
  logger.warn('Mistral API key missing.', {
    hint: 'Set server-only MISTRAL_API_KEY. Do not expose provider keys with VITE_* variables.',
  });
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) {
    return res.status(403).json({ message: 'Origin not allowed.' });
  }
  next();
});
app.use(cors({
  origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
  credentials: false,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Laura-Session'],
  maxAge: 600,
}));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));

const rateBuckets = new Map();
app.use('/api', (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ message: 'Too many requests.' });
  }
  next();
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const documentStore = new Map();

const sweepExpiredDocuments = () => {
  const now = Date.now();
  for (const [sessionId, session] of documentStore.entries()) {
    if (now - session.updatedAt > DOCUMENT_TTL_MS) {
      documentStore.delete(sessionId);
    }
  }
};

const getDocumentSessionId = (req) => {
  const raw = req.headers[DOCUMENT_SESSION_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return DOCUMENT_SESSION_PATTERN.test(trimmed) ? trimmed : null;
};

const requireDocumentSessionId = (req, res) => {
  const sessionId = getDocumentSessionId(req);
  if (!sessionId) {
    res.status(400).json({ message: 'Document session header is required.' });
    return null;
  }
  return sessionId;
};

const getSessionDocuments = (sessionId, create = false) => {
  sweepExpiredDocuments();
  const existing = documentStore.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing.documents;
  }
  if (!create) {
    return new Map();
  }
  const session = { updatedAt: Date.now(), documents: new Map() };
  documentStore.set(sessionId, session);
  return session.documents;
};

const normalizeBridgeMeta = (body) => {
  const source = typeof body?.source === "string" && body.source.trim() ? body.source.trim() : "laura-terminal";
  const target = typeof body?.target === "string" && body.target.trim() ? body.target.trim() : "laura";
  const thread = typeof body?.thread === "string" && body.thread.trim() ? body.thread.trim() : null;
  const mode =
    typeof body?.mode === "string" && VALID_BRIDGE_MODES.has(body.mode.trim())
      ? body.mode.trim()
      : "chat";
  const context =
    body?.context && typeof body.context === "object" && !Array.isArray(body.context)
      ? body.context
      : {};

  return { source, target, thread, mode, context };
};

const getMatrixProgress = (meta) => {
  const progress = meta.context?.matrixProgress;
  if (!progress || typeof progress !== 'object' || Array.isArray(progress)) {
    return null;
  }
  if (progress.contract !== 'laura-bridge-progress-v1') {
    return null;
  }
  return progress;
};

const getMatrixActions = (meta) => {
  const actions = meta.context?.matrixActions;
  if (!Array.isArray(actions)) {
    return [];
  }
  return actions
    .filter((action) => action && typeof action === 'object' && typeof action.label === 'string')
    .slice(0, 6);
};

const getMatrixRelayDrafts = (meta) => {
  const drafts = meta.context?.matrixRelayDrafts;
  if (!Array.isArray(drafts)) {
    return [];
  }
  return drafts
    .filter((draft) => draft && typeof draft === 'object' && typeof draft.body === 'string')
    .slice(0, 6);
};

const getMatrixBridgeSecurity = (meta) => {
  const security =
    meta.context?.bridgeSecurity && typeof meta.context.bridgeSecurity === "object"
      ? meta.context.bridgeSecurity
      : meta.context ?? {};

  const publicOrigin =
    typeof security.publicOrigin === "string" ? security.publicOrigin : meta.context?.publicOrigin;
  const targetRepository =
    typeof security.targetRepository === "string" ? security.targetRepository : meta.context?.targetRepository;
  const writeMode = typeof security.writeMode === "string" ? security.writeMode : meta.context?.writeMode;

  return {
    trusted:
      publicOrigin === TRUSTED_MATRIX_PUBLIC_ORIGIN &&
      targetRepository === TRUSTED_MATRIX_TARGET_REPOSITORY &&
      writeMode === "manual-publish-only",
    publicOrigin,
    targetRepository,
    writeMode,
  };
};

const buildAgentHints = (meta, lastUserMessage) => {
  const hints = new Set(["reply_terminal", "keep_terminal_primary"]);
  const message = (lastUserMessage?.content || "").toLowerCase();
  const tags = Array.isArray(meta.context?.tags) ? meta.context.tags : [];

  if (meta.source === "french-dev-ai-tools") {
    hints.add("animate_moltbook_stream");
  }
  if (meta.mode === "broadcast" || meta.mode === "social") {
    hints.add("publish_social_line");
  }
  if (message.includes("blog") || tags.includes("blog")) {
    hints.add("draft_blog_hook");
  }
  if (message.includes("forum") || tags.includes("forum")) {
    hints.add("seed_forum_reply");
  }
  if (message.includes("quest") || message.includes("badge")) {
    hints.add("sync_quest_progress");
  }
  if (getMatrixProgress(meta)) {
    hints.add("sync_matrix_progress");
    hints.add("themed_week_streak");
  }
  if (getMatrixActions(meta).length) {
    hints.add("route_matrix_action_deck");
  }
  if (getMatrixRelayDrafts(meta).length) {
    hints.add("publish_dry_relay_draft");
  }
  if (getMatrixBridgeSecurity(meta).trusted) {
    hints.add("trusted_techandstream_https_route");
    hints.add("french_dev_ai_tools_public_source");
  }

  return Array.from(hints);
};

const buildNextActions = (meta) => {
  const network = typeof meta.context?.network === "string" ? meta.context.network : "moltbook";
  const botName = typeof meta.context?.botName === "string" ? meta.context.botName : "MoltBot";
  const matrixSecurity = getMatrixBridgeSecurity(meta);

  return [
    `Return a short answer to ${botName} for ${network}.`,
    "Keep the main conversation grounded in Laura's terminal interface.",
    "Expose only public-safe summaries to the visible mini-social stream.",
    `When the topic is UI, keep it KISS with these blocks: ${UI_BUILDING_BLOCKS}.`,
    getMatrixProgress(meta)
      ? `Mirror public XP/streak progress for ${getMatrixProgress(meta).bonusWorld}.`
      : "Use local deterministic streak progress when no bridge progress is provided.",
    getMatrixActions(meta)[0]
      ? `Resolve MatrixCitizen action ${getMatrixActions(meta)[0].label} over ${getMatrixActions(meta)[0].channelPair}.`
      : "Keep auto/add/goto add ready for MatrixCitizen.",
    matrixSecurity.trusted
      ? `Use only ${matrixSecurity.publicOrigin} routes sourced from ${matrixSecurity.targetRepository}; publishing stays manual-review-only.`
      : "If MatrixCitizen trust markers are missing, keep the result local and public-safe.",
  ];
};

const buildNetworkThoughts = (meta) => {
  const botName = typeof meta.context?.botName === "string" ? meta.context.botName : "MoltBot";
  const activity = typeof meta.context?.activity === "string" ? meta.context.activity : "activity";
  const progress = getMatrixProgress(meta);
  const relayDraft = getMatrixRelayDrafts(meta)[0];
  const matrixSecurity = getMatrixBridgeSecurity(meta);

  return [
    {
      speaker: "Laura",
      role: "persona",
      content: `Je garde la voix principale au terminal et j'oriente ${activity} sans bruit inutile.`,
      emphasis: "signal",
    },
    {
      speaker: botName,
      role: "moltbot",
      content: `Le flux public est prêt. Si on parle UI, je reste KISS: ${UI_BUILDING_BLOCKS}.`,
      emphasis: "calm",
    },
    {
      speaker: "Veille",
      role: "watcher",
      content: "Aucune fuite de secrets. Seulement des résumés publics sûrs.",
      emphasis: "warning",
    },
    ...(progress
      ? [
          {
            speaker: "Streak",
            role: "matrix-progress",
            content: `Monde bonus ${progress.bonusWorld}: ${progress.quest}, XP ${progress.xpTotal}.`,
            emphasis: "signal",
          },
        ]
      : []),
    ...(relayDraft
      ? [
          {
            speaker: "Relay",
            role: relayDraft.tone || "dry",
            content: relayDraft.body,
            emphasis: "calm",
          },
        ]
      : []),
    ...(matrixSecurity.trusted
      ? [
          {
            speaker: "Trust",
            role: "bridge-policy",
            content: `Route HTTPS ${matrixSecurity.publicOrigin}; source publique ${matrixSecurity.targetRepository}; publication manuelle uniquement.`,
            emphasis: "calm",
          },
        ]
      : []),
  ];
};

const buildMatrixBridgeStatus = (bridgeMeta) => ({
  provider: 'laura',
  endpoint: '/api/bridge/matrix-progress',
  source: bridgeMeta.source,
  target: bridgeMeta.target,
  thread: bridgeMeta.thread,
  mode: bridgeMeta.mode,
  security: getMatrixBridgeSecurity(bridgeMeta),
  progress: getMatrixProgress(bridgeMeta),
  actions: getMatrixActions(bridgeMeta),
  relayDrafts: getMatrixRelayDrafts(bridgeMeta),
});

const buildThinkingFeedback = (meta, lastUserMessage) => {
  const contextLabel =
    typeof meta.context?.activity === 'string' && meta.context.activity.trim()
      ? meta.context.activity.trim()
      : meta.mode === 'broadcast'
        ? 'diffusion publique'
        : 'conversation';
  const messageText = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content.trim() : '';
  const shortIntent = messageText ? messageText.slice(0, 72) : 'aucun signal utilisateur';

  return [
    `Signal recu: ${shortIntent}`,
    `Contexte actif: ${contextLabel}`,
    meta.source === 'french-dev-ai-tools'
      ? 'Priorite: reponse terminale claire puis resume public pour Moltbook'
      : 'Priorite: reponse claire sans surcharge visuelle',
    `UI KISS: ${UI_BUILDING_BLOCKS}`,
  ];
};

/**
 * Split input text into overlapping chunks for embedding.
 * @param {string} text - Full document text.
 * @returns {{ index: number, text: string }[]} Ordered text chunks.
 */
const chunkText = (text) => {
  const chunks = [];
  let index = 0;
  for (let start = 0; start < text.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = text.slice(start, start + CHUNK_SIZE).trim();
    if (chunk) {
      chunks.push({ index, text: chunk });
      index += 1;
    }
  }
  return chunks;
};

/**
 * Compute cosine similarity between two numeric vectors.
 * @param {number[]} a - Vector A.
 * @param {number[]} b - Vector B.
 * @returns {number} Similarity score between 0 and 1.
 */
const cosineSimilarity = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0;
  }
  const dot = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (!magnitudeA || !magnitudeB) {
    return 0;
  }
  return dot / (magnitudeA * magnitudeB);
};

/**
 * Send a request to the Mistral API with safe error handling.
 * @param {string} endpoint - API endpoint.
 * @param {Record<string, unknown>} body - Request payload.
 * @returns {Promise<unknown>} Parsed JSON payload.
 */
const mistralFetch = async (endpoint, body) => {
  if (!MISTRAL_API_KEY) {
    const error = new Error('Mistral API key missing');
    error.status = 500;
    throw error;
  }

  try {
    const response = await fetch(`https://api.mistral.ai/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`Mistral API error: ${response.status}`);
      error.status = response.status;
      error.details = text;
      throw error;
    }

    return response.json();
  } catch (error) {
    error.status = error.status ?? 502;
    throw error;
  }
};

/**
 * Generate embeddings for an array of text chunks.
 * @param {string[]} texts - Text inputs to embed.
 * @returns {Promise<number[][]>} Embedding vectors.
 */
const embedTexts = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('No texts provided for embeddings');
  }
  const payload = await mistralFetch('embeddings', {
    model: EMBED_MODEL,
    input: texts,
  });

  if (!payload?.data) {
    throw new Error('Invalid embedding response from Mistral');
  }

  return payload.data.map((item) => item.embedding);
};

/**
 * Pick the most relevant chunks for a query embedding.
 * @param {number[]} queryEmbedding - Query embedding vector.
 * @param {number} limit - Number of chunks to return.
 * @returns {{ score: number, doc: { name: string }, chunk: { index: number, text: string } }[]} Ranked chunks.
 */
const pickTopChunks = (queryEmbedding, sessionId, limit = TOP_CHUNK_LIMIT) => {
  const scored = [];
  const documents = sessionId ? getSessionDocuments(sessionId, false) : new Map();
  for (const doc of documents.values()) {
    for (const chunk of doc.chunks) {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      scored.push({ score, doc, chunk });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter((item) => item.score > SIMILARITY_THRESHOLD);
};

/**
 * Build a summary list of stored documents for API responses.
 * @returns {{ id: string, name: string, chunks: number }[]} Document summaries.
 */
const getDocumentSummaries = (sessionId) =>
  Array.from(getSessionDocuments(sessionId, false).values()).map((doc) => ({
    id: doc.id,
    name: doc.name,
    chunks: doc.chunks.length,
  }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MISTRAL_MODEL });
});

app.get('/api/documents', (req, res) => {
  const sessionId = requireDocumentSessionId(req, res);
  if (!sessionId) return;
  res.json({ documents: getDocumentSummaries(sessionId) });
});

app.delete('/api/documents', (req, res) => {
  const sessionId = requireDocumentSessionId(req, res);
  if (!sessionId) return;
  documentStore.delete(sessionId);
  res.json({ status: 'cleared' });
});

app.post('/api/documents', upload.array('files'), async (req, res) => {
  try {
    const sessionId = requireDocumentSessionId(req, res);
    if (!sessionId) return;

    const files = req.files ?? [];
    if (!files.length) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return res.status(413).json({
        message: `Upload at most ${MAX_FILES_PER_UPLOAD} files at a time.`,
      });
    }

    const documents = getSessionDocuments(sessionId, true);
    if (documents.size + files.length > MAX_DOCUMENTS_PER_SESSION) {
      return res.status(413).json({
        message: `Store at most ${MAX_DOCUMENTS_PER_SESSION} documents per session.`,
      });
    }

    for (const file of files) {
      const safeName = normalizeDocumentName(file.originalname);
      const extension = getFileExtension(safeName);
      if (file.size > MAX_FILE_SIZE) {
        return res.status(413).json({
          message: `File exceeds size limit of ${FILE_SIZE_LABEL}: ${safeName}`,
        });
      }

      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return res.status(415).json({
          message: `File type not allowed: ${safeName}`,
        });
      }

      if (BLOCKED_FILE_EXTENSIONS.has(extension)) {
        return res.status(415).json({
          message: `Executable files are not allowed: ${safeName}`,
        });
      }

      const text = file.buffer.toString('utf-8').trim();
      if (!text) {
        return res.status(400).json({
          message: `File ${safeName} is empty or unreadable.`,
        });
      }
      if (text.length > MAX_TEXT_CHARS) {
        return res.status(413).json({
          message: `File text is too large after decoding: ${safeName}`,
        });
      }
      if (containsSensitiveText(text)) {
        return res.status(400).json({
          message: `File appears to contain credentials or secrets and was not indexed: ${safeName}`,
        });
      }

      const rawChunks = chunkText(redactSensitiveText(text));
      const currentChunkCount = Array.from(documents.values()).reduce(
        (sum, doc) => sum + doc.chunks.length,
        0
      );
      if (currentChunkCount + rawChunks.length > MAX_CHUNKS_PER_SESSION) {
        return res.status(413).json({
          message: `Document session exceeds ${MAX_CHUNKS_PER_SESSION} indexed chunks.`,
        });
      }
      const embeddings = await embedTexts(rawChunks.map((chunk) => chunk.text));
      const storedChunks = rawChunks.map((chunk, index) => ({
        id: crypto.randomUUID(),
        index: chunk.index + 1,
        text: chunk.text,
        embedding: embeddings[index],
      }));

      const document = {
        id: crypto.randomUUID(),
        name: safeName,
        chunks: storedChunks,
      };
      documents.set(document.id, document);
    }

    res.json({ documents: getDocumentSummaries(sessionId) });
  } catch (error) {
    logger.error('Upload failed', errorLogMeta(error));
    res.status(500).json({ message: 'Failed to process documents.' });
  }
});

app.post('/api/bridge/matrix-progress', (req, res) => {
  const bridgeMeta = normalizeBridgeMeta(req.body ?? {});
  const progress = getMatrixProgress(bridgeMeta);
  const security = getMatrixBridgeSecurity(bridgeMeta);

  if (!progress) {
    return res.status(400).json({ message: 'Matrix progress contract is required.' });
  }
  if (!security.trusted) {
    return res.status(400).json({ message: 'Trusted Matrix bridge security envelope is required.' });
  }

  const syntheticMessage = {
    role: 'user',
    content: `Sync ${progress.contract} for ${progress.matrixCitizenId}.`,
  };

  res.json({
    status: 'accepted',
    message: 'Matrix progress accepted for public-safe manual review.',
    thinkingFeedback: buildThinkingFeedback(bridgeMeta, syntheticMessage),
    agentHints: buildAgentHints(bridgeMeta, syntheticMessage),
    nextActions: buildNextActions(bridgeMeta),
    networkThoughts: buildNetworkThoughts(bridgeMeta),
    bridge: buildMatrixBridgeStatus(bridgeMeta),
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages payload is required.' });
    }
    if (!messages.every((message) => typeof message?.content === 'string')) {
      return res.status(400).json({
        message: 'Each message must include string content.',
      });
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message?.role === 'user');
    const bridgeMeta = normalizeBridgeMeta(req.body ?? {});

    if (!MISTRAL_API_KEY) {
      return res.json(buildLocalFallbackResponse(messages, bridgeMeta));
    }

    let contextPrompt = '';
    let citations = [];

    if (lastUserMessage) {
      const [queryEmbedding] = await embedTexts([redactSensitiveText(lastUserMessage.content)]);
      const topChunks = pickTopChunks(queryEmbedding, getDocumentSessionId(req));
      citations = topChunks.map(
        (chunk) => `${chunk.doc.name} • chunk ${chunk.chunk.index}`
      );
      if (topChunks.length) {
        contextPrompt = topChunks
          .map(
            (chunk) =>
              `Source: [${chunk.doc.name} • chunk ${chunk.chunk.index}]\n${chunk.chunk.text}`
          )
          .join('\n\n');
      }
    }

    const systemPrompt =
      'You are Laura, a cosmic dream companion. Use the provided sources to answer questions when relevant. ' +
      'If sources are provided, cite them exactly in brackets like [DocName • chunk 3]. If sources are not relevant, answer normally. ' +
      'Laura is terminal-first, and when the source is french-dev-ai-tools she coordinates MoltBots and visible mini-social activity without exposing private logs or secrets.';

    const payload = await mistralFetch('chat/completions', {
      model: MISTRAL_MODEL,
      messages: [
        {
          role: 'system',
          content: contextPrompt
            ? `${systemPrompt}\n\n${contextPrompt}`
            : systemPrompt,
        },
        ...sanitizeProviderMessages(messages),
      ],
      temperature: DEFAULT_TEMPERATURE,
    });

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ message: 'Mistral response missing content.' });
    }

    res.json({
      message: { role: 'assistant', content },
      citations,
      thinkingFeedback: buildThinkingFeedback(bridgeMeta, lastUserMessage),
      agentHints: buildAgentHints(bridgeMeta, lastUserMessage),
      nextActions: buildNextActions(bridgeMeta),
      networkThoughts: buildNetworkThoughts(bridgeMeta),
      bridge: {
        provider: 'laura',
        endpoint: '/api/chat',
        source: bridgeMeta.source,
        target: bridgeMeta.target,
        thread: bridgeMeta.thread,
        mode: bridgeMeta.mode,
        progress: getMatrixProgress(bridgeMeta),
        actions: getMatrixActions(bridgeMeta),
        relayDrafts: getMatrixRelayDrafts(bridgeMeta),
      },
    });
  } catch (error) {
    logger.error('Chat failed', errorLogMeta(error));
    const status = error.status ?? 500;
    res.status(status).json({ message: 'Chat request failed.' });
  }
});

// Lightweight streaming variant for the terminal client: skips the RAG/
// embeddings lookup (speed) and proxies Mistral's SSE chunks directly so
// the CLI can render tokens as they arrive instead of waiting on the
// full response.
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages) || !messages.every((message) => typeof message?.content === 'string')) {
      return res.status(400).json({ message: 'Messages payload is required.' });
    }

    const systemPrompt =
      'You are Laura, a cosmic dream companion. Be concise and terminal-first.';
    const fullMessages = sanitizeProviderMessages([
      { role: 'system', content: systemPrompt },
      ...messages,
    ]);

    // Prefer the local Ollama model when no Mistral key is configured (or
    // when explicitly requested) — keeps the terminal chat usable offline.
    if (!MISTRAL_API_KEY && OLLAMA_MODEL) {
      const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: OLLAMA_MODEL, messages: fullMessages, stream: true }),
      });

      if (!upstream.ok || !upstream.body) {
        const details = await upstream.text().catch(() => '');
        logger.error('Ollama stream failed', {
          status: upstream.status,
          details: redactLogText(details),
        });
        return res.status(upstream.status || 502).json({ message: 'Local Ollama stream failed.' });
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let chunk;
            try {
              chunk = JSON.parse(trimmed);
            } catch {
              continue;
            }
            const content = chunk?.message?.content;
            if (typeof content === 'string' && content) {
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
            }
            if (chunk?.done) {
              res.write('data: [DONE]\n\n');
            }
          }
        }
      } finally {
        res.end();
      }
      return;
    }

    if (!MISTRAL_API_KEY) {
      const fallback = buildLocalFallbackResponse(messages, normalizeBridgeMeta(req.body ?? {}));
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      const content = fallback.message.content;
      for (let index = 0; index < content.length; index += 160) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: content.slice(index, index + 160) } }] })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const upstream = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: fullMessages,
        temperature: DEFAULT_TEMPERATURE,
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const details = await upstream.text().catch(() => '');
      logger.error('Stream upstream failed', {
        status: upstream.status,
        details: redactLogText(details),
      });
      return res.status(upstream.status || 502).json({ message: 'Streaming chat request failed.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      res.end();
    }
  } catch (error) {
    logger.error('Stream chat failed', { error: error.message });
    if (!res.headersSent) {
      res.status(502).json({ message: 'Streaming chat request failed.' });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, HOST, () => {
  logger.info('Laura API listening', { host: HOST, port: PORT });
});
