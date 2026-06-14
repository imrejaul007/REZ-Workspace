import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../types/index.js';

interface JWTPayload {
  userId: string;
  advertiserId?: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication Middleware
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header required'
      });
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      req.user = {
        userId: decoded.userId,
        advertiserId: decoded.advertiserId,
        role: decoded.role
      };

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed', { error: jwtError });

      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired'
        });
        return;
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Optional auth middleware - sets user if token present, continues otherwise
 */
export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  authMiddleware(req, res, next);
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
}

/**
 * Advertiser ownership middleware - ensures user can only access their own campaigns
 */
export function advertiserOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  // Admins can access any campaign
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // Check if user has an advertiserId
  if (!req.user.advertiserId) {
    res.status(403).json({
      success: false,
      error: 'Advertiser ID required for this operation'
    });
    return;
  }

  // In the route handler, we'll verify the campaign belongs to the user
  next();
}

export default {
  authMiddleware,
  optionalAuthMiddleware,
  authorize,
  advertiserOwnership
};