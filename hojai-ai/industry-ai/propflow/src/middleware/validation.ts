/**
 * PROPFLOW - Real Estate AI Operating System
 * Validation Middleware using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../config/logger';

interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validation error formatter
 */
const formatZodError = (error: ZodError): string[] => {
  return error.errors.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
};

/**
 * Generic validation middleware factory
 */
export const validate = (schemas: ValidationOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: string[] = [];

      // Validate body
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);
        if (!result.success) {
          errors.push(...formatZodError(result.error));
        } else {
          req.body = result.data;
        }
      }

      // Validate query
      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);
        if (!result.success) {
          errors.push(...formatZodError(result.error));
        } else {
          req.query = result.data as any;
        }
      }

      // Validate params
      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);
        if (!result.success) {
          errors.push(...formatZodError(result.error));
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error', { error });
      res.status(500).json({
        success: false,
        error: 'Validation middleware error',
        code: 'VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatZodError(result.error)
        });
        return;
      }
      req.body = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate query parameters only
 */
export const validateQuery = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatZodError(result.error)
        });
        return;
      }
      req.query = result.data as any;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate URL parameters only
 */
export const validateParams = <T>(schema: ZodSchema<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: formatZodError(result.error)
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  validate,
  validateBody,
  validateQuery,
  validateParams
};