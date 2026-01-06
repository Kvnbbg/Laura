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
};

const parseChatReply = (payload: unknown): ChatMessage => {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof (payload as { message?: unknown }).message === 'string'
  ) {
    return {
      role: 'assistant',
      content: (payload as { message: string }).message,
    };
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'reply' in payload &&
    typeof (payload as { reply?: unknown }).reply === 'string'
  ) {
    return {
      role: 'assistant',
      content: (payload as { reply: string }).reply,
    };
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'content' in payload &&
    typeof (payload as { content?: unknown }).content === 'string'
  ) {
    return {
      role: 'assistant',
      content: (payload as { content: string }).content,
    };
  }

  throw new AppError('CHAT_PARSE_FAILED', 'Invalid chat response format', {
    userMessage: 'We received an unexpected response from the chat service.',
  });
};

export const sendChatMessage = async (
  messages: ChatMessage[],
  config: AppConfig = getConfig()
): Promise<ChatResponse> => {
  if (!config.chatEndpoint) {
    return {
      message: {
        role: 'assistant',
        content:
          'Chat is running in demo mode. Configure VITE_CHAT_ENDPOINT to enable live responses.',
      },
    };
  }

  try {
    const response = await fetchWithTimeout(
      config.chatEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
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
    const message = parseChatReply(payload);
    return { message };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('CHAT_TIMEOUT', 'Chat request timed out', {
        userMessage: 'Chat timed out. Please retry in a moment.',
      });
    }

    throw error;
  }
};
