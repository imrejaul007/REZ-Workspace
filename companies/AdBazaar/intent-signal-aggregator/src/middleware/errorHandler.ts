import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

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
  details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400);
    this.details = details;
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
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = 'statusCode' in err ? err.statusCode : 500;
  const isOperational = 'isOperational' in err ? err.isOperational : false;

  const response: ErrorResponse = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  if (err instanceof ValidationError && err.details) {
    response.details = err.details;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error', {
      statusCode,
      error: err.message,
      path: req.path,
      method: req.method,
    });
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    response.error = 'Internal Server Error';
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}