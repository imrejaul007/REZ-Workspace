/**
 * Authentication middleware for internal service calls
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  serviceId?: string;
}

export const internalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = req.headers['x-internal-token'] as string;

  // Skip auth in test/development mode if no token configured
  if (!config.INTERNAL_SERVICE_TOKEN) {
    if (config.NODE_ENV === 'production') {
      sendUnauthorized(res, 'Service token not configured');
      return;
    }
    next();
    return;
  }

  if (!token) {
    sendUnauthorized(res, 'Missing X-Internal-Token header');
    return;
  }

  // Timing-safe comparison
  const expectedToken = config.INTERNAL_SERVICE_TOKEN;
  if (!timingSafeEqual(token, expectedToken)) {
    logger.warn('Invalid service token attempted', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    sendUnauthorized(res, 'Invalid token');
    return;
  }

  // Extract service ID from optional header
  req.serviceId = req.headers['x-service-id'] as string;
  next();
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

function sendUnauthorized(res: Response, message: string): void {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message
    },
    meta: {
      requestId: res.getHeader('x-request-id') as string || 'unknown',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  res.status(401).json(response);
}
