import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const validated = schema.parse(data);

      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        (req as any).validatedQuery = validated;
      } else {
        (req as any).validatedParams = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', {
          path: req.path,
          errors: error.errors
        });

        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }

      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => validateRequest(schema, 'query');
export const validateParams = (schema: ZodSchema) => validateRequest(schema, 'params');

export default { validateRequest, validateQuery, validateParams };