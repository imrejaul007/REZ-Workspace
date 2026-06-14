/**
 * Validation Middleware for Grocery Service
 *
 * Handles:
 * - Request validation schemas
 * - Common validation helpers
 * - Custom validators
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import logger from '../utils/logger';

/**
 * Validate request body against a Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`[Validation] Body validation failed for ${req.path}:`, error.errors);
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
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
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`[Validation] Query validation failed for ${req.path}:`, error.errors);
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
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
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params);
      req.params = result as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn(`[Validation] Params validation failed for ${req.path}:`, error.errors);
        res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate that merchantId matches the authenticated user
 */
export function validateMerchantAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  const bodyMerchantId = req.body?.merchantId;
  const queryMerchantId = req.query?.merchantId;
  const paramMerchantId = req.params?.merchantId;

  const requestedMerchantId = bodyMerchantId || queryMerchantId || paramMerchantId;

  // Admin and service roles can access any merchant
  if (req.user.role === 'admin' || req.user.role === 'service') {
    next();
    return;
  }

  if (!requestedMerchantId) {
    res.status(400).json({
      success: false,
      error: 'Merchant ID is required'
    });
    return;
  }

  if (req.user.merchantId && req.user.merchantId !== requestedMerchantId) {
    logger.warn(`[Validation] Merchant access violation: User ${req.user.sub} attempted to access merchant ${requestedMerchantId}`);
    res.status(403).json({
      success: false,
      error: 'Access denied for this merchant'
    });
    return;
  }

  next();
}

/**
 * Validate required fields in request
 */
export function validateRequiredFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    for (const field of fields) {
      const value = req.body[field];
      if (value === undefined || value === null || value === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        fields: missing
      });
      return;
    }

    next();
  };
}

/**
 * Validate array has minimum length
 */
export function validateArrayMinLength(field: string, minLength: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const array = req.body[field];

    if (!Array.isArray(array)) {
      res.status(400).json({
        success: false,
        error: `${field} must be an array`
      });
      return;
    }

    if (array.length < minLength) {
      res.status(400).json({
        success: false,
        error: `${field} must have at least ${minLength} item(s)`
      });
      return;
    }

    next();
  };
}

/**
 * Validate object has required keys
 */
export function validateObjectKeys(obj: unknown, requiredKeys: string[], fieldName: string): string[] {
  const errors: string[] = [];

  if (typeof obj !== 'object' || obj === null) {
    return [`${fieldName} must be an object`];
  }

  for (const key of requiredKeys) {
    if (!(key in obj)) {
      errors.push(`${fieldName}.${key} is required`);
    }
  }

  return errors;
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: unknown): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: unknown): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Validate date string
 */
export function isValidDateString(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validate barcode format (EAN-13, UPC-A, or custom)
 */
export function isValidBarcode(barcode: string): boolean {
  // Allow common barcode formats
  const patterns = [
    /^\d{8}$/,           // EAN-8
    /^\d{12}$/,          // UPC-A
    /^\d{13}$/,          // EAN-13
    /^[A-Z0-9]{4,20}$/   // Custom alphanumeric
  ];

  return patterns.some(pattern => pattern.test(barcode));
}

/**
 * Sanitize string input
 */
export function sanitizeString(value: string): string {
  return value.trim().replace(/[<>]/g, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  // Allow various phone formats
  const phoneRegex = /^[+]?[\d\s-()]{10,20}$/;
  return phoneRegex.test(phone);
}

/**
 * Create custom validation middleware
 */
export function createValidator(
  validate: (req: Request) => { valid: boolean; errors?: string[] }
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validate(req);

    if (!result.valid) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors || ['Unknown validation error']
      });
      return;
    }

    next();
  };
}

// Common validation schemas
export const schemas = {
  // Pagination
  pagination: z.object({
    page: z.string().optional().transform(v => v ? parseInt(v) : 1),
    limit: z.string().optional().transform(v => v ? parseInt(v) : 20)
  }),

  // Date range
  dateRange: z.object({
    startDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
    endDate: z.string().optional().transform(v => v ? new Date(v) : undefined)
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().min(1, 'ID is required')
  }),

  // Merchant ID
  merchantIdQuery: z.object({
    merchantId: z.string().min(1, 'Merchant ID is required')
  })
};