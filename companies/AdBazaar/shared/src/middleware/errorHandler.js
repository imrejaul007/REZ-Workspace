"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const errors_js_1 = require("../utils/errors.js");
/**
 * Global error handler middleware
 */
function errorHandler(err, req, res, _next) {
    const requestId = req.requestId || 'unknown';
    // Log error
    console.error(JSON.stringify({
        level: 'error',
        requestId,
        path: req.path,
        method: req.method,
        error: {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        },
        timestamp: new Date().toISOString(),
    }));
    // Handle AppError (our custom error class)
    if (err instanceof errors_js_1.AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            requestId,
        });
        return;
    }
    // Handle validation errors
    if (err.name === 'ZodError') {
        res.status(400).json({
            error: 'Validation error',
            details: err.errors,
            requestId,
        });
        return;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        res.status(400).json({
            error: 'Validation error',
            details: err.message,
            requestId,
        });
        return;
    }
    // Handle MongoDB duplicate key errors
    if (err.code === 11000) {
        res.status(409).json({
            error: 'Duplicate entry',
            requestId,
        });
        return;
    }
    // Default to 500 Internal Server Error
    res.status(500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
        requestId,
    });
}
/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        error: `Route ${req.method} ${req.path} not found`,
        requestId: req.requestId,
    });
}
//# sourceMappingURL=errorHandler.js.map