import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from 'utils/logger.js';
import { JWTPayload } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      advertiserId?: string;
    }
  }
}

export interface AuthOptions {
  required?: boolean;
  roles?: string[];
}

export const authenticate = (options: AuthOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        if (options.required) {
          res.status(401).json({
            success: false,
            error: 'Authorization header required'
          });
          return;
        }
        next();
        return;
      }

      const [scheme, token] = authHeader.split(' ');

      if (scheme !== 'Bearer' || !token) {
        res.status(401).json({
          success: false,
          error: 'Invalid authorization format. Use: Bearer <token>'
        });
        return;
      }

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

        // Check roles if specified
        if (options.roles && options.roles.length > 0) {
          const hasRole = options.roles.includes(decoded.role);
          if (!hasRole) {
            res.status(403).json({
              success: false,
              error: 'Insufficient permissions'
            });
            return;
          }
        }

        req.user = decoded;
        req.advertiserId = decoded.advertiserId;
        next();

      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          res.status(401).json({
            success: false,
            error: 'Token expired'
          });
          return;
        }

        if (jwtError instanceof jwt.JsonWebTokenError) {
          res.status(401).json({
            success: false,
            error: 'Invalid token'
          });
          return;
        }

        throw jwtError;
      }

    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  };
};

// Optional authentication - sets user if token present, but doesn't require it
export const optionalAuth = authenticate({ required: false });

// Required authentication - always expects valid token
export const requireAuth = authenticate({ required: true });

// Admin-only route
export const requireAdmin = authenticate({ required: true, roles: ['admin'] });

// Generate JWT token (for testing)
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

export default {
  authenticate,
  optionalAuth,
  requireAuth,
  requireAdmin,
  generateToken
};