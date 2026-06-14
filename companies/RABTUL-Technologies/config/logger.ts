/**
 * Logger Configuration
 * Shared logger for all services
 */

export interface LogMeta {
  [key: string]: unknown;
}

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, meta || '');
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, meta || '');
  },
  error: (message: string, error?: unknown, meta?: LogMeta) => {
    const errorObj = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, errorObj, meta || '');
  },
  debug: (message: string, meta?: LogMeta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, meta || '');
    }
  },
};

export default logger;
