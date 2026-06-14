import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { logger } from '../config/logger';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: result.error.errors,
        });
        return;
      }

      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: result.error.errors,
        });
        return;
      }

      req.query = result.data as unknown;
      next();
    } catch (error) {
      logger.error('Query validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: result.error.errors,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Param validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
}
