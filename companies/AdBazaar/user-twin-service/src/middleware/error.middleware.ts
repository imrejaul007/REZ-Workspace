import { Request, Response, NextFunction } from 'express';
import { recordError } from './metrics.middleware';

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(409, `${resource} already exists`);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Record metric
  if (err instanceof ApiError) {
    recordError(err.statusCode.toString(), 'user-twin-service');
  } else {
    recordError('500', 'user-twin-service');
  }

  // Handle known API errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.name.replace('Error', '') || 'Error',
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date(),
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      statusCode: 400,
      timestamp: new Date(),
    });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is invalid',
      statusCode: 400,
      timestamp: new Date(),
    });
    return;
  }

  // Handle duplicate key errors
  if ((err as unknown as { code: number }).code === 11000) {
    res.status(409).json({
      error: 'Conflict',
      message: 'Duplicate entry found',
      statusCode: 409,
      timestamp: new Date(),
    });
    return;
  }

  // Default to 500 for unknown errors
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    statusCode: 500,
    timestamp: new Date(),
  });
};

/**
 * Async handler wrapper to catch errors in async routes
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  errorHandler,
  asyncHandler,
  ApiError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ConflictError,
};