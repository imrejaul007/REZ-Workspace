import winston from 'winston';
import { config } from '../config';

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'rez-cross-industry-loyalty-service',
    version: '1.0.0'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    }),

    // Error file transport
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),

    // Loyalty-specific log
    new winston.transports.File({
      filename: 'logs/loyalty.log',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    })
  ],

  // Exception handlers
  exceptionHandlers: [
    new winston.transports.File({
      filename: 'logs/exceptions.log',
      format: fileFormat
    })
  ],

  // Rejection handlers
  rejectionHandlers: [
    new winston.transports.File({
      filename: 'logs/rejections.log',
      format: fileFormat
    })
  ],

  // Don't exit on uncaught exceptions in production
  exitOnError: config.NODE_ENV !== 'production'
});

// Create a child logger for loyalty-specific logging
export const loyaltyLogger = logger.child({
  component: 'loyalty-engine'
});

// Create a child logger for database operations
export const dbLogger = logger.child({
  component: 'database'
});

// Create a child logger for API requests
export const apiLogger = logger.child({
  component: 'api'
});

// Utility function to log sensitive data safely
export const logSanitized = (message: string, data: Record<string, any>): void => {
  const sanitized = sanitizeLogData(data);
  logger.info(message, sanitized);
};

// Sanitize sensitive fields from log data
function sanitizeLogData(data: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export default logger;