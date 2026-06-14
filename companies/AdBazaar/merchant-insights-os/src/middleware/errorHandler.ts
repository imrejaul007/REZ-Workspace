import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

/**
 * Custom error class with status code
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'MongoServerError') {
    // MongoDB duplicate key error
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Resource already exists';
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      code,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  const response: {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    (response as any).stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper to catch async errors
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 for API routes
 */
export const apiNotFoundHandler = (req: Request, res: Response): void => {
  if (req.path.startsWith('/api/')) {
    notFoundHandler(req, res);
  }
};