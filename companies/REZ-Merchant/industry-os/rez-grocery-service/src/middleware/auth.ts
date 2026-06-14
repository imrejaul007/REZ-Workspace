/**
 * Authentication Middleware for Grocery Service
 *
 * Handles:
 * - JWT token validation
 * - Internal service authentication
 * - Role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

// Environment configuration
const JWT_SECRET = process.env.JWT_SECRET;
const INTERNAL_SERVICE_TOKENS_JSON = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

// Fail fast in production if secrets are missing
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
if (IS_PRODUCTION && !JWT_SECRET) {
  logger.error('[FATAL] JWT_SECRET is required in production');
  process.exit(1);
}

// Parse internal tokens
let internalTokens: Record<string, string> = {};
try {
  internalTokens = JSON.parse(INTERNAL_SERVICE_TOKENS_JSON);
  if (INTERNAL_SERVICE_TOKEN) {
    // Legacy fallback
    internalTokens['default'] = INTERNAL_SERVICE_TOKEN;
  }
} catch {
  if (INTERNAL_SERVICE_TOKEN) {
    internalTokens['default'] = INTERNAL_SERVICE_TOKEN;
  }
}

// Token payload type
export interface JWTPayload {
  sub: string;           // User ID
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'manager' | 'cashier' | 'service';
  merchantId?: string;
  storeId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      serviceAuth?: boolean;
    }
  }
}

/**
 * Validate JWT token from Authorization header
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Allow health check without auth
  if (req.path === '/health' || req.path === '/ready') {
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // In production, JWT_SECRET must be set
  if (IS_PRODUCTION && !JWT_SECRET) {
    res.status(500).json({ success: false, message: 'Authentication service misconfigured' });
    return;
  }

  // Development mode: allow with warning
  if (!JWT_SECRET) {
    logger.warn('[Auth] JWT_SECRET not configured, using decode-only mode (development only)');
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded) {
        req.user = decoded;
        next();
        return;
      }
    } catch {
      // Fall through to error
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  jwt.verify(token, JWT_SECRET!, (err, decoded) => {
    if (err) {
      logger.error('[Auth] Token verification failed:', err.message);
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    req.user = decoded as JWTPayload;
    logger.debug(`[Auth] User authenticated: ${decoded.sub}`);
    next();
  });
}

/**
 * Validate internal service token
 */
export function authenticateInternalService(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({ success: false, message: 'Internal service authentication required' });
    return;
  }

  // Check against all registered internal tokens
  const tokenValues = Object.values(internalTokens);
  const isValid = tokenValues.includes(token);

  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid internal service token' });
    return;
  }

  req.serviceAuth = true;
  logger.debug('[Auth] Internal service authenticated');
  next();
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole) && userRole !== 'admin') {
      logger.warn(`[Auth] Access denied for role ${userRole}. Required: ${roles.join(', ')}`);
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Require specific permissions
 */
export function requirePermissions(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = permissions.every(p => userPermissions.includes(p));

    if (!hasAllPermissions) {
      logger.warn(`[Auth] Access denied. Missing permissions: ${permissions.join(', ')}`);
      res.status(403).json({ success: false, message: 'Missing required permissions' });
      return;
    }

    next();
  };
}

/**
 * Validate merchant access
 */
export function requireMerchantAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // Admins and services can access any merchant
  if (req.user.role === 'admin' || req.user.role === 'service') {
    next();
    return;
  }

  // Get merchantId from request
  const requestMerchantId = req.body?.merchantId || req.query?.merchantId;

  if (!requestMerchantId) {
    res.status(400).json({ success: false, message: 'Merchant ID is required' });
    return;
  }

  // Check if user belongs to the requested merchant
  if (req.user.merchantId !== requestMerchantId) {
    logger.warn(`[Auth] Merchant access denied. User: ${req.user.sub}, Requested: ${requestMerchantId}`);
    res.status(403).json({ success: false, message: 'Access denied for this merchant' });
    return;
  }

  next();
}

/**
 * Optional authentication - continues even without token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  if (!JWT_SECRET) {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      if (decoded) {
        req.user = decoded;
      }
    } catch {
      // Ignore invalid tokens for optional auth
    }
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET!, (err, decoded) => {
    if (!err && decoded) {
      req.user = decoded as JWTPayload;
    }
    next();
  });
}

/**
 * Rate limit by user/merchant
 */
export function userRateLimiter() {
  const rateLimit = require('express-rate-limit');

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each user to 1000 requests per window
    keyGenerator: (req: Request) => {
      // Use user ID if available, otherwise fall back to IP
      return req.user?.sub || req.ip || 'unknown';
    },
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false
  });
}