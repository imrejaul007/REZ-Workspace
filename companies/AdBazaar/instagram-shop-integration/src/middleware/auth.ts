import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  isInternalService?: boolean;
}

/**
 * Authentication middleware for protected routes
 * Validates the internal service token or user JWT
 */
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check for internal service token
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken && internalToken === config.internal.serviceToken) {
      req.isInternalService = true;
      next();
      return;
    }

    // Check for user authentication (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Validate token and extract user ID
      // In production, this would validate a JWT or session token
      if (token && token.length > 10) {
        // Simple validation for demo - in production use proper JWT validation
        req.userId = extractUserIdFromToken(token);
        next();
        return;
      }
    }

    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  } catch (error) {
    logger.error('Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Webhook signature verification middleware
 */
export const verifyWebhookSignature = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers['x-hub-signature'] as string;

    if (!signature) {
      res.status(401).json({
        success: false,
        error: 'Missing webhook signature',
      });
      return;
    }

    // Verify Facebook webhook signature
    const crypto = await import('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', config.instagram.appSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== `sha256=${expectedSignature}`) {
      res.status(401).json({
        success: false,
        error: 'Invalid webhook signature',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Webhook signature verification error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Signature verification failed',
    });
  }
};

/**
 * Optional auth - allows both authenticated and anonymous requests
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token && token.length > 10) {
      req.userId = extractUserIdFromToken(token);
    }
  }
  next();
};

/**
 * Rate limiting helper for specific endpoints
 */
export const rateLimitOptions = {
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  strict: {
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 requests per window
  },
  webhook: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 requests per window
  },
};

/**
 * Extract user ID from token (simplified - use proper JWT validation in production)
 */
function extractUserIdFromToken(token: string): string {
  // In production, decode JWT and extract user ID
  // For now, return a hash of the token as a pseudo user ID
  return `user_${token.substring(0, 20)}`;
}

export default authMiddleware;