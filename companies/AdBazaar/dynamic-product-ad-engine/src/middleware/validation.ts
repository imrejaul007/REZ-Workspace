/**
 * Validation Middleware
 * Zod schema validation for request bodies and query params
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errorResponse = formatZodError(result.error);
      logger.warn('Body validation failed', {
        path: req.path,
        errors: errorResponse,
      });

      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorResponse,
      });
      return;
    }

    // Replace body with validated data (with defaults applied)
    req.body = result.data;
    next();
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errorResponse = formatZodError(result.error);
      logger.warn('Query validation failed', {
        path: req.path,
        errors: errorResponse,
      });

      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: errorResponse,
      });
      return;
    }

    // Replace query with validated data
    req.query = result.data as any;
    next();
  };
}

/**
 * Validate URL parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errorResponse = formatZodError(result.error);
      logger.warn('Params validation failed', {
        path: req.path,
        errors: errorResponse,
      });

      res.status(400).json({
        success: false,
        error: 'Invalid URL parameters',
        details: errorResponse,
      });
      return;
    }

    // Replace params with validated data
    req.params = result.data as any;
    next();
  };
}

/**
 * Format ZodError into a readable array
 */
function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Create a validation middleware with custom error handler
 */
export function createValidator(
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body',
  customErrorHandler?: (res: Response, errors: any[]) => void
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    const result = schema.safeParse(data);

    if (!result.success) {
      const errors = formatZodError(result.error);

      if (customErrorHandler) {
        customErrorHandler(res, errors);
      } else {
        res.status(400).json({
          success: false,
          error: `Validation failed for ${source}`,
          details: errors,
        });
      }
      return;
    }

    // Update the source with validated data
    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'query') {
      req.query = result.data as any;
    } else {
      req.params = result.data as any;
    }

    next();
  };
}

/**
 * Validate content type for file uploads
 */
export function validateContentType(allowedTypes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];

    if (!contentType) {
      res.status(400).json({
        success: false,
        error: 'Content-Type header required',
      });
      return;
    }

    const isValid = allowedTypes.some(type => contentType.includes(type));

    if (!isValid) {
      res.status(415).json({
        success: false,
        error: `Unsupported Content-Type. Allowed: ${allowedTypes.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Validate JSON structure for product arrays
 */
export function validateProductArray(req: Request, res: Response, next: NextFunction): void {
  if (!Array.isArray(req.body.products)) {
    res.status(400).json({
      success: false,
      error: 'products must be an array',
    });
    return;
  }

  if (req.body.products.length === 0) {
    res.status(400).json({
      success: false,
      error: 'products array cannot be empty',
    });
    return;
  }

  if (req.body.products.length > 50000) {
    res.status(400).json({
      success: false,
      error: 'products array exceeds maximum size of 50000',
    });
    return;
  }

  next();
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  createValidator,
  validateContentType,
  validateProductArray,
};