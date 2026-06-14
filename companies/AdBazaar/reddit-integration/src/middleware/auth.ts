import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface AuthenticatedRequest extends Request {
  accountId?: string;
  userId?: string;
}

/**
 * Authentication middleware for internal service-to-service calls
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;

    if (internalToken && internalToken === config.security.internalServiceToken) {
      // Internal service call
      req.accountId = req.headers['x-account-id'] as string;
      return next();
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Simple JWT verification (in production, use proper JWT library)
    try {
      const payload = verifyToken(token);

      if (!payload) {
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
        return;
      }

      req.userId = payload.userId;
      req.accountId = payload.accountId;

      logger.debug('Request authenticated', {
        userId: payload.userId,
        accountId: payload.accountId,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.error('Token verification failed', { error });
      res.status(401).json({
        success: false,
        error: 'Token verification failed',
        code: 'TOKEN_ERROR',
      });
    }
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Verify JWT token (simplified version)
 * In production, use jsonwebtoken library
 */
function verifyToken(token: string): { userId: string; accountId: string } | null {
  try {
    // For development, accept tokens in format: "userId:accountId"
    if (process.env.NODE_ENV === 'development') {
      const parts = token.split(':');
      if (parts.length >= 2) {
        return {
          userId: parts[0],
          accountId: parts[1],
        };
      }
    }

    // In production, implement proper JWT verification
    // For now, return null to require proper auth
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a simple token for development
 */
export const generateDevToken = (userId: string, accountId: string): string => {
  return `${userId}:${accountId}`;
};

export default authMiddleware;