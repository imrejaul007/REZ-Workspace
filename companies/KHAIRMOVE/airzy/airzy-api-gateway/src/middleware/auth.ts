import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { logger } from '../utils/logger';
import { UnauthorizedError, ApiKeyError } from '../utils/errors';
import { TokenPayload, ApiKeyInfo } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      apiKey?: ApiKeyInfo;
      requestId: string;
      startTime: number;
    }
  }
}

// JWT Authentication middleware
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer
      }) as TokenPayload;

      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired');
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Authentication failed');
    }
  } catch (error) {
    next(error);
  }
};

// API Key authentication middleware
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers[config.apiKeys.headerName] as string;

    if (!apiKey) {
      throw new ApiKeyError('Missing API key');
    }

    // In production, validate against database/Redis
    // For now, we'll decode a simple format: keyId:tenantId:permissions
    const parts = apiKey.split(':');
    if (parts.length < 2) {
      throw new ApiKeyError('Invalid API key format');
    }

    req.apiKey = {
      keyId: parts[0],
      tenantId: parts[1],
      permissions: parts[2]?.split(',') || []
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Combined authentication middleware (JWT or API Key)
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers[config.apiKeys.headerName] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJWT(req, res, next);
  }

  if (apiKey) {
    return authenticateApiKey(req, res, next);
  }

  // Allow unauthenticated access for public endpoints
  next();
};

// Optional authentication - doesn't fail if no auth provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers[config.apiKeys.headerName] as string;

  if (authHeader || apiKey) {
    return authenticate(req, res, next);
  }

  next();
};

// Role-based authorization middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const userRoles = req.user.roles || [];
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

// Tenant isolation middleware
export const requireTenant = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.user?.tenantId || req.headers[config.apiKeys.headerTenant] as string;

  if (!tenantId) {
    return next(new UnauthorizedError('Tenant ID required'));
  }

  if (req.user) {
    req.user.tenantId = tenantId;
  }

  next();
};

// Custom API Key error
class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

// Generate JWT token (for testing/development)
export const generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    issuer: config.jwt.issuer,
    expiresIn: config.jwt.expiresIn
  });
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer
  }) as TokenPayload;
};

export default {
  authenticateJWT,
  authenticateApiKey,
  authenticate,
  optionalAuth,
  authorize,
  requireTenant,
  generateToken,
  verifyToken
};