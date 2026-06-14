import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
}

export function zodErrorHandler(
  err: ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const errors = err.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  logger.warn('Validation error', {
    errors,
    path: req.path,
  });

  res.status(400).json({
    success: false,
    error: 'Validation Error',
    message: 'Request validation failed',
    errors,
  });
}