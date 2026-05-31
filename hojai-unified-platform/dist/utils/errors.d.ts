import { Response } from 'express';
import { ZodError } from 'zod';
/**
 * Handle errors consistently across routes
 */
export declare function handleError(res: Response, error: unknown, statusCode?: number): void;
/**
 * Format Zod validation errors
 */
export declare function formatZodError(error: ZodError): string;
export { errorResponse, successResponse } from '../middleware/auth.js';
