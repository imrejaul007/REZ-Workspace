/**
 * TreasuryOS Logger
 */

interface LogMeta {
  [key: string]: unknown;
}

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, meta || '');
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, meta || '');
  },
  error: (message: string, error?: unknown) => {
    const errorObj = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, errorObj);
  },
};

export default logger;
