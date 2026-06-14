import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { createLogger } from '../utils/index.js';

const logger = createLogger('AuthMiddleware');

export interface AuthRequest extends Request {
  user?: {
    publisherId: string;
    apiKey: string;
  };
}

// JWT authentication middleware
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        publisherId: string;
        apiKey: string;
      };

      req.user = {
        publisherId: decoded.publisherId,
        apiKey: decoded.apiKey,
      };

      next();
    } catch (error) {
      logger.warn('Invalid JWT token');
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Optional auth - continues even if no token
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        publisherId: string;
        apiKey: string;
      };

      req.user = {
        publisherId: decoded.publisherId,
        apiKey: decoded.apiKey,
      };
    } catch {
      // Ignore invalid token for optional auth
    }

    next();
  } catch (error) {
    next();
  }
}

// API Key authentication for SDK endpoints
export function apiKeyAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    // Extract publisherId from API key (format: sk_xxxx)
    if (!apiKey.startsWith('sk_')) {
      res.status(401).json({ error: 'Invalid API key format' });
      return;
    }

    // For now, we use publisherId as the API key reference
    // In production, you'd validate against a stored API key
    req.user = {
      publisherId: apiKey.replace('sk_', 'pub_'),
      apiKey,
    };

    next();
  } catch (error) {
    logger.error('API key auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

// Generate JWT token for publisher
export function generateToken(publisherId: string, apiKey: string): string {
  return jwt.sign(
    { publisherId, apiKey },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}