import { getConfig, type AppConfig } from '../config/env';
import { AppError } from '../utils/errors';
import { fetchWithTimeout } from './http';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatResponse = {
  message: ChatMessage;
  citations: string[];
};

type ChatPayload = {
  messages: ChatMessage[];
};

const parseChatReply = (payload: unknown): ChatResponse => {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message?: unknown }).message === 'object'
  ) {
    const message = (payload as { message?: ChatMessage }).message;
    if (message && typeof message.content === 'string' && message.role) {
      const citationsRaw = (payload as { citations?: unknown }).citations;
      const citations = Array.isArray(citationsRaw)
        ? citationsRaw.filter((item): item is string => typeof item === 'string')
        : [];
      return { message, citations };
    }
  }

  throw new AppError('CHAT_PARSE_FAILED', 'Invalid chat response format', {
    userMessage: 'We received an unexpected response from the chat service.',
  });
};

export const sendChatMessage = async (
  messages: ChatMessage[],
  config: AppConfig = getConfig()
): Promise<ChatResponse> => {
  if (!config.chatEnabled) {
    throw new AppError('CHAT_DISABLED', 'Chat is disabled', {
      userMessage:
        config.chatErrors[0] ??
        'Chat is currently disabled. Please enable it in your environment.',
    });
  }

  try {
    const response = await fetchWithTimeout(
      config.chatEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages } satisfies ChatPayload),
      },
      config.chatTimeoutMs
    );

    if (!response.ok) {
      throw new AppError('CHAT_REQUEST_FAILED', 'Chat request failed', {
        userMessage:
          'We could not reach the chat service. Please try again shortly.',
        details: { status: response.status },
      });
    }

    const payload = (await response.json()) as unknown;
    return parseChatReply(payload);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('CHAT_TIMEOUT', 'Chat request timed out', {
        userMessage: 'Chat timed out. Please retry in a moment.',
      });
    }

    throw error;
  }
};
