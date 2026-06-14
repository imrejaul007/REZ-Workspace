/**
 * Error handling middleware
 */
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

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

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
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
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err instanceof mongoose.Error.MongoServerError &&
      (err as mongoose.Error.MongoServerError).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      message: 'A record with this identifier already exists',
    });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      message: `Cannot cast ${err.value} to ${err.kind}`,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle SyntaxError (JSON parse errors)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
    });
    return;
  }

  // Default to 500 Internal Server Error
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env['NODE_ENV'] === 'development' ? err.message : undefined,
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
}
