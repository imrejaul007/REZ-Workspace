/**
 * JWT Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

export interface JwtPayload {
  userId: string;
  role: string;
  permissions?: string[];
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, error: 'No authorization header' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ success: false, error: 'Invalid authorization format' });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = jwt.verify(parts[1], config.jwt.secret) as JwtPayload;
      req.user = decoded;
    } catch {
      // Token invalid but optional - continue without user
    }
  }

  next();
}