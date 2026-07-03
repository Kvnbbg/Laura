import { getConfig, type AppConfig } from '../config/env';
import { AppError } from '../utils/errors';
import { getDocumentSessionHeaders } from './documentSession';
import { fetchWithTimeout } from './http';

export type ChatRole = 'system' | 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
  thinkingFeedback?: string[];
};

export type ChatResponse = {
  message: ChatMessage;
  citations: string[];
  thinkingFeedback: string[];
};

type ChatPayload = {
  messages: ChatMessage[];
};

const isValidChatMessage = (message: ChatMessage) =>
  message &&
  typeof message.content === 'string' &&
  message.content.trim().length > 0 &&
  Boolean(message.role);

const fallbackLinks = [
  'https://techandstream.com',
  'https://techandstream.com/matrix-citizen',
  'https://github.com/Kvnbbg/Laura',
  'https://github.com/Kvnbbg/french-dev-ai-tools',
];

const redactLocalSecrets = (value: string): string =>
  value
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')
    .replace(/\b(API_KEY|TOKEN|SECRET|PASSWORD)=\S+/gi, '$1=[REDACTED]');

const buildLocalFallbackResponse = (
  messages: ChatMessage[],
  reason = 'Local chat service unavailable'
): ChatResponse => {
  const lastUserMessage =
    [...messages].reverse().find((message) => message.role === 'user')?.content ??
    'daily Laura work';
  const safeIntent = redactLocalSecrets(lastUserMessage).slice(0, 260);
  const wantsCode = /code|script|bug|fix|go|react|node|api|build|test|deploy|cli/i.test(safeIntent);
  const codeBlock = wantsCode
    ? [
        '',
        'Snippet local sans API:',
        '```ts',
        'export function publicSafeSummary(input: string) {',
        '  return input',
        '    .replace(/Bearer\\s+\\S+/gi, "Bearer [REDACTED]")',
        '    .replace(/(API_KEY|TOKEN|SECRET)=\\S+/gi, "$1=[REDACTED]")',
        '    .slice(0, 600);',
        '}',
        '```',
      ]
    : [];

  return {
    message: {
      role: 'assistant',
      content: [
        `Mode local: ${reason}.`,
        '',
        `Signal recu: ${safeIntent || 'daily Laura work'}`,
        '',
        'Liens utiles:',
        '- Techandstream: https://techandstream.com',
        '- MatrixCitizen: https://techandstream.com/matrix-citizen',
        '- Laura GitHub: https://github.com/Kvnbbg/Laura',
        '- french-dev-ai-tools: https://github.com/Kvnbbg/french-dev-ai-tools',
        '',
        'Dialogue rapide:',
        'Laura: Je peux structurer ton travail sans API externe.',
        'Toi: Que faire maintenant ?',
        'Laura: Choisis une action courte, lance les checks, puis publie seulement du contenu public-safe.',
        '',
        'Commandes utiles:',
        '```bash',
        'npm run security:scan',
        'npm run lint',
        'npm run build',
        'npm run check:go',
        '```',
        ...codeBlock,
      ].join('\n'),
    },
    citations: fallbackLinks,
    thinkingFeedback: [
      'Mode local sans fournisseur',
      'Liens publics prepares',
      'Code snippet public-safe',
    ],
  };
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
      const thinkingFeedbackRaw = (payload as { thinkingFeedback?: unknown }).thinkingFeedback;
      const thinkingFeedback = Array.isArray(thinkingFeedbackRaw)
        ? thinkingFeedbackRaw.filter((item): item is string => typeof item === 'string').slice(0, 3)
        : [];
      return { message, citations, thinkingFeedback };
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
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new AppError('CHAT_EMPTY', 'No chat messages provided', {
      userMessage: 'Please enter a message before sending.',
    });
  }

  const invalidMessage = messages.find((message) => !isValidChatMessage(message));
  if (invalidMessage) {
    throw new AppError('CHAT_INVALID_MESSAGE', 'Invalid chat message payload', {
      userMessage: 'Please enter a valid message before sending.',
    });
  }

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
        headers: { 'Content-Type': 'application/json', ...getDocumentSessionHeaders() },
        body: JSON.stringify({ messages } satisfies ChatPayload),
      },
      config.chatTimeoutMs
    );

    if (!response.ok) {
      if ([404, 500, 502, 503].includes(response.status)) {
        return buildLocalFallbackResponse(messages, `Chat API returned ${response.status}`);
      }
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
      return buildLocalFallbackResponse(messages, 'Chat request timed out');
    }

    if (error instanceof TypeError) {
      return buildLocalFallbackResponse(messages);
    }

    throw error;
  }
};
