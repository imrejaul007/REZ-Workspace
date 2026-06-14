type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const formatMessage = (level: LogLevel, message: string, meta?: Record<string, unknown>): string => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      logger.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      logger.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      logger.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      logger.error(formatMessage('error', message, meta));
    }
  },
};

export default logger;
