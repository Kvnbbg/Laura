import { AppError } from '../utils/errors';

export type EnvSource = {
  VITE_APP_NAME?: string;
  VITE_CONTACT_ENDPOINT?: string;
  VITE_CONTACT_TIMEOUT_MS?: string;
  VITE_CHAT_ENDPOINT?: string;
  VITE_CHAT_TIMEOUT_MS?: string;
  VITE_ENABLE_CHAT?: string;
  VITE_MISTRAL_API_KEY?: string;
  VITE_MISTRAL_MODEL?: string;
};

export type MistralModel = 'mistral-small' | 'mistral-medium' | 'mistral-large';

export type AppConfig = {
  appName: string;
  contactEndpoint: string | null;
  contactTimeoutMs: number;
  chatEndpoint: string;
  chatTimeoutMs: number;
  chatEnabled: boolean;
  chatErrors: string[];
  mistralModel: MistralModel;
};

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_CHAT_ENDPOINT = '/api/chat';
const DEFAULT_MODEL: MistralModel = 'mistral-small';

const parseOptionalUrl = (raw: string | undefined, key: string) => {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
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

const parseBoolean = (raw: string | undefined) => {
  if (!raw) {
    return false;
  }
  const value = raw.trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(value);
};

const parseMistralModel = (raw: string | undefined) => {
  if (!raw) {
    return { model: DEFAULT_MODEL };
  }
  const value = raw.trim();
  if (value === 'mistral-small' || value === 'mistral-medium' || value === 'mistral-large') {
    return { model: value as MistralModel };
  }
  return {
    model: DEFAULT_MODEL,
    error: `VITE_MISTRAL_MODEL must be one of: mistral-small, mistral-medium, mistral-large.`,
  };
};

export const createConfig = (env: EnvSource): AppConfig => {
  const appName = env.VITE_APP_NAME?.trim() || 'Laura';

  const contactEndpoint = parseOptionalUrl(
    env.VITE_CONTACT_ENDPOINT,
    'VITE_CONTACT_ENDPOINT'
  );
  const chatEndpoint =
    parseOptionalUrl(env.VITE_CHAT_ENDPOINT, 'VITE_CHAT_ENDPOINT') ??
    DEFAULT_CHAT_ENDPOINT;

  const contactTimeoutMs = parseTimeout(
    env.VITE_CONTACT_TIMEOUT_MS,
    'VITE_CONTACT_TIMEOUT_MS'
  );
  const chatTimeoutMs = parseTimeout(
    env.VITE_CHAT_TIMEOUT_MS,
    'VITE_CHAT_TIMEOUT_MS'
  );

  const chatEnabledRequested = parseBoolean(env.VITE_ENABLE_CHAT);
  const chatErrors: string[] = [];

  const { model: mistralModel, error: modelError } = parseMistralModel(
    env.VITE_MISTRAL_MODEL
  );
  if (modelError && chatEnabledRequested) {
    chatErrors.push(modelError);
  }

  const apiKey = env.VITE_MISTRAL_API_KEY?.trim();
  if (chatEnabledRequested && !apiKey) {
    chatErrors.push(
      'VITE_MISTRAL_API_KEY is required to enable chat. Please set it in your environment.'
    );
  }

  const chatEnabled = chatEnabledRequested && chatErrors.length === 0;

  return {
    appName,
    contactEndpoint,
    contactTimeoutMs,
    chatEndpoint,
    chatTimeoutMs,
    chatEnabled,
    chatErrors,
    mistralModel,
  };
};

let cachedConfig: AppConfig | null = null;

export const getConfig = (): AppConfig => {
  if (!cachedConfig) {
    cachedConfig = createConfig(import.meta.env);
  }
  return cachedConfig;
};
