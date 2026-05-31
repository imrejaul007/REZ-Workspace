"use strict";
// ============================================
// HOJAI AI - SDR Agent Authentication Middleware
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInternalAuth = requireInternalAuth;
exports.extractTenant = extractTenant;
exports.requireTenant = requireTenant;
exports.requireUserAuth = requireUserAuth;
exports.requireRole = requireRole;
exports.rateLimitByTenant = rateLimitByTenant;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
// Environment configuration
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token';
const INTERNAL_SERVICE_TOKENS_JSON = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';
function getServiceTokens() {
    try {
        return JSON.parse(INTERNAL_SERVICE_TOKENS_JSON);
    }
    catch {
        return {};
    }
}
/**
 * Require internal service authentication
 * Used for service-to-service communication
 */
function requireInternalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const internalToken = req.headers['x-internal-token'];
    // Check Authorization header
    if (authHeader) {
        const [type, token] = authHeader.split(' ');
        if (type === 'Bearer' && token) {
            // Verify token against configured tokens
            const serviceTokens = getServiceTokens();
            const isValid = Object.values(serviceTokens).includes(token) || token === INTERNAL_SERVICE_TOKEN;
            if (isValid) {
                // Extract tenant from token or use default
                const tenantId = extractTenantFromToken(token) || 'default';
                req.tenantId = tenantId;
                req.userId = 'internal-service';
                req.correlationId = generateCorrelationId();
                logger_1.logger.debug('Internal auth successful', { tenantId: req.tenantId });
                return next();
            }
        }
    }
    // Check X-Internal-Token header
    if (internalToken) {
        const serviceTokens = getServiceTokens();
        const isValid = Object.values(serviceTokens).includes(internalToken) || internalToken === INTERNAL_SERVICE_TOKEN;
        if (isValid) {
            const tenantId = extractTenantFromToken(internalToken) || 'default';
            req.tenantId = tenantId;
            req.userId = 'internal-service';
            req.correlationId = generateCorrelationId();
            return next();
        }
    }
    logger_1.logger.warn('Unauthorized internal access attempt', {
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    res.status(401).json({
        success: false,
        error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or missing authentication token'
        }
    });
}
/**
 * Optional tenant extraction from headers
 * Does not block if no tenant is provided
 */
function extractTenant(req, res, next) {
    const tenantId = req.headers['x-tenant-id'];
    if (tenantId) {
        // Validate tenant ID format
        if (!isValidTenantId(tenantId)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_TENANT',
                    message: 'Invalid tenant ID format'
                }
            });
            return;
        }
        req.tenantId = tenantId;
    }
    else {
        // Default tenant for development
        req.tenantId = 'default';
    }
    req.correlationId = generateCorrelationId();
    next();
}
/**
 * Require specific tenant (fail if not provided)
 */
function requireTenant(req, res, next) {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
        res.status(400).json({
            success: false,
            error: {
                code: 'TENANT_REQUIRED',
                message: 'X-Tenant-Id header is required'
            }
        });
        return;
    }
    if (!isValidTenantId(tenantId)) {
        res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_TENANT',
                message: 'Invalid tenant ID format'
            }
        });
        return;
    }
    req.tenantId = tenantId;
    req.correlationId = generateCorrelationId();
    next();
}
/**
 * Require user authentication (end-user)
 */
function requireUserAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authorization header required'
            }
        });
        return;
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_AUTH',
                message: 'Invalid authorization format. Use: Bearer <token>'
            }
        });
        return;
    }
    // In production, verify JWT and extract user info
    // For now, we'll simulate verification
    try {
        const userPayload = verifyUserToken(token);
        req.userId = userPayload.userId;
        req.tenantId = userPayload.tenantId;
        req.userRoles = userPayload.roles;
        req.correlationId = generateCorrelationId();
        next();
    }
    catch (error) {
        logger_1.logger.warn('User authentication failed', { error });
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token'
            }
        });
    }
}
/**
 * Role-based access control
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.userRoles || req.userRoles.length === 0) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'No roles assigned'
                }
            });
            return;
        }
        const hasRole = roles.some(role => req.userRoles.includes(role));
        if (!hasRole) {
            logger_1.logger.warn('Access denied - insufficient role', {
                userId: req.userId,
                requiredRoles: roles,
                userRoles: req.userRoles
            });
            res.status(403).json({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: `Required role: ${roles.join(' or ')}`
                }
            });
            return;
        }
        next();
    };
}
/**
 * Rate limiting middleware
 */
function rateLimitByTenant(windowMs = 60 * 1000, max = 100) {
    const requests = new Map();
    return (req, res, next) => {
        const tenantId = req.tenantId || req.ip || 'unknown';
        const now = Date.now();
        let record = requests.get(tenantId);
        if (!record || record.resetAt < now) {
            record = { count: 0, resetAt: now + windowMs };
            requests.set(tenantId, record);
        }
        record.count++;
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
        if (record.count > max) {
            logger_1.logger.warn('Rate limit exceeded', { tenantId, count: record.count, limit: max });
            res.status(429).json({
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests. Please try again later.',
                    retryAfter: Math.ceil((record.resetAt - now) / 1000)
                }
            });
            return;
        }
        next();
    };
}
// ============================================
// Helper Functions
// ============================================
/**
 * Validate tenant ID format
 * Must be alphanumeric with optional hyphens/underscores
 */
function isValidTenantId(tenantId) {
    return /^[a-zA-Z0-9_-]{1,64}$/.test(tenantId);
}
/**
 * Extract tenant from service token
 * Format: tenant:token or just token
 */
function extractTenantFromToken(token) {
    const parts = token.split(':');
    if (parts.length >= 2 && isValidTenantId(parts[0])) {
        return parts[0];
    }
    return null;
}
/**
 * Generate correlation ID for request tracing
 */
function generateCorrelationId() {
    return crypto_1.default.randomUUID();
}
function verifyUserToken(token) {
    // In production, verify JWT signature and expiration
    // For development, we'll decode without verification (NOT FOR PRODUCTION)
    try {
        // Simple base64 decode for development
        // In production: jwt.verify(token, secret)
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        if (!payload.userId) {
            throw new Error('Invalid token payload');
        }
        return {
            userId: payload.userId,
            tenantId: payload.tenantId || 'default',
            roles: payload.roles || []
        };
    }
    catch {
        throw new Error('Invalid token');
    }
}
exports.default = {
    requireInternalAuth,
    extractTenant,
    requireTenant,
    requireUserAuth,
    requireRole,
    rateLimitByTenant
};
//# sourceMappingURL=auth.js.map