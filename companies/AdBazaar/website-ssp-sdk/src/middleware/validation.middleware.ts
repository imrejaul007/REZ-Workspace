import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createLogger } from '../utils/index.js';

const logger = createLogger('ValidationMiddleware');

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = formatZodError(result.error);
        logger.warn(`Validation error: ${JSON.stringify(errors)}`);
        res.status(400).json({ error: 'Validation failed', details: errors });
        return;
      }
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);
      if (!result.success) {
        const errors = formatZodError(result.error);
        logger.warn(`Param validation error: ${JSON.stringify(errors)}`);
        res.status(400).json({ error: 'Invalid parameters', details: errors });
        return;
      }
      next();
    } catch (error) {
      logger.error('Param validation middleware error:', error);
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        const errors = formatZodError(result.error);
        logger.warn(`Query validation error: ${JSON.stringify(errors)}`);
        res.status(400).json({ error: 'Invalid query parameters', details: errors });
        return;
      }
      next();
    } catch (error) {
      logger.error('Query validation middleware error:', error);
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}