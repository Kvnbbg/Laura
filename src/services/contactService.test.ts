import { describe, expect, it, vi } from 'vitest';
import { submitContactForm } from './contactService';
import type { AppConfig } from '../config/env';
import { AppError } from '../utils/errors';

describe('submitContactForm', () => {
  it('resolves without a configured endpoint', async () => {
    const config: AppConfig = {
      appName: 'Laura',
      contactEndpoint: null,
      contactTimeoutMs: 1000,
    };

    vi.useFakeTimers();
    const promise = submitContactForm(
      { name: 'Test', email: 'test@example.com', message: 'Hello' },
      config
    );

    await vi.advanceTimersByTimeAsync(900);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('throws a friendly error when the API responds with an error', async () => {
    const config: AppConfig = {
      appName: 'Laura',
      contactEndpoint: 'https://api.example.com/contact',
      contactTimeoutMs: 1000,
    };

    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      submitContactForm(
        { name: 'Test', email: 'test@example.com', message: 'Hello' },
        config
      )
    ).rejects.toBeInstanceOf(AppError);

    vi.unstubAllGlobals();
  });
});
