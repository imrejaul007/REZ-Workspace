import { Request, Response, NextFunction } from 'express';

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }> = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error:', err);
  }

  // Handle known operational errors
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      success: false,
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    };

    if (err instanceof ValidationError && err.errors.length > 0) {
      response.details = err.errors;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle Mongoose duplicate key error
  if ((err as unknown as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Not found handler
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date().toISOString(),
  });
}