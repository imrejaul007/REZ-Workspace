import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import { getJwtSecret, getInternalServiceKey } from '../utils/environment.js';
import type { JWTPayload } from '../types.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    // Check for internal service key first
    const internalKey = req.headers['x-internal-service-key'];
    if (internalKey === getInternalServiceKey()) {
      req.user = {
        userId: 'internal-service',
        role: 'internal',
      };
      return next();
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      } else {
        logger.error('Auth middleware error', { error });
        res.status(500).json({
          success: false,
          error: 'Authentication error',
        });
      }
    }
  } catch (error) {
    logger.error('Auth middleware unexpected error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal authentication error',
    });
  }
}

export function requireRole(...roles: JWTPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    req.user = decoded;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}