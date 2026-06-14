import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

export interface JwtPayload {
  userId: string;
  merchantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      isInternalCall?: boolean;
    }
  }
}

export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header missing',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    });

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

export const authenticateInternal = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    req.isInternalCall = false;
    next();
    return;
  }

  if (internalToken === config.auth.internalToken) {
    req.isInternalCall = true;
    logger.debug('Internal service call authenticated', {
      path: req.path,
      ip: req.ip,
    });
  } else {
    logger.warn('Invalid internal token attempted', {
      path: req.path,
      ip: req.ip,
    });
  }

  next();
};

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If internal token is valid, allow the request
  if (req.isInternalCall) {
    next();
    return;
  }

  // Otherwise, require JWT authentication
  authenticateJwt(req, res, next);
};

export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
    req.user = decoded;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

export const requireMerchantAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user && !req.isInternalCall) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Internal calls have full access
  if (req.isInternalCall) {
    next();
    return;
  }

  // For user access, merchant ID must match or user must have admin role
  const merchantId = req.params.merchantId || req.body.merchantId;
  if (merchantId && req.user?.merchantId !== merchantId && req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Access denied to this merchant',
    });
    return;
  }

  next();
};