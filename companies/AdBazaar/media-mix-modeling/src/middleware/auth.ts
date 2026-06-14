import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Extend Express Request to include service info
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
      isInternal?: boolean;
    }
  }
}

/**
 * Internal service authentication middleware
 * Validates internal service tokens for inter-service communication
 */
export const serviceAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN || process.env.SERVICE_TOKEN;

  // Skip auth in development
  if (process.env.NODE_ENV === 'development' && !serviceToken) {
    req.isInternal = true;
    req.serviceId = 'dev-service';
    next();
    return;
  }

  // Check for valid service token
  if (serviceToken && (authHeader === `Bearer ${serviceToken}` || internalToken === serviceToken)) {
    req.isInternal = true;
    req.serviceId = req.headers['x-service-id'] as string || 'internal-service';
    next();
    return;
  }

  // Check for RABTUL auth service token (standard for ecosystem)
  const rabtulToken = req.headers['x-rabtul-token'];
  if (rabtulToken && typeof rabtulToken === 'string') {
    // In production, validate against RABTUL auth service
    // For now, accept as internal
    req.isInternal = true;
    req.serviceId = 'rabtul-service';
    next();
    return;
  }

  // No valid auth found
  logger.warn('Unauthorized access attempt', {
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Valid service token required'
  });
};

/**
 * Optional auth - doesn't fail if no token present
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'] as string;
  const serviceToken = process.env.INTERNAL_SERVICE_TOKEN || process.env.SERVICE_TOKEN;

  if (serviceToken && (authHeader === `Bearer ${serviceToken}` || internalToken === serviceToken)) {
    req.isInternal = true;
    req.serviceId = req.headers['x-service-id'] as string || 'internal-service';
  }

  next();
};

/**
 * Audit logging middleware
 */
export const auditLog = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('API Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      serviceId: req.serviceId,
      ip: req.ip
    });
  });

  next();
};

export default { serviceAuth, optionalAuth, auditLog };