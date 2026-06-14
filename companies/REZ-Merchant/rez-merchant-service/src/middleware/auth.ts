/**
 * RABTUL MIGRATION STATUS: COMPLETE
 *
 * Auth middleware uses RABTUL auth service for token verification.
 * Local JWT verification fallback has been removed.
 *
 * RABTUL Service: rez-auth-service (Port 4002)
 * Verification endpoint: POST /api/auth/verify
 *
 * SECURITY: Requires INTERNAL_SERVICE_TOKEN for service-to-service auth.
 * Production environment: AUTH_SERVICE_URL must be configured.
 */

// RABTUL Migration: Auth middleware uses RABTUL auth service exclusively for token verification.
// Local JWT verification fallback has been removed - RABTUL is the only verification path.

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';
import { redis } from '../config/redis';
import { Merchant } from '../models/Merchant';
import { errorResponse, errors } from '../utils/response';

// RABTUL: Service URLs - SECURITY: Must not have hardcoded fallback in production
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
if (!AUTH_SERVICE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('CRITICAL: AUTH_SERVICE_URL environment variable is required in production');
}

// RABTUL: Internal service headers - SECURITY: Validate token exists
const getInternalHeaders = (): Record<string, string> => {
  const token = process.env.INTERNAL_SERVICE_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: INTERNAL_SERVICE_TOKEN environment variable is required in production');
    }
    // Dev mode warning
    logger.warn('WARNING: INTERNAL_SERVICE_TOKEN not set - running without service-to-service auth');
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': token,
  };
};

declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
      merchantUserId?: string;
      merchantRole?: string;
      merchantPermissions?: string[];
    }
  }
}

/**
 * RABTUL: Verify token via external auth service (only verification path)
 */
async function verifyTokenViaRABTUL(token: string): Promise<{
  success: boolean;
  data?: {
    merchantId: string;
    merchantUserId: string;
    role: string;
    permissions?: string[];
  };
  error?: string;
}> {
  // SECURITY: Skip external auth in dev/test if URL not configured
  if (!AUTH_SERVICE_URL) {
    return { success: false, error: 'Auth service URL not configured' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: getInternalHeaders(),
      body: JSON.stringify({ token }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json() as {
        merchantId: string;
        merchantUserId: string;
        role: string;
        permissions?: string[];
      };
      return { success: true, data };
    }
    return { success: false, error: `Auth service returned ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}


/**
 * Verifies a merchant JWT via RABTUL auth service.
 * Sets req.merchantId, req.merchantUserId, req.merchantRole, and req.merchantPermissions on success.
 * Token may be supplied as a Bearer token in Authorization header or in the
 * merchant_access_token cookie.
 * Tokens invalidated via logout are rejected via a Redis blacklist check.
 */
export async function merchantAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const cookieToken = (req as unknown).cookies?.merchant_access_token;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;

  if (!token) {
    return errorResponse(res, errors.authTokenMissing({ message: 'No token provided' }));
  }

  try {
    // Check token blacklist before verification (fast path for logged-out tokens)
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    try {
      const isBlacklisted = await redis.get(`blacklist:merchant:${tokenHash}`);
      if (isBlacklisted) {
        return errorResponse(res, errors.authTokenInvalid({ message: 'Token has been invalidated' }));
      }
    } catch {
      // Redis unavailable — fail closed in production, open in development
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, errors.authServiceUnavailable());
      }
    }

    // RABTUL: Verify token via external auth service only
    const result = await verifyTokenViaRABTUL(token);
    if (!result.success || !result.data) {
      return errorResponse(res, errors.authTokenInvalid({ message: result.error || 'Token verification failed' }));
    }
    const decoded = result.data;

    // Verify merchant account is still active (Redis-cached, TTL 5 min)
    const statusCacheKey = `merchant:status:${decoded.merchantId}`;
    let merchantStatus: { isActive: boolean; accountLockedUntil?: number } | null = null;
    try {
      const cached = await redis.get(statusCacheKey);
      if (cached) {
        merchantStatus = JSON.parse(cached);
      } else {
        const merchant = await Merchant.findById(decoded.merchantId)
          .select('isActive accountLockedUntil')
          .lean();
        if (!merchant) {
          return errorResponse(res, errors.authTokenInvalid({ message: 'Merchant account not found' }));
        }
        merchantStatus = {
          isActive: merchant.isActive,
          accountLockedUntil: merchant.accountLockedUntil
            ? (merchant.accountLockedUntil as Date).getTime()
            : undefined,
        };
        await redis.set(statusCacheKey, JSON.stringify(merchantStatus), 'EX', 300);
      }
    } catch {
      // Redis or DB unavailable — fail closed in production, open in development
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, errors.authServiceUnavailable());
      }
    }

    // Check immediate suspension marker
    try {
      const suspensionKey = `merchant:suspended:${decoded.merchantId}`;
      const isSuspended = await redis.get(suspensionKey);
      if (isSuspended) {
        return errorResponse(res, errors.authAccountSuspended({ message: 'Your merchant account has been suspended.' }));
      }
    } catch {
      if (process.env.NODE_ENV === 'production') {
        return errorResponse(res, errors.authServiceUnavailable());
      }
    }

    if (merchantStatus) {
      if (!merchantStatus.isActive) {
        return errorResponse(res, errors.authTokenInvalid({ message: 'Merchant account is not active' }));
      }
      if (merchantStatus.accountLockedUntil && merchantStatus.accountLockedUntil > Date.now()) {
        return errorResponse(res, errors.authAccountLocked({ message: 'Merchant account is temporarily locked' }));
      }
    }

    req.merchantId = decoded.merchantId;
    req.merchantUserId = decoded.merchantUserId;
    req.merchantRole = decoded.role;
    req.merchantPermissions = decoded.permissions;
    next();
  } catch {
    return errorResponse(res, errors.authTokenInvalid());
  }
}

/**
 * RABTUL: Gate routes that should only be accessible to verified merchants.
 * Checks merchant.verificationStatus === 'verified' (previously 'approved').
 * Should be applied after merchantAuth middleware.
 * Prevents unverified merchants from listing products, requesting payouts, etc.
 * Uses Redis cache with 60-second TTL to reduce DB load.
 */
export async function requireVerifiedMerchant(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.merchantId) {
      return errorResponse(res, errors.authTokenMissing({ message: 'Not authenticated' }));
    }

    // MEDIUM FIX: Cache verification status in Redis to reduce DB queries
    const cacheKey = `merchant:verified:${req.merchantId}`;
    let verificationStatus: string | null = null;

    try {
      verificationStatus = await redis.get(cacheKey);
    } catch {
      // Redis unavailable — fall through to DB query
    }

    if (!verificationStatus) {
      const merchant = await Merchant.findById(req.merchantId)
        .select('verificationStatus')
        .lean();

      if (!merchant) {
        return errorResponse(res, errors.notFound('Merchant'));
      }

      verificationStatus = merchant.verificationStatus || 'pending';

      // Cache for 60 seconds
      try {
        await redis.set(cacheKey, verificationStatus, 'EX', 60);
      } catch {
        // Redis unavailable — continue without caching
      }
    }

    if (verificationStatus !== 'verified') {
      return errorResponse(res, errors.authInsufficientPermissions({
        message: `Your merchant account must be verified to perform this action. Current status: ${verificationStatus}`,
      }));
    }

    next();
  } catch (err) {
    return errorResponse(res, errors.internalError());
  }
}
