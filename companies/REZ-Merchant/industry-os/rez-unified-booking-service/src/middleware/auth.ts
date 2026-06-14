import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-middleware');

// ============================================
// JWT Authentication (for user-facing routes)
// ============================================

export interface JWTPayload {
  userId: string;
  email?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

/**
 * Simple JWT verification (for production, use jsonwebtoken library)
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    // In production, use proper JWT verification:
    // import jwt from 'jsonwebtoken';
    // return jwt.verify(token, secret) as JWTPayload;

    // For now, simple base64 decode (development only)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch {
    return null;
  }
}

/**
 * Authentication middleware for user routes
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No authorization header provided',
      },
    });
    return;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authorization header format',
      },
    });
    return;
  }

  const payload = verifyJWT(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
    return;
  }

  // Attach user to request
  req.user = {
    userId: payload.userId,
    email: payload.email,
    roles: payload.roles,
  };

  next();
}

// ============================================
// Internal API Token (for service-to-service communication)
// ============================================

export function verifyInternalToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getConfig();
  const internalToken = req.headers['x-internal-token'] as string;

  // If no internal token is configured, allow all requests
  // This is for development/testing environments
  if (!config.INTERNAL_API_KEY) {
    next();
    return;
  }

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'No internal token provided',
      },
    });
    return;
  }

  if (internalToken !== config.INTERNAL_API_KEY) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Invalid internal token',
      },
    });
    return;
  }

  next();
}

// ============================================
// Combined Authentication (either JWT or Internal Token)
// ============================================

export function authenticateAny(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const authHeader = req.headers.authorization;

  // If internal token is valid, allow
  if (internalToken) {
    const config = getConfig();
    if (config.INTERNAL_API_KEY && internalToken === config.INTERNAL_API_KEY) {
      req.user = {
        userId: 'internal-service',
        roles: ['service'],
      };
      next();
      return;
    }
  }

  // Otherwise, try JWT
  if (authHeader) {
    const [scheme, token] = authHeader.split(' ');
    if (scheme === 'Bearer' && token) {
      const payload = verifyJWT(token);
      if (payload) {
        req.user = {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles,
        };
        next();
        return;
      }
    }
  }

  // If neither worked, check if route allows anonymous access
  const publicRoutes = [
    '/health',
    '/api/v1/verticals',
    '/api/v1/search/availability',
    '/api/v1/search/merchants',
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    req.path.startsWith(route)
  );

  if (isPublicRoute) {
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    },
  });
}

// ============================================
// Role-Based Access Control
// ============================================

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole && !userRoles.includes('admin')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
}

// ============================================
// Request Logging
// ============================================

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  req.startTime = startTime;
  req.requestId = (req.headers['x-request-id'] as string) || `req-${Date.now()}`;

  // Log request
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
    });
  });

  next();
}

export default {
  authenticate,
  verifyInternalToken,
  authenticateAny,
  requireRoles,
  requestLogger,
  verifyJWT,
};