import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JWTPayload } from '../types';
import logger from 'utils/logger.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      requestId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token is required',
        },
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = decoded;

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

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

/**
 * Optional Authentication Middleware
 * Sets user if token is valid, but doesn't require it
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        req.user = decoded;
      } catch {
        // Token invalid, but that's okay for optional auth
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Role-based Authorization Middleware
 */
export const roleMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
      return;
    }

    next();
  };
};

/**
 * Merchant Authorization Middleware
 * Ensures the authenticated user can access the merchant's data
 */
export const merchantAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const merchantId = req.params.merchantId || req.body.merchantId;

  if (!merchantId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MERCHANT_ID_REQUIRED',
        message: 'Merchant ID is required',
      },
    });
    return;
  }

  // Admin can access any merchant
  if (req.user?.role === 'admin') {
    next();
    return;
  }

  // Merchant can only access their own data
  if (req.user?.merchantId && req.user.merchantId !== merchantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this merchant\'s data',
      },
    });
    return;
  }

  next();
};

/**
 * Generate JWT Token
 */
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verify JWT Token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
};