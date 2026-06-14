import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createResponse } from '../types/index.js';

export function validate(schema: ZodSchema, target: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req[target]);
      req[target] = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(createResponse(false, undefined, {
          code: 'VALIDATION_ERROR',
          message: `Invalid ${target}`,
          details: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }));
        return;
      }
      next(error);
    }
  };
}
