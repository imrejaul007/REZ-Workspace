// Authentication Middleware
// Validates JWT tokens via RABTUL Auth Service

import { Request, Response, NextFunction } from 'express';
import { ecosystemIntegration } from '../services/index.js';

export interface AuthRequest extends Request {
  userId?: string;
  tenantId?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const tenantId = req.headers['x-tenant-id'] as string;

    // If no token provided, use default tenant (for internal service calls)
    if (!token) {
      if (tenantId) {
        req.tenantId = tenantId;
      }
      // Allow request to proceed without auth for internal endpoints
      next();
      return;
    }

    // Verify token with RABTUL Auth Service
    const result = await ecosystemIntegration.verifyToken(token);

    if (!result.success) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Extract user info from verified token
    const userData = result.data?.user || result.data;
    req.userId = userData?.id || userData?.userId || 'unknown';
    req.tenantId = tenantId || userData?.tenantId || 'default';

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable',
      timestamp: new Date().toISOString(),
    });
  }
};

// Optional auth - doesn't block requests without tokens
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const tenantId = req.headers['x-tenant-id'] as string;

    req.tenantId = tenantId || 'default';

    if (token) {
      const result = await ecosystemIntegration.verifyToken(token);
      if (result.success) {
        const userData = result.data?.user || result.data;
        req.userId = userData?.id || userData?.userId;
      }
    }

    next();
  } catch (error) {
    // Don't block on auth errors for optional auth
    next();
  }
};
