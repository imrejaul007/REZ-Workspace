import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../services/logger.service';
import { JWTPayload } from '../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      advertiserId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates JWT token and extracts user information
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authorization header is required',
        },
      });
      return;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
        },
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Attach user to request
    req.user = decoded;
    req.advertiserId = decoded.advertiserId;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      return;
    }

    logger.error('Authentication error', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Optional Authentication Middleware
 * Extracts user info if token is present, but doesn't require it
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const [type, token] = authHeader.split(' ');

    if (type === 'Bearer' && token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        req.user = decoded;
        req.advertiserId = decoded.advertiserId;
      } catch {
        // Ignore invalid token for optional auth
      }
    }

    next();
  } catch {
    next();
  }
}

/**
 * Role Authorization Middleware
 * Checks if user has required role
 */
export function authorize(...roles: ('admin' | 'advertiser' | 'viewer')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `User role '${req.user.role}' is not authorized for this action`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Permission Check Middleware
 * Checks if user has required permissions
 */
export function requirePermissions(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'User not authenticated',
        },
      });
      return;
    }

    const hasAllPermissions = permissions.every((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_PERMISSIONS',
          message: 'User does not have required permissions',
        },
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT token (utility function)
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/**
 * Verify and decode JWT token (utility function)
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}

export default {
  authenticate,
  optionalAuth,
  authorize,
  requirePermissions,
  generateToken,
  verifyToken,
};