import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Generic validation middleware factory
 * Creates middleware that validates request body/query/params against a Zod schema
 */
export function validate<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];

    try {
      const validated = schema.parse(data);
      // Replace with validated data
      if (source === 'body') {
        req.body = validated;
      } else if (source === 'query') {
        req.query = validated as any;
      } else {
        req.params = { ...req.params, ...(validated as any) };
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validate(schema, 'params');
}
