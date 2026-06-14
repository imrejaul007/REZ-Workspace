import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import logger from 'utils/logger.js';

/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header against configured token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string | undefined;
  const validToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!token) {
    res.status(401).json({ error: 'Missing authentication token' });
    return;
  }

  if (!validToken) {
    // In development without token configured, log warning and continue
    if (process.env.NODE_ENV === 'development') {
      logger.warn('WARNING: INTERNAL_SERVICE_TOKEN not configured - bypassing auth');
      next();
      return;
    }
    res.status(500).json({ error: 'Server authentication not configured' });
    return;
  }

  // Timing-safe comparison using Node.js crypto module
  const tokenBuffer = Buffer.from(token, 'utf8');
  const validBuffer = Buffer.from(validToken, 'utf8');

  if (tokenBuffer.length !== validBuffer.length || !timingSafeEqual(tokenBuffer, validBuffer)) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }

  next();
}

/**
 * Optional auth middleware - continues without token but sets req.service if valid
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string | undefined;
  const validToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (token && validToken) {
    const tokenBuffer = Buffer.from(token, 'utf8');
    const validBuffer = Buffer.from(validToken, 'utf8');

    if (tokenBuffer.length === validBuffer.length && timingSafeEqual(tokenBuffer, validBuffer)) {
      req.headers['x-authenticated'] = 'true';
    }
  }

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      serviceId?: string;
      requestId?: string;
    }
  }
}
