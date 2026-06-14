import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        brandId?: string;
        role?: string;
      };
    }
  }
}

/**
 * Verify internal service token for service-to-service communication
 */
export const verifyInternalToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Internal token required'
    });
    return;
  }

  if (token !== config.internalServiceToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal token'
    });
    return;
  }

  next();
};

/**
 * Verify user JWT token via RABTUL Auth service
 */
export const verifyAuthToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization token required'
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // Verify token with RABTUL Auth service
    const response = await axios.get(`${config.externalServices.auth}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });

    if (response.data.success) {
      req.user = {
        id: response.data.data.userId,
        brandId: response.data.data.brandId,
        role: response.data.data.role
      };
      next();
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Auth verification failed', { error });
    res.status(401).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

/**
 * Combined auth middleware - accepts either internal token or user auth
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Check for internal token first
  const internalToken = req.headers['x-internal-token'] as string;
  if (internalToken && internalToken === config.internalServiceToken) {
    req.user = { id: 'internal-service', role: 'service' };
    next();
    return;
  }

  // Otherwise verify user token
  await verifyAuthToken(req, res, next);
};

/**
 * Optional auth - doesn't fail if no token provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const response = await axios.get(`${config.externalServices.auth}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 5000
    });

    if (response.data.success) {
      req.user = {
        id: response.data.data.userId,
        brandId: response.data.data.brandId,
        role: response.data.data.role
      };
    }
  } catch (error) {
    // Ignore auth errors for optional auth
    logger.debug('Optional auth failed', { error });
  }

  next();
};

/**
 * Role-based access control
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role || '')) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Brand ownership check
 */
export const requireBrandAccess = (brandIdParam: string = 'brandId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const requestedBrandId = req.params[brandIdParam] || req.query[brandIdParam];

    // Allow if user is admin or if brand IDs match
    if (req.user.role === 'admin' || req.user.brandId === requestedBrandId) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied to this brand'
      });
    }
  };
};