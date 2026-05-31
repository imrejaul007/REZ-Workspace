"use strict";
/**
 * HOJAI RAG Service - Error Handler Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
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
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    details;
    constructor(message, details) {
        super(400, message, 'VALIDATION_ERROR');
        this.details = details;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource) {
        super(404, `${resource} not found`, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, message, 'UNAUTHORIZED');
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class RateLimitError extends AppError {
    constructor(retryAfter) {
        super(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED');
        this.name = 'RateLimitError';
        if (retryAfter) {
            this.retryAfter = retryAfter;
        }
    }
    retryAfter;
}
exports.RateLimitError = RateLimitError;
// Error handler middleware
function errorHandler(err, _req, res, _next) {
    console.error('Error:', err);
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            details: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message,
            })),
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle custom app errors
    if (err instanceof AppError) {
        const response = {
            success: false,
            error: err.message,
            code: err.code,
            timestamp: new Date().toISOString(),
        };
        if (err instanceof RateLimitError && err.retryAfter) {
            response.retry_after = err.retryAfter;
            res.setHeader('Retry-After', err.retryAfter.toString());
        }
        res.status(err.statusCode).json(response);
        return;
    }
    // Handle unexpected errors
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
    });
}
// 404 handler
function notFoundHandler(_req, res) {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=error.js.map