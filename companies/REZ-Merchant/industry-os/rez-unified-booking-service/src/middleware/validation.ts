import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { createLogger } from '../utils/logger';
import { ErrorCode } from '../types';

const logger = createLogger('validation-middleware');

// ============================================
// Validation Middleware Factory
// ============================================

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      logger.warn('Request body validation failed', {
        path: req.path,
        errors: result.error.errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid request body',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      logger.warn('Query parameter validation failed', {
        path: req.path,
        errors: result.error.errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid query parameters',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      logger.warn('URL parameter validation failed', {
        path: req.path,
        errors: result.error.errors,
      });

      res.status(400).json({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid URL parameters',
          details: result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
      return;
    }

    next();
  };
}

// ============================================
// Common Validation Schemas
// ============================================

// ObjectId validation
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID format');

// Date string validation (YYYY-MM-DD)
export const dateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Date must be in YYYY-MM-DD format'
);

// Time string validation (HH:mm)
export const timeStringSchema = z.string().regex(
  /^\d{2}:\d{2}$/,
  'Time must be in HH:mm format'
);

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Date range schema
export const dateRangeSchema = z.object({
  fromDate: z.string().datetime().or(dateStringSchema),
  toDate: z.string().datetime().or(dateStringSchema),
}).refine(
  (data) => new Date(data.fromDate) <= new Date(data.toDate),
  {
    message: 'fromDate must be before or equal to toDate',
    path: ['fromDate'],
  }
);

// Booking status schema
export const bookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

// Vertical schema
export const verticalSchema = z.enum([
  'restaurant',
  'hotel',
  'salon',
  'spa',
  'gym',
  'education',
  'events',
  'automotive',
  'medical',
  'tours',
  'rentals',
  'entertainment',
  'cleaning',
  'repair',
  'childcare',
  'petcare',
  'legal',
]);

// UUID schema
export const uuidSchema = z.string().uuid();

// ============================================
// Custom Validators
// ============================================

export function isValidDateString(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function isValidTimeString(timeStr: string): boolean {
  const regex = /^\d{2}:\d{2}$/;
  if (!regex.test(timeStr)) {
    return false;
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Allow international phone formats
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

// ============================================
// Validation Error Formatter
// ============================================

export function formatValidationErrors(errors: z.ZodError['errors']): {
  field: string;
  message: string;
  code?: string;
}[] {
  return errors.map((error) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
  }));
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  paginationSchema,
  dateRangeSchema,
  bookingStatusSchema,
  verticalSchema,
  objectIdSchema,
  uuidSchema,
  isValidDateString,
  isValidTimeString,
  isValidEmail,
  isValidPhone,
  formatValidationErrors,
};