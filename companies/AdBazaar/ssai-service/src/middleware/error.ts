import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '../types/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: 'details' in err ? (err as ValidationError).details : undefined,
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof ZodError) {
    const details: Record<string, unknown> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      details[path] = e.message;
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details,
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(400).json(response);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
      },
      meta: {
        requestId: req.headers['x-request-id'] as string ?? 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(400).json(response);
    return;
  }

  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
    },
    meta: {
      requestId: req.headers['x-request-id'] as string ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
  };

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      requestId: req.headers['x-request-id'] as string ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
  };

  res.status(404).json(response);
}
