"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const logger_1 = __importDefault(require("./utils/logger"));
'express';
/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header against configured token
 */
function authMiddleware(req, res, next) {
    const token = req.headers['x-internal-token'];
    const validToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) {
        res.status(401).json({ error: 'Missing authentication token' });
        return;
    }
    if (!validToken) {
        // In development without token configured, log warning and continue
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.warn('WARNING: INTERNAL_SERVICE_TOKEN not configured - bypassing auth');
            next();
            return;
        }
        res.status(500).json({ error: 'Server authentication not configured' });
        return;
    }
    // Timing-safe comparison to prevent timing attacks
    if (!timingSafeEqual(token, validToken)) {
        res.status(401).json({ error: 'Invalid authentication token' });
        return;
    }
    next();
}
/**
 * Optional auth middleware - continues without token but sets req.service if valid
 */
function optionalAuthMiddleware(req, res, next) {
    const token = req.headers['x-internal-token'];
    const validToken = process.env.INTERNAL_SERVICE_TOKEN;
    if (token && validToken && timingSafeEqual(token, validToken)) {
        req.headers['x-authenticated'] = 'true';
    }
    next();
}
/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
        result |= bufA[i] ^ bufB[i];
    }
    return result === 0;
}
//# sourceMappingURL=auth.js.map