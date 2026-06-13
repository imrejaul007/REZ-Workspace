import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationRequest extends Request {
  validatedBody?: unknown;
  validatedQuery?: unknown;
  validatedParams?: unknown;
}

// ============================================================================
// VALIDATION ERROR HANDLER
// ============================================================================

function handleZodError(error: ZodError): { errors: Array<{ path: string; message: string }> } {
  return {
    errors: error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

// ============================================================================
// VALIDATION MIDDLEWARE FACTORIES
// ============================================================================

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: ValidationRequest, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.validatedBody = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: handleZodError(error),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: ValidationRequest, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.validatedQuery = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Query validation failed',
          details: handleZodError(error),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate URL parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: ValidationRequest, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.validatedParams = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Parameter validation failed',
          details: handleZodError(error),
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Parse boolean query params
 */
export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return false;
}

/**
 * Parse number query params with default
 */
export function parseNumber(value: unknown, defaultValue: number): number {
  const parsed = parseInt(value as string, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse pagination params
 */
export function parsePagination(query: unknown): { page: number; limit: number; skip: number } {
  const q = query as Record<string, unknown>;
  const page = Math.max(1, parseNumber(q.page, 1));
  const limit = Math.min(100, Math.max(1, parseNumber(q.limit, 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}