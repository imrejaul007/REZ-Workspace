import { Response } from 'express';
import { ZodError } from 'zod';

/**
 * Handle errors consistently across routes
 */
export function handleError(res: Response, error: unknown, statusCode = 500): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (error instanceof Error) {
    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (typeof error === 'string') {
    res.status(statusCode).json({
      success: false,
      error,
      timestamp: new Date().toISOString()
    });
    return;
  }

  res.status(statusCode).json({
    success: false,
    error: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
}

/**
 * Format Zod validation errors
 */
export function formatZodError(error: ZodError): string {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}

// Re-export errorResponse from auth for convenience
export { errorResponse, successResponse } from '../middleware/auth.js';
