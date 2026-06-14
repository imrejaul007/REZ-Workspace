// ================================================
// REZ Atlas Score - Winston Logger
// ================================================

import winston from 'winston';
import path from 'path';

// ================================================
// Log Format Configuration
// ================================================
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const simpleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// ================================================
// Create Logger Instance
// ================================================
export const createLogger = (serviceName: string = 'REZ-atlas-score') => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format: isProduction ? logFormat : simpleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
  ];

  if (isProduction) {
    const logDir = process.env.LOG_DIR || '/app/logs';

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      })
    );

    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: logFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5,
        tailable: true,
      })
    );
  }

  return winston.createLogger({
    level: logLevel,
    defaultMeta: {
      service: serviceName,
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
    transports,
    exitOnError: false,
    exceptionHandlers: [
      new winston.transports.File({
        filename: path.join(process.env.LOG_DIR || '/app/logs', 'exceptions.log'),
        format: logFormat,
      }),
    ],
    rejectionHandlers: [
      new winston.transports.File({
        filename: path.join(process.env.LOG_DIR || '/app/logs', 'rejections.log'),
        format: logFormat,
      }),
    ],
  });
};

// ================================================
// Pre-configured Logger Instance
// ================================================
export const logger = createLogger(process.env.SERVICE_NAME || 'REZ-atlas-score');

// ================================================
// Request Logging Middleware
// ================================================
import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = (req as any).requestId || `req_${Date.now()}`;

  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// ================================================
// Child Logger for Specific Components
// ================================================
export const createChildLogger = (component: string, meta?: object) => {
  return logger.child({ component, ...meta });
};

// ================================================
// Structured Logging Helpers
// ================================================
export const logInfo = (message: string, meta?: object) => logger.info(message, meta);
export const logError = (message: string, meta?: object) => logger.error(message, meta);
export const logWarn = (message: string, meta?: object) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: object) => logger.debug(message, meta);

export default logger;
