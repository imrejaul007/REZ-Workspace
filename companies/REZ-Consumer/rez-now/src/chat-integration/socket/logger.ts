import logger from './utils/logger';

/**
 * @deprecated Use @rez/shared utilities instead.
 * This file provides local logger for backward compatibility.
 */

// Simple logger interface
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta) return '';
  return ' ' + JSON.stringify(meta);
}

export function createServiceLogger(component: string): Logger {
  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      const timestamp = new Date().toISOString();
      logger.info(`[${timestamp}] [${component}] INFO: ${message}${formatMeta(meta)}`);
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      const timestamp = new Date().toISOString();
      logger.warn(`[${timestamp}] [${component}] WARN: ${message}${formatMeta(meta)}`);
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      const timestamp = new Date().toISOString();
      logger.error(`[${timestamp}] [${component}] ERROR: ${message}${formatMeta(meta)}`);
    },
    debug: (message: string, meta?: Record<string, unknown>) => {
      if (process.env.LOG_LEVEL === 'debug') {
        const timestamp = new Date().toISOString();
        logger.info(`[${timestamp}] [${component}] DEBUG: ${message}${formatMeta(meta)}`);
      }
    },
  };
}

export const logger: Logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    logger.info(`[${timestamp}] INFO: ${message}${formatMeta(meta)}`);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    logger.warn(`[${timestamp}] WARN: ${message}${formatMeta(meta)}`);
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    logger.error(`[${timestamp}] ERROR: ${message}${formatMeta(meta)}`);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.LOG_LEVEL === 'debug') {
      const timestamp = new Date().toISOString();
      logger.info(`[${timestamp}] DEBUG: ${message}${formatMeta(meta)}`);
    }
  },
};
