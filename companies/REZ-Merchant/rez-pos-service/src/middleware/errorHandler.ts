import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  logger.error(`Error: ${message}`, {
    statusCode,
    code,
    path: req.path,
    method: req.method,
    stack: err.stack,
    details: err.details
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details
    },
    timestamp: new Date().toISOString()
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  logger.warn(`Route not found: ${req.method} ${req.path}`);

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    },
    timestamp: new Date().toISOString()
  });
}

export function createAppError(message: string, statusCode: number, code?: string, details?: unknown): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}
