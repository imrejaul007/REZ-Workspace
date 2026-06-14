import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { createChildLogger } from '../config/logger';

const logger = createChildLogger('error-handler');

// Custom error class for API errors
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common errors
  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }

  static instagramApiError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(502, 'INSTAGRAM_API_ERROR', message, details);
  }

  static validationError(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(422, 'VALIDATION_ERROR', message, details);
  }
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

// Get request ID from request
const getRequestId = (req: Request): string | undefined => {
  return (req.headers['x-request-id'] as string) || undefined;
};

// Format Zod errors
const formatZodErrors = (error: ZodError): Record<string, unknown> => {
  return {
    errors: error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
      code: e.code,
    })),
  };
};

// Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = getRequestId(req);
  const statusCode = 'statusCode' in err ? (err as ApiError).statusCode : 500;
  const isOperational = 'isOperational' in err ? (err as ApiError).isOperational : false;

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error occurred', {
      error: err.message,
      stack: err.stack,
      statusCode,
      requestId,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn('Client error occurred', {
      error: err.message,
      statusCode,
      requestId,
      path: req.path,
      method: req.method,
    });
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'code' in err ? (err as ApiError).code : 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Add details for specific error types
  if (err instanceof ZodError) {
    errorResponse.error.details = formatZodErrors(err);
  } else if ('details' in err && (err as ApiError).details) {
    errorResponse.error.details = (err as ApiError).details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', { path: req.path, method: req.method });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: getRequestId(req),
    },
  });
};

// Async handler wrapper to catch async errors
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation middleware factory
export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);

      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as typeof req.query;
      } else {
        req.params = validated as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.validationError('Validation failed', formatZodErrors(error)));
      } else {
        next(error);
      }
    }
  };
};

// Retry handler for transient errors
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${attempt} failed, retrying...`, { error: lastError.message });

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError;
};