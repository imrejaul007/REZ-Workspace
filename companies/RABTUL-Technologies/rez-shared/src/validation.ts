/**
 * Validation utilities
 */

import { z, ZodSchema, ZodError } from 'zod';

/**
 * Validate data against a schema
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: ValidationError[];
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(
        (e) => new ValidationError(e.message, { path: e.path.join('.') })
      );
      return { success: false, errors };
    }
    return { success: false, errors: [new ValidationError('Validation failed')] };
  }
}

/**
 * Safe parse that returns null on error
 */
export function safeParse<T>(schema: ZodSchema<T>, data: unknown): T | null {
  try {
    return schema.parse(data);
  } catch {
    return null;
  }
}

/**
 * Create a validation middleware for Fastify
 */
export function createValidator(schema: ZodSchema) {
  return async (data: unknown) => {
    const result = validate(schema, data);
    if (!result.success) {
      return result.errors;
    }
    return null;
  };
}

// ============ Common Validators ============

export const validators = {
  email: z.string().email(),
  phone: z.string().regex(/^[+]?[\d\s-]{10,}$/),
  uuid: z.string().uuid(),
  url: z.string().url(),
  date: z.string().datetime(),
  positiveInt: z.number().int().positive(),
  nonNegativeInt: z.number().int().nonnegative(),
  percentage: z.number().min(0).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isoDateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
};

// ============ Validation Error ============

export class ValidationError extends Error {
  constructor(
    message: string,
    public path?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
