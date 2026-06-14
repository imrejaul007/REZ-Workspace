import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from 'utils/logger.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check for internal service token
  const serviceToken = req.headers['x-internal-token'] as string;

  if (serviceToken && serviceToken === config.auth.internalServiceToken) {
    // Internal service authentication
    req.userId = req.headers['x-user-id'] as string || 'internal-service';
    req.userRole = 'service';
    next();
    return;
  }

  // Check for API key
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    // API key authentication (placeholder for external API keys)
    req.userId = 'api-user';
    req.userRole = 'api';
    next();
    return;
  }

  // Check for public endpoints
  const publicEndpoints = ['/health', '/metrics', '/api/hashtags/trending'];
  if (publicEndpoints.includes(req.path)) {
    next();
    return;
  }

  logger.warn('Unauthorized access attempt', {
    path: req.path,
    ip: req.ip,
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Valid authentication token required',
  });
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-internal-token'] as string;

  if (serviceToken && serviceToken === config.auth.internalServiceToken) {
    req.userId = req.headers['x-user-id'] as string || 'internal-service';
    req.userRole = 'service';
  }

  next();
};