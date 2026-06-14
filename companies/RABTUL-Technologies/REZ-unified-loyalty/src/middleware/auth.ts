import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger.js';

/**
 * Extended Request type with user context
 */
export interface AuthenticatedRequest extends Request {
  serviceId?: string;
  isInternalRequest?: boolean;
}

/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header for service-to-service communication
 */
export function internalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    logger.error('INTERNAL_SERVICE_TOKEN not configured');
    res.status(500).json({
      success: false,
      error: 'Server authentication not configured'
    });
    return;
  }

  if (!authHeader) {
    logger.warn('Missing X-Internal-Token header', {
      path: req.path,
      ip: req.ip
    });
    res.status(401).json({
      success: false,
      error: 'Missing authentication token'
    });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  const authHeaderBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expectedToken);

  if (authHeaderBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(authHeaderBuffer, expectedBuffer)) {
    logger.warn('Invalid authentication token', {
      path: req.path,
      ip: req.ip,
      tokenLength: authHeader.length
    });
    res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
    return;
  }

  req.isInternalRequest = true;
  req.serviceId = req.headers['x-service-id'] as string;
  next();
}

/**
 * Parse service tokens JSON and validate caller
 */
export function validateServiceCaller(
  allowedServices: string[]
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const tokensJson = process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}';

    try {
      const tokens = JSON.parse(tokensJson);
      const serviceId = req.headers['x-service-id'] as string;

      if (!serviceId) {
        res.status(400).json({
          success: false,
          error: 'Missing X-Service-Id header'
        });
        return;
      }

      if (!allowedServices.includes(serviceId)) {
        logger.warn('Unauthorized service attempted access', {
          serviceId,
          path: req.path,
          allowedServices
        });
        res.status(403).json({
          success: false,
          error: 'Service not authorized for this operation'
        });
        return;
      }

      const serviceToken = tokens[serviceId];
      const providedToken = req.headers['x-service-token'] as string;

      if (serviceToken && providedToken) {
        const providedBuffer = Buffer.from(providedToken);
        const expectedBuffer = Buffer.from(serviceToken);

        if (providedBuffer.length !== expectedBuffer.length ||
            !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
          res.status(401).json({
            success: false,
            error: 'Invalid service token'
          });
          return;
        }
      }

      req.serviceId = serviceId;
      next();
    } catch (error) {
      logger.error('Error validating service caller', { error });
      res.status(500).json({
        success: false,
        error: 'Authentication configuration error'
      });
    }
  };
}

/**
 * Optional authentication - sets user context if token present but doesn't require it
 */
export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (authHeader && expectedToken) {
    const authHeaderBuffer = Buffer.from(authHeader);
    const expectedBuffer = Buffer.from(expectedToken);

    if (authHeaderBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(authHeaderBuffer, expectedBuffer)) {
      req.isInternalRequest = true;
      req.serviceId = req.headers['x-service-id'] as string;
    }
  }

  next();
}
