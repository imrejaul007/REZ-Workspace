/**
 * LEDGERAI - Authentication Middleware
 * JWT-based authentication and authorization
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from './logger';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'accountant' | 'user';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
        code: 'NO_AUTH_HEADER'
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>',
        code: 'INVALID_AUTH_FORMAT'
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
        code: 'NO_TOKEN'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    req.user = decoded;

    logger.info('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      path: req.path
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

export const authorize = (...roles: Array<'admin' | 'accountant' | 'user'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles
      });
      return;
    }

    next();
  };
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;

    next();
  } catch {
    // Token invalid but auth is optional, continue
    next();
  }
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};