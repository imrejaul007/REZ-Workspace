/**
 * Validation Middleware for brand-partnership-portal
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from 'utils/logger.js';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      logger.warn('Validation failed:', { errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      logger.warn('Query validation failed:', { errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }
    req.query = result.data as any;
    next();
  };
}

export function validateParams<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      logger.warn('Params validation failed:', { errors: result.error.issues });
      res.status(400).json({
        success: false,
        error: 'Invalid parameters',
        details: result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }
    next();
  };
}