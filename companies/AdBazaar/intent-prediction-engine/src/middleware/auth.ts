import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger.js';
import { JwtPayload } from '../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'your-internal-service-key';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      serviceKey?: string;
    }
  }
}

/**
 * JWT Authentication middleware
 * Validates JWT token from Authorization header
 */
export function authenticateJwt(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded;
      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed', { error: (jwtError as Error).message });

      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(401).json({
        success: false,
        error: 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Internal service authentication
 * Validates X-Internal-Service-Key header for service-to-service communication
 */
export function authenticateServiceKey(req: Request, res: Response, next: NextFunction): void {
  try {
    const serviceKey = req.headers['x-internal-service-key'] as string;

    if (!serviceKey) {
      res.status(401).json({
        success: false,
        error: 'X-Internal-Service-Key header required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (serviceKey !== INTERNAL_SERVICE_KEY) {
      logger.warn('Invalid service key attempted', { ip: req.ip });
      res.status(401).json({
        success: false,
        error: 'Invalid service key',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.serviceKey = serviceKey;
    next();
  } catch (error) {
    logger.error('Service key authentication error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Combined authentication
 * Accepts either JWT or internal service key
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-internal-service-key'] as string;

  if (serviceKey) {
    return authenticateServiceKey(req, res, next);
  }

  return authenticateJwt(req, res, next);
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: JwtPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString(),
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
  return authorize('admin')(req, res, next);
}

/**
 * Service-only middleware
 */
export function serviceOnly(req: Request, res: Response, next: NextFunction): void {
  return authorize('service')(req, res, next);
}