import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/errors';
import { createConfig } from './env';

describe('createConfig', () => {
  it('uses defaults when optional values are missing', () => {
    const config = createConfig({});

    expect(config.appName).toBe('Laura');
    expect(config.contactEndpoint).toBeNull();
    expect(config.contactTimeoutMs).toBe(5000);
  });

  it('validates contact endpoint protocol', () => {
    expect(() =>
      createConfig({ VITE_CONTACT_ENDPOINT: 'ftp://example.com' })
    ).toThrow(AppError);
  });

  it('throws for invalid timeout values', () => {
    expect(() =>
      createConfig({ VITE_CONTACT_TIMEOUT_MS: '-5' })
    ).toThrow(AppError);
  });
});
