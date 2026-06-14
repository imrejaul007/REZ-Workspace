/**
 * Error Handler Middleware for Grocery Service
 *
 * Handles:
 * - Global error handling
 * - Error formatting
 * - Logging
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { z } from 'zod';
import mongoose from 'mongoose';

// Custom error types
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  details: z.ZodError['errors'];

  constructor(message: string, details: z.ZodError['errors']) {
    super(message, 400);
    this.details = details;
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  stack?: string;
}

/**
 * Format error for response
 */
function formatError(error: Error, includeStack: boolean = false): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: error.message || 'An unexpected error occurred'
  };

  if (error instanceof ValidationError) {
    response.details = error.details;
  }

  if (includeStack && process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  return response;
}

/**
 * Handle Mongoose validation errors
 */
function handleMongooseValidationError(error: mongoose.Error.ValidationError): ValidationError {
  const errors = Object.values(error.errors).map(err => ({
    path: err.path,
    message: err.message
  }));

  return new ValidationError('Validation failed', errors as z.ZodError['errors']);
}

/**
 * Handle Mongoose duplicate key error
 */
function handleMongooseDuplicateError(error: mongoose.Error.MongoServerError): ConflictError {
  const field = error.keyValue ? Object.keys(error.keyValue)[0] : 'field';
  return new ConflictError(`${field} already exists`);
}

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 */
function handleMongooseCastError(error: mongoose.Error.CastError): AppError {
  return new AppError(`Invalid ${error.path}: ${error.value}`, 400);
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error(`[Error] ${err.message}`, {
    path: req.path,
    method: req.method,
    body: req.body,
    stack: err.stack
  });

  // Handle known error types
  if (err instanceof AppError) {
    res.status(err.statusCode).json(formatError(err));
    return;
  }

  // Handle Mongoose errors
  if (err instanceof mongoose.Error.ValidationError) {
    const validationError = handleMongooseValidationError(err);
    res.status(validationError.statusCode).json(formatError(validationError));
    return;
  }

  if (err instanceof mongoose.Error.MongoServerError && err.code === 11000) {
    const duplicateError = handleMongooseDuplicateError(err);
    res.status(duplicateError.statusCode).json(formatError(duplicateError));
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    const castError = handleMongooseCastError(err);
    res.status(castError.statusCode).json(formatError(castError));
    return;
  }

  // Handle Zod errors
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors
    });
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
    return;
  }

  // Default error response
  const statusCode = 500;
  res.status(statusCode).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { message: err.message })
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Development error handler - more verbose
 */
export function devErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`[Dev Error] ${err.stack}`);

  res.status(err instanceof AppError ? err.statusCode : 500).json({
    success: false,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
}

/**
 * Production error handler - less verbose
 */
export function prodErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Don't leak error details in production
  res.status(err instanceof AppError ? err.statusCode : 500).json({
    success: false,
    error: err instanceof AppError ? err.message : 'Internal server error'
  });
}