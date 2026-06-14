import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types/index.js';

/**
 * Validation middleware factory
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        const response: ApiResponse<null> = {
          success: false,
          error: 'Validation failed',
          data: null,
          message: JSON.stringify(errorMessages),
        };

        res.status(400).json(response);
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          message: JSON.stringify(errorMessages),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Validate URL parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          message: JSON.stringify(errorMessages),
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

/**
 * Async handler wrapper
 * Catches async errors and passes them to the error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}