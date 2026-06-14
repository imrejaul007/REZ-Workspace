import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, code: string = 'ERROR', details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(503, message, 'SERVICE_UNAVAILABLE');
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
  stack?: string;
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  // Handle ApiError
  if (err instanceof ApiError) {
    const response: ErrorResponse = {
      success: false,
      error: err.message,
      code: err.code,
    };

    if (err.details) {
      response.details = err.details;
    }

    if (process.env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID',
    });
    return;
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const validationError = err as any;
    const errors = Object.keys(validationError.errors).reduce((acc, key) => {
      acc[key] = validationError.errors[key].message;
      return acc;
    }, {} as Record<string, string>);

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    });
    return;
  }

  // Handle Mongoose DuplicateKeyError
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  // Handle DocumentNotFoundError
  if (err instanceof DocumentNotFoundError) {
    res.status(404).json({
      success: false,
      error: err.message,
      code: 'NOT_FOUND',
    });
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && (err as any).body) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      code: 'INVALID_JSON',
    });
    return;
  }

  // Default to 500 Internal Server Error
  const response: ErrorResponse = {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    code: 'INTERNAL_ERROR',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}

// 404 handler for unknown routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
}

// Async handler wrapper to catch async errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// DocumentNotFoundError class
export class DocumentNotFoundError extends Error {
  constructor(documentType: string, identifier: string) {
    super(`${documentType} with identifier '${identifier}' not found`);
    this.name = 'DocumentNotFoundError';
  }
}