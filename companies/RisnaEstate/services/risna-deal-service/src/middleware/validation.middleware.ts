import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../config/logger';

interface ValidateOptions {
  params?: ZodSchema;
  query?: ZodSchema;
  body?: ZodSchema;
}

// Generic validation middleware factory
export function validate(options: ValidateOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (options.params) {
        (req as any).params = await options.params.parseAsync(req.params);
      }
      if (options.query) {
        (req as any).query = await options.query.parseAsync(req.query);
      }
      if (options.body) {
        req.body = await options.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation failed', { errors, path: req.path });

        _res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }

      // Re-throw non-Zod errors
      next(error);
    }
  };
}

// Middleware to validate request body only
export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Body validation failed', { errors, path: req.path });

        res.status(400).json({
          success: false,
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
}

// Middleware to validate query parameters only
export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      (req as any).query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Query validation failed', { errors, path: req.path });

        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
}

// Middleware to validate route params only
export function validateParams<T>(schema: ZodSchema<T>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      (req as any).params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Params validation failed', { errors, path: req.path });

        res.status(400).json({
          success: false,
          error: 'Invalid route parameters',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
}

// Validate MongoDB ObjectId format
export function validateObjectId(id: string, _fieldName: string = 'ID'): boolean {
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  if (!objectIdRegex.test(id)) {
    return false;
  }
  return true;
}

// Middleware to validate ObjectId params
export function validateObjectIdParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    if (!validateObjectId(id, paramName)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`,
        code: 'INVALID_ID',
      });
      return;
    }
    next();
  };
}