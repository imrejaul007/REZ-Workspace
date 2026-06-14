import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger.js';
import { ZodError } from 'zod';

const logger = createLogger('error-handler');

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  if (statusCode >= 500) {
    logger.error(`Server Error: ${message}`, err.stack);
  } else {
    logger.warn(`Client Error: ${message}`, { statusCode });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message
    });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
    return;
  }

  // Handle duplicate key errors
  if ((err as AppError).code === '11000') {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: err.message
    });
    return;
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`
  });
}

export function createAppError(message: string, statusCode: number = 500): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
