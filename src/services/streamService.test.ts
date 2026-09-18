import { describe, expect, it, vi } from 'vitest';
import { streamChatMessage } from './streamService';
import type { AppConfig } from '../config/env';

const config: AppConfig = {
  appName: 'Laura',
  contactEndpoint: null,
  contactTimeoutMs: 1000,
  chatEndpoint: '/api/chat',
  chatTimeoutMs: 1000,
  chatEnabled: true,
  chatErrors: [],
  mistralModel: 'mistral-small',
};

describe('streamChatMessage', () => {
  it('parses SSE deltas and stops at DONE', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"lo"}}]}\n\ndata: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      body: stream,
    }));

    const chunks: string[] = [];
    await streamChatMessage([{ role: 'user', content: 'Hi' }], { onDelta: (value) => chunks.push(value) }, config);

    expect(chunks.join('')).toBe('Hello');
    vi.unstubAllGlobals();
  });

  it('rejects non-stream responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(
      streamChatMessage([{ role: 'user', content: 'Hi' }], { onDelta: vi.fn() }, config)
    ).rejects.toMatchObject({ code: 'CHAT_STREAM_FAILED' });
    vi.unstubAllGlobals();
  });
});
