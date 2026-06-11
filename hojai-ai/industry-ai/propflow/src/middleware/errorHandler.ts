/**
 * PROPFLOW - Real Estate AI Operating System
 * Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../config/logger';
import { config } from '../config';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Pre-defined errors
export const Errors = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  unauthorized: (message = 'Authentication required') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Access denied') =>
    new AppError(message, 403, 'FORBIDDEN'),

  badRequest: (message = 'Bad request') =>
    new AppError(message, 400, 'BAD_REQUEST'),

  conflict: (message = 'Resource conflict') =>
    new AppError(message, 409, 'CONFLICT'),

  validation: (message = 'Validation failed') =>
    new AppError(message, 400, 'VALIDATION_ERROR'),

  internal: (message = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (message = 'Service unavailable') =>
    new AppError(message, 503, 'SERVICE_UNAVAILABLE')
};

/**
 * Async handler wrapper to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Global error handler
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  }

  // Handle Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';

    const validationErrors: Record<string, string> = {};
    Object.keys(err.errors).forEach(key => {
      validationErrors[key] = err.errors[key].message;
    });
    details = { fields: validationErrors };
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Duplicate value for unique field';

    const field = Object.keys((err as any).keyPattern)[0];
    details = { field, value: (err as any).keyValue[field] };
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error
  const logData = {
    statusCode,
    code,
    message,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id,
    stack: config.nodeEnv === 'development' ? err.stack : undefined
  };

  if (statusCode >= 500) {
    logger.error('Server error', logData);
  } else {
    logger.warn('Client error', logData);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(details && { details }),
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id']
  });
};

export default {
  AppError,
  Errors,
  asyncHandler,
  notFoundHandler,
  errorHandler
};