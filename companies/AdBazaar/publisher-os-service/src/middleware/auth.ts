import { Request, Response, NextFunction } from 'express';
import { publisherService } from '../services/index.js';
import { logger } from 'utils/logger.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      publisher?: {
        id: string;
        name: string;
        apiKey: string;
      };
      internalService?: {
        name: string;
        token: string;
      };
    }
  }
}

/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header for inter-service communication
 */
export const internalServiceAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    logger.warn('INTERNAL_SERVICE_TOKEN not configured');
    next();
    return;
  }

  if (!internalToken || internalToken !== expectedToken) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or missing internal service token'
    });
    return;
  }

  req.internalService = {
    name: req.headers['x-service-name'] as string || 'unknown',
    token: internalToken
  };

  next();
};

/**
 * Publisher API key authentication middleware
 * Validates X-Publisher-Key header for publisher-specific operations
 */
export const publisherApiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-publisher-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing publisher API key'
    });
    return;
  }

  try {
    const publisher = await publisherService.getByApiKey(apiKey);

    if (!publisher) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid publisher API key'
      });
      return;
    }

    if (publisher.status !== 'active') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Publisher account is not active'
      });
      return;
    }

    req.publisher = {
      id: publisher._id.toString(),
      name: publisher.name,
      apiKey: publisher.apiKey || ''
    };

    next();
  } catch (error) {
    logger.error('Publisher API key authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional publisher authentication
 * Sets publisher context if API key is present, but doesn't require it
 */
export const optionalPublisherAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-publisher-key'] as string;

  if (!apiKey) {
    next();
    return;
  }

  try {
    const publisher = await publisherService.getByApiKey(apiKey);

    if (publisher && publisher.status === 'active') {
      req.publisher = {
        id: publisher._id.toString(),
        name: publisher.name,
        apiKey: publisher.apiKey || ''
      };
    }
  } catch (error) {
    logger.warn('Optional publisher auth failed', { error });
  }

  next();
};

/**
 * Admin authentication middleware
 * Validates admin access for management operations
 */
export const adminAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const adminToken = req.headers['x-admin-token'] as string;
  const expectedToken = process.env.ADMIN_TOKEN;

  if (!expectedToken) {
    logger.warn('ADMIN_TOKEN not configured');
    next();
    return;
  }

  if (!adminToken || adminToken !== expectedToken) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid or missing admin token'
    });
    return;
  }

  next();
};

/**
 * Combined auth middleware - supports both internal service and publisher auth
 */
export const combinedAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Check internal service token first
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedInternalToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (internalToken && expectedInternalToken && internalToken === expectedInternalToken) {
    req.internalService = {
      name: req.headers['x-service-name'] as string || 'unknown',
      token: internalToken
    };
    next();
    return;
  }

  // Check publisher API key
  const apiKey = req.headers['x-publisher-key'] as string;

  if (apiKey) {
    try {
      const publisher = await publisherService.getByApiKey(apiKey);

      if (publisher && publisher.status === 'active') {
        req.publisher = {
          id: publisher._id.toString(),
          name: publisher.name,
          apiKey: publisher.apiKey || ''
        };
        next();
        return;
      }
    } catch (error) {
      logger.warn('Combined auth publisher check failed', { error });
    }
  }

  // Check admin token
  const adminToken = req.headers['x-admin-token'] as string;
  const expectedAdminToken = process.env.ADMIN_TOKEN;

  if (adminToken && expectedAdminToken && adminToken === expectedAdminToken) {
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message: 'Valid authentication required'
  });
};
