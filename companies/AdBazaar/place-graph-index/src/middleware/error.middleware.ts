import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/index.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  public errors: Array<{ field: string; message: string }>;

  constructor(message: string, errors: Array<{ field: string; message: string }> = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 if no status code
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: Array<{ field: string; message: string }> = [];

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    // Extract Mongoose validation errors if needed
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Handle duplicate key error
  if ((err as Record<string, unknown>).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Log error in non-production
  if (process.env.NODE_ENV !== 'production') {
    logger.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  const response: ApiResponse<null> = {
    success: false,
    error: message,
  };

  if (errors.length > 0) {
    response.message = JSON.stringify(errors);
  }

  res.status(statusCode).json(response);
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  };

  res.status(404).json(response);
}

/**
 * Async error wrapper
 */
export function asyncErrorHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}