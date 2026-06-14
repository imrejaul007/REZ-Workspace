import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { logger } from 'utils/logger.js';

export interface JwtPayload {
  userId: string;
  advertiserId?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ success: false, error: 'No authorization header provided' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ success: false, error: 'Invalid authorization format. Use: Bearer <token>' });
      return;
    }

    const token = parts[1];

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      advertiserId: decoded.advertiserId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    logger.error('Auth middleware error', { error });
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
}

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
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
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = {
        userId: decoded.userId,
        advertiserId: decoded.advertiserId,
        role: decoded.role,
      };
    } catch {
      // Token invalid but optional, continue without user
    }

    next();
  } catch {
    next();
  }
}

export function advertiserOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (!req.user.advertiserId && req.user.role !== 'advertiser') {
    res.status(403).json({ success: false, error: 'Advertiser access required' });
    return;
  }

  next();
}