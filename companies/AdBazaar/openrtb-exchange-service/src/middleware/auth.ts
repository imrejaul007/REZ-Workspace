import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  serviceAuth?: {
    serviceId: string;
    permissions: string[];
  };
}

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';

export const internalServiceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing internal service token'
    });
    return;
  }

  if (token !== INTERNAL_SERVICE_TOKEN) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid internal service token'
    });
    return;
  }

  req.serviceAuth = {
    serviceId: req.headers['x-service-id'] as string || 'unknown',
    permissions: (req.headers['x-permissions'] as string || '').split(',').filter(Boolean)
  };

  next();
};

export const optionalServiceAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === INTERNAL_SERVICE_TOKEN) {
    req.serviceAuth = {
      serviceId: req.headers['x-service-id'] as string || 'unknown',
      permissions: (req.headers['x-permissions'] as string || '').split(',').filter(Boolean)
    };
  }

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.serviceAuth) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!req.serviceAuth.permissions.includes(permission)) {
      logger.warn('Permission denied', {
        serviceId: req.serviceAuth.serviceId,
        requiredPermission: permission,
        path: req.path
      });
      res.status(403).json({
        error: 'Forbidden',
        message: `Permission '${permission}' required`
      });
      return;
    }

    next();
  };
};

export default {
  internalServiceAuth,
  optionalServiceAuth,
  requirePermission
};
