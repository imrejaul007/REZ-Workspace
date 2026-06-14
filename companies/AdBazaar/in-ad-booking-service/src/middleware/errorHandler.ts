/**
 * Error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: ApiError, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  logger.error('API Error', {
    statusCode,
    message,
    code: err.code,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

export function createError(message: string, statusCode = 500, code?: string): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}
