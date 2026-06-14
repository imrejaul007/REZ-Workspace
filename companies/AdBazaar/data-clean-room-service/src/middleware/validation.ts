import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../config/logger';

/**
 * Validate request body against Zod schema
 */
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', {
          errors: error.errors,
          path: req.path,
        });

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Validate request query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Query validation error', {
          errors: error.errors,
          path: req.path,
        });

        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Validate UUID format
 */
export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!value || !uuidRegex.test(value)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Validate required header
 */
export function requireHeader(headerName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.headers[headerName.toLowerCase()] as string;

    if (!value) {
      res.status(400).json({
        success: false,
        error: `Required header '${headerName}' is missing`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}