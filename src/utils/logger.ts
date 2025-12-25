type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogPayload = {
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
  timestamp: string;
};

const shouldLogDebug = () => import.meta.env.DEV;

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
  const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  console[method](payload);
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
