/**
 * Shared Validation Middleware using Zod
 *
 * SECURITY FIX (MA-BACK-AUDIT-008): Centralized validation middleware.
 * Provides consistent request validation across all routes using Zod schemas.
 * Reduces code duplication and ensures all inputs are validated at the boundary.
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { errorResponse, errors } from '../utils/response';

/**
 * Validates request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      errorResponse(res, errors.badRequest(errorMessages.join('; ')));
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      errorResponse(res, errors.badRequest(errorMessages.join('; ')));
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Validates URL parameters against a Zod schema
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      errorResponse(res, errors.badRequest(errorMessages.join('; ')));
      return;
    }
    req.params = result.data as typeof req.params;
    next();
  };
}

/**
 * Common validation schemas for reuse across routes
 */

// ObjectId validation
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Pagination with defaults
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// MongoDB ObjectId
export const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

// UUID v4
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email
export const emailSchema = z.string().email('Invalid email format');

// URL
export const urlSchema = z.string().url('Invalid URL format');

// Phone (E.164 format or Indian format)
export const phoneSchema = z.string().regex(
  /^(?:\+91[-\s]?)?[6-9]\d{9}$/,
  'Invalid phone number format'
);

// Date string (ISO 8601)
export const dateSchema = z.string().datetime('Invalid date format');

// Non-empty string
export const nonEmptyStringSchema = z.string().min(1, 'String cannot be empty');

// Positive number
export const positiveNumberSchema = z.number().positive('Must be a positive number');

// Non-negative number
export const nonNegativeNumberSchema = z.number().nonnegative('Must be a non-negative number');

// Boolean string ('true' or 'false')
export const booleanStringSchema = z.enum(['true', 'false']);

// Create helper to extract error messages from ZodError
export function getZodErrorMessages(error: ZodError): string[] {
  return error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
}
