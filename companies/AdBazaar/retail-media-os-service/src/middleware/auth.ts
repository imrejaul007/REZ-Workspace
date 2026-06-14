import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  internalServiceToken?: string;
  serviceName?: string;
}

export const internalServiceAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    logger.warn('INTERNAL_SERVICE_TOKEN not configured');
    next();
    return;
  }

  if (!token) {
    logger.warn('Missing internal service token');
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Internal service token required'
    });
    return;
  }

  if (token !== expectedToken) {
    logger.warn('Invalid internal service token');
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid internal service token'
    });
    return;
  }

  req.internalServiceToken = token;
  req.serviceName = req.headers['x-service-name'] as string;

  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (token && expectedToken && token === expectedToken) {
    req.internalServiceToken = token;
    req.serviceName = req.headers['x-service-name'] as string;
  }

  next();
};

export default {
  internalServiceAuth,
  optionalAuth
};