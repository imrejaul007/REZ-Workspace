/**
 * Winston Logger for Grocery Service
 *
 * Provides structured logging with levels:
 * - error: Error conditions
 * - warn: Warning conditions
 * - info: Informational messages (default)
 * - http: HTTP request logs
 * - debug: Detailed debugging information
 */

import winston from 'winston';
import path from 'path';

// Environment configuration
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(meta).length > 0 && meta.stack === undefined) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // Add stack trace for errors
    if (meta.stack) {
      log += `\n${meta.stack}`;
    }

    return log;
  })
);

// JSON format for file/logstash output
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport - always enabled in non-production
if (!IS_PRODUCTION) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// File transports for production
if (IS_PRODUCTION) {
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );

  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    })
  );

  // HTTP request logs
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
      level: 'http',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  defaultMeta: {
    service: 'rez-grocery-service',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  exitOnError: false
});

// Create child logger for specific contexts
logger.child = (meta: Record<string, unknown>) => {
  return logger.child(meta);
};

// Log startup message
if (!IS_PRODUCTION) {
  logger.info('========================================');
  logger.info('  Grocery Service - Development Mode');
  logger.info(`  Log Level: ${LOG_LEVEL}`);
  logger.info('========================================');
}

export default logger;

// Export types for use elsewhere
export type Logger = typeof logger;

/**
 * Log HTTP request details
 */
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string,
  merchantId?: string
): void {
  const logData = {
    method,
    path,
    statusCode,
    duration: `${duration}ms`,
    userId,
    merchantId
  };

  if (statusCode >= 500) {
    logger.error('Request failed', logData);
  } else if (statusCode >= 400) {
    logger.warn('Request error', logData);
  } else {
    logger.http('Request completed', logData);
  }
}

/**
 * Log database operations
 */
export function logDbOperation(
  operation: string,
  collection: string,
  duration: number,
  success: boolean,
  error?: string
): void {
  const logData = {
    operation,
    collection,
    duration: `${duration}ms`,
    success
  };

  if (success) {
    logger.debug('DB operation', logData);
  } else {
    logger.error('DB operation failed', { ...logData, error });
  }
}

/**
 * Log business events
 */
export function logBusinessEvent(
  event: string,
  details: Record<string, unknown>
): void {
  logger.info(`[EVENT] ${event}`, details);
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  details: {
    userId?: string;
    ip?: string;
    action: string;
    resource?: string;
    success: boolean;
    reason?: string;
  }
): void {
  const logData = {
    event,
    ...details
  };

  if (details.success) {
    logger.info(`[SECURITY] ${event}`, logData);
  } else {
    logger.warn(`[SECURITY] ${event} - FAILED`, logData);
  }
}