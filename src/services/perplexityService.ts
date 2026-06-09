/**
 * Perplexity adapter for Laura — drop-in replacement for mistralService.
 *
 * Perplexity exposes an OpenAI-compatible chat completions endpoint and returns
 * inline `citations` in the response body.  This module normalises that output
 * into the same ChatResponse shape used across the app so the rest of Laura
 * never needs to know which provider is behind the request.
 *
 * Rate-limit guidance (Perplexity Pro):
 *   - Tier 1 → ~20 req/min, 500 req/day
 *   - Tier 2 → ~60 req/min, shared daily budget
 *   - Use VITE_PERPLEXITY_TIMEOUT_MS (default 10 000 ms) for slow sonar-pro calls
 *   - On 429 / 5xx the caller should apply exponential back-off before retry
 *
 * To swap to any other OpenAI-compatible API, change VITE_PERPLEXITY_BASE_URL
 * and VITE_PERPLEXITY_MODEL — no other code changes needed.
 */

import { getConfig } from '../config/env';
import { AppError } from '../utils/errors';
import { fetchWithTimeout } from './http';
import type { ChatMessage, ChatResponse } from './mistralService';

// ── Perplexity-specific API shapes ───────────────────────────────────────────

type PerplexityCitation = string | { url: string; title?: string };

type PerplexityChoice = {
  message?: { role?: string; content?: string };
};

type PerplexityApiResponse = {
  id?: string;
  model?: string;
  choices?: PerplexityChoice[];
  citations?: PerplexityCitation[];
};

// ── Normalisation helpers ────────────────────────────────────────────────────

const normaliseCitation = (raw: PerplexityCitation): { url: string; title?: string } =>
  typeof raw === 'string' ? { url: raw } : { url: raw.url, title: raw.title };

const parsePerplexityReply = (payload: unknown): ChatResponse => {
  const data = payload as PerplexityApiResponse;

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new AppError('PERPLEXITY_PARSE_FAILED', 'Empty or missing content', {
      userMessage: 'Laura n\'a pas reçu de réponse valide de Perplexity. Réessaie dans un instant.',
    });
  }

  const citations: string[] = (data.citations ?? [])
    .map(normaliseCitation)
    .map((c) => c.url);

  return {
    message: { role: 'assistant', content },
    citations,
    thinkingFeedback: [],
  };
};

// ── Public API ───────────────────────────────────────────────────────────────

export const sendPerplexityMessage = async (
  messages: ChatMessage[],
  config = getConfig()
): Promise<ChatResponse> => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError('PERPLEXITY_EMPTY', 'No messages provided', {
      userMessage: 'Écris un message avant d\'envoyer.',
    });
  }

  if (!config.perplexityEnabled) {
    throw new AppError('PERPLEXITY_DISABLED', 'Perplexity is disabled', {
      userMessage:
        config.perplexityErrors[0] ??
        'Perplexity est désactivé. Configure VITE_PERPLEXITY_API_KEY.',
    });
  }

  const body = {
    model: config.perplexityModel,
    messages: messages.map(({ role, content }) => ({ role, content })),
    temperature: 0.2,
    return_citations: true,
  };

  try {
    const response = await fetchWithTimeout(
      config.perplexityBaseUrl + '/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.perplexityApiKey}`,
          Referer: 'https://github.com/Kvnbbg/Laura',
        },
        body: JSON.stringify(body),
      },
      config.perplexityTimeoutMs
    );

    if (response.status === 429) {
      throw new AppError('PERPLEXITY_RATE_LIMITED', 'Rate limit reached', {
        userMessage:
          'Limite de requêtes Perplexity atteinte. Attends quelques secondes puis réessaie.',
        details: { status: 429 },
      });
    }

    if (!response.ok) {
      throw new AppError('PERPLEXITY_REQUEST_FAILED', `HTTP ${response.status}`, {
        userMessage: 'Impossible de joindre Perplexity. Réessaie dans un moment.',
        details: { status: response.status },
      });
    }

    const payload = (await response.json()) as unknown;
    return parsePerplexityReply(payload);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('PERPLEXITY_TIMEOUT', 'Request timed out', {
        userMessage: 'La requête Perplexity a expiré. Réessaie dans un instant.',
      });
    }
    throw error;
  }
};
