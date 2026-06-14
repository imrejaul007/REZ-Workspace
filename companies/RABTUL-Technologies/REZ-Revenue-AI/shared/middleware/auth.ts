/**
 * REZ Revenue AI - Auth Middleware
 * JWT validation and API key authentication
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface AuthUser {
  userId: string;
  email: string;
  role: string;
  merchantId?: string;
  permissions: string[];
}

export interface AuthConfig {
  authServiceUrl: string;
  internalToken: string;
  apiKeys: Map<string, { merchantId: string; permissions: string[] }>;
}

// ============================================================
// AUTH CONFIG
// ============================================================

const config: AuthConfig = {
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-token',
  apiKeys: new Map(),
};

// Add API keys from environment
if (process.env.API_KEYS_JSON) {
  try {
    const keys = JSON.parse(process.env.API_KEYS_JSON);
    Object.entries(keys).forEach(([key, value]) => {
      config.apiKeys.set(key, value as { merchantId: string; permissions: string[] });
    });
  } catch (e) {
    console.error('Failed to parse API_KEYS_JSON');
  }
}

// ============================================================
// MIDDLEWARE FUNCTIONS
// ============================================================

/**
 * Verify JWT token with RABTUL Auth Service
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const response = await axios.post(
      `${config.authServiceUrl}/api/auth/verify`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.internalToken,
        },
        timeout: 5000,
      }
    );

    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.warn('[Auth] Token verification failed');
    return null;
  }
}

/**
 * Verify internal service token
 */
export function verifyInternalToken(token: string): boolean {
  return token === config.internalToken;
}

/**
 * Verify API key
 */
export function verifyApiKey(apiKey: string): { merchantId: string; permissions: string[] } | null {
  return config.apiKeys.get(apiKey) || null;
}

// ============================================================
// EXPRESS MIDDLEWARE
// ============================================================

/**
 * Auth middleware - accepts JWT, API key, or internal token
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;
  const internalToken = req.headers['x-internal-token'] as string;

  // Check internal token first (service-to-service)
  if (internalToken && verifyInternalToken(internalToken)) {
    (req as any).auth = {
      type: 'internal',
      permissions: ['*'],
    };
    return next();
  }

  // Check API key
  if (apiKey) {
    const keyData = verifyApiKey(apiKey);
    if (keyData) {
      (req as any).auth = {
        type: 'apikey',
        merchantId: keyData.merchantId,
        permissions: keyData.permissions,
      };
      return next();
    }
  }

  // Check JWT
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    verifyToken(token).then(user => {
      if (user) {
        (req as any).auth = {
          type: 'jwt',
          user,
          merchantId: user.merchantId,
          permissions: user.permissions,
        };
        next();
      } else {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
        });
      }
    }).catch(() => {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Authentication failed' },
      });
    });
    return;
  }

  // No auth provided
  res.status(401).json({
    success: false,
    error: { code: 'NO_AUTH', message: 'Authorization required' },
  });
}

/**
 * Optional auth - doesn't fail if no auth provided
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as any).auth = null;
    return next();
  }

  const token = authHeader.substring(7);

  verifyToken(token).then(user => {
    if (user) {
      (req as any).auth = {
        type: 'jwt',
        user,
        merchantId: user.merchantId,
        permissions: user.permissions,
      };
    } else {
      (req as any).auth = null;
    }
    next();
  }).catch(() => {
    (req as any).auth = null;
    next();
  });
}

/**
 * Require specific permission
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth;

    if (!auth) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_AUTH', message: 'Authorization required' },
      });
    }

    if (auth.permissions?.includes('*')) {
      return next();
    }

    const hasPermission = permissions.some(p => auth.permissions?.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    next();
  };
}

/**
 * Require merchant ownership
 */
export function requireMerchant(req: Request, res: Response, next: NextFunction): void {
  const auth = (req as any).auth;
  const merchantId = req.params.merchantId || req.body.merchantId;

  if (!auth) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_AUTH', message: 'Authorization required' },
    });
  }

  // Internal calls can access any merchant
  if (auth.type === 'internal') {
    return next();
  }

  // Check ownership
  if (auth.merchantId && auth.merchantId !== merchantId && merchantId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied to this merchant' },
    });
  }

  next();
}

/**
 * Rate limiting per merchant
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth;
    const key = auth?.merchantId || req.ip || 'unknown';
    const now = Date.now();

    let limit = rateLimitMap.get(key);

    if (!limit || now > limit.resetAt) {
      limit = { count: 0, resetAt: now + options.windowMs };
      rateLimitMap.set(key, limit);
    }

    limit.count++;

    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - limit.count));
    res.setHeader('X-RateLimit-Reset', new Date(limit.resetAt).toISOString());

    if (limit.count > options.max) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests' },
      });
    }

    next();
  };
}

/**
 * Generate API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Add API key programmatically
 */
export function addApiKey(key: string, data: { merchantId: string; permissions: string[] }): void {
  config.apiKeys.set(key, data);
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get current user from request
 */
export function getCurrentUser(req: Request): AuthUser | null {
  return (req as any).auth?.user || null;
}

/**
 * Get current merchant ID from request
 */
export function getCurrentMerchantId(req: Request): string | null {
  return (req as any).auth?.merchantId || null;
}

/**
 * Check if request is internal
 */
export function isInternalRequest(req: Request): boolean {
  return (req as any).auth?.type === 'internal';
}

export default {
  authMiddleware,
  optionalAuthMiddleware,
  requirePermission,
  requireMerchant,
  rateLimitMiddleware,
  verifyToken,
  verifyInternalToken,
  verifyApiKey,
  generateApiKey,
  addApiKey,
  getCurrentUser,
  getCurrentMerchantId,
  isInternalRequest,
};
