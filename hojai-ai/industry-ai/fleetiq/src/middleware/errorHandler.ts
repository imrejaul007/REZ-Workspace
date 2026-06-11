/**
 * FLEETIQ - Error Handler Middleware
 * Production-ready error handling with proper HTTP status codes
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// ============================================
// ERROR HANDLER
// ============================================

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default values
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle AppError instances
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
      field: e.path,
      message: e.message
    }));
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    message = 'Duplicate entry found';
    const field = Object.keys((err as any).keyValue || {})[0];
    if (field) {
      message = `${field} already exists`;
    }
  }

  // Handle Mongoose connection errors
  if (err instanceof mongoose.Error.ConnectionError) {
    statusCode = 503;
    code = 'DATABASE_ERROR';
    message = 'Database connection error';
  }

  // Log error
  const logData = {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    code,
    userId: (req as any).userId
  };

  if (statusCode >= 500) {
    logger.error('Server error', logData);
  } else {
    logger.warn('Client error', logData);
  }

  // Send response
  const response: any = {
    success: false,
    error: message,
    code
  };

  // Include details in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json({
    ...response,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

// ============================================
// NOT FOUND HANDLER
// ============================================

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', { path: req.path, method: req.method });

  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

// ============================================
// ASYNC HANDLER (wrapper for async route handlers)
// ============================================

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ServiceUnavailableError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
