import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

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
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  details: Record<string, string>;

  constructor(message: string, details: Record<string, string> = {}) {
    super(message, 400);
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err instanceof ValidationError) {
      details = err.details;
    }
  } else if (err.name === 'MongoServerError' || err.name === 'MongoError') {
    // MongoDB errors
    statusCode = 500;
    message = 'Database error';
    logger.error('MongoDB error', { error: err.message });
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation error';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error', { error: err.message, stack: err.stack });
  } else {
    logger.warn('Client error', { statusCode, message });
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}