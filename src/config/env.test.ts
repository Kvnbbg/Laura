import { describe, expect, it } from 'vitest';
import { createConfig } from './env';

describe('createConfig', () => {
  it('enables chat without requiring browser provider keys', () => {
    const config = createConfig({
      VITE_ENABLE_CHAT: 'true',
      VITE_MISTRAL_MODEL: 'mistral-small',
    });

    expect(config.chatEnabled).toBe(true);
    expect(config.chatErrors).toHaveLength(0);
  });

  it('uses default model when invalid model provided', () => {
    const config = createConfig({
      VITE_ENABLE_CHAT: 'true',
      VITE_MISTRAL_MODEL: 'unknown-model',
    });

    expect(config.mistralModel).toBe('mistral-small');
    expect(config.chatEnabled).toBe(false);
    expect(config.chatErrors[0]).toMatch(/VITE_MISTRAL_MODEL/);
  });

  it('enables chat when requirements are met', () => {
    const config = createConfig({
      VITE_ENABLE_CHAT: 'true',
      VITE_MISTRAL_MODEL: 'mistral-medium',
    });

    expect(config.chatEnabled).toBe(true);
    expect(config.mistralModel).toBe('mistral-medium');
    expect(config.chatErrors).toHaveLength(0);
  });
});
