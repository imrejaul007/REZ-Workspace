/**
 * FLEETIQ - JWT Authentication Middleware
 * Production-ready JWT validation with role-based access
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export interface JwtPayload {
  userId: string;
  role: 'admin' | 'manager' | 'driver' | 'service';
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  userEmail?: string;
  isInternal?: boolean;
}

// ============================================
// AUTH MIDDLEWARE
// ============================================

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for internal service token first
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === config.security.internalServiceToken) {
      req.isInternal = true;
      logger.debug('Internal service request authenticated');
      return next();
    }

    // Check for Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;

      logger.debug('User authenticated', { userId: decoded.userId, role: decoded.role });
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      throw jwtError;
    }
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// ============================================
// OPTIONAL AUTH (doesn't fail if no token)
// ============================================

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.userEmail = decoded.email;
    } catch {
      // Token invalid but optional, continue
    }
  }

  next();
};

// ============================================
// ROLE-BASED ACCESS CONTROL
// ============================================

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.isInternal) {
      return next();
    }

    if (!req.userRole) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ROLE_REQUIRED'
      });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
      return;
    }

    next();
  };
};

// ============================================
// TOKEN GENERATION (for testing/admin)
// ============================================

export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

export const generateRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

// ============================================
// TOKEN VERIFICATION (utility)
// ============================================

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JwtPayload;
  } catch {
    return null;
  }
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  generateToken,
  generateRefreshToken,
  verifyToken
};
