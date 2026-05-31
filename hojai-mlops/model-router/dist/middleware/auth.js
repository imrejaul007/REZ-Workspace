"use strict";
/**
 * Hojai Model Router - Authentication Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const error_1 = require("./error");
// Parse environment variables with explicit access
const INTERNAL_SERVICE_TOKENS_JSON = process.env['INTERNAL_SERVICE_TOKENS_JSON'];
const INTERNAL_SERVICE_TOKENS = INTERNAL_SERVICE_TOKENS_JSON
    ? JSON.parse(INTERNAL_SERVICE_TOKENS_JSON)
    : {};
const INTERNAL_TOKEN = process.env['INTERNAL_SERVICE_TOKEN'] || '';
const API_KEY = process.env['API_KEY'] || '';
const NODE_ENV = process.env['NODE_ENV'] || 'development';
/**
 * Simple API key auth for internal services
 */
function authMiddleware(req, _res, next) {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'];
    const apiKey = req.headers['x-api-key'];
    // Allow if internal token matches
    if (internalToken && INTERNAL_TOKEN && internalToken === INTERNAL_TOKEN) {
        return next();
    }
    // Check service tokens
    if (internalToken && INTERNAL_SERVICE_TOKENS) {
        const isValidServiceToken = Object.values(INTERNAL_SERVICE_TOKENS).includes(internalToken);
        if (isValidServiceToken) {
            return next();
        }
    }
    // Check API key
    if (apiKey && apiKey === API_KEY) {
        return next();
    }
    // For development, allow no auth
    if (NODE_ENV === 'development' && !internalToken && !apiKey) {
        return next();
    }
    next(new error_1.AppError('Unauthorized: Invalid or missing authentication', 401));
}
//# sourceMappingURL=auth.js.map