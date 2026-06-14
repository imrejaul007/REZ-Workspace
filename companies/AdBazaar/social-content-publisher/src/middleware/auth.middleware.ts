import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { logger } from '../config/logger';

export interface AuthenticatedUser {
  userId: string;
  companyId: string;
  email?: string;
  roles?: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export const internalServiceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal service token', { path: req.path });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing internal service token',
    });
    return;
  }

  if (token !== config.internalServiceToken) {
    logger.warn('Invalid internal service token', { path: req.path });
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid internal service token',
    });
    return;
  }

  // Extract user info from headers
  req.user = {
    userId: req.headers['x-user-id'] as string || 'system',
    companyId: req.headers['x-company-id'] as string || 'default',
    email: req.headers['x-user-email'] as string,
    roles: req.headers['x-user-roles'] ? (req.headers['x-user-roles'] as string).split(',') : undefined,
  };

  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === config.internalServiceToken) {
    req.user = {
      userId: req.headers['x-user-id'] as string || 'system',
      companyId: req.headers['x-company-id'] as string || 'default',
      email: req.headers['x-user-email'] as string,
      roles: req.headers['x-user-roles'] ? (req.headers['x-user-roles'] as string).split(',') : undefined,
    };
  }

  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      logger.warn('Insufficient permissions', { userId: req.user.userId, requiredRoles: roles });
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};