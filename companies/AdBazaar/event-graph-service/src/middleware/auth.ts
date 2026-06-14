import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';

const authLogger = logger.child({ component: 'AuthMiddleware' });

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      serviceToken?: string;
      isInternalService?: boolean;
    }
  }
}

/**
 * Internal service authentication middleware
 * Validates internal service tokens for inter-service communication
 */
export const internalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const serviceToken = req.headers['x-internal-token'] as string;

  if (!serviceToken) {
    // Allow unauthenticated access for development
    if (process.env.NODE_ENV === 'development') {
      req.isInternalService = true;
      next();
      return;
    }

    authLogger.warn('Missing service token', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Service token required'
      }
    });
    return;
  }

  // Validate token format (simple check)
  if (serviceToken.length < 32) {
    authLogger.warn('Invalid service token format', {
      path: req.path,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid service token format'
      }
    });
    return;
  }

  req.serviceToken = serviceToken;
  req.isInternalService = true;
  next();
};

/**
 * Optional authentication middleware
 * Sets user context if token is present, but doesn't block if missing
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  // In production, validate JWT and extract user info
  if (process.env.NODE_ENV === 'production') {
    try {
      // TODO: Implement JWT validation
      // const decoded = verifyToken(token);
      // req.userId = decoded.userId;
    } catch (error) {
      authLogger.warn('Invalid auth token', { error });
    }
  } else {
    // Development mode - extract user ID from token
    req.userId = token;
  }

  next();
};

/**
 * API key authentication for external clients
 */
export const apiKeyAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

  if (validApiKeys.length === 0) {
    // Allow unauthenticated access in development
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'API keys not configured'
      }
    });
    return;
  }

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    authLogger.warn('Invalid API key', {
      path: req.path,
      ip: req.ip
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid or missing API key'
      }
    });
    return;
  }

  next();
};

export default {
  internalServiceAuth,
  optionalAuth,
  apiKeyAuth
};