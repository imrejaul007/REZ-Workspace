import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

export async function requireMerchantAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'AUTH_001', message: 'Missing authentication token' } });
    return;
  }

  const token = header.slice(7);
  let decoded: { merchantId?: string; role?: string; companyId?: string };

  try {
    const env = validateEnv();
    decoded = jwt.verify(token, env.JWT_MERCHANT_SECRET, { algorithms: ['HS256'] }) as typeof decoded;
  } catch (err) {
    logger.warn('[MerchantAuth] Invalid token:', (err as Error).message);
    res.status(401).json({ success: false, error: { code: 'AUTH_002', message: 'Invalid or expired token' } });
    return;
  }

  if (!decoded.merchantId) {
    res.status(403).json({ success: false, error: { code: 'AUTH_004', message: 'Merchant token required' } });
    return;
  }

  req.merchantId = decoded.merchantId;
  req.companyId = decoded.companyId || 'rez';

  next();
}

export async function requireCreatorAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'AUTH_001', message: 'Missing authentication token' } });
    return;
  }

  const token = header.slice(7);
  let decoded: { creatorId?: string; role?: string; companyId?: string };

  try {
    const env = validateEnv();
    decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as typeof decoded;
  } catch (err) {
    logger.warn('[CreatorAuth] Invalid token:', (err as Error).message);
    res.status(401).json({ success: false, error: { code: 'AUTH_002', message: 'Invalid or expired token' } });
    return;
  }

  if (!decoded.creatorId) {
    res.status(403).json({ success: false, error: { code: 'AUTH_004', message: 'Creator token required' } });
    return;
  }

  req.creatorId = decoded.creatorId;
  req.companyId = decoded.companyId || 'rez';

  next();
}
