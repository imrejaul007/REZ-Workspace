/**
 * WebSocket Auth Middleware - RABTUL Integration
 *
 * Migration: Local JWT → RABTUL Auth Service
 * Date: May 18, 2026
 *
 * Production: RABTUL Auth Service only
 * Development: RABTUL with local fallback
 */

import jwt from 'jsonwebtoken';
import type { AuthenticatedUser, AuthenticatedRequest } from '../types/index.js';

// RABTUL Auth Service
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.RABTUL_AUTH_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Local fallback (development only)
const LOCAL_JWT_SECRET = process.env.JWT_SECRET || 'rez-websocket-hub-secret-key-change-in-production';

export class JWTAuthError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_ERROR'
  ) {
    super(message);
    this.name = 'JWTAuthError';
  }
}

/**
 * Generate token via RABTUL Auth Service
 * Returns a token that can be verified centrally
 */
export async function generateToken(user: { id: string; username: string; email?: string }): Promise<string> {
  // Production: Request token from RABTUL Auth Service
  if (IS_PRODUCTION) {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          userId: user.id,
          role: 'user',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
    } catch (error) {
      console.error('[WebSocket Auth] Failed to get token from RABTUL:', error);
    }
  }

  // Development fallback: Generate locally
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    LOCAL_JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify token with RABTUL Auth Service
 * Production: RABTUL only
 * Development: RABTUL with local fallback
 */
export async function verifyToken(token: string): Promise<AuthenticatedUser> {
  // Try RABTUL Auth Service first
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.user) {
        return {
          id: result.user.id,
          username: result.user.phone || result.user.id,
          role: result.user.role || 'user',
        } as AuthenticatedUser;
      }
    }
  } catch (error) {
    if (IS_PRODUCTION) {
      // Production: Fail hard if RABTUL is unavailable
      console.error('[WebSocket Auth] RABTUL unavailable in production:', error);
      throw new JWTAuthError('Authentication service unavailable', 'SERVICE_UNAVAILABLE');
    }
    console.warn('[WebSocket Auth] RABTUL unavailable, using local fallback');
  }

  // Development fallback only
  if (IS_PRODUCTION) {
    throw new JWTAuthError('Invalid token', 'INVALID_TOKEN');
  }

  try {
    const decoded = jwt.verify(token, LOCAL_JWT_SECRET) as {
      id: string;
      username?: string;
      email?: string;
    };

    return {
      id: decoded.id,
      username: decoded.username || decoded.id,
      role: 'user',
    } as AuthenticatedUser;
  } catch {
    throw new JWTAuthError('Invalid token', 'INVALID_TOKEN');
  }
}y(token, JWT_SECRET) as AuthenticatedUser;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new JWTAuthError('Token has expired', 'TOKEN_EXPIRED');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new JWTAuthError('Invalid token', 'INVALID_TOKEN');
    }
    throw new JWTAuthError('Token verification failed', 'VERIFICATION_FAILED');
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new JWTAuthError('No authorization header provided', 'MISSING_HEADER');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new JWTAuthError('Invalid authorization header format', 'INVALID_FORMAT');
  }

  return parts[1];
}

export async function authenticateRequest(req: AuthenticatedRequest): Promise<AuthenticatedUser> {
  const token = extractTokenFromHeader(req.headers.authorization);
  return verifyToken(token);
}

export async function wsAuthenticate(token: string): Promise<AuthenticatedUser> {
  return verifyToken(token);
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: { statusCode: number; end: (data?: string) => void },
  next: (err?: Error) => void
): Promise<void> {
  try {
    const user = await authenticateRequest(req);
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof JWTAuthError) {
      res.statusCode = 401;
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: Date.now(),
      }));
      return;
    }
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: 'Internal authentication error',
      timestamp: Date.now(),
    }));
  }
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: { statusCode: number; end: (data?: string) => void },
  next: (err?: Error) => void
): void {
  try {
    if (req.headers.authorization) {
      const user = authenticateRequest(req);
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}
