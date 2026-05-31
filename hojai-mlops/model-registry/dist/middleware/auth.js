"use strict";
/**
 * Hojai Model Registry - Authentication Middleware
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
/**
 * Simple API key authentication for service-to-service calls
 * In production, this should validate against a proper auth service
 */
function authMiddleware(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const internalToken = req.headers['x-internal-token'];
    // Allow health checks without auth
    if (req.path === '/health' || req.path === '/') {
        next();
        return;
    }
    // Check for internal service token
    if (internalToken) {
        // In production, validate against INTERNAL_SERVICE_TOKENS_JSON
        const validToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-dev-token';
        if (internalToken === validToken) {
            req.clientType = 'internal';
            next();
            return;
        }
    }
    // Check for API key
    if (apiKey) {
        // In production, validate against registered API keys
        req.clientType = 'external';
        next();
        return;
    }
    // No auth provided - allow in development mode
    if (process.env.NODE_ENV !== 'production') {
        req.clientType = 'internal';
        next();
        return;
    }
    res.status(401).json({
        error: 'Unauthorized',
        message: 'API key or internal token required',
        statusCode: 401,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=auth.js.map