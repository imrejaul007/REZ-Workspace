import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from 'utils/logger.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
  };
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format');
    }

    const token = parts[1];

    const internalToken = req.headers['x-internal-token'];
    if (internalToken === config.internalServiceToken && config.internalServiceToken) {
      req.user = {
        id: 'internal-service',
        organizationId: req.headers['x-organization-id'] as string || 'default',
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        organizationId: string;
      };

      req.user = {
        id: decoded.id,
        organizationId: decoded.organizationId,
      };

      next();
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      next(error);
    } else {
      logger.error('Auth middleware error', { error });
      next(new UnauthorizedError('Authentication failed'));
    }
  }
}

export function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        organizationId: string;
      };

      req.user = {
        id: decoded.id,
        organizationId: decoded.organizationId,
      };
    } catch {
      // Token invalid, but auth is optional
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error', { error });
    next();
  }
}