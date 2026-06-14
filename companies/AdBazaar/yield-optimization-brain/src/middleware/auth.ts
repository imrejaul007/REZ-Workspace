import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

/**
 * Internal service authentication middleware
 */
export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    logger.warn('Missing internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Internal token required',
      },
    });
    return;
  }

  if (token !== config.internalToken) {
    logger.warn('Invalid internal token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid internal token',
      },
    });
    return;
  }

  next();
}

/**
 * Optional internal auth (doesn't fail if no token)
 */
export function optionalInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-internal-token'] as string;

  if (token && token === config.internalToken) {
    req.headers['x-authenticated'] = 'true';
  }

  next();
}

/**
 * CORS middleware
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;

  // Allow specific origins in production
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://adbazaar.com',
    'https://www.adbazaar.com',
  ];

  if (config.service.env === 'development' || !origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
 }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Internal-Token, X-Request-ID');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
}
