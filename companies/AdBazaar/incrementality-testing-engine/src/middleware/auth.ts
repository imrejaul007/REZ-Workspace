import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  serviceToken?: string;
  permissions?: string[];
}

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'incrementality-internal-token-dev';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const serviceToken = req.headers['x-internal-token'] as string;

  // Check for internal service token first
  if (serviceToken && serviceToken === INTERNAL_SERVICE_TOKEN) {
    req.serviceToken = serviceToken;
    req.userId = req.headers['x-user-id'] as string || 'internal-service';
    req.permissions = ['read', 'write', 'admin'];
    next();
    return;
  }

  // Check for Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // In production, validate JWT token here
    // For now, accept any non-empty token
    if (token) {
      try {
        // TODO: Add proper JWT validation
        // For now, we'll decode a simple token format
        const tokenParts = token.split('.');
        if (tokenParts.length >= 2) {
          // JWT-like token
          req.userId = tokenParts[0];
        } else {
          // Simple token
          req.userId = token;
        }
        req.permissions = ['read', 'write'];
        next();
        return;
      } catch (error) {
        logger.warn('Token validation failed', { error });
 }
    }
  }

  // API Key authentication
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey) {
    // TODO: Validate API key against database
    req.userId = 'api-user';
    req.permissions = ['read'];
    next();
    return;
  }

  // No valid authentication found
  logger.warn('Unauthorized access attempt', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Valid authentication required'
  });
};

export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.permissions) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'No permissions found'
      });
      return;
    }

    const hasPermission = requiredPermissions.some(
      (permission) => req.permissions?.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: req.userId,
        required: requiredPermissions,
        actual: req.permissions
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Required permissions: ${requiredPermissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const serviceToken = req.headers['x-internal-token'] as string;

  if (serviceToken && serviceToken === INTERNAL_SERVICE_TOKEN) {
    req.serviceToken = serviceToken;
    req.userId = req.headers['x-user-id'] as string || 'internal-service';
    req.permissions = ['read', 'write', 'admin'];
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token) {
      req.userId = 'authenticated-user';
      req.permissions = ['read', 'write'];
    }
  }

  next();
};

export default authMiddleware;