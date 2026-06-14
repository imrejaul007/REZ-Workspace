import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  isInternal?: boolean;
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication middleware
 * Validates JWT token from Authorization header
 */
export const jwtAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided'
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      req.userId = decoded.userId;
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }
  } catch (error) {
    logger.error('JWT auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Internal token authentication
 * Used for service-to-service communication
 */
export const internalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const internalToken = req.headers['x-internal-token'] as string;

    if (!internalToken) {
      res.status(401).json({
        success: false,
        error: 'No internal token provided'
      });
      return;
    }

    if (internalToken !== config.INTERNAL_TOKEN) {
      logger.warn('Invalid internal token attempt');
      res.status(403).json({
        success: false,
        error: 'Invalid internal token'
      });
      return;
    }

    req.isInternal = true;
    next();
  } catch (error) {
    logger.error('Internal auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal authentication error'
    });
  }
};

/**
 * Combined auth middleware - accepts either JWT or internal token
 */
export const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (internalToken) {
    return internalAuth(req, res, next);
  }

  return jwtAuth(req, res, next);
};

/**
 * Optional auth - attaches user info if token present, but doesn't require it
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const internalToken = req.headers['x-internal-token'] as string;

  if (internalToken && internalToken === config.INTERNAL_TOKEN) {
    req.isInternal = true;
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
      req.userId = decoded.userId;
    } catch (error) {
      // Token is invalid, but we continue without user info
      logger.debug('Optional auth: invalid token, continuing without user');
    }
  }

  next();
};

/**
 * Generate a JWT token for testing
 */
export const generateToken = (userId: string, expiresIn: string = '7d'): string => {
  return jwt.sign({ userId }, config.JWT_SECRET, { expiresIn });
};

export default {
  jwtAuth,
  internalAuth,
  auth,
  optionalAuth,
  generateToken
};