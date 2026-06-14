import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { JWTPayload } from '../types/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT Authentication middleware
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: 'Authorization header is required',
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
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: Array<'publisher' | 'advertiser' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required roles: ${roles.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Company-based authorization middleware
 */
export function requireCompanyType(...companyTypes: Array<'publisher' | 'advertiser'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!companyTypes.includes(req.user.companyType)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required company types: ${companyTypes.join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Optional auth middleware - doesn't fail if no token
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
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
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JWTPayload;

    req.user = decoded;
  } catch {
    // Ignore errors for optional auth
  }

  next();
}

/**
 * Generate JWT token for testing
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
}