import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from 'utils/logger.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isInternalService?: boolean;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken && internalToken === config.internalToken) {
      req.isInternalService = true;
      next();
      return;
    }

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // In production, verify the token with RABTUL auth service
      // For now, we'll decode a simple token format: userId:timestamp
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId] = decoded.split(':');
        if (userId) {
          req.userId = userId;
          next();
          return;
        }
      } catch {
        // Token format not recognized, continue to next middleware
      }
    }

    // For development, allow requests without auth
    if (config.nodeEnv === 'development') {
      req.userId = 'dev-user';
      next();
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Valid authentication required',
    });
  } catch (error) {
    logger.error('Auth middleware error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication Error',
      message: 'Failed to process authentication',
    });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken && internalToken === config.internalToken) {
      req.isInternalService = true;
      next();
      return;
    }

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [userId] = decoded.split(':');
        if (userId) {
          req.userId = userId;
        }
      } catch {
        // Ignore token decode errors
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error });
    next();
  }
};