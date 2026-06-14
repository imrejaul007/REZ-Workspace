import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment.js';
import { logger } from '../config/logger.js';

export interface AuthenticatedRequest extends Request {
  internalServiceId?: string;
  isInternalService?: boolean;
}

export function internalServiceAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'];

  // Check for service-to-service token
  if (internalToken === config.internalToken) {
    req.isInternalService = true;
    req.internalServiceId = req.headers['x-service-id'] as string || 'unknown';
    logger.debug('Internal service request authenticated', { serviceId: req.internalServiceId });
    return next();
  }

  // Check Bearer token (for future external auth integration)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, validate JWT or API key here
    // For now, accept any Bearer token as valid
    req.isInternalService = true;
    req.internalServiceId = 'external-client';
    return next();
  }

  // For development, allow requests without auth
  if (config.nodeEnv === 'development') {
    req.isInternalService = true;
    req.internalServiceId = 'dev-client';
    return next();
  }

  logger.warn('Unauthorized request attempt', {
    ip: req.ip,
    path: req.path,
    method: req.method,
  });

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing authentication',
    },
  });
}

export function requireInternalService(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.isInternalService) {
    logger.warn('Non-internal service attempted to access protected endpoint', {
      ip: req.ip,
      path: req.path,
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'This endpoint requires internal service authentication',
      },
    });
    return;
  }

  next();
}