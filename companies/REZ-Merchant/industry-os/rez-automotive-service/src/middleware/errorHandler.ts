import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

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

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode || 500 : 500;
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';

  logger.error('Error handling request', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    statusCode,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Database validation failed',
      code: 'DB_VALIDATION_ERROR',
      details: err.message,
    });
    return;
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID',
      details: err.message,
    });
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const duplicateField = Object.keys((err as any).keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: `Duplicate value for ${duplicateField}`,
      code: 'DUPLICATE_ENTRY',
      details: (err as any).keyValue,
    });
    return;
  }

  // Default error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    code,
    ...(err instanceof AppError && err.details && { details: err.details }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      if (err instanceof AppError) {
        next(err);
      } else {
        next(createAppError(err.message, 500));
      }
    });
  };
};

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      next(error);
    }
  };
};