/**
 * Authentication Middleware for Fitness Service - RABTUL Integration
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
  role?: 'user' | 'admin' | 'staff' | 'service' | 'trainer' | 'gym_owner';
  merchantId?: string;
  gymId?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      serviceAuth?: boolean;
    }
  }
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
 * Validate JWT token from Authorization header
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  // Allow health check without auth
  if (req.path === '/health') {
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
    req.user = raborUser;
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
      req.user = decoded as JWTPayload;
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

  const isValid = token === INTERNAL_SERVICE_TOKEN;
  if (!isValid) {
    res.status(401).json({ success: false, error: 'Invalid internal service token' });
    return;
  }

  req.serviceAuth = true;
  next();
}

/**
 * Require specific roles
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole) && userRole !== 'admin') {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
