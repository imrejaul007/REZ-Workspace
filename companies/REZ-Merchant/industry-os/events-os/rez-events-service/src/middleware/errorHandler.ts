/**
 * Global Error Handler Middleware for Events Service
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Log error details
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: err.message,
      stack: err.stack,
      code,
      path: _req.path,
      method: _req.method
    });
  } else {
    logger.warn('Client error:', {
      message: err.message,
      code,
      path: _req.path,
      method: _req.method
    });
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err.errors
    });
    return;
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code,
    ...(err.details && { details: err.details })
  });
}

/**
 * Not found handler - 404
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom error with status code
 */
export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error factory functions
 */
export const Errors = {
  badRequest: (message: string, details?: unknown) =>
    new AppError(message, 400, 'BAD_REQUEST', details),

  unauthorized: (message: string = 'Authentication required') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Access denied') =>
    new AppError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  tooManyRequests: (message: string = 'Rate limit exceeded') =>
    new AppError(message, 429, 'TOO_MANY_REQUESTS'),

  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR')
};