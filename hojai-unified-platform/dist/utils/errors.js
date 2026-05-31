import { ZodError } from 'zod';
/**
 * Handle errors consistently across routes
 */
export function handleError(res, error, statusCode = 500) {
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
export function formatZodError(error) {
    return error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}
// Re-export errorResponse from auth for convenience
export { errorResponse, successResponse } from '../middleware/auth.js';
//# sourceMappingURL=errors.js.map