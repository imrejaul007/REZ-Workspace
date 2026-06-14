/**
 * Logger utility for consistent logging across the app
 * Uses console methods with optional levels for production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const formatMessage = (level: LogLevel, message: string, ...args: unknown[]): string => {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message} ${args.length > 0 ? JSON.stringify(args, null, 2) : ''}`;
};

const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
};

const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message, ...args));
    }
  },

  info: (message: string, ...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message, ...args));
    }
  },

  warn: (message: string, ...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, ...args));
    }
  },

  error: (message: string, ...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, ...args));
    }
  },
};

export default logger;
