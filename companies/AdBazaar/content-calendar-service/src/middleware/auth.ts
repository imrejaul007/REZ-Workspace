import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  accountId?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');

    if (req.headers['x-internal-token'] === config.auth.internalServiceToken) {
      req.userId = req.headers['x-user-id'] as string || 'system';
      req.accountId = req.headers['x-account-id'] as string || 'system';
      next();
      return;
    }

    try {
      const response = await axios.post(
        `${config.services.rezAuth}/api/auth/verify`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      if (response.data.success && response.data.data) {
        req.userId = response.data.data.userId;
        req.accountId = response.data.data.accountId;
        next();
      } else {
        throw new UnauthorizedError('Invalid token');
      }
    } catch {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        req.userId = decoded.userId || decoded.sub;
        req.accountId = decoded.accountId;
        next();
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
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

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.userId = 'anonymous';
    next();
    return;
  }

  authMiddleware(req, _res, next);
}
