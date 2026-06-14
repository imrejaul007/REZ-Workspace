import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  accountId?: string;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const authHeader = req.headers.authorization;

  // Check internal service token first
  if (internalToken && internalToken === config.internalServiceToken) {
    req.userId = 'internal-service';
    return next();
  }

  // Check Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, validate JWT token here
    // For now, we'll accept any non-empty token
    if (token && token.length > 0) {
      req.userId = 'authenticated-user';
      return next();
    }
  }

  logger.warn('Unauthorized access attempt', {
    path: req.path,
    ip: req.ip,
  });

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Valid authentication token required',
  });
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const authHeader = req.headers.authorization;

  if (internalToken && internalToken === config.internalServiceToken) {
    req.userId = 'internal-service';
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token.length > 0) {
      req.userId = 'authenticated-user';
    }
  }

  next();
}