"use strict";
/**
 * HR Recruiter Agent - Authentication Middleware
 * Service-to-service authentication and authorization
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalAuth = internalAuth;
exports.userAuth = userAuth;
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.tenantIsolation = tenantIsolation;
exports.optionalAuth = optionalAuth;
const crypto = __importStar(require("crypto"));
// Valid internal service tokens (in production, use secrets manager)
const INTERNAL_SERVICE_TOKENS = new Map();
// Initialize with environment variable if available
if (process.env.INTERNAL_SERVICE_TOKENS_JSON) {
    try {
        const tokens = JSON.parse(process.env.INTERNAL_SERVICE_TOKENS_JSON);
        for (const [service, token] of Object.entries(tokens)) {
            INTERNAL_SERVICE_TOKENS.set(service, token);
        }
    }
    catch (error) {
        console.warn('Failed to parse INTERNAL_SERVICE_TOKENS_JSON');
    }
}
/**
 * Validate internal service token using timing-safe comparison
 */
function validateInternalToken(token) {
    // Check against configured tokens
    for (const [, validToken] of INTERNAL_SERVICE_TOKENS) {
        if (timingSafeEqual(token, validToken)) {
            return true;
        }
    }
    return false;
}
/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
}
/**
 * Internal service authentication middleware
 * Used for service-to-service communication
 */
function internalAuth(req, res, next) {
    const token = req.headers['x-internal-token'];
    if (!token) {
        const response = {
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing internal service token',
            },
        };
        res.status(401).json(response);
        return;
    }
    if (!validateInternalToken(token)) {
        const response = {
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Invalid internal service token',
            },
        };
        res.status(403).json(response);
        return;
    }
    req.isInternal = true;
    next();
}
/**
 * User authentication middleware
 * Validates user JWT token
 */
function userAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        const response = {
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing authorization header',
            },
        };
        res.status(401).json(response);
        return;
    }
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
        const response = {
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid authorization header format',
            },
        };
        res.status(401).json(response);
        return;
    }
    // In production, validate JWT token here
    // For now, we'll use a simplified validation
    try {
        // Decode token (simplified - in production use proper JWT validation)
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
            // JWT format detected - decode payload
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
            req.userId = payload.userId || payload.sub;
            req.tenantId = payload.tenantId || 'default';
            req.roles = payload.roles || [];
        }
        else {
            // Simple API key format
            req.userId = token;
            req.tenantId = req.headers['x-tenant-id'] || 'default';
        }
        next();
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid token',
            },
        };
        res.status(401).json(response);
        return;
    }
}
/**
 * Combined auth middleware
 * Accepts either internal service token or user JWT
 */
function authenticate(req, res, next) {
    const internalToken = req.headers['x-internal-token'];
    if (internalToken) {
        return internalAuth(req, res, next);
    }
    return userAuth(req, res, next);
}
/**
 * Role-based authorization middleware
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.roles || req.roles.length === 0) {
            const response = {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'No roles assigned to user',
                },
            };
            res.status(403).json(response);
            return;
        }
        const hasRole = req.roles.some(role => allowedRoles.includes(role));
        if (!hasRole) {
            const response = {
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Required role: ${allowedRoles.join(' or ')}`,
                },
            };
            res.status(403).json(response);
            return;
        }
        next();
    };
}
/**
 * Tenant isolation middleware
 */
function tenantIsolation(req, res, next) {
    const tenantId = req.headers['x-tenant-id'] || req.tenantId;
    if (!tenantId) {
        const response = {
            success: false,
            error: {
                code: 'TENANT_REQUIRED',
                message: 'Tenant ID is required',
            },
        };
        res.status(400).json(response);
        return;
    }
    req.tenantId = tenantId;
    next();
}
/**
 * Optional auth - doesn't fail if no token provided
 */
function optionalAuth(req, res, next) {
    const internalToken = req.headers['x-internal-token'];
    const authHeader = req.headers.authorization;
    if (internalToken) {
        return internalAuth(req, res, next);
    }
    if (authHeader) {
        return userAuth(req, res, next);
    }
    // No auth provided, continue without user context
    next();
}
//# sourceMappingURL=auth.js.map