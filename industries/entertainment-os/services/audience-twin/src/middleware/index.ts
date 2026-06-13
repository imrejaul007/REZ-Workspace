import { Request, Response, NextFunction } from 'express';

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthRequest extends Request {
  validatedBody?: unknown;
  internal?: boolean;
}

// ============================================================================
// API KEY AUTH
// ============================================================================

export function apiKeyAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  const validKey = process.env.API_KEY || 'audience-twin-api-key-change-in-production';

  if (!apiKey || apiKey !== validKey) {
    res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  next();
}

// ============================================================================
// INTERNAL AUTH
// ============================================================================

export function internalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers['x-internal-token'] as string | undefined;
  const validToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token-change-in-production';

  if (!token || token !== validToken) {
    res.status(401).json({
      success: false,
      error: 'Invalid or missing internal token',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  req.internal = true;
  next();
}

// ============================================================================
// VALIDATION
// ============================================================================

import { z, ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
          code: 'VALIDATION_ERROR',
        });
        return;
      }
      next(error);
    }
  };
}

// ============================================================================
// PAGINATION
// ============================================================================

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20));
  return { page, limit };
}

// ============================================================================
// NUMBER PARSING
// ============================================================================

export function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
