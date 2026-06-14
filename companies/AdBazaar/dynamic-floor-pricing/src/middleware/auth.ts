import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { createLogger } from 'utils/logger.js';

const logger = createLogger('AuthMiddleware');

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  serviceName?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Get internal service token from header
  const token = req.headers['x-internal-token'] as string;

  // In development, allow requests without token
  if (config.nodeEnv === 'development' && !token) {
    logger.debug('Development mode: skipping auth');
    next();
    return;
  }

  // Validate token
  if (!token) {
    logger.warn('Missing internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-Internal-Token header'
    });
    return;
  }

  if (token !== config.auth.internalToken) {
    logger.warn('Invalid internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid X-Internal-Token'
    });
    return;
  }

  // Extract service info from header (optional)
  const serviceId = req.headers['x-service-id'] as string;
  const serviceName = req.headers['x-service-name'] as string;

  if (serviceId) req.serviceId = serviceId;
  if (serviceName) req.serviceName = serviceName;

  logger.debug('Request authenticated', {
    path: req.path,
    serviceId,
    serviceName
  });

  next();
};

export default authMiddleware;