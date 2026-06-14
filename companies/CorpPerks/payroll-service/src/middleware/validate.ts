import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, target: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Tenant middleware - extracts tenant ID from various sources
 */
export const tenantMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Try to get tenant ID from header
  const tenantHeader = req.headers['x-tenant-id'] as string;
  if (tenantHeader) {
    (req as unknown as Record<string, unknown>).tenantId = tenantHeader;
    return next();
  }

  // Try to get from body
  const tenantBody = req.body?.tenantId;
  if (tenantBody) {
    (req as unknown as Record<string, unknown>).tenantId = tenantBody;
    return next();
  }

  // For development, use a default tenant
  if (process.env.NODE_ENV === 'development') {
    (req as unknown as Record<string, unknown>).tenantId = 'dev-tenant';
    return next();
  }

  next();
};
