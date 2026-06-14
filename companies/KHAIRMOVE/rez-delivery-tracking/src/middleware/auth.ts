import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  role: 'driver' | 'customer' | 'admin';
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 * Can be used with optional auth to allow both authenticated and anonymous requests
 */
export function authenticate() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
      return;
    }
    
    const token = parts[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token has expired' });
        return;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      res.status(401).json({ error: 'Authentication failed' });
    }
  };
}

/**
 * Role-based authorization middleware
 */
export function authorize(...allowedRoles: Array<'driver' | 'customer' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

/**
 * Verify JWT without middleware pattern (for use in route handlers)
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
