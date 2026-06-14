import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Error handler caught', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  if (err.isOperational) {
    res.status(statusCode).json({
      success: false,
      error: message,
      code: err.code,
    });
    return;
  }

  // Don't leak error details in production
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : message,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', { path: req.path, method: req.method });

  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.path,
  });
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';

  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  statusCode = 409;
  isOperational = true;
  code = 'CONFLICT';

  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
