import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: (req.body as unknown)?.userId,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details: {
        errors: err.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    };
    res.status(400).json(response);
    return;
  }

  // Handle specific error types
  if (err.name === 'MongoServerError') {
    const response: ErrorResponse = {
      error: 'Database Error',
      code: 'DATABASE_ERROR',
      message: 'A database error occurred',
    };
    res.status(503).json(response);
    return;
  }

  if (err.name === 'ValidationError') {
    const response: ErrorResponse = {
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: err.message,
    };
    res.status(400).json(response);
    return;
  }

  // Handle custom application errors
  if ((err as unknown).code) {
    const statusCode = (err as unknown).statusCode || 500;
    const response: ErrorResponse = {
      error: 'Error',
      code: (err as unknown).code,
      message: err.message,
    };
    res.status(statusCode).json(response);
    return;
  }

  // Default error response
  const response: ErrorResponse = {
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message:
      process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
  };
  res.status(500).json(response);
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: 'Not Found',
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  };
  res.status(404).json(response);
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
