/**
 * Laura API core: Ollama multi-model + optional Mistral + local memory RAG.
 */
import express from 'express';
import cors from 'cors';
import {
  getOllamaConfig,
  resolveOllamaModel,
  listOllamaTags,
  chatOllama,
} from './ollama-models.mjs';
import { buildRagContext } from './memory-rag.mjs';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST =
  process.env.HOST ||
  process.env.LAURA_API_HOST ||
  (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || '';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-small';
const RAG_ENABLED = process.env.LAURA_RAG !== '0';
const ollamaConfig = getOllamaConfig();
const OLLAMA_URL = ollamaConfig.url;
const OLLAMA_MODEL = ollamaConfig.defaultModel;

app.disable('x-powered-by');
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const systemPrompt =
  'You are Laura, terminal-first. Use long-term memory snippets when provided. Propose commands; never claim you executed installs. Prefer capable local models over tiny 1.5b for multi-step work.';

async function withRagSystem(messages) {
  const lastUser = [...messages].reverse().find((m) => m?.role === 'user')?.content || '';
  let sys = systemPrompt;
  let ragMeta = null;
  if (RAG_ENABLED && lastUser) {
    try {
      const { context, result } = await buildRagContext(lastUser, { limit: 5 });
      if (context) {
        sys = `${systemPrompt}\n\n${context}`;
        ragMeta = { mode: result.mode, hits: result.hits.length, store: result.store };
      }
    } catch {
      /* memory optional */
    }
  }
  return {
    messages: [{ role: 'system', content: sys }, ...messages.filter((m) => m.role !== 'system')],
    ragMeta,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    ollamaDefault: OLLAMA_MODEL || null,
    mistral: Boolean(MISTRAL_API_KEY),
    rag: RAG_ENABLED,
  });
});

app.get('/api/models', async (_req, res) => {
  try {
    const tags = await listOllamaTags(ollamaConfig);
    res.json({
      schemaVersion: 'laura-ollama-multi-v1',
      provider: 'ollama',
      url: OLLAMA_URL,
      defaultModel: OLLAMA_MODEL || null,
      allowlist: ollamaConfig.allowlist,
      aliases: ollamaConfig.aliases,
      installed: tags,
      mistralConfigured: Boolean(MISTRAL_API_KEY),
      mistralModel: MISTRAL_API_KEY ? MISTRAL_MODEL : null,
      rag: RAG_ENABLED,
    });
  } catch (error) {
    res.status(502).json({
      message: 'Could not list Ollama models.',
      error: String(error?.message || error),
      defaultModel: OLLAMA_MODEL || null,
      aliases: ollamaConfig.aliases,
    });
  }
});

app.post('/api/memory/recall', async (req, res) => {
  try {
    const q = String(req.body?.query || '');
    const { context, result } = await buildRagContext(q, { limit: Number(req.body?.limit) || 6 });
    res.json({ context, ...result });
  } catch (error) {
    res.status(500).json({ message: String(error?.message || error) });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages payload is required.' });
    }
    const requested = typeof req.body?.model === 'string' ? req.body.model : '';
    const resolved = resolveOllamaModel(requested, ollamaConfig);
    const { messages: fullMessages, ragMeta } = await withRagSystem(messages);

    if (!MISTRAL_API_KEY && resolved.ok) {
      const content = await chatOllama({
        config: ollamaConfig,
        model: resolved.model,
        messages: fullMessages,
        stream: false,
      });
      return res.json({
        message: { role: 'assistant', content },
        bridge: { provider: 'ollama', model: resolved.model, rag: ragMeta },
      });
    }

    if (!MISTRAL_API_KEY) {
      return res.json({
        message: {
          role: 'assistant',
          content:
            'Aucun cerveau actif. Définis OLLAMA_MODEL / LAURA_LOCAL_MODEL ou MISTRAL_API_KEY. Voir /api/models et docs/OLLAMA_MULTI.md.',
        },
        bridge: { provider: 'local-fallback', rag: ragMeta },
      });
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
        temperature: 0.4,
      }),
    });
    if (!upstream.ok) {
      return res.status(502).json({ message: 'Mistral chat failed.' });
    }
    const payload = await upstream.json();
    const content = payload?.choices?.[0]?.message?.content || '';
    return res.json({
      message: { role: 'assistant', content },
      bridge: { provider: 'mistral', model: MISTRAL_MODEL, rag: ragMeta },
    });
  } catch (error) {
    res.status(500).json({ message: String(error?.message || error) });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  try {
    const messages = req.body?.messages;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages payload is required.' });
    }
    const { messages: fullMessages } = await withRagSystem(messages);
    const requested = typeof req.body?.model === 'string' ? req.body.model : '';
    const resolved = resolveOllamaModel(requested, ollamaConfig);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    if (!MISTRAL_API_KEY && resolved.ok) {
      const upstream = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: resolved.model, messages: fullMessages, stream: true }),
      });
      if (!upstream.ok || !upstream.body) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Ollama stream failed.' } }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
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
      return res.end();
    }

    if (!MISTRAL_API_KEY) {
      const msg =
        'Configure OLLAMA_MODEL (ex: qwen2.5:3b) ou MISTRAL_API_KEY. /model list dans le terminal.';
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`);
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
        stream: true,
        temperature: 0.4,
      }),
    });
    if (!upstream.ok || !upstream.body) {
      res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Mistral stream failed.' } }] })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        res.write(`${line}\n\n`);
      }
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: String(error?.message || error) });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, HOST, () => {
  process.stdout.write(
    `${JSON.stringify({
      level: 'info',
      message: 'Laura API listening',
      host: HOST,
      port: PORT,
      ollama: OLLAMA_MODEL || null,
      rag: RAG_ENABLED,
    })}\n`,
  );
});
