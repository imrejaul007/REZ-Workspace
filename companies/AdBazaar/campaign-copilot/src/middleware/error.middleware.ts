import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.js';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message, 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(e.message);
    });

    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      errors,
    });
    return;
  }

  // Handle custom validation errors
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid',
    });
    return;
  }

  // Handle duplicate key error
  if ((err as Record<string, unknown>).code === 11000) {
    res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A resource with this identifier already exists',
    });
    return;
  }

  // Default to 500 Internal Server Error
  const statusCode = 500;
  const message = config.nodeEnv === 'production'
    ? 'Internal Server Error'
    : err.message;

  res.status(statusCode).json({
    error: 'Internal Server Error',
    message,
  });
}

// Handle 404 for unmatched routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

// Async handler wrapper to catch errors in async route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}