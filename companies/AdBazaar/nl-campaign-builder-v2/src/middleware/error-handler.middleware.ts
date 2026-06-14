import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from 'utils/logger.js';
import { metrics } from './metrics.middleware';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method
    });
  } else {
    logger.warn('Client error:', {
      error: err.message,
      path: req.path,
      method: req.method
    });
  }

  // Update error metrics
  metrics.errorsTotal.inc({ type: statusCode >= 500 ? 'server' : 'client' });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
    return;
  }

  // Handle known error types
  const errorResponse = {
    success: false,
    error: isProduction && statusCode >= 500 ? 'Internal server error' : err.message,
    code: err.code,
    ...(err.details && { details: err.details }),
    ...(!isProduction && statusCode >= 500 && { stack: err.stack })
  };

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export class ApiError extends Error implements AppError {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string, details?: Record<string, unknown>): ApiError {
    return new ApiError(409, message, 'CONFLICT', details);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError(503, message, 'SERVICE_UNAVAILABLE');
  }
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  ApiError
};