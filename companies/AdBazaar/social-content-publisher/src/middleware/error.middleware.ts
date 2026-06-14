import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  public errors: Record<string, string[]>;

  constructor(message: string = 'Validation failed', errors: Record<string, string[]> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      res.status(err.statusCode).json({
        success: false,
        error: err.message,
        errors: err.errors,
      });
      return;
    }

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(e.message);
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.message,
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    });
    return;
  }

  // Duplicate key error
  if ((err as any).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: (err as any).keyValue,
    });
    return;
  }

  // Log unexpected errors
  logger.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};