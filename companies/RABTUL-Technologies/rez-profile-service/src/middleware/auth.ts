import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger';

/**
 * Internal service authentication middleware.
 * Validates x-internal-token header against configured service tokens.
 */

// Timing-safe comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a comparison to maintain constant time
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Parse scoped tokens from JSON environment variable
function parseScopedTokens(json: string): Array<{ serviceId: string; token: string }> {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (t): t is { serviceId: string; token: string } =>
          typeof t === 'object' && t !== null && typeof t.serviceId === 'string' && typeof t.token === 'string',
      );
    }
    return [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[InternalAuth] Failed to parse INTERNAL_SERVICE_TOKENS_JSON', { error: errorMessage });
    return [];
  }
}

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  isInternal?: boolean;
  userId?: string;
}

export function internalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = req.headers['x-internal-token'] as string | undefined;

  // Check scoped tokens
  const scopedTokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON;
  if (scopedTokensJson) {
    const scopedTokens = parseScopedTokens(scopedTokensJson);
    for (const { serviceId, token: serviceToken } of scopedTokens) {
      if (token && timingSafeEqual(token, serviceToken)) {
        req.serviceId = serviceId;
        req.isInternal = true;
        logger.debug('[InternalAuth] Request authenticated', { serviceId, path: req.path });
        next();
        return;
      }
    }
  }

  // Check legacy token
  const legacyToken = process.env.INTERNAL_SERVICE_TOKEN;
  if (legacyToken && token && timingSafeEqual(token, legacyToken)) {
    req.serviceId = 'legacy';
    req.isInternal = true;
    logger.warn('[InternalAuth] DEPRECATED: Legacy INTERNAL_SERVICE_TOKEN used');
    next();
    return;
  }

  // No valid token
  logger.warn('[InternalAuth] Invalid token', { path: req.path, ip: req.ip });
  res.status(401).json({ success: false, message: 'Unauthorized' });
}

/**
 * JWT validation for external-facing endpoints.
 * Validates Bearer token against AUTH_SERVICE_URL.
 */
export async function jwtAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Validate token against auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${authServiceUrl}/auth/validate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN || '',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
      return;
    }

    const data = (await response.json()) as { valid: boolean; userId?: string; role?: string };

    if (!data.valid || !data.userId) {
      res.status(401).json({ success: false, message: 'Invalid token payload' });
      return;
    }

    // Attach user info to request
    req.userId = data.userId;
    logger.debug('[JWTAuth] Request authenticated', { userId: data.userId, path: req.path });
    next();
  } catch (error) {
    logger.error('[JWTAuth] Token validation failed', { error, path: req.path });
    res.status(401).json({ success: false, message: 'Token validation failed' });
  }
}

/**
 * Ownership check middleware - ensures user can only access their own profile.
 * Must be used after jwtAuthMiddleware.
 */
export function requireOwnership(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const { userId } = req.params;

  // Internal services can access any profile
  if (req.isInternal) {
    next();
    return;
  }

  // Users can only access their own profile
  if (req.userId !== userId) {
    logger.warn('[Auth] Ownership check failed', {
      requestedUserId: userId,
      authenticatedUserId: req.userId,
      path: req.path,
    });
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }

  next();
}
