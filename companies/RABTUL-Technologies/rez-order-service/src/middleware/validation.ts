/**
 * Zod validation middleware for Express routes.
 * Validates request bodies and query parameters against schemas.
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * Validates req.body against the provided Zod schema.
 * Returns 400 with error details if validation fails.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query against the provided Zod schema.
 * Returns 400 with error details if validation fails.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: result.error.flatten(),
      });
    }
    req.query = result.data as unknown;
    next();
  };
}
