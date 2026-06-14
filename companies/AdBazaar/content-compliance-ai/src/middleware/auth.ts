import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/index.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
  isInternal?: boolean;
}

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your_internal_token_here';
const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY || 'your_service_secret_key_here';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check for internal service token (inter-service communication)
  const internalToken = req.headers['x-internal-token'] as string;
  if (internalToken && internalToken === INTERNAL_TOKEN) {
    req.isInternal = true;
    req.userId = req.headers['x-user-id'] as string || 'internal';
    next();
    return;
  }

  // Check for service secret key (service-to-service)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === SERVICE_SECRET_KEY) {
      req.userId = req.headers['x-user-id'] as string || 'service';
      next();
      return;
    }
  }

  // Check for user authentication (optional for some endpoints)
  const userToken = req.headers['x-auth-token'] as string;
  if (userToken) {
    // In production, verify JWT token here
    // For now, we'll accept any non-empty token and use it as userId
    req.userId = userToken;
    next();
    return;
  }

  // For development, allow requests without auth (with warning)
  if (process.env.NODE_ENV === 'development') {
    logger.warn('Request without authentication', {
      path: req.path,
      method: req.method,
    });
    req.userId = 'anonymous';
    next();
    return;
  }

  // In production, require authentication
  res.status(401).json({
    success: false,
    error: 'Authentication required',
    message: 'Please provide a valid authentication token',
  });
};

export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === SERVICE_SECRET_KEY) {
      req.userId = req.headers['x-user-id'] as string || 'service';
    }
  }

  // Don't fail if no auth - just continue without userId
  next();
};

export const requireInternalService = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken || internalToken !== INTERNAL_TOKEN) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Internal service access required',
    });
    return;
  }

  req.isInternal = true;
  req.userId = req.headers['x-user-id'] as string || 'internal';
  next();
};