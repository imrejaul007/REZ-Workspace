/**
 * Error Handler Utility
 *
 * Express error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';

const logger = createLogger('error-handler');

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, any> | undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    if (err instanceof ValidationError) {
      details = err.details;
    }
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log the error
  const logContext = {
    statusCode,
    code,
    message,
    stack: err.stack,
    isOperational: err instanceof AppError ? (err as AppError).isOperational : false,
  };

  if (statusCode >= 500) {
    logger.error('server_error', logContext);
  } else {
    logger.warn('client_error', logContext);
  }

  // Build response
  const response: ErrorResponse = {
    error: statusCode >= 500 ? 'Internal Server Error' : message,
    code,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
