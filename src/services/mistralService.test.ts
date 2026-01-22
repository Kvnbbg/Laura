import { describe, expect, it, vi } from 'vitest';
import { sendChatMessage } from './mistralService';
import type { AppConfig } from '../config/env';
import { AppError } from '../utils/errors';

describe('sendChatMessage', () => {
  const baseConfig: AppConfig = {
    appName: 'Laura',
    contactEndpoint: null,
    contactTimeoutMs: 1000,
    chatEndpoint: '/api/chat',
    chatTimeoutMs: 1000,
    chatEnabled: true,
    chatErrors: [],
    mistralModel: 'mistral-small',
  };

  it('returns a parsed chat response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: { role: 'assistant', content: 'Hello there' },
        citations: ['Doc • chunk 1'],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await sendChatMessage(
      [{ role: 'user', content: 'Hi' }],
      baseConfig
    );

    expect(response.message.content).toBe('Hello there');
    expect(response.citations).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it('throws when response payload is invalid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      sendChatMessage([{ role: 'user', content: 'Hi' }], baseConfig)
    ).rejects.toBeInstanceOf(AppError);

    vi.unstubAllGlobals();
  });

  it('throws when chat is disabled', async () => {
    await expect(
      sendChatMessage(
        [{ role: 'user', content: 'Hi' }],
        { ...baseConfig, chatEnabled: false, chatErrors: ['disabled'] }
      )
    ).rejects.toBeInstanceOf(AppError);
  });
});
