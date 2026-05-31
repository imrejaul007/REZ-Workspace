"use strict";
/**
 * Hojai Model Registry - Error Handling Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ConflictError = exports.NotFoundError = exports.AppError = void 0;
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
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
function createErrorResponse(error) {
    return {
        ...error,
        timestamp: new Date().toISOString(),
    };
}
function errorHandler(err, _req, res, _next) {
    console.error('Error:', err);
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        res.status(400).json(createErrorResponse({
            error: 'Validation Error',
            message: messages,
            statusCode: 400,
            timestamp: new Date().toISOString(),
        }));
        return;
    }
    // Handle custom AppError
    if (err instanceof AppError) {
        res.status(err.statusCode).json(createErrorResponse({
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            timestamp: new Date().toISOString(),
        }));
        return;
    }
    // Handle unknown errors
    res.status(500).json(createErrorResponse({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
    }));
}
function notFoundHandler(req, res, _next) {
    res.status(404).json(createErrorResponse({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
    }));
}
//# sourceMappingURL=error.js.map