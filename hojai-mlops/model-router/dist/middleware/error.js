"use strict";
/**
 * Hojai Model Router - Error Handling Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ValidationError = exports.ServiceUnavailableError = exports.NotFoundError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} '${identifier}' not found`
            : `${resource} not found`;
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ServiceUnavailableError extends AppError {
    constructor(message) {
        super(message, 503);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429);
    }
}
exports.RateLimitError = RateLimitError;
function createErrorResponse(error) {
    return {
        error: error.error || 'Unknown Error',
        message: error.message || 'An unexpected error occurred',
        statusCode: error.statusCode || 500,
        timestamp: new Date().toISOString(),
    };
}
function errorHandler(err, _req, res, _next) {
    console.error('[Error]', err);
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json(createErrorResponse({
            error: 'Validation Error',
            message: messages,
            statusCode: 400,
        }));
        return;
    }
    // Handle custom AppError
    if (err instanceof AppError) {
        res.status(err.statusCode).json(createErrorResponse({
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
        }));
        return;
    }
    // Handle unknown errors
    const isProduction = process.env['NODE_ENV'] === 'production';
    res.status(500).json(createErrorResponse({
        error: 'Internal Server Error',
        message: isProduction
            ? 'An unexpected error occurred'
            : err.message,
        statusCode: 500,
    }));
}
function notFoundHandler(req, res, _next) {
    res.status(404).json(createErrorResponse({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
    }));
}
//# sourceMappingURL=error.js.map