/**
 * NEIGHBORAI - Logger Middleware & Winston Configuration
 */

import winston from 'winston';
import morgan from 'morgan';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// WINSTON LOGGER CONFIGURATION
// ============================================

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'NEIGHBORAI', version: '1.0.0' },
  transports: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5
  }));
}

// ============================================
// REQUEST LOGGER
// ============================================

export interface RequestWithId extends Request {
  requestId: string;
  startTime: number;
}

export const requestLogger = (req: Request, res: Response, next: Function) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  (req as RequestWithId).requestId = requestId;
  (req as RequestWithId).startTime = startTime;

  // Log request start
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).userId
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// ============================================
// MORGAN FORMATTER (for HTTP access logging)
// ============================================

export const morganFormat = ':method :url :status :response-time ms - :res[content-length]';

// ============================================
// LOG HELPERS
// ============================================

export const logError = (context: string, error: Error | any, meta?: object) => {
  logger.error(context, {
    error: error.message || error,
    stack: error.stack,
    ...meta
  });
};

export const logInfo = (context: string, meta?: object) => {
  logger.info(context, meta);
};

export const logWarn = (context: string, meta?: object) => {
  logger.warn(context, meta);
};

export const logDebug = (context: string, meta?: object) => {
  logger.debug(context, meta);
};

export default logger;