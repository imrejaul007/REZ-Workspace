import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;
  if (!token || !timingSafeEqual(token, process.env.INTERNAL_SERVICE_TOKEN || '')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } }); return;
  }
  next();
}
