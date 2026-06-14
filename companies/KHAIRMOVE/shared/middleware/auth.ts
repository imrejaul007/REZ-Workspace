import { logger } from '../logger';
// KHAIRMOVE JWT Authentication Middleware
// JWT verification using RABTUL Auth Service

import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export interface JWTPayload {
  userId: string;
  phone?: string;
  email?: string;
  role?: 'user' | 'driver' | 'admin' | 'fleet_owner';
  companyId?: string;
  permissions?: string[];
  exp?: number;
  iat?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  userId?: string;
  isInternal?: boolean;
}

export interface AuthConfig {
  authServiceUrl: string;
  internalToken: string;
  apiKey: string;
  bypassInternal?: boolean;
}

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

export function validateAuthEnv(): void {
  const required = ['INTERNAL_SERVICE_TOKEN', 'REZ_INTELLIGENCE_API_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Warn if using localhost for auth service in production
  if (process.env.NODE_ENV === 'production' &&
      process.env.AUTH_SERVICE_URL?.includes('localhost')) {
    logger.warn('AUTH_SERVICE_URL points to localhost in production');
  }
}

// Initialize config with validation
function initAuthConfig(): AuthConfig {
  // In production, fail fast if secrets are not set
  if (process.env.NODE_ENV === 'production') {
    validateAuthEnv();
  }

  return {
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    apiKey: process.env.REZ_INTELLIGENCE_API_KEY || '',
  };
}

const DEFAULT_CONFIG = initAuthConfig();

// ============================================
// TIMING-SAFE COMPARISON
// ============================================

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to prevent timing attacks based on length
    const dummy = Buffer.alloc(a.length);
    crypto.timingSafeEqual(dummy, Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ============================================
// JWT VERIFICATION
// ============================================

export async function verifyJWT(
  token: string,
  config: AuthConfig = DEFAULT_CONFIG
): Promise<JWTPayload> {
  const response = await fetch(`${config.authServiceUrl}/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': config.internalToken,
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Verification failed' })) as { message?: string };
    throw new AuthError(401, errorData.message || 'Invalid token');
  }

  const data = await response.json();
  return data as JWTPayload;
}

export async function verifyInternal(
  config: AuthConfig = DEFAULT_CONFIG
): Promise<boolean> {
  try {
    const response = await fetch(`${config.authServiceUrl}/api/auth/internal-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': config.internalToken,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================
// AUTH ERROR
// ============================================

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ============================================
// EXPRESS MIDDLEWARE
// ============================================

/**
 * Main authentication middleware
 * Verifies JWT from Authorization header or X-Internal-Token for service-to-service calls
 */
export function authenticate(config: Partial<AuthConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check for internal service token (timing-safe comparison)
      const internalToken = req.headers['x-internal-token'] as string;
      if (internalToken && fullConfig.internalToken &&
          timingSafeEqual(internalToken, fullConfig.internalToken)) {
        req.isInternal = true;
        req.user = {
          userId: 'internal-service',
          role: 'admin',
          permissions: ['*'],
        };
        return next();
      }

      // Check for API key (timing-safe comparison)
      const apiKey = req.headers['x-api-key'] as string;
      if (apiKey && fullConfig.apiKey &&
          timingSafeEqual(apiKey, fullConfig.apiKey)) {
        req.isInternal = true;
        req.user = {
          userId: 'api-key',
          role: 'admin',
          permissions: ['*'],
        };
        return next();
      }

      // Verify JWT from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AuthError(401, 'No authorization token provided', 'NO_TOKEN');
      }

      const [type, token] = authHeader.split(' ');

      if (type !== 'Bearer' || !token) {
        throw new AuthError(401, 'Invalid authorization format. Use: Bearer <token>', 'INVALID_FORMAT');
      }

      // Verify the token
      const payload = await verifyJWT(token, fullConfig);

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new AuthError(401, 'Token has expired', 'TOKEN_EXPIRED');
      }

      req.user = payload;
      req.userId = payload.userId;

      next();
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }

      logger.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Authentication failed',
        },
      });
    }
  };
}

/**
 * Optional authentication - sets user if token present, but doesn't require it
 */
export function optionalAuth(config: Partial<AuthConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const internalToken = req.headers['x-internal-token'] as string;

      if (internalToken && fullConfig.internalToken &&
          timingSafeEqual(internalToken, fullConfig.internalToken)) {
        req.isInternal = true;
        req.user = {
          userId: 'internal-service',
          role: 'admin',
          permissions: ['*'],
        };
        return next();
      }

      if (!authHeader) {
        return next();
      }

      const [type, token] = authHeader.split(' ');

      if (type === 'Bearer' && token) {
        try {
          const payload = await verifyJWT(token, fullConfig);
          if (!payload.exp || payload.exp * 1000 > Date.now()) {
            req.user = payload;
            req.userId = payload.userId;
          }
        } catch {
          // Ignore invalid tokens for optional auth
        }
      }

      next();
    } catch (error) {
      // Continue even on error for optional auth
      next();
    }
  };
}

/**
 * Require specific roles
 */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required',
        },
      });
    }

    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Requires one of: ${roles.join(', ')}`,
        },
      });
    }

    next();
  };
}

/**
 * Require specific permissions
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required',
        },
      });
    }

    const userPermissions = req.user.permissions || [];

    // Admin has all permissions
    if (userPermissions.includes('*')) {
      return next();
    }

    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Requires permissions: ${permissions.join(', ')}`,
        },
      });
    }

    next();
  };
}

/**
 * Internal service only - rejects user tokens
 */
export function internalOnly(config: Partial<AuthConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const internalToken = req.headers['x-internal-token'] as string;
      const apiKey = req.headers['x-api-key'] as string;

      const isInternal = (
        (internalToken && fullConfig.internalToken && timingSafeEqual(internalToken, fullConfig.internalToken)) ||
        (apiKey && fullConfig.apiKey && timingSafeEqual(apiKey, fullConfig.apiKey))
      );

      if (isInternal) {
        req.isInternal = true;
        req.user = {
          userId: 'internal-service',
          role: 'admin',
          permissions: ['*'],
        };
        return next();
      }

      throw new AuthError(403, 'Internal services only', 'INTERNAL_ONLY');
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        });
      }
      next(error);
    }
  };
}

/**
 * Rate limiting per user (combine with express-rate-limit)
 */
export function getUserIdentifier(req: AuthRequest): string {
  if (req.user?.userId) return req.user.userId;
  if (req.isInternal) return 'internal';
  return req.ip || 'unknown';
}

// ============================================
// TOKEN GENERATION (for testing/development)
// ============================================

export async function generateTestToken(
  payload: Partial<JWTPayload>,
  config: AuthConfig = DEFAULT_CONFIG
): Promise<string> {
  const response = await fetch(`${config.authServiceUrl}/api/auth/test-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': config.internalToken,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to generate test token');
  }

  const data = await response.json() as { token?: string };
  return data.token || '';
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getUserId(req: AuthRequest): string | undefined {
  return req.userId || req.user?.userId;
}

export function isAdmin(req: AuthRequest): boolean {
  return req.user?.role === 'admin' || req.isInternal === true;
}

export function isDriver(req: AuthRequest): boolean {
  return req.user?.role === 'driver';
}

export function isUser(req: AuthRequest): boolean {
  return req.user?.role === 'user';
}
