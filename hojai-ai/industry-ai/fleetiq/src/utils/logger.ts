/**
 * FLEETIQ - Winston Logger Configuration
 * Production-ready logging with structured output
 */

import winston from 'winston';
import path from 'path';

const { combine, timestamp, errors, json, colorize, printf, simple } = winston.format;

// Custom format for development
const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for production (JSON)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logFormat = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'FLEETIQ',
    environment: process.env.NODE_ENV || 'development'
  },
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exceptionHandlers: [
    new winston.transports.Console()
  ],
  rejectionHandlers: [
    new winston.transports.Console()
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Ensure logs directory exists
  const logsDir = process.env.LOGS_DIR || path.join(process.cwd(), 'logs');

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }));

  // Separate access log
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'access.log'),
    format: combine(timestamp(), json())
  }));
}

// Helper methods for specific log types
export const logRequest = (req: { method: string; path: string; ip?: string; userId?: string }, res: { statusCode: number }, duration: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userId: req.userId
  });
};

export const logError = (context: string, error: Error, meta?: Record<string, unknown>) => {
  logger.error(context, {
    error: error.message,
    stack: error.stack,
    ...meta
  });
};

export const logBusinessEvent = (event: string, data: Record<string, unknown>) => {
  logger.info(`[EVENT] ${event}`, data);
};

export default logger;
