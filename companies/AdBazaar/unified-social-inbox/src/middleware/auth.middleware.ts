import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { AuthenticatedRequest } from '../types';
import { createModuleLogger } from 'utils/logger.js';

const logger = createModuleLogger('AuthMiddleware');

/**
 * Authentication middleware
 * Verifies JWT token via RABTUL auth service
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token via RABTUL auth service
    const response = await axios.get(`${config.auth.serviceUrl}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    if (response.data.success && response.data.user) {
      req.user = {
        id: response.data.user.id,
        accountId: response.data.user.accountId || response.data.user.account_id,
        role: response.data.user.role || 'user',
      };
      next();
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
    }
  } catch (error) {
    logger.error('Authentication failed', { error });

    // For development, allow bypass with mock user
    if (config.nodeEnv === 'development' && process.env.SKIP_AUTH === 'true') {
      req.user = {
        id: 'dev-user-001',
        accountId: 'dev-account-001',
        role: 'admin',
      };
      next();
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Authorization middleware - check role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Account ID extraction middleware
 * Extracts accountId from user or query params
 */
export const extractAccountId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Account ID should be set by authenticate middleware
  if (!req.user?.accountId) {
    // Allow accountId in query for specific endpoints
    const accountId = req.query.accountId as string;
    if (accountId) {
      req.user = req.user || ({} as AuthenticatedRequest['user']);
      req.user.accountId = accountId;
    }
  }
  next();
};