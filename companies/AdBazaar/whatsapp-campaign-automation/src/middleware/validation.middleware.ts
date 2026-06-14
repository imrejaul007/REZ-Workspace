/**
 * Validation Middleware using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = formatZodError(result.error);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors,
        });
        return;
      }
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = formatZodError(result.error);
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: errors,
        });
        return;
      }
      req.query = result.data as typeof req.query;
      next();
    } catch (error) {
      logger.error('Query validation error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = formatZodError(result.error);
        res.status(400).json({
          success: false,
          error: 'Invalid parameters',
          details: errors,
        });
        return;
      }
      req.params = result.data as typeof req.params;
      next();
    } catch (error) {
      logger.error('Params validation error', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
      });
    }
  };
}

function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}