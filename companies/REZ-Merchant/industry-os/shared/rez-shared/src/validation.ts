import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'validation' });

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Create validation middleware using Zod
 */
export function createValidationMiddleware(options: ValidationOptions): RequestHandler {
  const { body: bodySchema, query: querySchema, params: paramsSchema } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (bodySchema) {
        req.body = bodySchema.parse(req.body);
      }

      if (querySchema) {
        req.query = querySchema.parse(req.query);
      }

      if (paramsSchema) {
        req.params = paramsSchema.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: errors,
          },
        });
      }

      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      });
    }
  };
}

/**
 * Create async validation middleware that passes validated data to handler
 */
export function createAsyncValidationMiddleware<T>(
  schema: ZodSchema<T>,
  source: 'body' | 'query' | 'params' = 'body'
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      req[source] = schema.parse(data);
      next();

      // Wrap the handler to catch validation errors
      const originalHandler = next;

      // Return a wrapper that will be used by the route handler
      return (body: T) => {
        req[source] = body;
        next();
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation failed',
            details: errors,
          },
        });
      }

      logger.error('Validation middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      });
    }
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID formats
  mongoId: {
    schema: () => {
      const { z } = require('zod');
      return z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');
    },
  },

  // Phone number (Indian format)
  phone: () => {
    const { z } = require('zod');
    return z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number');
  },

  // Email
  email: () => {
    const { z } = require('zod');
    return z.string().email('Invalid email format');
  },

  // Pagination
  pagination: () => {
    const { z } = require('zod');
    return z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    });
  },

  // Date range
  dateRange: () => {
    const { z } = require('zod');
    return z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    });
  },
};

export default { createValidationMiddleware, createAsyncValidationMiddleware, commonSchemas };
