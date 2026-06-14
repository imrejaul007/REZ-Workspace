import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { validateEnv } from '../config/env';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

export interface REZJwtPayload extends jwt.JwtPayload {
  userId?: string;
  merchantId?: string;
  creatorId?: string;
  role?: string;
  phone?: string;
  companyId?: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      merchantId?: string;
      creatorId?: string;
      companyId?: string;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'AUTH_001', message: 'Missing authentication token' } });
    return;
  }

  const token = header.slice(7);
  let decoded: REZJwtPayload;

  try {
    const env = validateEnv();
    decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as REZJwtPayload;
  } catch (err) {
    logger.warn('[Auth] Invalid token:', (err as Error).message);
    res.status(401).json({ success: false, error: { code: 'AUTH_002', message: 'Invalid or expired token' } });
    return;
  }

  // Check if token is blacklisted
  try {
    const redis = getRedisClient();
    const blacklisted = await redis.exists('blacklist:token:' + token);
    if (blacklisted) {
      res.status(401).json({ success: false, error: { code: 'AUTH_002', message: 'Token has been revoked' } });
      return;
    }
  } catch (redisErr) {
    // SECURITY: Fail closed when Redis unavailable
    logger.error('[Auth] Redis unavailable for blacklist check:', (redisErr as Error).message);
    res.status(503).json({ success: false, error: { code: 'SRV_002', message: 'Auth service unavailable' } });
    return;
  }

  // Set user context
  req.userId = decoded.userId;
  req.userRole = decoded.role;
  req.merchantId = decoded.merchantId;
  req.creatorId = decoded.creatorId;
  req.companyId = decoded.companyId || 'rez';

  next();
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);

  try {
    const env = validateEnv();
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as REZJwtPayload;

    // Check blacklist
    const redis = getRedisClient();
    const blacklisted = await redis.exists('blacklist:token:' + token);
    if (!blacklisted) {
      req.userId = decoded.userId;
      req.userRole = decoded.role;
      req.merchantId = decoded.merchantId;
      req.creatorId = decoded.creatorId;
      req.companyId = decoded.companyId || 'rez';
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}
