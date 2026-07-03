import { getConfig, type AppConfig } from '../config/env';
import { sendChatMessage, type ChatMessage, type ChatResponse } from './mistralService';

/**
 * Backward-compatible provider entrypoint.
 *
 * Provider credentials must stay server-side in open-source builds. This
 * function intentionally delegates to the configured chat endpoint instead of
 * sending a browser Bearer token to a third-party provider.
 */
export const sendPerplexityMessage = async (
  messages: ChatMessage[],
  config: AppConfig = getConfig()
): Promise<ChatResponse> => {
  return sendChatMessage(messages, config);
};
