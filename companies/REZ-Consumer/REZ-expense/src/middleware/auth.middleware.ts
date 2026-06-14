/**
 * RABTUL Auth Middleware for REZ-Expense
 * Validates user tokens via RABTUL Auth Service
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.RABTUL_AUTH_URL || 'https://rez-auth.rezapp.com';

export interface AuthUser {
  userId: string;
  email?: string;
  phone?: string;
  name?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authenticate request via RABTUL Auth Service
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });

      if (response.data?.user) {
        req.user = response.data.user;
        next();
      } else {
        res.status(401).json({ error: 'Invalid token response' });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        res.status(401).json({ error: 'Invalid or expired token' });
      } else {
        // Fallback: allow request but without user context
        console.warn('RABTUL Auth unavailable, proceeding without user validation');
        next();
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');

      try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        });

        if (response.data?.user) {
          req.user = response.data.user;
        }
      } catch (error: any) {
        console.warn('Optional auth failed:', error.message);
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }

  next();
}
