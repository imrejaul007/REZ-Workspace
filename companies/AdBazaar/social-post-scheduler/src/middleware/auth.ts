import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('AuthMiddleware');

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // In production, verify token with RABTUL auth service
    // For now, extract userId from token (simplified)
    if (!token) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Mock user extraction - in production, decode JWT
    req.userId = `user_${token.substring(0, 8)}`;
    req.userRole = 'user';

    logger.debug('User authenticated', { userId: req.userId });
    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      req.userId = `user_${token.substring(0, 8)}`;
      req.userRole = 'user';
    } else {
      req.userId = 'anonymous';
 req.userRole = 'anonymous';
    }

    next();
  } catch (error) {
    req.userId = 'anonymous';
    req.userRole = 'anonymous';
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};