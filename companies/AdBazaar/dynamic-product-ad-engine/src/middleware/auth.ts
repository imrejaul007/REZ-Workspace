/**
 * Authentication Middleware
 * JWT validation and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import type { JWTPayload } from '../types';
import logger from '../utils/logger';

/**
 * JWT authentication middleware
 * Validates JWT token from Authorization header
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    req.advertiserId = decoded.advertiserId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    logger.error('Auth error', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Does not fail if no token is provided
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
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

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    req.user = decoded;
    req.advertiserId = decoded.advertiserId;
  } catch {
    // Token invalid but optional - continue without user
 }

  next();
}

/**
 * Role-based access control middleware
 * Requires specific roles
 */
export function requireRole(...roles: ('advertiser' | 'admin' | 'viewer')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 * Requires specific permissions
 */
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const hasPermission = permissions.every(perm => req.user!.permissions.includes(perm));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required permissions: ${permissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
}

/**
 * Advertiser access control
 * Ensures advertiser can only access their own resources
 */
export function advertiserAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Admin can access all resources
  if (req.user.role === 'admin') {
    next();
    return;
  }

  // For advertisers, we check if the resource belongs to them
  // This is typically handled at the service layer
  // but we can add a header check here
  const requestedAdvertiserId = req.headers['x-advertiser-id'] as string;

  if (requestedAdvertiserId && requestedAdvertiserId !== req.user.advertiserId) {
    res.status(403).json({
      success: false,
      error: 'Access denied to this advertiser resource',
    });
    return;
  }

  next();
}

/**
 * Generate JWT token (for testing purposes)
 */
export function generateToken(payload: Omit<JWTPayload, 'exp' | 'iat'>): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
}

export default {
  authenticate,
  optionalAuth,
  requireRole,
  requirePermission,
  adminOnly,
  advertiserAccess,
  generateToken,
};