/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    [key: string]: unknown;
  };
}

/**
 * Validate JWT token and extract user ID
 */
function validateAndDecodeJWT(token: string): string {
  const jwtSecret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { sub?: string; userId?: string; id?: string };
    const userId = decoded.sub || decoded.userId || decoded.id;

    if (!userId) {
      throw new Error('No user ID in token');
    }

    return userId;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Require authentication
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Check for user ID in header (from other services)
  const userId = req.headers['x-user-id'] as string;

  if (userId) {
    req.user = { id: userId };
    return next();
  }

  // Check for internal service token
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (internalToken && expectedToken && internalToken === expectedToken) {
    // Service-to-service call
    const serviceUserId = req.headers['x-service-user-id'] as string;
    if (serviceUserId) {
      req.user = { id: serviceUserId };
      return next();
    }
  }

  // Check for Bearer token (user authentication)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const userId = validateAndDecodeJWT(token);
      req.user = { id: userId };
      return next();
    } catch {
      // Invalid token, fall through to auth error
    }
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}

/**
 * Optional authentication
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string;

  if (userId) {
    req.user = { id: userId };
  }

  next();
}
