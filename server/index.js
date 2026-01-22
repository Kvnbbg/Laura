import express from 'express';
import multer from 'multer';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const CHAT_MODELS = new Set(['mistral-small', 'mistral-medium', 'mistral-large']);
const DEFAULT_CHAT_MODEL = 'mistral-small';
const EMBED_MODEL = 'mistral-embed';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = new Set(['text/plain', 'text/markdown']);

const MISTRAL_API_KEY =
  process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
const MISTRAL_MODEL = CHAT_MODELS.has(process.env.MISTRAL_MODEL ?? '')
  ? process.env.MISTRAL_MODEL
  : CHAT_MODELS.has(process.env.VITE_MISTRAL_MODEL ?? '')
    ? process.env.VITE_MISTRAL_MODEL
    : DEFAULT_CHAT_MODEL;

if (!MISTRAL_API_KEY) {
  console.warn(
    '[server] Mistral API key missing. Set MISTRAL_API_KEY (preferred) or VITE_MISTRAL_API_KEY.'
  );
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

const documentStore = new Map();

const chunkText = (text) => {
  const chunkSize = 800;
  const overlap = 100;
  const chunks = [];
  let index = 0;
  for (let start = 0; start < text.length; start += chunkSize - overlap) {
    const chunk = text.slice(start, start + chunkSize).trim();
    if (chunk) {
      chunks.push({ index, text: chunk });
      index += 1;
    }
  }
  return chunks;
};

const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, idx) => sum + val * b[idx], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (!magnitudeA || !magnitudeB) {
    return 0;
  }
  return dot / (magnitudeA * magnitudeB);
};

const mistralFetch = async (endpoint, body) => {
  if (!MISTRAL_API_KEY) {
    const error = new Error('Mistral API key missing');
    error.status = 500;
    throw error;
  }

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
};

const embedTexts = async (texts) => {
  const payload = await mistralFetch('embeddings', {
    model: EMBED_MODEL,
    input: texts,
  });

  if (!payload?.data) {
    throw new Error('Invalid embedding response from Mistral');
  }

  return payload.data.map((item) => item.embedding);
};

const pickTopChunks = (queryEmbedding, limit = 3) => {
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
    .filter((item) => item.score > 0.2);
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: MISTRAL_MODEL });
});

app.get('/api/documents', (_req, res) => {
  const documents = Array.from(documentStore.values()).map((doc) => ({
    id: doc.id,
    name: doc.name,
    chunks: doc.chunks.length,
  }));
  res.json({ documents });
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

    const documents = Array.from(documentStore.values()).map((doc) => ({
      id: doc.id,
      name: doc.name,
      chunks: doc.chunks.length,
    }));

    res.json({ documents });
  } catch (error) {
    console.error('[server] Upload failed', error);
    res.status(500).json({ message: 'Failed to process documents.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body ?? {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages payload is required.' });
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message?.role === 'user');

    let contextPrompt = '';
    let citations = [];

    if (lastUserMessage) {
      const [queryEmbedding] = await embedTexts([lastUserMessage.content]);
      const topChunks = pickTopChunks(queryEmbedding, 3);
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
      temperature: 0.4,
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
    console.error('[server] Chat failed', error);
    const status = error.status ?? 500;
    res.status(status).json({ message: 'Chat request failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Laura API listening on port ${PORT}`);
});
