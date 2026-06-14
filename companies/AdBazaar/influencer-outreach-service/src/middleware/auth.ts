import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
  roles?: string[];
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const tokenData = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(tokenData);

    req.userId = parsed.userId;
    req.companyId = parsed.companyId;
    req.roles = parsed.roles || [];

    next();
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.roles) {
      return res.status(403).json({ error: 'No roles found' });
    }

    const hasRole = roles.some(role => req.roles?.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};