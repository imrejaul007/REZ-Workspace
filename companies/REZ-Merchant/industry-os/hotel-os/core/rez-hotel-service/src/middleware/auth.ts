/**
 * Authentication Middleware for Hotel Service
 *
 * Handles:
 * - JWT token validation
 * - Service-to-service authentication
 * - Role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import jwt from 'jsonwebtoken';

// Environment-based secrets
const JWT_SECRET = process.env.JWT_SECRET || '';

// Fail fast in production if JWT_SECRET is not set
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
if (IS_PRODUCTION && !JWT_SECRET) {
  logger.error('[FATAL] JWT_SECRET is required in production environment');
  process.exit(1);
}

// Token payload type
export interface JWTPayload {
  sub: string;           // User ID
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'staff' | 'service';
  hotelId?: string;      // For hotel-specific access
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

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  // For development without JWT_SECRET, accept tokens for testing
  if (!JWT_SECRET) {
    // CRITICAL FIX: Never skip auth in production - fail securely
    if (IS_PRODUCTION) {
      res.status(500).json({ success: false, message: 'Authentication service misconfigured' });
      return;
    }
    logger.warn('[Auth] JWT_SECRET not configured, skipping token validation in development');
    try {
      // Decode without verification for dev ONLY - NEVER in production
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

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('[Auth] Token verification failed:', err.message);
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    req.user = decoded as JWTPayload;
    next();
  });
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  if (!JWT_SECRET) {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      req.user = decoded || undefined;
    } catch {
      // Ignore decode errors
    }
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) {
      req.user = decoded as JWTPayload;
    }
  });

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
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
