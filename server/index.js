import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const CHAT_MODELS = new Set(['mistral-small', 'mistral-medium', 'mistral-large']);
const DEFAULT_CHAT_MODEL = 'mistral-small';
const EMBED_MODEL = 'mistral-embed';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['text/plain', 'text/markdown']);
const FILE_SIZE_LABEL = '2MB';
const REQUEST_BODY_LIMIT = '1mb';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;
const TOP_CHUNK_LIMIT = 3;
const SIMILARITY_THRESHOLD = 0.2;
const DEFAULT_TEMPERATURE = 0.4;

const MISTRAL_API_KEY =
  process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
const MISTRAL_MODEL = CHAT_MODELS.has(process.env.MISTRAL_MODEL ?? '')
  ? process.env.MISTRAL_MODEL
  : CHAT_MODELS.has(process.env.VITE_MISTRAL_MODEL ?? '')
    ? process.env.VITE_MISTRAL_MODEL
    : DEFAULT_CHAT_MODEL;

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

if (!MISTRAL_API_KEY) {
  logger.warn('Mistral API key missing.', {
    hint: 'Set MISTRAL_API_KEY (preferred) or VITE_MISTRAL_API_KEY.',
  });
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: REQUEST_BODY_LIMIT }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const documentStore = new Map();

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
const pickTopChunks = (queryEmbedding, limit = TOP_CHUNK_LIMIT) => {
  const scored = [];
  for (const doc of documentStore.values()) {
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
const getDocumentSummaries = () =>
  Array.from(documentStore.values()).map((doc) => ({
    id: doc.id,
    name: doc.name,
    chunks: doc.chunks.length,
  }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MISTRAL_MODEL });
});

app.get('/api/documents', (_req, res) => {
  res.json({ documents: getDocumentSummaries() });
});

app.delete('/api/documents', (_req, res) => {
  documentStore.clear();
  res.json({ status: 'cleared' });
});

app.post('/api/documents', upload.array('files'), async (req, res) => {
  try {
    const files = req.files ?? [];
    if (!files.length) {
      return res.status(400).json({ message: 'No files uploaded.' });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return res.status(413).json({
          message: `File exceeds size limit of ${FILE_SIZE_LABEL}: ${file.originalname}`,
        });
      }

      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return res.status(415).json({
          message: `File type not allowed: ${file.originalname}`,
        });
      }

      if (file.originalname.endsWith('.exe') || file.originalname.endsWith('.sh')) {
        return res.status(415).json({
          message: `Executable files are not allowed: ${file.originalname}`,
        });
      }

      const text = file.buffer.toString('utf-8').trim();
      if (!text) {
        return res.status(400).json({
          message: `File ${file.originalname} is empty or unreadable.`,
        });
      }

      const rawChunks = chunkText(text);
      const embeddings = await embedTexts(rawChunks.map((chunk) => chunk.text));
      const storedChunks = rawChunks.map((chunk, index) => ({
        id: crypto.randomUUID(),
        index: chunk.index + 1,
        text: chunk.text,
        embedding: embeddings[index],
      }));

      const document = {
        id: crypto.randomUUID(),
        name: file.originalname,
        chunks: storedChunks,
      };
      documentStore.set(document.id, document);
    }

    res.json({ documents: getDocumentSummaries() });
  } catch (error) {
    logger.error('Upload failed', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Failed to process documents.' });
  }
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

    let contextPrompt = '';
    let citations = [];

    if (lastUserMessage) {
      const [queryEmbedding] = await embedTexts([lastUserMessage.content]);
      const topChunks = pickTopChunks(queryEmbedding);
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
      'If sources are provided, cite them exactly in brackets like [DocName • chunk 3]. If sources are not relevant, answer normally.';

    const payload = await mistralFetch('chat/completions', {
      model: MISTRAL_MODEL,
      messages: [
        {
          role: 'system',
          content: contextPrompt
            ? `${systemPrompt}\n\n${contextPrompt}`
            : systemPrompt,
        },
        ...messages,
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
    });
  } catch (error) {
    logger.error('Chat failed', {
      error: error.message,
      stack: error.stack,
    });
    const status = error.status ?? 500;
    res.status(status).json({ message: 'Chat request failed.' });
  }
});

app.listen(PORT, () => {
  logger.info('Laura API listening', { port: PORT });
});
