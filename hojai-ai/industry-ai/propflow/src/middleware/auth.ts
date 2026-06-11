/**
 * PROPFLOW - Real Estate AI Operating System
 * Authentication & Authorization Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';
import { logger } from '../config/logger';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent' | 'manager' | 'viewer';
  assignedRegion?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  isInternal?: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Main authentication middleware
 * Validates JWT token or internal service token
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === config.internalServiceToken) {
      req.isInternal = true;
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
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token not provided',
        code: 'TOKEN_NOT_FOUND'
      });
      return;
    }

    // Verify JWT token
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }
      throw err;
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      assignedRegion: decoded.assignedRegion
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Optional authentication - allows unauthenticated requests
 * but attaches user if token is present
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as jwt.JwtPayload;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        assignedRegion: decoded.assignedRegion
      };
    } catch {
      // Token is invalid but optional, continue without user
    }

    next();
  } catch (error) {
    // Continue without user on error
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
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

/**
 * Admin-only middleware
 */
export const adminOnly = authorize('admin');

/**
 * Agent and above middleware
 */
export const agentAndAbove = authorize('admin', 'agent', 'manager');

/**
 * Manager and above middleware
 */
export const managerAndAbove = authorize('admin', 'manager');

/**
 * Generate JWT token
 */
export const generateToken = (user: {
  id: string;
  email: string;
  name: string;
  role: string;
  assignedRegion?: string;
}): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      assignedRegion: user.assignedRegion
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn }
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; type: string };
    if (decoded.type !== 'refresh') {
      return null;
    }
    return { userId: decoded.userId };
  } catch {
    return null;
  }
};

export default {
  authenticate,
  optionalAuth,
  authorize,
  adminOnly,
  agentAndAbove,
  managerAndAbove,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
};