import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { errorsTotal } from '../utils/metrics';

const moduleLogger = logger.child({ module: 'AuthMiddleware' });

/**
 * Internal service authentication middleware
 * Validates the X-Internal-Token header for inter-service communication
 */
export const internalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  // Skip auth in development if no token is configured
  if (!expectedToken && process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (!token) {
    moduleLogger.warn('Missing internal service token', {
      path: req.path,
      ip: req.ip
    });
    errorsTotal.inc({ type: 'auth', endpoint: req.path });
    res.status(401).json({
      success: false,
      error: 'Missing authentication token'
    });
    return;
  }

  if (token !== expectedToken) {
    moduleLogger.warn('Invalid internal service token', {
      path: req.path,
      ip: req.ip
    });
    errorsTotal.inc({ type: 'auth', endpoint: req.path });
    res.status(403).json({
      success: false,
      error: 'Invalid authentication token'
    });
    return;
  }

  next();
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
export const optionalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (token && expectedToken && token !== expectedToken) {
    moduleLogger.warn('Invalid optional token ignored', {
      path: req.path,
      ip: req.ip
    });
  }

  // Continue regardless of token validity
  next();
};

/**
 * API key validation for external clients
 */
export const apiKeyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    // No API key configured, allow all
    return next();
  }

  if (!apiKey) {
    moduleLogger.warn('Missing API key', {
      path: req.path,
      ip: req.ip
    });
    errorsTotal.inc({ type: 'api_key', endpoint: req.path });
    res.status(401).json({
      success: false,
      error: 'Missing API key'
    });
    return;
  }

  if (apiKey !== expectedKey) {
    moduleLogger.warn('Invalid API key', {
      path: req.path,
      ip: req.ip
    });
    errorsTotal.inc({ type: 'api_key', endpoint: req.path });
    res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
    return;
  }

  next();
};

export default {
  internalServiceAuth,
  optionalServiceAuth,
  apiKeyAuth
};