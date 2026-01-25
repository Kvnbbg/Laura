type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogPayload = {
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
};

const MAX_LOG_ENTRIES = 200;

const shouldLogDebug = () => import.meta.env.DEV;

const getLogStore = () => {
  const globalScope = globalThis as typeof globalThis & {
    __appLogs?: LogPayload[];
  };
  if (!globalScope.__appLogs) {
    globalScope.__appLogs = [];
  }
  return globalScope.__appLogs;
};

const formatPayload = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
): LogPayload => ({
  level,
  message,
  meta,
  timestamp: new Date().toISOString(),
});

const writeLog = (
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>
) => {
  if (level === 'debug' && !shouldLogDebug()) {
    return;
  }

  const payload = formatPayload(level, message, meta);
  const logStore = getLogStore();
  logStore.push(payload);
  if (logStore.length > MAX_LOG_ENTRIES) {
    logStore.splice(0, logStore.length - MAX_LOG_ENTRIES);
  }
};

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    writeLog('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    writeLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    writeLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    writeLog('error', message, meta),
};
