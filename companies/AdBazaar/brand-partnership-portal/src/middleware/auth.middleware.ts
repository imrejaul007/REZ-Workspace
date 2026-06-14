/**
 * Auth Middleware for brand-partnership-portal
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from 'utils/logger.js';
import { RABTUL } from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  isInternal?: boolean;
}

// Verify user with RABTUL Auth
export async function verifyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    // Allow internal service calls
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken && internalToken === RABTUL.INTERNAL_TOKEN) {
      req.isInternal = true;
      req.userId = req.headers['x-user-id'] as string || 'internal';
      next();
      return;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authorization header required' });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with RABTUL Auth service
    try {
      const response = await axios.get(`${RABTUL.AUTH_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Internal-Token': RABTUL.INTERNAL_TOKEN
        }
      });

      if (response.data.success && response.data.data) {
        req.userId = response.data.data.userId;
        req.userRole = response.data.data.role;
        next();
      } else {
        res.status(401).json({ success: false, error: 'Invalid token' });
      }
    } catch (authError) {
      logger.error('Auth verification failed:', authError);
      res.status(401).json({ success: false, error: 'Token verification failed' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
}

// Optional auth - doesn't fail if no token
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const response = await axios.get(`${RABTUL.AUTH_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Internal-Token': RABTUL.INTERNAL_TOKEN
        }
      });

      if (response.data.success && response.data.data) {
        req.userId = response.data.data.userId;
        req.userRole = response.data.data.role;
      }
    } catch {
      // Ignore auth errors for optional auth
    }

    next();
  } catch {
    next();
  }
}

// Brand access control - ensure user owns the brand
export async function brandAccessControl(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { Brand } = require('../models');
    const brandId = req.params.id || req.params.brandId;

    if (!brandId) {
      res.status(400).json({ success: false, error: 'Brand ID required' });
      return;
    }

    const brand = await Brand.findOne({ brandId });

    if (!brand) {
      res.status(404).json({ success: false, error: 'Brand not found' });
      return;
    }

    // Check ownership (unless internal service call)
    if (!req.isInternal && brand.userId !== req.userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    req.userId = brand.userId; // Set userId from brand owner
    next();
  } catch (error) {
    logger.error('Brand access control error:', error);
    res.status(500).json({ success: false, error: 'Access control error' });
  }
}

// Admin-only route guard
export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin' && !req.isInternal) {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return;
  }
  next();
}