/**
 * REZ Verify QR - Winston Logger
 * Production-ready structured logging
 */

import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for production
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;

  if (Object.keys(metadata).length > 0 && metadata.stack) {
    msg += `\n${metadata.stack}`;
  } else if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }

  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport with colors for development
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      )
    })
  ],
  defaultMeta: { service: 'verify-qr-service' },
  exitOnError: false
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: path.join(process.env.LOG_DIR || './logs', 'error.log'),
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));
  logger.add(new winston.transports.File({
    filename: path.join(process.env.LOG_DIR || './logs', 'combined.log'),
    maxsize: 5242880,
    maxFiles: 5
  }));
}

export default logger;

/**
 * Helper function to log external API errors
 */
export function logExternalApiError(service: string, endpoint: string, error: unknown, context?: Record<string, unknown>): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`External API error: ${service}/${endpoint}`, {
    service,
    endpoint,
    error: errorMessage,
    stack: errorStack,
    context
  });
}

/**
 * Helper function to log external API successes
 */
export function logExternalApiSuccess(service: string, endpoint: string, responseTime: number, context?: Record<string, unknown>): void {
  logger.info(`External API success: ${service}/${endpoint}`, {
    service,
    endpoint,
    responseTime,
    context
  });
}