import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/index.js';

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an application error
 */
export function createError(message: string, statusCode = 500, code?: string, metadata?: Record<string, any>): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.metadata = metadata;
  return error;
}

/**
 * Not found error
 */
export function notFoundError(resource: string, id?: string): AppError {
  return createError(
    `${resource} not found${id ? `: ${id}` : ''}`,
    404,
    `${resource.toUpperCase().replace(' ', '_')}_NOT_FOUND`
  );
}

/**
 * Validation error
 */
export function validationError(message: string, errors?: any[]): AppError {
  return createError(message, 400, 'VALIDATION_ERROR', { errors });
}

/**
 * Conflict error
 */
export function conflictError(message: string, code?: string): AppError {
  return createError(message, 409, code || 'CONFLICT');
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = (err as AppError).statusCode || 500;
  const code = (err as AppError).code || 'INTERNAL_ERROR';
  const metadata = (err as AppError).metadata;

  logger.error('Request error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    code,
  });

  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal error' : err.message,
    code,
    ...(metadata && { metadata }),
  });
}

/**
 * Async handler wrapper
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
