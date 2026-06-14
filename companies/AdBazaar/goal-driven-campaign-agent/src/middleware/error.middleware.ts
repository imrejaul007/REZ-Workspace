import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { logger } from '../utils/logger.js';
import { errorsTotal } from '../utils/metrics.js';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Validation Error
 */
export class ValidationError extends AppError {
  public errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Unauthorized Error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Track error metrics
  errorsTotal.inc({ type: err.name, source: 'express' });

  // Handle AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code
    });
    return;
  }

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
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors
    });
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      code: 'DUPLICATE_KEY'
    });
    return;
  }

  // Handle MongoDB validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'MONGO_VALIDATION_ERROR'
    });
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    code: 'INTERNAL_ERROR'
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request validation middleware using Zod schema
 */
export function validateRequest(schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateRequest
};