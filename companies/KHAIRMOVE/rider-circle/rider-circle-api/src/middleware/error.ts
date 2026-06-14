import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class
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

// Not Found handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

// Global error handler
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Check if it's our custom error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Handle Mongoose errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    isOperational = true;
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    isOperational = true;
  }

  if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    isOperational = true;
  }

  // Log error
  if (!isOperational) {
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.warn(`${statusCode} - ${message}: ${req.method} ${req.path}`);
  }

  // Send response
  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal Server Error' : message,
    message: statusCode >= 500 ? 'Something went wrong' : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// Async handler wrapper
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
