/**
 * BNPL Service Auth Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      merchantId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET || process.env.INTERNAL_SERVICE_TOKEN || 'dev-secret';

  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { userId: string; role: string; merchantId?: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.merchantId = decoded.merchantId;
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }
}

export async function requireInternal(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers['x-internal-token'];
  const expected = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expected) {
    next(); // Skip in dev
    return;
  }

  if (header !== expected) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Internal access only' } });
    return;
  }

  next();
}