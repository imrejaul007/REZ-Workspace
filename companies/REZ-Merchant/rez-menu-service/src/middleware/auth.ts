/**
 * RABTUL Auth Migration Wrapper for rez-menu-service
 *
 * This middleware wraps RABTUL Auth Service for token verification.
 * The local JWT_SECRET is kept as fallback for development.
 *
 * Migration: Local auth → RABTUL Auth
 * Date: May 18, 2026
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// RABTUL Auth Service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || process.env.RABTUL_AUTH_URL || 'https://rez-auth-service.onrender.com';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Local fallback (for development only)
const LOCAL_JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

// Types
interface MerchantAuthRequest extends Request {
  merchantId?: string;
  restaurantId?: string;
  user?: {
    id: string;
    role: string;
  };
}

interface RABTULAuthResponse {
  success: boolean;
  user?: {
    id: string;
    phone?: string;
    role?: string;
  };
  error?: string;
}

/**
 * Verify token with RABTUL Auth Service
 */
async function verifyWithRABTUL(token: string): Promise<{ valid: boolean; user?: { id: string; role: string } }> {
  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return { valid: false };
    }

    const data = await response.json() as RABTULAuthResponse;

    if (data.success && data.user) {
      return {
        valid: true,
        user: {
          id: data.user.id,
          role: data.user.role || 'user',
        },
      };
    }

    return { valid: false };
  } catch (error) {
    console.error('[Auth] RABTUL verify failed:', error);
    return { valid: false };
  }
}

/**
 * Verify token locally (fallback for development)
 */
function verifyLocally(token: string): { valid: boolean; user?: { id: string; role: string } } {
  try {
    const decoded = jwt.verify(token, LOCAL_JWT_SECRET) as {
      userId?: string;
      id?: string;
      role?: string;
    };

    return {
      valid: true,
      user: {
        id: decoded.userId || decoded.id || '',
        role: decoded.role || 'user',
      },
    };
  } catch {
    return { valid: false };
  }
}

/**
 * Authentication middleware using RABTUL Auth Service
 *
 * Priority:
 * 1. Try RABTUL Auth Service (production)
 * 2. Fallback to local JWT (development only)
 */
export async function merchantAuth(
  req: MerchantAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
        },
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bearer token is required',
        },
      });
      return;
    }

    // Try RABTUL Auth Service first
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Production: Only use RABTUL
      const result = await verifyWithRABTUL(token);

      if (!result.valid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
        return;
      }

      req.user = result.user;
      next();
    } else {
      // Development: Try RABTUL first, fallback to local
      let result = await verifyWithRABTUL(token);

      if (!result.valid) {
        console.log('[Auth] RABTUL verify failed, trying local fallback...');
        result = verifyLocally(token);
      }

      if (!result.valid) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
        return;
      }

      req.user = result.user;
      next();
    }
  } catch (error) {
    console.error('[Auth] Middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

/**
 * Admin-only middleware
 */
export async function requireAdmin(
  req: MerchantAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  await merchantAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
      });
      return;
    }
    next();
  });
}

/**
 * Service-to-service auth middleware
 */
export async function requireServiceAuth(
  req: MerchantAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const serviceToken = req.headers['x-service-token'];

  if (!serviceToken || serviceToken !== INTERNAL_SERVICE_TOKEN) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Service token required',
      },
    });
    return;
  }

  next();
}

// Export for testing
export { verifyWithRABTUL, verifyLocally };
