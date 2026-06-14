import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'affiliate' | 'advertiser';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware
 * Validates internal service token or user token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'];

  // Internal service token (for service-to-service communication)
  if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    req.user = {
      userId: 'internal-service',
      email: 'service@adbazaar.com',
      role: 'admin',
    };
    next();
    return;
  }

  // Bearer token validation
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    // In production, validate JWT token here
    // For now, accept any non-empty token
    if (token) {
      // Mock user extraction - in production, decode JWT
      req.user = {
        userId: 'user-' + token.slice(0, 8),
        email: 'user@example.com',
        role: 'affiliate',
      };
      next();
      return;
    }
  }

  // API Key authentication
  const apiKey = req.headers['x-api-key'];
  if (apiKey === process.env.API_KEY) {
    req.user = {
      userId: 'api-user',
      email: 'api@adbazaar.com',
      role: 'admin',
    };
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Valid authentication token required',
  });
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export const adminOnly = requireRole('admin');

/**
 * Affiliate or Admin middleware
 */
export const affiliateOrAdmin = requireRole('affiliate', 'admin');