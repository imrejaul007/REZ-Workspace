import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
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

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      error: 'Missing internal service token',
    });
    return;
  }

  if (token !== config.internalServiceToken) {
    logger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip,
    });
    res.status(403).json({
      success: false,
      error: 'Invalid internal service token',
    });
    return;
  }

  req.internalServiceToken = token;
  req.serviceName = req.headers['x-service-name'] as string || 'unknown';
  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === config.internalServiceToken) {
    req.internalServiceToken = token;
    req.serviceName = req.headers['x-service-name'] as string || 'unknown';
  }

  next();
};

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Internal-Token, X-Service-Name');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};