import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Custom error class for application errors
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      `${resource}${identifier ? ` with ID ${identifier}` : ''} not found`,
      404,
      'NOT_FOUND'
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
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
    super('Too many requests', 429, 'RATE_LIMIT');
    this.headers = retryAfter ? { 'Retry-After': String(retryAfter) } : undefined;
  }
  public headers?: Record<string, string>;
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
  path?: string;
}

// Format Zod validation errors
function formatZodError(error: ZodError): string[] {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}

// Main error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isProduction = process.env.NODE_ENV === 'production';

  const response: ErrorResponse = {
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err instanceof AppError ? err.code : 'INTERNAL_ERROR',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Add details for validation errors
  if (err instanceof ZodError) {
    response.error.details = formatZodError(err);
    response.error.message = 'Validation failed';
  }

  // Add stack trace in development
  if (!isProduction && err instanceof AppError) {
    response.error.stack = err.stack;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      code: response.error.code,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }

  // Set rate limit headers if present
  if (err instanceof RateLimitError && err.headers) {
    Object.entries(err.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  res.status(statusCode).json(response);
}

// Not found handler for undefined routes
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}

// Async handler wrapper to catch async errors
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation middleware factory
export function validate<T>(schema: ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new ValidationError(formatZodError(result.error).join('; '));
    }

    return result.data;
  };
}

// Request validation middleware
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatZodError(result.error),
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

// 404 catch for async operations
export function catchAsync<T>(
  fn: (...args: Parameters<T>) => Promise<unknown>
) {
  return (...args: Parameters<T>): Promise<unknown> => {
    return fn(...args).catch((error: Error) => {
      if (!(error instanceof AppError)) {
        logger.error('Unhandled async error:', error);
        throw new AppError('An unexpected error occurred', 500);
      }
      throw error;
    });
  };
}

// Global exception handler for unhandled rejections
export function setupGlobalErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit in production - log and continue
    if (process.env.NODE_ENV === 'development') {
      process.exit(1);
    }
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}
