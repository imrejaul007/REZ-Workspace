import { Request, Response, NextFunction } from 'express';

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

export interface AuthRequest extends Request {
  userId?: string;
  isInternalCall?: boolean;
}

export const internalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (token === INTERNAL_TOKEN) {
    req.isInternalCall = true;
    return next();
  }

  const userId = req.headers['x-user-id'] as string;
  if (userId) {
    req.userId = userId;
  }

  next();
};

export const requireUserId = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId && !req.isInternalCall) {
    return res.status(401).json({ error: 'User ID required' });
  }
  next();
};
