import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

const errorLogger = logger.child({ component: 'ErrorHandler' });

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

// Error types
export const Errors = {
  notFound: (resource: string) =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  validation: (message: string) =>
    new AppError(message, 400, 'VALIDATION_ERROR'),

  unauthorized: (message = 'Unauthorized') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message = 'Forbidden') =>
    new AppError(message, 403, 'FORBIDDEN'),

  conflict: (message: string) =>
    new AppError(message, 409, 'CONFLICT'),

  internal: (message = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),

  serviceUnavailable: (service: string) =>
    new AppError(`${service} is currently unavailable`, 503, 'SERVICE_UNAVAILABLE')
};

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: unknown = undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
 }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values(err.errors).map(e => ({
      field: (e as any).path,
      message: e.message
    }));
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
    message = 'Duplicate entry';
    details = (err as any).keyValue;
  }

  // Log the error
  const logData = {
    statusCode,
    code,
    message,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  if (statusCode >= 500) {
    errorLogger.error('Server error', logData);
  } else {
    errorLogger.warn('Client error', logData);
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  });
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

export default errorHandler;