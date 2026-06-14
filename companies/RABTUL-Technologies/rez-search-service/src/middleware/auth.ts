import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing token' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, error: 'Auth not configured' });
    return;
  }
  try {
    const decoded = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'] }) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const decoded = jwt.verify(header.slice(7), secret, { algorithms: ['HS256'] }) as { userId: string };
        req.userId = decoded.userId;
      }
    } catch {
      // Ignore — anonymous access allowed
    }
  }
  next();
}
