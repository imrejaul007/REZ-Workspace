import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    role: string;
    iat: number;
    exp: number;
  };
}

/**
 * Auth middleware for protected routes
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Allow unauthenticated access for some routes
    // In production, this would be more restrictive
    (req as any).user = null;
    next();
    return;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    // For development, allow requests without valid token
    if (config.NODE_ENV === 'development') {
      (req as any).user = null;
      next();
      return;
    }

    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    (req as any).user = decoded;
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }

  next();
}

/**
 * Internal service auth middleware
 */
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'];

  if (!internalToken || internalToken !== config.INTERNAL_SERVICE_TOKEN) {
    res.status(403).json({ error: 'Invalid internal token' });
    return;
  }

  next();
}
