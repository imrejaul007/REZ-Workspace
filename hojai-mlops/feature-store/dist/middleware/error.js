"use strict";
/**
 * Error Handling Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.ConflictError = exports.ValidationError = exports.NotFoundError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    message;
    code;
    constructor(statusCode, message, code) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(404, `${resource} not found`);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ValidationError extends AppError {
    constructor(message) {
        super(400, message, 'VALIDATION_ERROR');
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ConflictError extends AppError {
    constructor(message) {
        super(409, message, 'CONFLICT');
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(retryAfter) {
        super(429, 'Rate limit exceeded', 'RATE_LIMIT');
        this.name = 'RateLimitError';
        if (retryAfter) {
            this.retryAfter = retryAfter;
        }
    }
    retryAfter;
}
exports.RateLimitError = RateLimitError;
/**
 * Global error handler
 */
function errorHandler(err, req, res, _next) {
    console.error('Error:', err);
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'Validation Error',
            message: err.errors
                .map((e) => `${e.path.join('.')}: ${e.message}`)
                .join(', '),
            statusCode: 400,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // App errors
    if (err instanceof AppError) {
        const response = {
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            timestamp: new Date().toISOString(),
        };
        if (err instanceof RateLimitError && err.retryAfter) {
            response.retryAfter = err.retryAfter;
        }
        res.status(err.statusCode).json(response);
        return;
    }
    // Unknown errors
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
    });
}
/**
 * Not found handler for undefined routes
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        statusCode: 404,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=error.js.map