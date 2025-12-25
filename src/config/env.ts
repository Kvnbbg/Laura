import { AppError } from '../utils/errors';

export type EnvSource = {
  VITE_APP_NAME?: string;
  VITE_CONTACT_ENDPOINT?: string;
  VITE_CONTACT_TIMEOUT_MS?: string;
};

export type AppConfig = {
  appName: string;
  contactEndpoint: string | null;
  contactTimeoutMs: number;
};

const DEFAULT_TIMEOUT_MS = 5000;

export const createConfig = (env: EnvSource): AppConfig => {
  const appName = env.VITE_APP_NAME?.trim() || 'Laura';
  const contactEndpointRaw = env.VITE_CONTACT_ENDPOINT?.trim();

  let contactEndpoint: string | null = null;
  if (contactEndpointRaw) {
    try {
      const url = new URL(contactEndpointRaw);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Contact endpoint must use http or https');
      }
      contactEndpoint = url.toString();
    } catch (error) {
      throw new AppError('CONFIG_INVALID', 'Invalid VITE_CONTACT_ENDPOINT', {
        cause: error,
        userMessage:
          'Contact endpoint configuration is invalid. Please check VITE_CONTACT_ENDPOINT.',
      });
    }
  }

  const timeoutValue = env.VITE_CONTACT_TIMEOUT_MS?.trim();
  const contactTimeoutMs = timeoutValue
    ? Number(timeoutValue)
    : DEFAULT_TIMEOUT_MS;

  if (!Number.isFinite(contactTimeoutMs) || contactTimeoutMs <= 0) {
    throw new AppError('CONFIG_INVALID', 'Invalid VITE_CONTACT_TIMEOUT_MS', {
      userMessage:
        'Contact timeout must be a positive number. Please check VITE_CONTACT_TIMEOUT_MS.',
    });
  }

  return {
    appName,
    contactEndpoint,
    contactTimeoutMs,
  };
};

let cachedConfig: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  if (!cachedConfig) {
    cachedConfig = createConfig(import.meta.env);
  }
  return cachedConfig;
};
