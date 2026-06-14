import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorDetails: any = undefined;

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = { type: 'validation' };
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    errorDetails = { type: 'cast_error' };
  }

  if (err.name === 'MongoServerError') {
    // Handle duplicate key error
    if ((err as any).code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
      const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
      message = `${field} already exists`;
    }
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = {
      type: 'zod_validation',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    };
  }

  // Don't leak error details in production
  const response: any = {
    success: false,
    error: message,
    statusCode
  };

  if (config.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  if (errorDetails) {
    response.details = errorDetails;
  }

  res.status(statusCode).json(response);
};

/**
 * Not Found Handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create an operational error
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export default errorHandler;