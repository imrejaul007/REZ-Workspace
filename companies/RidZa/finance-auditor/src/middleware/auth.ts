/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user info to request
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export interface JWTPayload {
  tenantId: string;
  userId: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Authenticate incoming requests using JWT
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided'
      });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Use: Bearer <token>'
      });
      return;
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Attach authenticated user info to request
      (req as AuthenticatedRequest).tenantId = decoded.tenantId;
      (req as AuthenticatedRequest).userId = decoded.userId;
      (req as AuthenticatedRequest).roles = decoded.roles || [];

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
        return;
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        });
        return;
      }
      throw jwtError;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication - continues even without token
 */
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        (req as AuthenticatedRequest).tenantId = decoded.tenantId;
        (req as AuthenticatedRequest).userId = decoded.userId;
        (req as AuthenticatedRequest).roles = decoded.roles || [];
      } catch {
        // Token invalid, but continue without auth
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
}

/**
 * Require specific roles
 */
export function requireRoles(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.roles || authReq.roles.length === 0) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'No roles assigned to user'
      });
      return;
    }

    const hasRole = requiredRoles.some(role => authReq.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required roles: ${requiredRoles.join(', ')}`
      });
      return;
    }

    next();
  };
}

/**
 * Generate a JWT token (for testing/internal use)
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}