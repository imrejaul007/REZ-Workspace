import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`Error: ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
    timestamp: new Date().toISOString(),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  });
};

export const asyncHandler = <T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: AppError = new Error(
          error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
        errorResponse.statusCode = 400;
        errorResponse.isOperational = true;
        next(errorResponse);
      } else {
        next(error);
      }
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: AppError = new Error(
          error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
        errorResponse.statusCode = 400;
        errorResponse.isOperational = true;
        next(errorResponse);
      } else {
        next(error);
      }
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorResponse: AppError = new Error(
          error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        );
        errorResponse.statusCode = 400;
        errorResponse.isOperational = true;
        next(errorResponse);
      } else {
        next(error);
      }
    }
  };
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateRequest,
  validateQuery,
  validateParams,
};