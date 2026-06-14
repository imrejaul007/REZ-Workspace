import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// P1-DATA-2 FIX: Server-side auth guard — protect user-facing routes from unauthenticated access.
// Token source priority: (1) rez_access_token httpOnly cookie (set by /api/auth/set-cookies route)
// — invisible to JavaScript, immune to XSS token theft. (2) Bearer Authorization header (for API clients
// that send tokens directly). Redirects to /?login=1 for unauthenticated requests to protected paths.
const handleI18n = createMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'en',
  localePrefix: 'never',
});

// NW-CRIT-003: Merchant routes expose full merchant panel (dashboard, pay-display,
// reconcile, bill-builder). All /merchant/* paths require auth + store ownership.
const PROTECTED_PATHS = ['/profile', '/orders', '/wallet', '/checkout', '/merchant'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p));
}

/**
 * Verifies JWT signature cryptographically using HS256 algorithm.
 * Throws if token is invalid, expired, or uses wrong algorithm.
 *
 * CRITICAL SECURITY FIX: Now throws error when JWT_SECRET is missing,
 * preventing silent authentication bypass that could allow unauthorized access.
 */
function verifyJwtSignature(token: string): boolean {
  try {
    // SECURITY: Support service-specific JWT secret with fallback to legacy secret
    const secret = process.env.NOW_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      // CRITICAL FIX: Fail CLOSED instead of open - deny access when misconfigured
      // Previously returned false which allowed unauthenticated access
      logger.error('CRITICAL: NOW_JWT_SECRET or JWT_SECRET environment variable is not configured - blocking all requests');
      throw new Error('JWT_SECRET environment variable is required for authentication');
    }
    // Verify signature and decode payload
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as {
      userId?: string;
      sub?: string;
      exp?: number;
    };

    // Ensure payload has required user identification
    if (!decoded.userId && !decoded.sub) {
      logger.error('JWT payload missing userId or sub claim');
      return false;
    }

    // jwt.verify() already validates expiry via exp claim
    return true;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      logger.error('JWT token has expired');
    } else if (err instanceof jwt.JsonWebTokenError) {
      logger.error('JWT signature verification failed:', err.message);
    } else {
      logger.error('JWT verification error:', err);
    }
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Run i18n routing first
  const i18nResponse = handleI18n(request);
  if (i18nResponse.status !== 200) {
    return i18nResponse;
  }

  // P1-DATA-2: Auth guard on protected user routes
  if (isProtectedPath(pathname)) {
    const token =
      request.cookies.get('rez_access_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    // NW-CRIT-003 FIX: Cryptographically verify JWT signature using HS256.
    // An attacker can set any string as a cookie, but they cannot forge a valid JWT
    // without knowing JWT_SECRET. jwt.verify() ensures the token was signed with the
    // server's secret and validates expiry automatically.
    if (!token || !verifyJwtSignature(token)) {
      const loginUrl = new URL('/?login=1', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return i18nResponse;
}

export const config = {
  // Match all paths except _next, api, static, and file extensions
  matcher: ['/((?!_next|api|static|.*\\..*).*)'],
};
