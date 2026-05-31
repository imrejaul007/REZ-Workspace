import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    tenantId: z.string().min(1)
});
export const TokenRefreshSchema = z.object({
    refreshToken: z.string()
});
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    tenantId: z.string().min(1),
    role: z.enum(['admin', 'agent', 'customer']).default('customer')
});
// In-memory store (replace with MongoDB in production)
const users = new Map();
const refreshTokens = new Map();
// Default admin for demo
const DEFAULT_ADMIN = {
    id: 'admin-default',
    email: 'admin@hojai.ai',
    passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Admin',
    tenantId: 'default',
    role: 'admin',
    permissions: ['*'],
    createdAt: new Date()
};
users.set(DEFAULT_ADMIN.email, DEFAULT_ADMIN);
// ============================================================================
// JWT UTILITIES
// ============================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'hojai-unified-platform-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hojai-unified-platform-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
function generateAccessToken(user) {
    const payload = {
        sub: user.id,
        tenantId: user.tenantId,
        role: user.role,
        permissions: user.permissions
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}
function generateRefreshToken(userId) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    refreshTokens.set(token, { userId, expiresAt });
    return token;
}
function verifyAccessToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
// ============================================================================
// PERMISSION CHECKER
// ============================================================================
export function hasPermission(tenant, permission) {
    if (tenant.role === 'admin')
        return true;
    if (tenant.permissions.includes('*'))
        return true;
    return tenant.permissions.includes(permission);
}
export function requirePermission(permission) {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.tenant) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }
        if (!hasPermission(authReq.tenant, permission)) {
            res.status(403).json({ success: false, error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
/**
 * Optional authentication - populates tenant context if token present
 */
export function optionalAuth(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${uuidv4()}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        // Set default guest context
        req.tenant = {
            tenantId: req.headers['x-tenant-id'] || 'default',
            role: 'customer',
            permissions: []
        };
        return next();
    }
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
        return;
    }
    req.tenant = {
        tenantId: payload.tenantId,
        userId: payload.sub,
        role: payload.role,
        permissions: payload.permissions || []
    };
    next();
}
/**
 * Required authentication - rejects if no valid token
 */
export function requireAuth(req, res, next) {
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${uuidv4()}`;
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
        return;
    }
    req.tenant = {
        tenantId: payload.tenantId,
        userId: payload.sub,
        role: payload.role,
        permissions: payload.permissions || []
    };
    next();
}
/**
 * Require specific roles
 */
export function requireRole(...roles) {
    return (req, res, next) => {
        const authReq = req;
        if (!authReq.tenant) {
            res.status(401).json({ success: false, error: 'Authentication required' });
            return;
        }
        if (!roles.includes(authReq.tenant.role)) {
            res.status(403).json({
                success: false,
                error: `Requires one of roles: ${roles.join(', ')}`
            });
            return;
        }
        next();
    };
}
export async function login(email, password, tenantId) {
    const bcrypt = await import('bcryptjs');
    const user = users.get(email);
    if (!user || user.tenantId !== tenantId) {
        return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return null;
    }
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user.id),
        expiresIn: 3600, // 1 hour in seconds
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            tenantId: user.tenantId,
            role: user.role
        }
    };
}
export async function register(data) {
    const bcrypt = await import('bcryptjs');
    const existingUser = users.get(data.email);
    if (existingUser) {
        throw new Error('User already exists');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = data.role || 'customer';
    const permissions = getDefaultPermissions(role);
    const user = {
        id: uuidv4(),
        email: data.email,
        passwordHash,
        name: data.name,
        tenantId: data.tenantId,
        role,
        permissions,
        createdAt: new Date()
    };
    users.set(user.email, user);
    return {
        userId: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role
    };
}
function getDefaultPermissions(role) {
    switch (role) {
        case 'admin':
            return ['*'];
        case 'agent':
            return ['conversations.read', 'conversations.write', 'messages.read', 'messages.write', 'customers.read'];
        case 'customer':
            return ['profile.read', 'profile.write', 'orders.read'];
        default:
            return [];
    }
}
export async function refreshAccessToken(refreshToken) {
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
        refreshTokens.delete(refreshToken);
        return null;
    }
    // Find user
    let foundUser;
    for (const user of users.values()) {
        if (user.id === tokenData.userId) {
            foundUser = user;
            break;
        }
    }
    if (!foundUser) {
        return null;
    }
    return {
        accessToken: generateAccessToken(foundUser),
        expiresIn: 3600
    };
}
// ============================================================================
// API RESPONSE HELPERS
// ============================================================================
export function successResponse(res, data, statusCode = 200) {
    res.status(statusCode).json({
        success: true,
        data,
        timestamp: new Date().toISOString()
    });
}
export function errorResponse(res, error, statusCode = 500) {
    const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
    res.status(statusCode).json({
        success: false,
        error: message,
        timestamp: new Date().toISOString()
    });
}
//# sourceMappingURL=auth.js.map