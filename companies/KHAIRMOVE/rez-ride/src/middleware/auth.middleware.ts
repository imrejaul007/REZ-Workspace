import { logger } from '../../shared/logger';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  phone: string;
  role: 'user' | 'driver' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// SECURITY: Fail fast if JWT_SECRET is not configured
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('[FATAL] JWT_SECRET environment variable is required in production');
}

if (!JWT_SECRET) {
  logger.warn('[WARNING] JWT_SECRET not set - using development mode');
}

const SECRET = JWT_SECRET || 'dev-only-secret-do-not-use-in-production';

/**
 * Verify JWT token and attach user to request
 */
function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, SECRET) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Authentication middleware - requires valid JWT
 */
export function requireAuth(requiredRole?: 'user' | 'driver' | 'admin') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const token = authHeader.substring(7);
    const user = verifyToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Role-based access control
    if (requiredRole) {
      const roleHierarchy = { admin: 3, driver: 2, user: 1 };
      const requiredLevel = roleHierarchy[requiredRole];
      const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'FORBIDDEN'
        });
        return;
      }
    }

    req.user = user;
    next();
  };
}

/**
 * Optional authentication - attaches user if token present
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}

/**
 * Internal service authentication - for service-to-service calls
 */
export function requireInternalAuth(internalToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['x-internal-token'] as string;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Internal token required',
        code: 'INTERNAL_TOKEN_REQUIRED'
      });
      return;
    }

    if (token !== internalToken) {
      res.status(403).json({
        success: false,
        error: 'Invalid internal token',
        code: 'INVALID_INTERNAL_TOKEN'
      });
      return;
    }

    // Mark request as from internal service
    req.user = { id: 'internal', phone: '', role: 'admin' };
    next();
  };
}

/**
 * Generate JWT token (for testing/admin use)
 */
export function generateToken(user: AuthUser, expiresIn = '7d'): string {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      role: user.role
    },
    SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}
