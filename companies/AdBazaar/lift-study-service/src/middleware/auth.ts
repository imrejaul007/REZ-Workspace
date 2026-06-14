import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ServiceAuthRequest extends Request {
  serviceId?: string;
  serviceName?: string;
  internalToken?: string;
}

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'lift-study-service-secret';

export const serviceAuth = (req: ServiceAuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;
  const serviceId = req.headers['x-service-id'] as string;
  const serviceName = req.headers['x-service-name'] as string;

  // Allow internal service calls with valid token
  if (token === INTERNAL_SERVICE_TOKEN) {
    req.internalToken = token;
    req.serviceId = serviceId;
    req.serviceName = serviceName;
    return next();
  }

  // Check for API key authentication
  const apiKey = req.headers['x-api-key'] as string;
  if (apiKey === process.env.API_KEY) {
    return next();
  }

  logger.warn('Unauthorized access attempt', {
    ip: req.ip,
    path: req.path,
    method: req.method
  });

  return res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Invalid or missing authentication credentials'
  });
};

export const optionalAuth = (req: ServiceAuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers['x-internal-token'] as string;

  if (token === INTERNAL_SERVICE_TOKEN) {
    req.internalToken = token;
    req.serviceId = req.headers['x-service-id'] as string;
    req.serviceName = req.headers['x-service-name'] as string;
  }

  next();
};

export const requireInternalCall = (req: ServiceAuthRequest, res: Response, next: NextFunction) => {
  if (!req.internalToken) {
    logger.warn('Non-internal call to internal endpoint', {
      ip: req.ip,
      path: req.path
    });

    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'This endpoint requires internal service authentication'
    });
  }

  next();
};

export default { serviceAuth, optionalAuth, requireInternalCall };