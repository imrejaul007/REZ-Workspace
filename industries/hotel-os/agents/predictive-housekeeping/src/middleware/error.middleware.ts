import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, formatErrorResponse, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

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
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const validationError = new ValidationError(
      'Request validation failed',
      err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      'VALIDATION_ERROR'
    );
    res.status(validationError.statusCode).json(formatErrorResponse(validationError, req.path));
    return;
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatErrorResponse(err, req.path));
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const validationError = new ValidationError(
      'Database validation failed',
      err.message,
      'DATABASE_VALIDATION_ERROR'
    );
    res.status(validationError.statusCode).json(formatErrorResponse(validationError, req.path));
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const duplicateError = new AppError(
      'Resource already exists',
      409,
      'DUPLICATE_KEY_ERROR'
    );
    res.status(duplicateError.statusCode).json(formatErrorResponse(duplicateError, req.path));
    return;
  }

  // Handle unknown errors
  const internalError = new AppError(
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    500,
    'INTERNAL_ERROR'
  );
  res.status(internalError.statusCode).json(formatErrorResponse(internalError, req.path));
}

/**
 * Not found handler middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  });
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}