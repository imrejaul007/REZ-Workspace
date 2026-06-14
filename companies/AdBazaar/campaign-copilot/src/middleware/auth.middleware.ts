import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../services/logger.js';
import type { AuthPayload } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header is required',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authorization format. Use: Bearer <token>',
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;

    // Validate required fields
    if (!decoded.advertiserId || !decoded.userId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token payload',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
      return;
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

// Optional auth - sets user if token present but doesn't require it
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
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
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = decoded;
  } catch {
    // Token invalid, but continue without user
  }

  next();
}

// Generate JWT token (for testing)
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '24h',
  });
}