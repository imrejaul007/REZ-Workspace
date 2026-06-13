import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(`API Error: ${code} - ${err.message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    details: err.details,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      details: err.details,
    },
    timestamp: new Date().toISOString(),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
}

export function zodErrorHandler(err: ZodError, req: Request, res: Response, next: NextFunction): void {
  const details = err.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));

  const error: ApiError = new Error('Validation failed') as ApiError;
  error.statusCode = 400;
  error.code = 'VALIDATION_ERROR';
  error.details = { errors: details };

  next(error);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}