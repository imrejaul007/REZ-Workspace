/**
 * REZ Security Middleware - Input Sanitization
 * Copy to: src/middleware/sanitize.ts
 *
 * Usage in index.ts:
 *   import { sanitizeInput, schemas } from './middleware/sanitize';
 *   app.post('/api', sanitizeInput, handler);
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Sanitize input by removing dangerous characters
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj): unknown {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: unknown = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\0/g, ''); // Remove null bytes

/**
 * Validate and sanitize MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate phone number (India)
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?[6-9]\d{9}$/.test(phone);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Common Zod schemas for reuse
export const schemas = {
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  email: z.string().email('Invalid email').max(255),
  phone: z.string().regex(/^\+?[6-9]\d{9}$/, 'Invalid phone'),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  amount: z.number().int().min(1).max(1000000000),
  percent: z.number().min(0).max(100),
};
