import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation error response
 */
interface ValidationError {
  field: string;
  message: string;
}

/**
 * Format Zod errors into a clean format
 */
function formatZodErrors(error: ZodError): ValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Request body validation middleware
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: formatZodErrors(error),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * Query parameters validation middleware
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: formatZodErrors(error),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * URL parameters validation middleware
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: formatZodErrors(error),
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: 'Invalid URL parameters',
        timestamp: new Date().toISOString(),
      });
    }
  };
}