import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from 'utils/logger.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  serviceAuth?: boolean;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken && internalToken === config.auth.internalToken) {
      req.serviceAuth = true;
      next();
      return;
    }

    // Check for user JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const response = await axios.post(
        `${config.auth.serviceUrl}/api/auth/verify`,
        { token },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      if (response.data.valid) {
        req.user = {
          id: response.data.userId,
          email: response.data.email,
          roles: response.data.roles || [],
        };
        next();
      } else {
        throw new UnauthorizedError('Invalid token');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new UnauthorizedError('Invalid or expired token');
        }
        logger.warn('Auth service unavailable, using fallback', {
          error: error.message,
        });
        // Fallback: allow in development mode
        if (config.nodeEnv === 'development') {
          req.user = {
            id: 'dev-user',
            email: 'dev@example.com',
            roles: ['admin'],
          };
          next();
          return;
        }
      }
      throw new UnauthorizedError('Authentication failed');
    }
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (req.serviceAuth) {
      next();
      return;
    }

    if (!req.user) {
      next(new UnauthorizedError('Not authenticated'));
      return;
    }

    const hasRole = roles.some((role) => req.user!.roles.includes(role));
    if (!hasRole) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
