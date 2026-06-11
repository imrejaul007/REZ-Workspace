/**
 * GLAMAI - Authentication Middleware
 * Salon AI Operating System
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, INTERNAL_SERVICE_TOKEN } from '../config';
import { AppError, ErrorCodes } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      isInternal?: boolean;
    }
  }
}

/**
 * Authentication middleware with internal service token support
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'];
    if (internalToken === INTERNAL_SERVICE_TOKEN) {
      req.isInternal = true;
      return next();
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Authorization token required') as AppError;
      error.statusCode = 401;
      error.code = ErrorCodes.UNAUTHORIZED;
      return next(error);
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      next();
    } catch (jwtError) {
      const error = new Error('Invalid or expired token') as AppError;
      error.statusCode = 401;
      error.code = ErrorCodes.INVALID_TOKEN;
      return next(error);
    }
  } catch (error) {
    const appError = new Error('Authentication error') as AppError;
    appError.statusCode = 500;
    appError.code = ErrorCodes.AUTH_ERROR;
    return next(appError);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
      req.userId = decoded.userId;
      req.userRole = decoded.role;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
};

/**
 * Admin-only middleware
 */
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.userRole || req.userRole !== 'admin') {
    const error = new Error('Admin access required') as AppError;
    error.statusCode = 403;
    error.code = ErrorCodes.UNAUTHORIZED;
    return next(error);
  }
  next();
};

/**
 * Generate JWT token for testing
 */
export const generateToken = (userId: string, role: string = 'user'): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
};

export default {
  authMiddleware,
  optionalAuth,
  adminOnly,
  generateToken,
};