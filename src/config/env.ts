import { AppError } from '../utils/errors';

export type EnvSource = {
  VITE_APP_NAME?: string;
  VITE_CONTACT_ENDPOINT?: string;
  VITE_CONTACT_TIMEOUT_MS?: string;
  VITE_CHAT_ENDPOINT?: string;
  VITE_CHAT_TIMEOUT_MS?: string;
};

export type AppConfig = {
  appName: string;
  contactEndpoint: string | null;
  contactTimeoutMs: number;
  chatEndpoint: string | null;
  chatTimeoutMs: number;
};

const DEFAULT_TIMEOUT_MS = 5000;

const parseOptionalUrl = (raw: string | undefined, key: string) => {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Endpoint must use http or https');
    }
    return url.toString();
  } catch (error) {
    throw new AppError('CONFIG_INVALID', `Invalid ${key}`, {
      cause: error,
      userMessage: `${key} configuration is invalid. Please check ${key}.`,
    });
  }
};

const parseTimeout = (raw: string | undefined, key: string) => {
  const value = raw?.trim();
  const timeoutMs = value ? Number(value) : DEFAULT_TIMEOUT_MS;

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new AppError('CONFIG_INVALID', `Invalid ${key}`, {
      userMessage: `${key} must be a positive number. Please check ${key}.`,
    });
  }

  return timeoutMs;
};

export const createConfig = (env: EnvSource): AppConfig => {
  const appName = env.VITE_APP_NAME?.trim() || 'Laura';

  const contactEndpoint = parseOptionalUrl(
    env.VITE_CONTACT_ENDPOINT,
    'VITE_CONTACT_ENDPOINT'
  );
  const chatEndpoint = parseOptionalUrl(
    env.VITE_CHAT_ENDPOINT,
    'VITE_CHAT_ENDPOINT'
  );

  const contactTimeoutMs = parseTimeout(
    env.VITE_CONTACT_TIMEOUT_MS,
    'VITE_CONTACT_TIMEOUT_MS'
  );
  const chatTimeoutMs = parseTimeout(
    env.VITE_CHAT_TIMEOUT_MS,
    'VITE_CHAT_TIMEOUT_MS'
  );

  return {
    appName,
    contactEndpoint,
    contactTimeoutMs,
    chatEndpoint,
    chatTimeoutMs,
  };
};

let cachedConfig: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  if (!cachedConfig) {
    cachedConfig = createConfig(import.meta.env);
  }
  return cachedConfig;
};
