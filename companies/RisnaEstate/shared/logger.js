"use strict";
/**
 * Shared Production Logger for RTNM Companies
 *
 * Features:
 * - Structured JSON logging
 * - PII redaction
 * - Correlation ID tracking
 * - Production-safe (no console.log in prod)
 *
 * Usage:
 *   import { logger } from '../../shared/logger';
 *   logger.info('Message', { key: 'value' });
 *   logger.error('Failed', error);
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info');
const SERVICE_NAME = process.env.SERVICE_NAME || 'rtnm-service';
const IS_PROD = process.env.NODE_ENV === 'production';
// PII patterns
const PII_PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\+?[0-9]{10,15}/g,
    ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
};
function redactPII(str) {
    if (typeof str !== 'string')
        return String(str);
    return str
        .replace(PII_PATTERNS.email, (m) => m.split('@')[0].slice(0, 2) + '***@***')
        .replace(PII_PATTERNS.phone, (m) => m.slice(0, 2) + '****' + m.slice(-2))
        .replace(PII_PATTERNS.ip, (m) => m.split('.')[0] + '.***.***.***');
}
function redactObject(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj !== 'object')
        return obj;
    const sensitive = ['password', 'token', 'secret', 'key', 'apiKey', 'creditCard'];
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
        if (sensitive.some(s => k.toLowerCase().includes(s))) {
            result[k] = '[REDACTED]';
        }
        else if (typeof v === 'string') {
            result[k] = redactPII(v);
        }
        else if (typeof v === 'object' && v !== null) {
            result[k] = redactObject(v);
        }
        else {
            result[k] = v;
        }
    }
    return result;
}
function formatLog(level, message, meta) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: SERVICE_NAME,
        message: redactPII(message),
        ...(meta && { ...redactObject(meta) }),
    };
    return JSON.stringify(entry);
}
const LEVEL_PRIORITY = { debug: 0, info: 1, warn: 2, error: 3 };
function shouldLog(level) {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[LOG_LEVEL];
}
// Production logger - uses console only in non-production
const logger = {
    debug(message, meta) {
        if (shouldLog('debug')) {
            IS_PROD ? console.log(formatLog('debug', message, meta)) : console.debug(message, meta);
        }
    },
    info(message, meta) {
        if (shouldLog('info')) {
            IS_PROD ? console.log(formatLog('info', message, meta)) : console.info(message, meta);
        }
    },
    warn(message, meta) {
        if (shouldLog('warn')) {
            IS_PROD ? console.log(formatLog('warn', message, meta)) : console.warn(message, meta);
        }
    },
    error(message, error, meta) {
        if (shouldLog('error')) {
            const errorObj = error instanceof Error ? { message: error.message, stack: error.stack } : error;
            const entry = formatLog('error', message, { ...meta, error: errorObj });
            IS_PROD ? console.log(entry) : console.error(message, error);
        }
    },
    http(req) {
        const level = req.status >= 500 ? 'error' : req.status >= 400 ? 'warn' : 'info';
        if (shouldLog(level)) {
            console.log(formatLog(level, `${req.method} ${req.url} ${req.status} ${req.duration}ms`));
        }
    },
};
exports.logger = logger;
exports.default = logger;
//# sourceMappingURL=logger.js.map