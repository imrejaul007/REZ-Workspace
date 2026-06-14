import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';
import logger from '../config/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Request validation failed', {
          path: req.path,
          method: req.method,
          errors: details,
          requestId: req.requestId,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details,
          },
        };

        res.status(400).json(response);
        return;
      }

      next(error);
    }
  };
}

/**
 * Query parameter validation middleware factory
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details,
          },
        };

        res.status(400).json(response);
        return;
      }

      next(error);
    }
  };
}

/**
 * Path parameter validation middleware factory
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Path parameter validation failed',
            details,
          },
        };

        res.status(400).json(response);
        return;
      }

      next(error);
    }
  };
}

export default {
  validateBody,
  validateQuery,
  validateParams,
};
