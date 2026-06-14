/**
 * Auth Middleware
 */
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for health check and some public routes
  if (req.path === '/health' || req.path.startsWith('/api/trials')) {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // In production, verify JWT token with auth service
  // For now, accept any token for development
  if (config.nodeEnv === 'development') {
    (req as any).userId = token;
    return next();
  }

  // Production JWT verification would go here
  next();
}
