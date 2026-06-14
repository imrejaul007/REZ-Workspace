/**
 * Error Handling Middleware
 * Centralized error handling and validation
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from './logging';

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
  errors: Record<string, string>;
  
  constructor(message: string, errors: Record<string, string> = {}) {
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
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

// Error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  
  if (err instanceof AppError) {
    logger.warn('Application error', {
      requestId,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
    });
    
    res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
      ...(err instanceof ValidationError && { errors: err.errors }),
    });
    return;
  }
  
  // Unexpected errors
  logger.error('Unexpected error', {
    requestId,
    message: err.message,
    stack: err.stack,
    path: req.path,
  });
  
  res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  });
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
