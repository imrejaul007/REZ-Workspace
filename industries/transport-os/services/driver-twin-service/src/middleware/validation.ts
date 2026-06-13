import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validate request body, query, or params against Zod schemas
 */
export function validate(schemas: ValidateOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
        (req as any).validatedBody = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          metadata: {
            errors: error.errors.map((e) => ({
              path: e.path.join('.'),
              message: e.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request body only
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return validate({ body: schema });
}

/**
 * Validate query parameters only
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return validate({ query: schema });
}

/**
 * Validate URL parameters only
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return validate({ params: schema });
}

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export function parsePagination(query: any): PaginationParams {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  return { page, limit };
}

export function parseNumber(value: any, defaultValue: number): number {
  const parsed = parseInt(value as string, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parseBoolean(value: any, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return defaultValue;
}
