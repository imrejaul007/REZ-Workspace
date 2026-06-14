import { Request, Response, NextFunction } from 'express';
import { PinterestAccount } from '../models';
import logger from 'utils/logger.js';

export interface IAuthenticatedRequest extends Request {
  userId?: string;
  accountId?: string;
  pinterestAccountId?: string;
}

/**
 * Authentication middleware that verifies the request has valid auth headers
 * and attaches user/account info to the request object
 */
export const authMiddleware = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Authorization header is required',
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token is required',
      });
      return;
    }

    // In a real implementation, you would verify the JWT token here
    // For now, we'll look up the account by a header that contains the pinterestUserId
    const pinterestUserId = req.headers['x-pinterest-user-id'] as string;

    if (!pinterestUserId) {
      res.status(401).json({
        success: false,
        error: 'X-Pinterest-User-Id header is required',
      });
      return;
    }

    const account = await PinterestAccount.findOne({ pinterestUserId });

    if (!account) {
      res.status(401).json({
        success: false,
        error: 'Pinterest account not found',
      });
      return;
    }

    // Attach user info to request
    req.userId = account.pinterestUserId;
    req.accountId = account.id;
    req.pinterestAccountId = account._id?.toString();

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Optional auth middleware that doesn't require authentication
 * but will attach user info if token is provided
 */
export const optionalAuthMiddleware = async (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const pinterestUserId = req.headers['x-pinterest-user-id'] as string;

    if (token && pinterestUserId) {
      const account = await PinterestAccount.findOne({ pinterestUserId });
      if (account) {
        req.userId = account.pinterestUserId;
        req.accountId = account.id;
        req.pinterestAccountId = account._id?.toString();
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

/**
 * Internal service auth middleware for service-to-service communication
 */
export const internalAuthMiddleware = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Internal token is required',
    });
    return;
  }

  // In production, verify the internal token against a secret
  if (internalToken !== process.env.INTERNAL_SERVICE_TOKEN) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal token',
    });
    return;
  }

  next();
};
