import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { validateEnv } from '../config/env';
import { logger } from '../utils/logger';

function checkIpAllowlist(req: Request): boolean {
  const env = validateEnv();
  const clientIp = req.ip || req.socket.remoteAddress || '';
  const allowlist = env.INTERNAL_IP_ALLOWLIST;

  // Always allow localhost in development
  if (env.NODE_ENV === 'development' && (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1')) {
    return true;
  }

  return allowlist.includes(clientIp);
}

function resolveScopedTokens(): Record<string, string> | null {
  try {
    const env = validateEnv();
    if (env.INTERNAL_SERVICE_TOKENS_JSON) {
      return JSON.parse(env.INTERNAL_SERVICE_TOKENS_JSON);
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction): void {
  // IP allowlist check
  if (!checkIpAllowlist(req)) {
    logger.warn('[InternalAuth] IP not in allowlist:', req.ip);
    res.status(403).json({ success: false, error: { code: 'AUTH_004', message: 'Caller IP not in allowlist' } });
    return;
  }

  const token = req.headers['x-internal-token'] as string;
  const callerService = req.headers['x-internal-service'] as string | undefined;

  if (!token) {
    res.status(401).json({ success: false, error: { code: 'AUTH_001', message: 'Missing internal token' } });
    return;
  }

  const scopedTokens = resolveScopedTokens();
  const legacyToken = validateEnv().INTERNAL_SERVICE_TOKEN;

  let isValid = false;

  // Try scoped tokens first
  if (scopedTokens) {
    const expected = callerService ? scopedTokens[callerService] : undefined;
    if (expected) {
      const tokenBuf = Buffer.from(token);
      const expectedBuf = Buffer.from(expected);
      isValid = tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf);
    }
  }

  // Fall back to legacy token
  if (!isValid && legacyToken) {
    const tokenBuf = Buffer.from(token);
    const legacyBuf = Buffer.from(legacyToken);
    isValid = tokenBuf.length === legacyBuf.length && crypto.timingSafeEqual(tokenBuf, legacyBuf);
  }

  if (!isValid) {
    logger.warn('[InternalAuth] Invalid token from service:', callerService);
    res.status(401).json({ success: false, error: { code: 'AUTH_002', message: 'Invalid internal token' } });
    return;
  }

  logger.debug('[InternalAuth] Valid request from:', callerService);
  next();
}

export function optionalInternalToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    next();
    return;
  }

  // If token provided, validate it
  requireInternalToken(req, res, next);
}
