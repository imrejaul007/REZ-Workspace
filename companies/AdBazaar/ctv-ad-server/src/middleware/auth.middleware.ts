import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    advertiserId?: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      advertiserId?: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
};

export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    try {
      const decoded = jwt.verify(parts[1], config.jwt.secret) as {
        userId: string;
        advertiserId?: string;
        role: string;
      };
      req.user = decoded;
    } catch {
      // Ignore invalid token for optional auth
    }
  }

  next();
};

export const generateToken = (payload: { userId: string; advertiserId?: string; role: string }): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
};