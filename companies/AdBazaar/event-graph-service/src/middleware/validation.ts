import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../config/logger.js';

const validationLogger = logger.child({ component: 'ValidationMiddleware' });

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = <T>(
  schema: ZodSchema<T>,
  target: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
      const validated = schema.parse(data);

      if (target === 'body') {
        req.body = validated;
      } else if (target === 'query') {
        (req as any).validatedQuery = validated;
      } else {
        (req as any).validatedParams = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }));

        validationLogger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors
          }
        });
        return;
      }

      validationLogger.error('Unexpected validation error', { error });
      next(error);
    }
  };
};

/**
 * Async handler wrapper
 * Catches errors from async route handlers and passes them to Express error handler
 */
export const asyncHandler = <P = any, R = any, B = any>(
  fn: (req: Request<P, any, B>, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request<P, any, B>, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  validate,
  asyncHandler
};