import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import config from '../config';

// Winston logger setup
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

export const logger = winston.createLogger({
  level: config.logger.level,
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
};

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Default values
  let statusCode = 500;
  let message = 'Internal server error';
  let errorType = ErrorTypes.INTERNAL_ERROR;
  let details: unknown = undefined;

  // Handle different error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorType = ErrorTypes.INTERNAL_ERROR;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    errorType = ErrorTypes.VALIDATION_ERROR;
    details = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400;
    message = 'Invalid ID format';
    errorType = ErrorTypes.VALIDATION_ERROR;
  } else if (err.name === 'MongoServerError') {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    errorType = ErrorTypes.DATABASE_ERROR;
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: {
      type: errorType,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      type: ErrorTypes.NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger.log({
      level: logLevel,
      message: `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

export default errorHandler;
