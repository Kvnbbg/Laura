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
        thinkingFeedback: ['Signal recu', 'Contexte trie'],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await sendChatMessage(
      [{ role: 'user', content: 'Hi' }],
      baseConfig
    );

    expect(response.message.content).toBe('Hello there');
    expect(response.citations).toHaveLength(1);
    expect(response.thinkingFeedback).toEqual(['Signal recu', 'Contexte trie']);

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

  it('returns a local fallback when the chat API is unavailable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal('fetch', fetchMock);

    const response = await sendChatMessage(
      [{ role: 'user', content: 'Need code with TOKEN=super-secret-value' }],
      baseConfig
    );

    expect(response.message.content).toContain('Mode local');
    expect(response.message.content).toContain('```ts');
    expect(response.message.content).toContain('TOKEN=[REDACTED]');
    expect(response.message.content).not.toContain('super-secret-value');
    expect(response.citations).toContain('https://techandstream.com');

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
