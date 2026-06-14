/**
 * Simple logger for DOOH Service
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel;
const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (levels[LOG_LEVEL] <= levels.debug) {
      logger.info(formatMessage('debug', message, meta));
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (levels[LOG_LEVEL] <= levels.info) {
      logger.info(formatMessage('info', message, meta));
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (levels[LOG_LEVEL] <= levels.warn) {
      logger.warn(formatMessage('warn', message, meta));
    }
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    if (levels[LOG_LEVEL] <= levels.error) {
      logger.error(formatMessage('error', message, meta));
    }
  },
};

export default logger;
