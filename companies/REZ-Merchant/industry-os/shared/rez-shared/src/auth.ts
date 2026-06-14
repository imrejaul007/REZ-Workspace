import { Request, Response, NextFunction, RequestHandler } from 'express';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'auth' });

export interface AuthOptions {
  authServiceUrl: string;
  internalToken: string;
  excludePaths?: string[];
}

/**
 * JWT Token payload from auth service
 */
export interface TokenPayload {
  userId: string;
  phone?: string;
  email?: string;
  role?: string;
  merchantId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extended Express Request with auth user
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
  isInternal?: boolean;
}

/**
 * Create authentication middleware for API routes
 */
export function createAuthMiddleware(options: AuthOptions): RequestHandler {
  const { authServiceUrl, internalToken, excludePaths = ['/health', '/healthz', '/ready'] } = options;

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (excludePaths.includes(req.path)) {
      return next();
    }

    // Check for internal service token
    const internalTokenHeader = req.headers['x-internal-token'] as string;
    if (internalTokenHeader && internalTokenHeader === internalToken) {
      req.isInternal = true;
      return next();
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const token = authHeader.substring(7);

    try {
      // Verify token with auth service
      const response = await fetch(`${authServiceUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Internal-Token': internalToken,
        },
      });

      if (!response.ok) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        });
      }

      const data = await response.json();
      req.user = data.user || data;
      next();
    } catch (error) {
      logger.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_SERVICE_ERROR',
          message: 'Authentication service unavailable',
        },
      });
    }
  };
}

/**
 * Create internal service authentication middleware
 */
export function createInternalAuthMiddleware(internalToken: string): RequestHandler {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers['x-internal-token'] as string;

    if (!token || token !== internalToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_INTERNAL_TOKEN',
          message: 'Invalid internal service token',
        },
      });
    }

    req.isInternal = true;
    next();
  };
}

/**
 * Optional auth - continues even if no auth
 */
export function createOptionalAuthMiddleware(options: AuthOptions): RequestHandler {
  const authMiddleware = createAuthMiddleware(options);

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const internalToken = req.headers['x-internal-token'];

    if (!authHeader && !internalToken) {
      // No auth provided, continue without user
      return next();
    }

    // If auth provided, run through auth middleware
    return authMiddleware(req, res, next);
  };
}

export default { createAuthMiddleware, createInternalAuthMiddleware, createOptionalAuthMiddleware };
