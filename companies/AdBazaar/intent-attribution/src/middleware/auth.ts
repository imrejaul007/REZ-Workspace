import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../config/logger.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'your-internal-key-change-in-production';

export interface JWTPayload {
  userId: string;
  role: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  valid: boolean;
  user?: JWTPayload;
  error?: string;
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AuthResult {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return { valid: true, user: decoded };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { valid: false, error: 'Token expired' };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return { valid: false, error: 'Invalid token' };
    }
    return { valid: false, error: 'Token verification failed' };
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
}

/**
 * JWT Authentication middleware
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid JWT token.'
    });
    return;
  }

  const result = verifyToken(token);

  if (!result.valid || !result.user) {
    logger.warn('Authentication failed', {
      ip: req.ip,
      path: req.path,
      error: result.error
    });

    res.status(401).json({
      success: false,
      error: result.error || 'Invalid authentication token'
    });
    return;
  }

  // Attach user to request
  req.user = result.user;
  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req.headers.authorization);

  if (token) {
    const result = verifyToken(token);
    if (result.valid && result.user) {
      req.user = result.user;
    }
  }

  next();
}

/**
 * Internal service authentication middleware
 */
export function internalServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-internal-service-key'] as string;

  if (!serviceKey) {
    res.status(401).json({
      success: false,
      error: 'Internal service key required'
    });
    return;
  }

  if (serviceKey !== INTERNAL_SERVICE_KEY) {
    logger.warn('Invalid internal service key attempt', {
      ip: req.ip,
      path: req.path
    });

    res.status(403).json({
      success: false,
      error: 'Invalid internal service key'
    });
    return;
  }

  next();
}

/**
 * Combined authentication (JWT or internal service)
 */
export function combinedAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Try internal service key first
  const serviceKey = req.headers['x-internal-service-key'] as string;
  if (serviceKey && serviceKey === INTERNAL_SERVICE_KEY) {
    next();
    return;
  }

  // Fall back to JWT
  authMiddleware(req, res, next);
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });

      res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const hasPermission = req.user.permissions?.includes(permission);

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: req.user.userId,
        requiredPermission: permission,
        path: req.path
      });

      res.status(403).json({
        success: false,
        error: `Missing required permission: ${permission}`
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT token (for testing/internal use)
 */
export function generateToken(payload: JWTPayload, expiresIn = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export default {
  authMiddleware,
  optionalAuthMiddleware,
  internalServiceAuth,
  combinedAuthMiddleware,
  authorize,
  requirePermission,
  verifyToken,
  extractToken,
  generateToken
};