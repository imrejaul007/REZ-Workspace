import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger';
import { errorResponse, errors } from '../utils/response';

/**
 * CSRF Protection Middleware — Double Submit Cookie pattern.
 *
 * Adapted from rez-backend/src/middleware/csrf.ts to cover the merchant-service
 * after route migration from the monolith.
 *
 * JWT Bearer requests are auto-exempted (native mobile clients), so this only
 * protects browser-based cookie-authenticated surfaces (Expo web, rez-web-menu).
 */

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 1000; // 1 hour

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const CSRF_EXEMPT_PATHS = [
  '/health',
  '/health/live',
  '/health/ready',
  '/healthz',
];

const CSRF_EXEMPT_PREFIXES = [
  '/auth/',
  '/api/merchant/auth/',
  '/merchant/auth/', // direct hits (no /api prefix via internal calls or mobile)
];

function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

function verifyToken(token1: string, token2: string): boolean {
  if (!token1 || !token2 || token1.length !== token2.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(token1, 'utf-8'), Buffer.from(token2, 'utf-8'));
  } catch {
    return false;
  }
}

function shouldExempt(req: Request): boolean {
  if (SAFE_METHODS.includes(req.method.toUpperCase())) return true;

  const path = req.originalUrl.split('?')[0];
  if (CSRF_EXEMPT_PATHS.includes(path)) return true;
  if (CSRF_EXEMPT_PREFIXES.some((p) => path.startsWith(p))) return true;

  // JWT Bearer requests are CSRF-resistant (not auto-sent by browser)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return true;

  return false;
}

/**
 * Combined middleware: sets CSRF cookie on responses and validates token
 * on state-changing requests from cookie-authenticated browser clients.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  try {
    // Skip token generation for JWT-authenticated API requests
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      let csrfToken = (req as unknown).cookies?.[CSRF_COOKIE_NAME];

      if (!csrfToken || csrfToken.length !== CSRF_TOKEN_LENGTH * 2) {
        csrfToken = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, csrfToken, {
          httpOnly: false, // Client JS must read this for Double Submit pattern
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: CSRF_COOKIE_MAX_AGE,
          path: '/',
        });
      }

      res.setHeader(CSRF_HEADER_NAME, csrfToken);
    }

    // Validate on state-changing requests from non-exempt sources
    if (shouldExempt(req)) return next();

    const cookieToken = (req as unknown).cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    if (!cookieToken) {
      logger.warn('[CSRF] Missing cookie token', { path: req.originalUrl, method: req.method, ip: req.ip });
      return errorResponse(res, errors.authInsufficientPermissions({ message: 'CSRF token missing. Please refresh and try again.', code: 'CSRF_TOKEN_MISSING' }));
    }

    if (!headerToken) {
      logger.warn('[CSRF] Missing header token', { path: req.originalUrl, method: req.method, ip: req.ip });
      return errorResponse(res, errors.authInsufficientPermissions({ message: 'CSRF token not provided in request header.', code: 'CSRF_TOKEN_NOT_PROVIDED' }));
    }

    if (!verifyToken(cookieToken, headerToken)) {
      logger.warn('[CSRF] Token mismatch', { path: req.originalUrl, method: req.method, ip: req.ip });
      return errorResponse(res, errors.authInsufficientPermissions({ message: 'CSRF token validation failed. Please refresh and try again.', code: 'CSRF_TOKEN_INVALID' }));
    }

    next();
  } catch (error) {
    logger.error('[CSRF] Validation error', { error: error.message, path: req.originalUrl });
    return errorResponse(res, { message: 'Error validating CSRF token', code: 'CSRF_VALIDATION_ERROR' });
  }
}
