"use strict";
// ============================================
// HOJAI AI - SDR Agent Logger Utility
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMetric = exports.logError = exports.logRequest = exports.logger = void 0;
exports.redactSensitiveData = redactSensitiveData;
exports.generateCorrelationId = generateCorrelationId;
const winston_1 = __importDefault(require("winston"));
const crypto_1 = __importDefault(require("crypto"));
const { combine, timestamp, printf, colorize, errors } = winston_1.default.format;
// Custom format for logs
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    // Add metadata if present
    if (Object.keys(metadata).length > 0 && metadata.stack === undefined) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    // Add stack trace for errors
    if (metadata.stack) {
        msg += `\n${metadata.stack}`;
    }
    return msg;
});
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
        // Console transport with colors
        new winston_1.default.transports.Console({
            format: combine(colorize({ all: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat)
        })
    ],
    defaultMeta: {
        service: 'sdr-agent',
        version: '1.0.0'
    }
});
// Add file transports in production
if (process.env.NODE_ENV === 'production') {
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
    exports.logger.add(new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }));
}
// Security: Redact sensitive data in logs
const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'sessionId',
    'ssn',
    'creditCard'
];
function redactSensitiveData(obj) {
    const redacted = { ...obj };
    for (const key of Object.keys(redacted)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
            redacted[key] = '[REDACTED]';
        }
        else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
            redacted[key] = redactSensitiveData(redacted[key]);
        }
    }
    return redacted;
}
// Generate correlation ID for request tracing
function generateCorrelationId() {
    return crypto_1.default.randomUUID();
}
// Structured logging helpers
const logRequest = (method, path, statusCode, durationMs, metadata) => {
    exports.logger.info(`${method} ${path} ${statusCode} ${durationMs}ms`, {
        type: 'http_request',
        method,
        path,
        statusCode,
        durationMs,
        ...metadata
    });
};
exports.logRequest = logRequest;
const logError = (context, error, metadata) => {
    const errorInfo = {
        type: 'error',
        context,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...metadata
    };
    exports.logger.error(`Error in ${context}`, redactSensitiveData(errorInfo));
};
exports.logError = logError;
const logMetric = (metric, value, metadata) => {
    exports.logger.info(`Metric: ${metric}`, {
        type: 'metric',
        metric,
        value,
        ...metadata
    });
};
exports.logMetric = logMetric;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map