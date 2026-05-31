"use strict";
/**
 * Authentication Middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = __importDefault(require("../config"));
/**
 * Verify internal service token
 * Used for service-to-service communication
 */
function authMiddleware(req, res, next) {
    const token = req.headers['x-internal-token'];
    if (!token) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing X-Internal-Token header',
            statusCode: 401,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Timing-safe comparison
    const expectedToken = config_1.default.internalServiceToken;
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedToken);
    if (tokenBuffer.length !== expectedBuffer.length ||
        !crypto_1.default.timingSafeEqual(tokenBuffer, expectedBuffer)) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid internal service token',
            statusCode: 401,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    req.internalToken = token;
    next();
}
/**
 * Optional auth - sets internalToken if present but doesn't require it
 */
function optionalAuthMiddleware(req, res, next) {
    const token = req.headers['x-internal-token'];
    if (token) {
        const expectedToken = config_1.default.internalServiceToken;
        const tokenBuffer = Buffer.from(token);
        const expectedBuffer = Buffer.from(expectedToken);
        if (tokenBuffer.length === expectedBuffer.length &&
            crypto_1.default.timingSafeEqual(tokenBuffer, expectedBuffer)) {
            req.internalToken = token;
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map