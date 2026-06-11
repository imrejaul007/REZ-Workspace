import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
        return;
      }

      req.body = result.data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.error('Zod validation error', { errors: error.errors });
        res.status(400).json({
          success: false,
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        });
        return;
      }

      logger.error('Unexpected validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          code: 'INVALID_PARAMS',
          details: errors,
        });
        return;
      }

      req.params = result.data as typeof req.params;
      next();
    } catch (error) {
      logger.error('Params validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          code: 'INVALID_QUERY',
          details: errors,
        });
        return;
      }

      req.query = result.data as typeof req.query;
      next();
    } catch (error) {
      logger.error('Query validation error', { error });
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        code: 'INTERNAL_ERROR',
      });
    }
  };
};