import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Error Handler Middleware
 * Handles all errors in a consistent way
 */

export interface ApiError extends Error {
 statusCode?: number;
 code?: string;
 details?;
}

export function errorHandler(
 err: ApiError,
 req: Request,
 res: Response,
 _next: NextFunction
): void {
 logger.error('Error:', {
   message: err.message,
   stack: err.stack,
   path: req.path,
   method: req.method,
 });

 // Default error response
 let statusCode = err.statusCode || 500;
 let message = err.message || 'Internal Server Error';
 let code = err.code || 'INTERNAL_ERROR';
 let details: unknown = undefined;

 // Handle specific error types
 if (err instanceof ZodError) {
   statusCode = 400;
   message = 'Validation failed';
   code = 'VALIDATION_ERROR';
   details = err.errors.map((e) => ({
     path: e.path.join('.'),
     message: e.message,
   }));
 }

 // Handle known error codes
 switch (code) {
   case 'NOT_FOUND':
     statusCode = 404;
     break;
   case 'UNAUTHORIZED':
     statusCode = 401;
     break;
   case 'FORBIDDEN':
     statusCode = 403;
     break;
   case 'VALIDATION_ERROR':
     statusCode = 400;
     break;
   case 'RATE_LIMITED':
     statusCode = 429;
     break;
   case 'CONFLICT':
     statusCode = 409;
     break;
 }

 // Send error response
 res.status(statusCode).json({
   success: false,
   error: {
     code,
     message,
     details,
   },
 });
}

/**
 * Not found handler
 */
export function notFoundHandler(
 req: Request,
 res: Response,
 _next: NextFunction
): void {
 res.status(404).json({
   success: false,
   error: {
     code: 'NOT_FOUND',
     message: `Route ${req.method} ${req.path} not found`,
   },
 });
}

/**
 * Create an API error
 */
export function createError(
 message: string,
 statusCode: number = 500,
 code: string = 'INTERNAL_ERROR',
 details?: unknown
): ApiError {
 const error: ApiError = new Error(message);
 error.statusCode = statusCode;
 error.code = code;
 error.details = details;
 return error;
}

/**
 * Async handler wrapper
 */
export function asyncHandler(
 fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
 return (req: Request, res: Response, next: NextFunction) => {
   Promise.resolve(fn(req, res, next)).catch(next);
 };
}
