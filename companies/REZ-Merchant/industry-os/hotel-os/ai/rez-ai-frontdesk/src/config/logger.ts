import { logger } from '../../shared/logger';
/**
 * Logger utility for AI Front Desk Service
 */

import { config } from './index';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[config.logging.level as LogLevel] ?? LOG_LEVELS.info;

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) {
      logger.info(formatMessage('debug', message, meta));
    }
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      logger.info(formatMessage('info', message, meta));
    }
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) {
      logger.warn(formatMessage('warn', message, meta));
    }
  },

  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) {
      logger.error(formatMessage('error', message, meta));
    }
  },
};

export default logger;