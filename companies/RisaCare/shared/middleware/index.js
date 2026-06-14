"use strict";
// RisaCare Shared Middleware
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRateLimiter = exports.compressionMiddleware = exports.corsMiddleware = exports.securityHeaders = void 0;
exports.requestId = requestId;
exports.errorHandler = errorHandler;
exports.requestLogger = requestLogger;
exports.healthCheck = healthCheck;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errors_1 = require("../errors");
const utils_1 = require("../utils");
// ============================================
// REQUEST ID
// ============================================
function requestId(req, res, next) {
    const requestId = req.headers['x-request-id'] || (0, utils_1.generateRequestId)();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}
// ============================================
// SECURITY HEADERS
// ============================================
exports.securityHeaders = (0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true
    }
});
// ============================================
// CORS
// ============================================
exports.corsMiddleware = (0, cors_1.default)({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://risa.money',
            'https://app.risa.money'
        ];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Profile-Id']
});
// ============================================
// COMPRESSION
// ============================================
exports.compressionMiddleware = (0, compression_1.default)();
// ============================================
// RATE LIMITING
// ============================================
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
    standardHeaders: true,
    legacyHeaders: false
});
// ============================================
// ERROR HANDLER
// ============================================
function errorHandler(error, req, res, _next) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    if (error instanceof errors_1.RisaCareError) {
        utils_1.logger.error(`RisaCare error: ${error.code}`, error, { requestId });
        res.status(error.statusCode).json((0, errors_1.formatErrorResponse)(error, requestId));
        return;
    }
    utils_1.logger.error('Unexpected error', error, { requestId });
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            requestId
        }
    });
}
// ============================================
// LOGGING
// ============================================
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.headers['x-request-id'],
            userId: req.headers['x-user-id'] || 'anonymous'
        };
        if (res.statusCode >= 400) {
            utils_1.logger.warn(`${req.method} ${req.path} ${res.statusCode}`, logData);
        }
        else {
            utils_1.logger.info(`${req.method} ${req.path} ${res.statusCode}`, logData);
        }
    });
    next();
}
// ============================================
// HEALTH CHECK
// ============================================
function healthCheck(req, res) {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
}
//# sourceMappingURL=index.js.map