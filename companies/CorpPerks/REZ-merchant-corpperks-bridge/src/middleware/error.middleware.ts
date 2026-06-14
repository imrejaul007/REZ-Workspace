import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { ApiResponse } from '../types';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * Conflict error (e.g., duplicate entry)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * External service error
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: unknown) {
    super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  // Log the error
  if (err instanceof AppError && err.isOperational) {
    logger.warn('Operational error', {
      requestId,
      path: req.path,
      method: req.method,
      code: err.code,
      message: err.message,
      details: err.details,
    });
  } else {
    logger.error('Unhandled error', {
      requestId,
      path: req.path,
      method: req.method,
      error: err.message,
      stack: err.stack,
    });
  }

  // Determine status code and response
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const message =
    err instanceof AppError && err.isOperational
      ? err.message
      : 'An unexpected error occurred';

  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details: err instanceof AppError ? err.details : undefined,
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err instanceof AppError && !err.isOperational) {
    (response.error as Record<string, unknown>).stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  };

  res.status(404).json(response);
}

export default {
  AppError,
  NotFoundError,
  ValidationError,
  ConflictError,
  ExternalServiceError,
  errorHandler,
  notFoundHandler,
};
