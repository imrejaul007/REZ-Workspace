import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import { ZodError } from 'zod';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const errorMessage = err.message || 'Internal Server Error';

  logger.error('Request error', {
    path: req.path,
    method: req.method,
    statusCode,
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle known error types
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
    });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'The provided ID is not valid',
    });
    return;
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    error: err.code || getErrorType(statusCode),
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
};

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: unknown
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
    default:
      return 'Internal Server Error';
  }
}