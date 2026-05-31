"use strict";
/**
 * HOJAI RAG Service - Authentication Middleware
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const config_1 = __importDefault(require("../config"));
const error_1 = require("./error");
/**
 * Internal service authentication
 * Validates X-Internal-Token header for service-to-service calls
 */
function authMiddleware(req, _res, next) {
    // Skip auth for health endpoints
    if (req.path === '/health' || req.path === '/') {
        return next();
    }
    const internalToken = req.headers['x-internal-token'];
    // If no token required (development mode)
    if (!config_1.default.internalServiceToken) {
        return next();
    }
    // Validate token
    if (!internalToken) {
        return next(new error_1.UnauthorizedError('Missing X-Internal-Token header'));
    }
    if (internalToken !== config_1.default.internalServiceToken) {
        return next(new error_1.UnauthorizedError('Invalid service token'));
    }
    // Extract service info from headers
    req.serviceId = req.headers['x-service-id'];
    req.tenantId = req.headers['x-tenant-id'];
    return next();
}
/**
 * Optional auth - doesn't fail if no token present
 */
function optionalAuthMiddleware(req, _res, next) {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken && config_1.default.internalServiceToken) {
        if (internalToken === config_1.default.internalServiceToken) {
            req.serviceId = req.headers['x-service-id'];
            req.tenantId = req.headers['x-tenant-id'];
        }
    }
    return next();
}
//# sourceMappingURL=auth.js.map