/**
 * GLAMAI - Error Handler Middleware
 * Salon AI Operating System
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorCodes, ApiResponse } from '../types';
import { logger } from './logger';

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;

  // Log the error
  logger.error('Request error', {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      code: ErrorCodes.VALIDATION_ERROR,
      details: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      })),
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  // Handle custom AppError
  const appError = err as AppError;
  const statusCode = appError.statusCode || 500;
  const code = appError.code || ErrorCodes.INTERNAL_ERROR;

  const response: ApiResponse = {
    success: false,
    error: appError.message || 'Internal server error',
    code,
    ...(appError.details && { details: appError.details }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

/**
 * Not found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  };
  res.status(404).json(response);
};

/**
 * Async handler wrapper - catches errors in async route handlers
 */
export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create a custom application error
 */
export const createError = (
  message: string,
  statusCode: number = 500,
  code: string = ErrorCodes.INTERNAL_ERROR,
  details?: any
): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Common error creators
 */
export const errors = {
  unauthorized: (message = 'Unauthorized') =>
    createError(message, 401, ErrorCodes.UNAUTHORIZED),

  notFound: (resource: string) =>
    createError(`${resource} not found`, 404, `${resource.toUpperCase()}_NOT_FOUND`),

  conflict: (message: string) =>
    createError(message, 409, 'CONFLICT'),

  validation: (details: any) =>
    createError('Validation failed', 400, ErrorCodes.VALIDATION_ERROR, details),

  rateLimit: (type: 'auth' | 'api' | 'ai') =>
    createError(
      `${type} rate limit exceeded`,
      429,
      type === 'auth'
        ? ErrorCodes.AUTH_RATE_LIMIT_EXCEEDED
        : type === 'ai'
        ? ErrorCodes.AI_RATE_LIMIT_EXCEEDED
        : ErrorCodes.RATE_LIMIT_EXCEEDED
    ),

  internal: (message = 'Internal server error') =>
    createError(message, 500, ErrorCodes.INTERNAL_ERROR),
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  errors,
};