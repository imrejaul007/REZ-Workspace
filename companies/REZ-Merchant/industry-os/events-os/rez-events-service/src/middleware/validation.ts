/**
 * Validation Middleware and Utility Functions for Events Service
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { Errors } from './errorHandler';

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(Errors.badRequest('Validation failed', error.errors));
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request query against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(Errors.badRequest('Invalid query parameters', error.errors));
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate request params against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params) as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(Errors.badRequest('Invalid path parameters', error.errors));
        return;
      }
      next(error);
    }
  };
}

/**
 * Common validation schemas for reuse
 */
export const ValidationSchemas = {
  // UUID or ID pattern
  id: z.string().min(1, 'ID is required'),

  // Pagination
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional()
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().transform(s => new Date(s)).optional(),
    endDate: z.string().transform(s => new Date(s)).optional()
  }).refine(data => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  }, {
    message: 'Start date must be before or equal to end date'
  }),

  // Merchant ID
  merchantId: z.string().min(1, 'Merchant ID is required'),

  // Status update
  statusUpdate: z.object({
    status: z.string().min(1)
  })
};

/**
 * Sanitize search input to prevent injection
 */
export function sanitizeSearchInput(input: string): string {
  // Remove special characters that could be used for query injection
  return input
    .replace(/[${}]/g, '')
    .replace(/\$/g, '')
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic international support)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 8;
}

/**
 * Validate date format
 */
export function isValidDate(date: string | Date): boolean {
  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Create a validation schema for partial updates
 */
export function partial<T extends z.ZodRawShape>(schema: z.ZodObject<T>): ZodSchema<Partial<z.infer<z.ZodObject<T>>>> {
  return schema.partial();
}

/**
 * Create a validation schema for required updates (at least one field)
 */
export function requiredAtLeastOne<T extends z.ZodRawShape>(schema: z.ZodObject<T>): ZodSchema<Partial<z.infer<z.ZodObject<T>>>> {
  return schema.partial().refine(
    obj => Object.keys(obj).length > 0,
    { message: 'At least one field is required' }
  );
}