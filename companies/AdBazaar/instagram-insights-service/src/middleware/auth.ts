import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createChildLogger } from '../config/logger';

const logger = createChildLogger('auth-middleware');

// Request validation schema
export const RequestHeadersSchema = z.object({
  'x-api-key': z.string().optional(),
  'x-internal-token': z.string().optional(),
  authorization: z.string().optional(),
});

// API Key validation schema
export const ApiKeySchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
});

// Internal service token validation
export const InternalTokenSchema = z.object({
  internalToken: z.string().min(1, 'Internal token is required'),
});

// JWT payload schema
export interface JwtPayload {
  userId: string;
  accountId: string;
  role: string;
  permissions: string[];
  exp?: number;
  iat?: number;
}

// Extended Express Request with user info
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  apiKey?: string;
  isInternalRequest?: boolean;
}

// Middleware to validate API key
export const validateApiKey = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('Missing API key in request');
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
      },
    });
    return;
  }

  // Validate API key format (basic validation)
  const validation = ApiKeySchema.safeParse({ apiKey });
  if (!validation.success) {
    logger.warn('Invalid API key format', { apiKey: apiKey.substring(0, 8) + '...' });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key format',
      },
    });
    return;
  }

  // In production, validate against stored API keys
  // For now, we just attach the API key to the request
  req.apiKey = apiKey;
  next();
};

// Middleware to validate internal service token
export const validateInternalToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    logger.warn('Missing internal token in request');
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_INTERNAL_TOKEN',
        message: 'Internal service token is required',
      },
    });
    return;
  }

  // Validate internal token format
  const validation = InternalTokenSchema.safeParse({ internalToken });
  if (!validation.success) {
    logger.warn('Invalid internal token format');
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_INTERNAL_TOKEN',
        message: 'Invalid internal token format',
      },
    });
    return;
  }

  // In production, validate token against service registry
  req.isInternalRequest = true;
  next();
};

// Middleware to extract Bearer token from Authorization header
export const extractBearerToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No bearer token, continue without user
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    // In production, verify JWT token
    // For now, we'll just log it
    logger.debug('Bearer token received', { tokenPrefix: token.substring(0, 20) + '...' });
    next();
  } catch (error) {
    logger.error('Error parsing bearer token', { error });
    next();
  }
};

// Middleware to check required permissions
export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

    const userPermissions = req.user.permissions || [];
    const hasAllPermissions = requiredPermissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasAllPermissions) {
      logger.warn('Insufficient permissions', {
        userId: req.user.userId,
        required: requiredPermissions,
        actual: userPermissions,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have the required permissions for this action',
        },
      });
      return;
    }

    next();
  };
};

// Optional auth middleware - attaches user if token present but doesn't require it
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const internalToken = req.headers['x-internal-token'] as string;

  if (apiKey) {
    req.apiKey = apiKey;
  }

  if (internalToken) {
    req.isInternalRequest = true;
  }

  next();
};

// Rate limiting by API key (placeholder for actual implementation)
export const apiKeyRateLimiter = (
  _limit: number = 100,
  _windowMs: number = 60000
) => {
  return (_req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    // In production, implement actual rate limiting
    // using Redis or similar
    next();
  };
};
