/**
 * Logger utility using Winston
 */

import winston from 'winston';
import { isProduction } from './config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level.toUpperCase()}] ${message} ${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProduction() ? jsonFormat : logFormat,
  defaultMeta: { service: 'webhook-verification' },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ]
});

// Add file transports in production
if (isProduction()) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  );

  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    })
  );
}

// Create child logger for specific components
export const createLogger = (component: string) => {
  return logger.child({ component });
};
