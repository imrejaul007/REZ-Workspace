import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import config from '../config';
import logger from '../config/logger';
import { ApiResponse } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
      requestId?: string;
    }
  }
}

/**
 * Internal service token authentication middleware
 * Verifies X-Internal-Token header for inter-service communication
 */
export function internalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing internal service token',
      },
    };

    res.status(401).json(response);
    return;
  }

  // Timing-safe comparison
  const expectedToken = config.internalServiceToken;
  if (!timingSafeEqual(token, expectedToken)) {
    logger.warn('Invalid internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid internal service token',
      },
    };

    res.status(403).json(response);
    return;
  }

  // Extract service ID from token payload if JWT
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      req.serviceId = payload.serviceId || payload.sub;
    }
  } catch {
    // Ignore JWT parsing errors, token is still valid
  }

  next();
}

/**
 * Request ID middleware
 * Generates or extracts a unique request ID for tracing
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req.headers['x-request-id'] as string) || generateUUID();
  req.requestId = requestId;

  res.setHeader('X-Request-Id', requestId);
  next();
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
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

/**
 * Generate a cryptographically secure UUID v4
 */
function generateUUID(): string {
  return randomUUID();
}

export default {
  internalAuthMiddleware,
  requestIdMiddleware,
};
