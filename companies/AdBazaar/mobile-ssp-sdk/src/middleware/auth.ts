import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { JWTPayload, AuthContext } from '../types/index.js';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * JWT Authentication middleware
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing',
      });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token missing',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    req.auth = {
      publisherId: decoded.publisherId,
      email: decoded.email,
    };

    next();
  } catch (error) {
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

    res.status(500).json({
      success: false,
      error: 'Authentication error',
    });
  }
};

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    req.auth = {
      publisherId: decoded.publisherId,
      email: decoded.email,
    };

    next();
  } catch {
    // Token invalid or expired, continue without auth
    next();
  }
};

/**
 * API Key authentication for SDK endpoints
 */
export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'API key missing',
    });
    return;
  }

  // In production, validate against stored API keys
  // For now, we'll just pass through
  next();
};

/**
 * Generate JWT token for publisher
 */
export const generateToken = (publisherId: string, email: string): string => {
  return jwt.sign(
    { publisherId, email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
};