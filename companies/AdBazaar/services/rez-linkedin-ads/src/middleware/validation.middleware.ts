import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

export interface ApiResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Parse Zod validation error into a user-friendly message
 */
function parseZodError(error: ZodError): { message: string; details: unknown } {
  const issues = error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return {
    message: issues[0]?.message || 'Validation failed',
    details: issues,
  };
}

/**
 * Create validation middleware for request body
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const { message, details } = parseZodError(result.error);

        logger.warn('Request validation failed', {
          path: req.path,
          errors: details,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
            details,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };

        res.status(400).json(response);
        return;
      }

      // Replace body with validated/transformed data
      req.body = result.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', { error });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'An error occurred during validation',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };

      res.status(500).json(response);
    }
  };
}

/**
 * Create validation middleware for query parameters
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const { message, details } = parseZodError(result.error);

        logger.warn('Query validation failed', {
          path: req.path,
          errors: details,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
            details,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };

        res.status(400).json(response);
        return;
      }

      req.query = result.data as typeof req.query;
      next();
    } catch (error) {
      logger.error('Query validation middleware error', { error });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'An error occurred during query validation',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };

      res.status(500).json(response);
    }
  };
}

/**
 * Create validation middleware for route parameters
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const { message, details } = parseZodError(result.error);

        logger.warn('Params validation failed', {
          path: req.path,
          errors: details,
        });

        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message,
            details,
          },
          meta: {
            timestamp: new Date().toISOString(),
            requestId: uuidv4(),
          },
        };

        res.status(400).json(response);
        return;
      }

      req.params = result.data as typeof req.params;
      next();
    } catch (error) {
      logger.error('Params validation middleware error', { error });

      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'An error occurred during params validation',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };

      res.status(500).json(response);
    }
  };
}

/**
 * Require tenant ID header middleware
 */
export function requireTenantId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const tenantId = req.headers['x-tenant-id'] as string | undefined;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'MISSING_TENANT_ID',
          message: 'X-Tenant-ID header is required',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
        },
      };

      res.status(400).json(response);
      return;
    }

    next();
  };
}
