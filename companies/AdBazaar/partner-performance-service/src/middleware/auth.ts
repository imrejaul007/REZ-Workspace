import { Request, Response, NextFunction } from 'express';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'partner' | 'analyst';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'];

  if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    req.user = { userId: 'internal-service', email: 'service@adbazaar.com', role: 'admin' };
    next();
    return;
  }

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token) {
      req.user = { userId: 'user-' + token.slice(0, 8), email: 'user@example.com', role: 'partner' };
      next();
      return;
    }
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey === process.env.API_KEY) {
    req.user = { userId: 'api-user', email: 'api@adbazaar.com', role: 'admin' };
    next();
    return;
  }

  res.status(401).json({ success: false, error: 'Unauthorized' });
}

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    next();
  };
}

export const adminOnly = requireRole('admin');
export const analystOrAdmin = requireRole('analyst', 'admin');