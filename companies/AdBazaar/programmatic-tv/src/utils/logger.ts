import { config } from '../config/index.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[config.logLevel as LogLevel] ?? LOG_LEVELS.info;

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (currentLevel <= LOG_LEVELS.debug) {
      logger.debug(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (currentLevel <= LOG_LEVELS.info) {
      logger.info(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (currentLevel <= LOG_LEVELS.warn) {
      logger.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>): void {
    if (currentLevel <= LOG_LEVELS.error) {
      logger.error(formatMessage('error', message, meta));
    }
  },
};