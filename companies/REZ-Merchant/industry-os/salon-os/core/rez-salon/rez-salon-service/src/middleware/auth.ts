/**
 * Authentication Middleware for Salon Service - RABTUL Integration
 *
 * Delegates all authentication to the RABTUL Auth Service:
 * - Token verification via RABTUL
 * - Internal service authentication via X-Internal-Token
 */

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// RABTUL Auth Service configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Fail fast in production if secrets are missing
if (IS_PRODUCTION && !JWT_SECRET) {
  logger.error('[FATAL] JWT_SECRET is required in production');
  process.exit(1);
}

export interface JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'staff' | 'service' | 'salon_owner';
  salonId?: string;
  merchantId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
  serviceAuth?: boolean;
}

/**
 * Verify token with RABTUL Auth Service
 */
async function verifyTokenWithRABTUL(token: string): Promise<JWTPayload | null> {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        timeout: 5000,
      }
    );

    if (response.data.success && response.data.user) {
      return response.data.user as JWTPayload;
    }
    return null;
  } catch (error) {
    console.error('[Auth] RABTUL verify failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Validate JWT token from Authorization header via RABTUL Auth Service
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  // Allow health check without auth
  if (req.path === '/health' || req.path === '/api/health') {
    next();
    return;
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  // Try RABTUL verification first
  const raborUser = await verifyTokenWithRABTUL(token);
  if (raborUser) {
    (req as AuthRequest).user = raborUser;
    next();
    return;
  }

  // Fallback to local JWT verification
  if (JWT_SECRET) {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({ success: false, error: 'Invalid or expired token' });
        return;
      }
      (req as AuthRequest).user = decoded as JWTPayload;
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

/**
 * Validate internal service token (server-to-server)
 */
export function authenticateInternalService(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({ success: false, error: 'Internal service authentication required' });
    return;
  }

  // Check against registered tokens
  const isValid = token === INTERNAL_SERVICE_TOKEN;
  if (!isValid) {
    res.status(401).json({ success: false, error: 'Invalid internal service token' });
    return;
  }

  (req as AuthRequest).serviceAuth = true;
  next();
}

/**
 * Optional authentication - continues even without token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  verifyTokenWithRABTUL(token).then((user) => {
    if (user) {
      (req as AuthRequest).user = user;
    }
    next();
  }).catch(() => {
    // Continue even if verification fails
    next();
  });
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user && !authReq.serviceAuth) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (authReq.user) {
      const userRole = authReq.user.role || 'user';
      if (!roles.includes(userRole) && userRole !== 'admin') {
        res.status(403).json({ success: false, error: 'Insufficient permissions' });
        return;
      }
    }

    next();
  };
}
