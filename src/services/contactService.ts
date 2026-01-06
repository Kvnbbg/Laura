import { getConfig, type AppConfig } from '../config/env';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { fetchWithTimeout } from './http';

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

const simulateNetworkDelay = (durationMs: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), durationMs);
  });

export const submitContactForm = async (
  payload: ContactPayload,
  config: AppConfig = getConfig()
) => {
  if (!config.contactEndpoint) {
    logger.info('Contact endpoint not configured. Using local simulation.', {
      contactPayload: { name: payload.name, email: payload.email },
    });
    await simulateNetworkDelay(800);
    return;
  }

  try {
    const response = await fetchWithTimeout(
      config.contactEndpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      config.contactTimeoutMs
    );

    if (!response.ok) {
      throw new AppError('CONTACT_SUBMIT_FAILED', 'Contact submission failed', {
        userMessage:
          'We could not send your message. Please try again or email us directly.',
        details: { status: response.status },
      });
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AppError('CONTACT_TIMEOUT', 'Contact submission timed out', {
        userMessage:
          'Message delivery timed out. Please retry in a moment or use email.',
      });
    }

    throw error;
  }
};
