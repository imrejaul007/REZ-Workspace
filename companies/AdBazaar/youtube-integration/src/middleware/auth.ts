import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  serviceToken?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;

    if (internalToken && config.internal.serviceToken) {
      if (internalToken === config.internal.serviceToken) {
        req.serviceToken = internalToken;
        next();
        return;
      }
    }

    // Check for user authorization (Bearer token or API key)
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In production, validate the JWT token here
      // For now, we'll extract user ID from the token
      req.userId = token;
      next();
      return;
    }

    if (apiKey) {
      // In production, validate the API key against database
      req.userId = apiKey;
      next();
      return;
    }

    // No valid auth found
    logger.warn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Valid authentication token or API key required',
    });
  } catch (error) {
    logger.error('Auth middleware error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication check failed',
    });
  }
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const internalToken = req.headers['x-internal-token'] as string;
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    if (internalToken && config.internal.serviceToken === internalToken) {
      req.serviceToken = internalToken;
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.userId = token;
    }

    if (apiKey) {
      req.userId = apiKey;
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error: (error as Error).message });
    next();
  }
};
