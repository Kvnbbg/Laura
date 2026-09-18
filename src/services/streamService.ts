import { getConfig, type AppConfig } from '../config/env';
import { AppError } from '../utils/errors';
import { getDocumentSessionHeaders } from './documentSession';

export type StreamChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type StreamCallbacks = {
  onDelta: (delta: string) => void;
};

const parseSseLine = (line: string): string | null => {
  if (!line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (!payload || payload === '[DONE]') return payload === '[DONE]' ? '__DONE__' : null;
  try {
    const parsed = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: unknown } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === 'string' ? content : null;
  } catch {
    return null;
  }
};

export const streamChatMessage = async (
  messages: StreamChatMessage[],
  callbacks: StreamCallbacks,
  config: AppConfig = getConfig()
): Promise<void> => {
  if (!messages.length) {
    throw new AppError('CHAT_EMPTY', 'No chat messages provided', {
      userMessage: 'Please enter a message before sending.',
    });
  }
  if (!config.chatEnabled) {
    throw new AppError('CHAT_DISABLED', 'Chat is disabled', {
      userMessage: config.chatErrors[0] ?? 'Chat is currently disabled.',
    });
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), config.chatTimeoutMs);

  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getDocumentSessionHeaders() },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new AppError('CHAT_STREAM_FAILED', 'Chat stream unavailable', {
        userMessage: 'Streaming is temporarily unavailable.',
        details: {
          status: response.status,
          correlationId: response.headers.get('X-Correlation-Id'),
        },
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      buffer += decoder.decode(result.value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const parsed = parseSseLine(line);
        if (parsed === '__DONE__') return;
        if (parsed) callbacks.onDelta(parsed);
      }
    }

    const parsed = parseSseLine(buffer);
    if (parsed && parsed !== '__DONE__') callbacks.onDelta(parsed);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('CHAT_STREAM_TIMEOUT', 'Chat stream timed out', {
        userMessage: 'The streamed response timed out. Please try again.',
      });
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
};
