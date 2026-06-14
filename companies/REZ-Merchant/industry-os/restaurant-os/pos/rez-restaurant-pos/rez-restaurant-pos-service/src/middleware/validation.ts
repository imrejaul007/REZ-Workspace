import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function validateBody(schema: unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = require('zod');
      if ('parse' in (schema as object)) {
        (req as Request & { body: unknown }).body = (schema as { parse: (data: unknown) => unknown }).parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
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

export function validateQuery(schema: unknown) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parse' in (schema as object)) {
        req.query = (schema as { parse: (data: unknown) => unknown }).parse(req.query) as typeof req.query;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Query validation failed',
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

export function validateParams(schema: Record<string, string>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    for (const [param, pattern] of Object.entries(schema)) {
      const value = req.params[param];
      const regex = new RegExp(pattern);

      if (!value || !regex.test(value)) {
        errors.push(`Invalid ${param}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, error: errors.join(', ') });
      return;
    }

    next();
  };
}
