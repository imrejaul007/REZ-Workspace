import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import type { AuthRequest } from './auth.js';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export function validateBody(schema: ZodSchema) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// PAGINATION PARSING
// ============================================================================

export function parsePagination(query: Record<string, unknown>): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10) || 20));
  return { page, limit };
}

// ============================================================================
// NUMBER PARSING
// ============================================================================

export function parseNumber(value: unknown, defaultValue: number = 0): number {
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}

// ============================================================================
// DATE PARSING
// ============================================================================

export function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return isNaN(date.getTime()) ? null : date;
}
