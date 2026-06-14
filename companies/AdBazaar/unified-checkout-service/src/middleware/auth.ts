import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const RABTUL = {
  AUTH_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || ''
};

export interface AuthUser {
  userId: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-api-key'] as string;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  try {
    const response = await fetch(`${RABTUL.AUTH_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Token': RABTUL.INTERNAL_TOKEN },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const data = await response.json();
    req.user = data.user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication service unavailable' });
  }
}