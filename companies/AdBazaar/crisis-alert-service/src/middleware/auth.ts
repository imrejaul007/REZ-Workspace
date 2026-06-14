/**
 * Authentication Middleware for AdBazaar Services
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import config from '../config';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'agent' | 'customer' | 'api_key';
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const publicPaths = ['/health', '/metrics'];

/**
 * Verify API key authentication
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (publicPaths.some(path => req.path.startsWith(path))) {
    next();
    return;
  }

  const apiKey = req.headers['x-api-key'] as string;
  const internalToken = req.headers['x-internal-token'] as string;

  if (apiKey && apiKey === config.serviceApiKey) {
    req.user = {
      userId: 'service',
      email: 'service@adbazaar.com',
      role: 'api_key',
      permissions: ['read', 'write', 'admin'],
    };
    next();
    return;
  }

  if (internalToken && internalToken === config.internalServiceToken) {
    req.user = {
      userId: 'internal',
      email: 'internal@adbazaar.com',
      role: 'api_key',
      permissions: ['read', 'write', 'admin'],
    };
    next();
    return;
  }

  if (config.nodeEnv === 'development' || config.skipAuth) {
    req.user = {
      userId: 'dev-user',
      email: 'dev@adbazaar.com',
      role: 'admin',
      permissions: ['read', 'write', 'admin'],
    };
    next();
    return;
  }

  logger.warn('Unauthorized access attempt', { path: req.path, ip: req.ip });
  res.status(401).json({ success: false, error: 'Unauthorized' });
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    next();
  };
};

export default authMiddleware;
