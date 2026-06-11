/**
 * GLAMAI - Logger Middleware
 * Salon AI Operating System
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createLogger, format, transports } from 'winston';
import { LOG_LEVEL, LOG_DIR, PORT } from '../config';

// Create Winston logger
export const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'GLAMAI', port: PORT },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          const metaStr = Object.keys(meta).length > 2
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new transports.File({
    filename: `${LOG_DIR}/error.log`,
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  logger.add(new transports.File({
    filename: `${LOG_DIR}/combined.log`,
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

/**
 * Request logging middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = requestId;

  const start = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous',
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

/**
 * Error logging helper
 */
export const logError = (
  error: Error,
  context?: {
    requestId?: string;
    userId?: string;
    path?: string;
    method?: string;
  }
) => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    ...context,
  });
};

export default {
  logger,
  requestLogger,
  logError,
};