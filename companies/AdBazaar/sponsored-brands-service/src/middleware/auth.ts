import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';
import { z } from 'zod';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'adbazaar-internal-token';

const ApiKeySchema = z.object({
  'x-api-key': z.string().optional(),
  'authorization': z.string().optional()
});

export interface AuthenticatedRequest extends Request {
  advertiserId?: string;
  userId?: string;
  permissions?: string[];
}

export const internalServiceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const authHeader = req.headers['authorization'] as string;
    const internalToken = req.headers['x-internal-token'] as string;

    if (internalToken && internalToken === INTERNAL_SERVICE_TOKEN) {
      req.advertiserId = 'internal';
      return next();
    }

    if (apiKey && apiKey.startsWith('adb_')) {
      const decoded = Buffer.from(apiKey.replace('adb_', ''), 'base64').toString();
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        req.advertiserId = parts[0];
        req.userId = parts[1];
        if (parts.length > 2) {
          req.permissions = parts[2].split(',');
        }
        return next();
      }
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        req.advertiserId = parts[0];
        req.userId = parts[1];
        return next();
      }
    }

    const result = ApiKeySchema.safeParse(req.headers);
    if (!result.success) {
      logger.warn('Authentication failed - invalid headers', {
        path: req.path,
        method: req.method
      });
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing authentication credentials'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication Error',
      message: 'Internal authentication error'
    });
  }
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const authHeader = req.headers['authorization'] as string;

    if (!apiKey && !authHeader) {
      return next();
    }

    if (apiKey && apiKey.startsWith('adb_')) {
      const decoded = Buffer.from(apiKey.replace('adb_', ''), 'base64').toString();
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        req.advertiserId = parts[0];
        req.userId = parts[1];
      }
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split(':');
      if (parts.length >= 2) {
        req.advertiserId = parts[0];
        req.userId = parts[1];
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requirePermissions = (...permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.permissions || req.permissions.length === 0) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'No permissions found'
      });
      return;
    }

    const hasAllPermissions = permissions.every(p => req.permissions!.includes(p));
    if (!hasAllPermissions) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Missing required permissions: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

export default {
  internalServiceAuth,
  optionalAuth,
  requirePermissions
};