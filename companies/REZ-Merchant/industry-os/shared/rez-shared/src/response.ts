import { Request, Response, NextFunction } from 'express';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'error-handler' });

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Standardized error response
 */
export function standardizeError(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
}

/**
 * Standardized success response
 */
export function standardizeResponse<T = any>(data: T): { success: true; data: T } {
  return {
    success: true,
    data,
  };
}

/**
 * Create global error handler middleware
 */
export function createErrorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    // Log the error
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
    });

    // Handle known error types
    if (err.name === 'ValidationError') {
      return res.status(400).json(standardizeError('VALIDATION_ERROR', err.message));
    }

    if (err.name === 'CastError') {
      return res.status(400).json(standardizeError('INVALID_ID', 'Invalid ID format'));
    }

    if (err.name === 'MongoServerError') {
      if ((err as any).code === 11000) {
        return res.status(409).json(standardizeError('DUPLICATE_ERROR', 'Duplicate entry'));
      }
      return res.status(500).json(standardizeError('DATABASE_ERROR', 'Database error'));
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json(standardizeError('INVALID_TOKEN', 'Invalid token'));
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json(standardizeError('TOKEN_EXPIRED', 'Token expired'));
    }

    // Default to internal server error
    const statusCode = (err as any).statusCode || 500;
    const errorCode = (err as any).code || 'INTERNAL_ERROR';

    res.status(statusCode).json(
      standardizeError(
        errorCode,
        statusCode === 500 ? 'Internal server error' : err.message
      )
    );
  };
}

/**
 * Create 404 handler
 */
export function createNotFoundHandler() {
  return (req: Request, res: Response) => {
    res.status(404).json(
      standardizeError('NOT_FOUND', `Route ${req.method} ${req.path} not found`)
    );
  };
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * NotFoundError class for explicit 404 responses
 */
export class NotFoundError extends Error {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * ValidationError class for explicit 400 responses
 */
export class ValidationError extends Error {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * UnauthorizedError class for explicit 401 responses
 */
export class UnauthorizedError extends Error {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export default {
  standardizeError,
  standardizeResponse,
  createErrorHandler,
  createNotFoundHandler,
  asyncHandler,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
};
