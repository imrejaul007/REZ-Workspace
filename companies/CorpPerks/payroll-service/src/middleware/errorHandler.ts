import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';
import type { ApiResponse } from '../types/index.js';

/**
 * Custom application error class
 */
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

/**
 * Not found handler
 */
export const notFound = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
  };
  res.status(404).json(response);
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
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: { field: string; message: string }[] | undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  }

  // Handle Mongoose duplicate key errors
  if ((err as unknown as Record<string, unknown>).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  // Log error
  logger.error('Error occurred', {
    statusCode,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send response
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(errors && { errors }),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    Object.assign(response, { stack: err.stack });
  }

  res.status(statusCode).json(response);
};
