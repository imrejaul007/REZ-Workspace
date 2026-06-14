import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  serviceToken?: string;
  isInternalService?: boolean;
  serviceName?: string;
}

/**
 * Middleware to verify internal service token
 */
export function internalServiceAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal service token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_TOKEN',
      message: 'Internal service token is required',
    });
    return;
  }

  // Support multiple tokens (service-specific)
  if (config.internalServiceToken) {
    const validTokens = config.internalServiceToken.split(',').map(t => t.trim());

    if (!validTokens.includes(token)) {
      logger.warn('Invalid internal service token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
      });
      res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_TOKEN',
        message: 'Invalid internal service token',
      });
      return;
    }
  }

  req.serviceToken = token;
  req.isInternalService = true;

  logger.debug('Internal service authenticated', {
    path: req.path,
    method: req.method,
  });

  next();
}

/**
 * Middleware to extract request metadata (IP, User Agent, etc.)
 */
export function requestMetadata(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Attach IP address (handle proxies)
  req.headers['x-forwarded-for'] = req.headers['x-forwarded-for'] as string || req.ip;

  // Attach timestamp
  (req as unknown).requestTime = new Date();

  next();
}

/**
 * Admin role check middleware
 * Requires X-Admin-Token header for admin operations
 */
export function adminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const adminToken = req.headers['x-admin-token'] as string;

  if (!adminToken) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_ADMIN_TOKEN',
      message: 'Admin token is required',
    });
    return;
  }

  // In production, validate against admin tokens stored securely
  // For now, simple check
  const validAdminTokens = (process.env.ADMIN_TOKENS || '').split(',');

  if (validAdminTokens.length > 0 && !validAdminTokens.includes(adminToken)) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_ADMIN_TOKEN',
      message: 'Invalid admin token',
    });
    return;
  }

  req.serviceName = 'admin';
  next();
}
