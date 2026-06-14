/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      statusCode,
    });
  } else {
    logger.warn('Client error', {
      error: err.message,
      statusCode,
    });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: isOperational ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      details: {
        message: err.message,
        stack: err.stack,
      },
    }),
  });
}

/**
 * Not found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

/**
 * Create an operational error
 */
export function createError(
  message: string,
  statusCode = 500
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  createError,
  asyncHandler,
};