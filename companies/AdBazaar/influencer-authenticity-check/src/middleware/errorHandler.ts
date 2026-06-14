import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from 'utils/logger.js';

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

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const loggerCtx = logger.child({
    path: req.path,
    method: req.method,
    body: req.body,
  });

  if (err instanceof AppError) {
    loggerCtx.warn('Application error', {
      statusCode: err.statusCode,
      message: err.message,
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    loggerCtx.warn('Validation error', { errors });

    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors,
    });
    return;
  }

  // MongoDB validation errors
  if (err.name === 'ValidationError') {
    loggerCtx.warn('Mongoose validation error', { error: err.message });

    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
    });
    return;
  }

  // MongoDB duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    loggerCtx.warn('Duplicate key error', { error: err.message });

    res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this identifier already exists',
    });
    return;
  }

  // Cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    loggerCtx.warn('Cast error', { error: err.message });

    res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is not valid',
    });
    return;
  }

  // Unknown errors
  loggerCtx.error('Unexpected error', { error: err });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
  });
};

import { config } from '../config';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};