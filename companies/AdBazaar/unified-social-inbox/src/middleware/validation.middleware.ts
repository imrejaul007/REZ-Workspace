import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createModuleLogger } from 'utils/logger.js';

const logger = createModuleLogger('ValidationMiddleware');

/**
 * Request validation middleware using Zod schemas
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(dataToValidate);

      // Replace with validated data (with defaults applied)
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', {
          errors: error.errors,
          path: req.path,
          source,
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Optional validation middleware - doesn't fail on errors
 */
export const validateOptional = (schema: ZodSchema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = source === 'body' ? req.body : req.query;
      const validated = schema.parse(dataToValidate);

      if (source === 'body') {
        req.body = validated;
      } else {
        req.query = validated;
      }

      next();
    } catch (error) {
      // Log but don't fail
      if (error instanceof ZodError) {
        logger.debug('Optional validation failed', {
          errors: error.errors,
          path: req.path,
        });
      }
      // Continue anyway
      next();
    }
  };
};