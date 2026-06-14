/**
 * Authentication Middleware for Restaurant Service
 *
 * Handles:
 * - JWT token validation
 * - Service-to-service authentication
 * - Role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export interface JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'staff' | 'service' | 'restaurant_owner';
  restaurantId?: string;
  branchId?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      serviceAuth?: boolean;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (!JWT_SECRET) {
    logger.error('[Auth] CRITICAL: JWT_SECRET not configured');
    res.status(500).json({ success: false, message: 'Server configuration error' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    req.user = decoded as JWTPayload;
    next();
  });
}

export function authenticateService(req: Request, res: Response, next: NextFunction): void {
  const serviceKey = req.headers['x-service-key'] as string;
  const authHeader = req.headers.authorization;

  if (serviceKey && INTERNAL_SERVICE_TOKEN && serviceKey === INTERNAL_SERVICE_TOKEN) {
    req.serviceAuth = true;
    next();
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    if (!JWT_SECRET) {
      try {
        const decoded = jwt.decode(token) as JWTPayload;
        if (decoded && decoded.role === 'service') {
          req.user = decoded;
          req.serviceAuth = true;
          next();
          return;
        }
      } catch {
        // Fall through
      }
    } else {
      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err && (decoded as JWTPayload).role === 'service') {
          req.user = decoded as JWTPayload;
          req.serviceAuth = true;
          next();
          return;
        }
      });
    }
  }

  res.status(401).json({ success: false, message: 'Service authentication required' });
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole) && userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function requireRestaurantAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role === 'admin') {
    next();
    return;
  }

  const requestedRestaurantId = req.params.restaurantId || req.body.restaurantId || req.query.restaurantId;

  if (requestedRestaurantId && req.user.restaurantId && req.user.restaurantId !== requestedRestaurantId) {
    res.status(403).json({ success: false, message: 'Access denied for this restaurant' });
    return;
  }

  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  if (!JWT_SECRET) {
    try {
      const decoded = jwt.decode(token) as JWTPayload;
      req.user = decoded || undefined;
    } catch {
      // Ignore
    }
    next();
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (!err) {
      req.user = decoded as JWTPayload;
    }
  });

  next();
}

export function generateServiceToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}
