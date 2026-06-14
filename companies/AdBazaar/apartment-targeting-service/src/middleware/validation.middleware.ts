import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

// Validate request data against a Zod schema
export const validate = (
  schema: ZodSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
      const validated = schema.parse(data);

      // Replace with validated data
      if (target === 'body') {
        req.body = validated;
      } else if (target === 'query') {
        req.query = validated;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
};

// Validate multiple targets
export const validateMultiple = (
  validations: { schema: ZodSchema; target: ValidationTarget }[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const { schema, target } of validations) {
      try {
        const data = target === 'body' ? req.body : target === 'query' ? req.query : req.params;
        const validated = schema.parse(data);

        if (target === 'body') {
          req.body = validated;
        } else if (target === 'query') {
          req.query = validated;
        }
      } catch (error) {
        if (error instanceof ZodError) {
          const errors = error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }));

          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors,
          });
          return;
        }

        res.status(500).json({
          success: false,
          error: 'Internal validation error',
        });
        return;
      }
    }

    next();
  };
};