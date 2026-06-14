import winston from 'winston';
import { config } from '../config/index.js';

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: config.nodeEnv === 'production' ? structuredFormat : consoleFormat,
  defaultMeta: {
    service: 'business-outcome-engine',
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

// Create stream for HTTP request logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
export const logWithContext = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context: Record<string, any>
): void => {
  logger.log(level, message, context);
};

// Domain-specific logging helpers
export const predictionLogger = {
  info: (message: string, data: Record<string, any> = {}) => {
    logger.info(`[PREDICTION] ${message}`, { domain: 'prediction', ...data });
  },
  error: (message: string, error: Error | string, data: Record<string, any> = {}) => {
    logger.error(`[PREDICTION] ${message}`, { domain: 'prediction', error: String(error), ...data });
  },
};

export const interventionLogger = {
  info: (message: string, data: Record<string, any> = {}) => {
    logger.info(`[INTERVENTION] ${message}`, { domain: 'intervention', ...data });
  },
  error: (message: string, error: Error | string, data: Record<string, any> = {}) => {
    logger.error(`[INTERVENTION] ${message}`, { domain: 'intervention', error: String(error), ...data });
  },
};

export const trackingLogger = {
  info: (message: string, data: Record<string, any> = {}) => {
    logger.info(`[TRACKING] ${message}`, { domain: 'tracking', ...data });
  },
  error: (message: string, error: Error | string, data: Record<string, any> = {}) => {
    logger.error(`[TRACKING] ${message}`, { domain: 'tracking', error: String(error), ...data });
  },
};

export const learningLogger = {
  info: (message: string, data: Record<string, any> = {}) => {
    logger.info(`[LEARNING] ${message}`, { domain: 'learning', ...data });
  },
  error: (message: string, error: Error | string, data: Record<string, any> = {}) => {
    logger.error(`[LEARNING] ${message}`, { domain: 'learning', error: String(error), ...data });
  },
};

export const ecosystemLogger = {
  info: (message: string, data: Record<string, any> = {}) => {
    logger.info(`[ECOSYSTEM] ${message}`, { domain: 'ecosystem', ...data });
  },
  error: (message: string, error: Error | string, data: Record<string, any> = {}) => {
    logger.error(`[ECOSYSTEM] ${message}`, { domain: 'ecosystem', error: String(error), ...data });
  },
};

export default logger;