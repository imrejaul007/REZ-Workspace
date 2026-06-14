/**
 * Authentication Middleware
 * Validates JWT tokens for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    roles: string[];
  };
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  roles: string[];
  iat: number;
  exp: number;
}

/**
 * Verify JWT token from Authorization header
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization format. Use: Bearer <token>',
      });
      return;
    }

    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        roles: decoded.roles ?? [],
      };
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired',
        });
        return;
      }
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  try {
    const token = parts[1];
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      roles: decoded.roles ?? [],
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

/**
 * Check if user has required role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const hasRole = roles.some((role) => req.user?.roles.includes(role));
    
    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Validate tenant access - user can only access their own tenant data
 */
export function validateTenantAccess(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const requestedTenantId = req.params.tenantId;

  if (!requestedTenantId) {
    next();
    return;
  }

  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.roles.includes('admin')) {
    next();
    return;
  }

  if (req.user.tenantId !== requestedTenantId) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied to this tenant',
    });
    return;
  }

  next();
}
