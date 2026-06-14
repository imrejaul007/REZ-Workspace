import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

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
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 400);
    this.errors = errors;
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Request validation failed',
      errors
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      ...(err instanceof ValidationError && { errors: err.errors })
    });
    return;
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongooseErrors: Record<string, string[]> = {};
    const validationErr = err as unknown as { errors: Record<string, { message: string }> };
    Object.keys(validationErr.errors || {}).forEach((key) => {
      mongooseErrors[key] = [validationErr.errors[key].message];
    });

    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Database validation failed',
      errors: mongooseErrors
    });
    return;
  }

  // Handle mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
    return;
  }

  // Handle duplicate key error
  if ((err as unknown as { code: number }).code === 11000) {
    res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A resource with this identifier already exists'
    });
    return;
  }

  // Default server error
  const statusCode = (err as AppError).statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: 'Server Error',
    message
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};

export default {
  AppError,
  NotFoundError,
  ValidationError,
  errorHandler,
  notFoundHandler
};