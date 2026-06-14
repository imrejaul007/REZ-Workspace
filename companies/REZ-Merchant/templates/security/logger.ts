// ================================================
// REZ-Merchant Winston Logger Template
// Standardized logging for all services
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
export const createLogger = (serviceName: string = 'rez-service') => {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      level: logLevel,
      format: isProduction ? logFormat : simpleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
  ];

  // File transports for production
  if (isProduction) {
    // Error log
    transports.push(
      new winston.transports.File({
        filename: path.join(process.env.LOG_DIR || '/app/logs', 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true,
      })
    );

    // Combined log
    transports.push(
      new winston.transports.File({
        filename: path.join(process.env.LOG_DIR || '/app/logs', 'combined.log'),
        format: logFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
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
export const logger = createLogger(process.env.SERVICE_NAME || 'rez-service');

// ================================================
// Request Logging Middleware
// ================================================
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = (req as any).requestId || `req_${Date.now()}`;

  // Log request
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

// ================================================
// Import express types for request logger
// ================================================
import { Request, Response, NextFunction } from 'express';

export default logger;