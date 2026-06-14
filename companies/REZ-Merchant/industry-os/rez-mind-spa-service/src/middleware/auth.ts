import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

// Extended Request type with user info
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    merchantId?: string;
    roles?: string[];
    type: 'jwt' | 'internal';
  };
  isInternalRequest?: boolean;
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  merchantId?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

// Verify JWT token
const verifyJWT = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.jwtSecret) as JWTPayload;
  } catch (error) {
    return null;
  }
};

// Generate JWT token (for testing/internal use)
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

// Authentication middleware - accepts either JWT or internal token
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check for internal token first (service-to-service)
  const internalToken = req.headers['x-internal-token'] as string;
  if (internalToken && internalToken === config.internalToken) {
    req.isInternalRequest = true;
    req.user = {
      userId: 'internal-service',
      type: 'internal',
    };
    next();
    return;
  }

  // Check for JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Provide either Bearer token or X-Internal-Token.',
      },
    };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyJWT(token);

  if (!payload) {
    logger.warn('Invalid or expired JWT token', {
      ip: req.ip,
      path: req.path,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token is invalid or expired.',
      },
    };
    res.status(401).json(response);
    return;
  }

  req.user = {
    userId: payload.userId,
    merchantId: payload.merchantId,
    roles: payload.roles,
    type: 'jwt',
  };

  next();
};

// Strict authentication - requires valid JWT (no internal token fallback)
export const authenticateStrict = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'JWT authentication required.',
      },
    };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyJWT(token);

  if (!payload) {
    logger.warn('Invalid or expired JWT token in strict auth', {
      ip: req.ip,
      path: req.path,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token is invalid or expired.',
      },
    };
    res.status(401).json(response);
    return;
  }

  req.user = {
    userId: payload.userId,
    merchantId: payload.merchantId,
    roles: payload.roles,
    type: 'jwt',
  };

  next();
};

// Merchant authorization middleware
export const authorizeMerchant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Internal requests bypass merchant authorization
  if (req.isInternalRequest) {
    next();
    return;
  }

  const merchantId = req.params.merchantId || req.body?.merchantId;

  // Allow if user is associated with the merchant
  if (req.user?.merchantId && req.user.merchantId !== merchantId) {
    logger.warn('Merchant authorization failed', {
      userId: req.user.userId,
      requestedMerchantId: merchantId,
      userMerchantId: req.user.merchantId,
    });
    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not authorized to access this merchant resource.',
      },
    };
    res.status(403).json(response);
    return;
  }

  next();
};

// Role-based authorization
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (req.isInternalRequest) {
      next();
      return;
    }

    if (!req.user?.roles || !req.user.roles.some((role) => allowedRoles.includes(role))) {
      logger.warn('Role authorization failed', {
        userId: req.user?.userId,
        userRoles: req.user?.roles,
        requiredRoles: allowedRoles,
      });
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have the required role for this action.',
        },
      };
      res.status(403).json(response);
      return;
    }

    next();
  };
};

// Optional authentication - continues even without auth
export const authenticateOptional = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Check for internal token first
  const internalToken = req.headers['x-internal-token'] as string;
  if (internalToken && internalToken === config.internalToken) {
    req.isInternalRequest = true;
    req.user = {
      userId: 'internal-service',
      type: 'internal',
    };
    next();
    return;
  }

  // Check for JWT token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyJWT(token);
    if (payload) {
      req.user = {
        userId: payload.userId,
        merchantId: payload.merchantId,
        roles: payload.roles,
        type: 'jwt',
      };
    }
  }

  next();
};
