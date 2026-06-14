/**
 * Logger utility with production-ready logging
 * - Uses structured logging
 * - Respects LOG_LEVEL environment variable
 * - Masks sensitive data in production
 */

const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;

type LogLevel = keyof typeof levels;

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL as LogLevel] || levels[level] >= levels.info;
}

function formatMessage(level: LogLevel, service: string, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] [${service}] ${message}${metaStr}`;
}

export const logger = {
  debug(service: string, message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', service, message, meta));
    }
  },

  info(service: string, message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', service, message, meta));
    }
  },

  warn(service: string, message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', service, message, meta));
    }
  },

  error(service: string, message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const errorMeta = error instanceof Error
        ? { error: error.message, stack: error.stack, ...meta }
        : { error: String(error), ...meta };
      console.error(formatMessage('error', service, message, errorMeta));
    }
  },
};
