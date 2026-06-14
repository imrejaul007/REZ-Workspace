import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/index.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

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
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(err.details && { details: err.details }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

export const zodErrorHandler = (
  err: ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const errors = err.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));

  logger.warn('Validation error', { errors, path: req.path });

  res.status(400).json({
    success: false,
    error: 'Validation error',
    details: errors,
  });
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createAppError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};