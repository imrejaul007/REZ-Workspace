/**
 * Authentication Middleware for Caption Generator AI Service
 * Validates RABTUL auth tokens for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

/**
 * Auth middleware that verifies user tokens via RABTUL Auth Service
 */
export function authMiddleware(authUrl: string, internalToken: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from Authorization header or X-Internal-Token
      const authHeader = req.headers.authorization;
      const internalTokenHeader = req.headers['x-internal-token'] as string;

      // Allow internal service calls
      if (internalTokenHeader === internalToken) {
        req.body.userId = req.headers['x-user-id'] as string || 'internal';
        next();
        return;
      }

      // Check for user token
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const token = authHeader.substring(7);

      // Verify token with RABTUL Auth
      try {
        const response = await axios.get(`${authUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Internal-Token': internalToken,
          },
          timeout: 5000,
        });

        // Attach user info to request
        req.body.userId = response.data.data?.userId || response.data.userId;
        next();
      } catch (error) {
        logger.warn('Auth verification failed', { error: axios.isAxiosError(error) ? error.message : 'Unknown' });
        res.status(401).json({
          success: false,
          error: 'Invalid or expired token',
        });
      }
    } catch (error) {
      logger.error('Auth middleware error:', { error: error instanceof Error ? error.message : 'Unknown' });
      res.status(500).json({
        success: false,
        error: 'Authentication service error',
      });
    }
  };
}

/**
 * Optional auth - sets userId if token provided, but doesn't require it
 */
export function optionalAuthMiddleware(authUrl: string, internalToken: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
      }

      const token = authHeader.substring(7);

      try {
        const response = await axios.get(`${authUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Internal-Token': internalToken,
          },
          timeout: 5000,
        });

        req.body.userId = response.data.data?.userId || response.data.userId;
      } catch {
        // Ignore auth errors for optional auth
      }

      next();
    } catch {
      next();
    }
  };
}