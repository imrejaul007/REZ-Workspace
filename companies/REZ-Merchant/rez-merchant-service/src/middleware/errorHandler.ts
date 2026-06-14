/**
 * Error Handler Middleware
 *
 * Centralized error handling for the API:
 * - Standardized error responses
 * - Error logging
 * - Custom error classes
 * - Async error wrapper
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

// ── Custom Error Classes ───────────────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
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
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

// ── Error Response Interface ─────────────────────────────────────────────────

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string; // Only in development
  };
  requestId?: string;
}

// ── Error Handler ───────────────────────────────────────────────────────────

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as unknown).requestId || (req as unknown).res?.locals?.requestId;

  // Default error values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = {
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    };
  } else if (err.name === 'MongoServerError') {
    if ((err as unknown).code === 11000) {
      statusCode = 409;
      code = 'DUPLICATE_KEY';
      message = 'A record with this value already exists';
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[Error] ${req.method} ${req.path}`, {
      statusCode,
      code,
      message,
      stack: err.stack,
      requestId,
      body: req.body,
    });
  } else {
    logger.warn(`[Error] ${req.method} ${req.path}`, {
      statusCode,
      code,
      message,
      requestId,
    });
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  if (requestId) {
    response.requestId = requestId;
  }

  res.status(statusCode).json(response);
}

// ── Async Handler Wrapper ───────────────────────────────────────────────────

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ── 404 Handler ────────────────────────────────────────────────────────────

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  };

  res.status(404).json(response);
}

// ── Validation Helper ────────────────────────────────────────────────────────

export function validate<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: ZodError } },
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Request validation failed', {
      errors: result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }
  return result.data;
}
