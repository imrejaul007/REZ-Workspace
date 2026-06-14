import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { JWTPayload } from '../types/index.js';

/**
 * JWT Authentication middleware
 */
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'No authorization header provided',
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

    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
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
}

/**
 * Optional authentication middleware
 * Sets user if token is valid, but doesn't require it
 */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
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

    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as JWTPayload;

    req.user = decoded;
    next();
  } catch {
    // Token is invalid, but we allow request to proceed
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * API Key authentication for service-to-service communication
 */
export function apiKeyMiddleware(apiKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const providedKey = req.headers['x-api-key'] as string;

    if (!providedKey) {
      res.status(401).json({
        success: false,
        error: 'API key required',
      });
      return;
    }

    if (providedKey !== apiKey) {
      res.status(403).json({
        success: false,
        error: 'Invalid API key',
      });
      return;
    }

    next();
  };
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
    }) as JWTPayload;
  } catch {
    return null;
  }
}