import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

// Custom error class for application errors
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

// Validation error with Zod
export class ValidationError extends AppError {
  public readonly zodError?: ZodError;

  constructor(message: string, zodError?: ZodError) {
    super(message, 400, 'VALIDATION_ERROR');
    this.zodError = zodError;
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

// Conflict error (e.g., duplicate entries)
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

// Format Zod errors
const formatZodErrors = (error: ZodError): Record<string, unknown>[] => {
  return error.errors.map((issue: ZodIssue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
};

// Error handler middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = { validationErrors: formatZodErrors(err) };
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError' && (err as any).errors) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Database validation failed';
    details = { validationErrors: Object.values((err as any).errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }))};
  }

  // Handle mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid identifier format';
  }

  // Handle duplicate key errors
  if ((err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'A record with this identifier already exists';
    const field = Object.keys((err as any).keyValue || {})[0];
    details = { field, value: (err as any).keyValue?.[field] };
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error('Server error', {
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
      request: {
        id: requestId,
        method: req.method,
        path: req.path,
        body: sanitizeBody(req.body),
        query: req.query,
      },
    });
  } else {
    logger.warn('Client error', {
      error: {
        code,
        message,
        details,
      },
      request: {
        id: requestId,
        method: req.method,
        path: req.path,
      },
    });
  }

  // Send error response
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  res.status(statusCode).json(response);
};

// Helper to sanitize body (remove sensitive fields)
const sanitizeBody = (body: any): any => {
  if (!body) return undefined;
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

// Not found handler for unmatched routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  };

  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json(response);
};

// Async wrapper to catch async errors
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 for API routes
export const apiNotFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `API endpoint ${req.method} ${req.path} does not exist`,
    },
  };
  res.status(404).json(response);
};
