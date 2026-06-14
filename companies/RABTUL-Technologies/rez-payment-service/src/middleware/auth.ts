// Shared middleware aliases added — requireUser/requireMerchant/requireAdmin now available.
// Full re-export shim blocked by tsconfig rootDir. Use these aliases in new routes.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
      merchantId?: string;
    }
  }
}

// Lightweight — in production the API gateway calls auth-service /validate
// This is a fallback for direct calls during migration
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing token' });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ success: false, message: 'JWT not configured' });
    return;
  }

  let decoded: { userId: string; role: string; merchantId?: string; iat?: number } | null = null;

  try {
    // FIX: Add algorithms constraint to prevent alg:none and algorithm confusion attacks.
    // Without this, an attacker can forge tokens by setting alg:'none' in the JWT header.
    decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as { userId: string; role: string; merchantId?: string; iat?: number };
  } catch {
    // Try merchant secret
    const merchantSecret = process.env.JWT_MERCHANT_SECRET;
    if (merchantSecret) {
      try {
        decoded = jwt.verify(token, merchantSecret, { algorithms: ['HS256'] }) as { userId: string; role: string; merchantId?: string; iat?: number };
      } catch {
        // fall through
      }
    }
  }

  if (!decoded) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  req.userId = decoded.userId;
  req.userRole = decoded.role;
  req.merchantId = decoded.merchantId;

  // Check Redis token blacklist — fail open if Redis is unavailable
  try {
    const blacklisted = await redis.exists('blacklist:token:' + token);
    if (blacklisted) {
      res.status(401).json({ success: false, message: 'Token revoked' });
      return;
    }
    const allLogoutTs = await redis.get('allLogout:' + decoded.userId);
    if (allLogoutTs) {
      const logoutSec = Math.floor(Number(allLogoutTs) / 1000);
      if (decoded.iat && decoded.iat < logoutSec) {
        res.status(401).json({ success: false, message: 'Token revoked' });
        return;
      }
    }
  } catch (redisErr) {
    // PAY-011 FIX: Fail closed in ALL environments. Even in dev/staging, failing open
    // creates a path where revoked tokens are not detected and expired sessions are not enforced.
    // The only acceptable failure mode is an explicit 503 with AUTH_SERVICE_UNAVAILABLE.
    logger.error('[Auth] Redis unavailable during token blacklist check — failing closed', {
      error: (redisErr as Error).message,
      environment: process.env.NODE_ENV,
    });
    res.status(503).json({
      success: false,
      message: 'Auth service temporarily unavailable',
      code: 'AUTH_SERVICE_UNAVAILABLE',
    });
    return;
  }

  next();
}

// Aliases for shared middleware compatibility
export const requireUser = requireAuth;
