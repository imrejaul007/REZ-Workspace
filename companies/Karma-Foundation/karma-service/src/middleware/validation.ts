/**
 * Validation Middleware using Zod
 * Provides Express middleware for validating request data against Zod schemas
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = formatZodError(result.error);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

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
      const errors = formatZodError(result.error);
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: errors,
      });
      return;
    }

    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Validate route parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = formatZodError(result.error);
      res.status(400).json({
        success: false,
        error: 'Invalid route parameters',
        details: errors,
      });
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}

/**
 * Format Zod errors into a user-friendly structure
 */
function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'value';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Validate multiple request parts at once
 */
export function validateRequest<TBody, TQuery, TParams>(schemas: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};

    if (schemas.body) {
      const bodyResult = schemas.body.safeParse(req.body);
      if (!bodyResult.success) {
        Object.assign(errors, formatZodError(bodyResult.error));
      } else {
        req.body = bodyResult.data;
      }
    }

    if (schemas.query) {
      const queryResult = schemas.query.safeParse(req.query);
      if (!queryResult.success) {
        Object.assign(errors, formatZodError(queryResult.error));
      } else {
        req.query = queryResult.data as typeof req.query;
      }
    }

    if (schemas.params) {
      const paramsResult = schemas.params.safeParse(req.params);
      if (!paramsResult.success) {
        Object.assign(errors, formatZodError(paramsResult.error));
      } else {
        req.params = paramsResult.data as typeof req.params;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
      return;
    }

    next();
  };
}
