import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { getRABTULIntegration } from '../services/rabtul.integration.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        phone?: string;
        email?: string;
        name?: string;
        avatar?: string;
      };
    }
  }
}

// JWT payload interface
export interface JWTPayload {
  userId: string;
  phone?: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

// Verify JWT token (local verification first, then RABTUL if needed)
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header' });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // First try local JWT verification
    let decoded: JWTPayload;

    try {
      decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch {
      // Not a local token, try RABTUL verification
      try {
        const rabtul = getRABTULIntegration();
        const user = await rabtul.verifyToken(token);

        if (!user) {
          res.status(401).json({ error: 'Invalid token' });
          return;
        }

        decoded = {
          userId: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
        };
      } catch {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
    }

    req.userId = decoded.userId;
    req.user = {
      id: decoded.userId,
      phone: decoded.phone,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
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

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        phone: decoded.phone,
        email: decoded.email,
      };

      next();
    } catch {
      // Invalid token, but optional auth so continue
      next();
    }
  } catch {
    // Error parsing token, but optional auth so continue
    next();
  }
}

// Internal service authentication (for service-to-service calls)
export function internalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({ error: 'No internal token' });
    return;
  }

  if (internalToken !== config.rez.internalToken) {
    res.status(403).json({ error: 'Invalid internal token' });
    return;
  }

  next();
}

// Generate JWT token (for local testing)
export function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>
): string {
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

// Verify token without middleware
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  } catch {
    return null;
  }
}
