/**
 * REZ Security Middleware - Authentication
 * Copy to: src/middleware/auth.ts
 *
 * Usage in index.ts:
 *   import { requireInternalAuth, requireAdmin } from './middleware/auth';
 *   app.use('/api', requireInternalAuth);
 */

import { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import crypto from 'crypto';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const INTERNAL_SERVICE_TOKENS_JSON = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';
const NODE_ENV = process.env.NODE_ENV || 'development';

interface ServiceTokens {
  [service: string]: string;
}

let serviceTokens: ServiceTokens = {};
try {
  serviceTokens = JSON.parse(INTERNAL_SERVICE_TOKENS_JSON);
} catch {
  serviceTokens = {};
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    try {
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    } catch { /* ignore */ }
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Verify internal service token
 */
export function verifyInternalToken(token: string): boolean {
  // Check main token
  if (INTERNAL_SERVICE_TOKEN && timingSafeCompare(token, INTERNAL_SERVICE_TOKEN)) {
    return true;
  }

  // Check service tokens
  for (const t of Object.values(serviceTokens)) {
    if (timingSafeCompare(token, t)) {
      return true;
    }
  }

  return false;
}

/**
 * Require internal service authentication (all /api routes)
 */
export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  // Skip in development if no tokens configured
  if (NODE_ENV !== 'production' && !INTERNAL_SERVICE_TOKEN && Object.keys(serviceTokens).length === 0) {
    logger.warn('[Auth] No tokens configured, skipping auth in development');
    return next();
  }

  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({ success: false, error: 'Missing X-Internal-Token header' });
    return;
  }

  if (!verifyInternalToken(token)) {
    res.status(403).json({ success: false, error: 'Invalid service token' });
    return;
  }

  next();
}

/**
 * Require admin authentication
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminToken = process.env.ADMIN_SERVICE_TOKEN || INTERNAL_SERVICE_TOKEN;
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({ success: false, error: 'Missing token' });
    return;
  }

  if (!timingSafeCompare(token, adminToken)) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }

  next();
}
