import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../services/logger.service';

/**
 * Custom API Error class
 */
export class APIError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }

  static badRequest(message: string, details?: unknown): APIError {
    return new APIError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): APIError {
    return new APIError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = 'Forbidden'): APIError {
    return new APIError(403, 'FORBIDDEN', message);
  }

  static notFound(message: string = 'Resource not found'): APIError {
    return new APIError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown): APIError {
    return new APIError(409, 'CONFLICT', message, details);
  }

  static internal(message: string = 'Internal server error'): APIError {
    return new APIError(500, 'INTERNAL_ERROR', message);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): APIError {
    return new APIError(503, 'SERVICE_UNAVAILABLE', message);
  }
}

/**
 * Error Response interface
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

/**
 * Global Error Handler Middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error response
  let response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  };

  // Handle APIError
  if (err instanceof APIError) {
    response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    };

    // Log warning for client errors
    if (err.statusCode >= 400 && err.statusCode < 500) {
      logger.warn('Client error', {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
      });
    } else {
      // Log error for server errors
      logger.error('Server error', {
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
      });
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      },
    };

    logger.warn('Validation error', {
      errors: err.errors,
      path: req.path,
      method: req.method,
    });

    res.status(400).json(response);
    return;
  }

  // Handle MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    response = {
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: 'A resource with this identifier already exists',
      },
    };

    logger.warn('Duplicate key error', { path: req.path });
    res.status(409).json(response);
    return;
  }

  // Handle MongoDB validation errors
  if (err.name === 'ValidationError') {
    response = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    };

    logger.warn('Mongoose validation error', { message: err.message });
    res.status(400).json(response);
    return;
  }

  // Handle unknown errors
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }

  res.status(500).json(response);
}

/**
 * Not Found Handler Middleware
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  APIError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};