import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new ValidationError(`Query validation failed: ${errors.join(', ')}`);
      }
      req.query = result.data as typeof req.query;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw new ValidationError(`Param validation failed: ${errors.join(', ')}`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
