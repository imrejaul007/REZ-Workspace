import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';

// RABTUL Auth Service configuration
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'https://rez-auth-service.onrender.com';

export interface JWTPayload {
  sub: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'doctor' | 'nurse' | 'staff' | 'service' | 'patient';
  merchantId?: string;
  facilityId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  isInternalService?: boolean;
}

/**
 * Verify token with RABTUL Auth Service
 */
async function verifyTokenWithRABTUL(token: string): Promise<JWTPayload | null> {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': config.internalServiceTokens.default || '',
        },
        timeout: 5000,
      }
    );

    if (response.data.success && response.data.user) {
      return response.data.user as JWTPayload;
    }
    return null;
  } catch (error) {
    logger.warn('[Auth] RABTUL verify failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Allow health check without auth
  if (req.path === '/health') {
    next();
    return;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Access token required',
    });
    return;
  }

  // Try RABTUL verification first
  const raborUser = await verifyTokenWithRABTUL(token);
  if (raborUser) {
    req.user = raborUser;
    next();
    return;
  }

  // Fallback to local JWT verification
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token', { error });
    res.status(403).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export function authenticateInternalService(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Internal service token required',
    });
    return;
  }

  const serviceName = req.headers['x-service-name'] as string;
  const expectedToken = config.internalServiceTokens[serviceName || ''];

  if (!expectedToken || expectedToken !== internalToken) {
    logger.warn('Invalid internal service token', {
      serviceName,
      hasExpectedToken: !!expectedToken,
    });
    res.status(403).json({
      success: false,
      error: 'Invalid internal service token',
    });
    return;
  }

  req.isInternalService = true;
  next();
}

export function requireRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user && !req.isInternalService) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (req.user) {
      const userRole = req.user.role || 'user';
      if (!roles.includes(userRole) && userRole !== 'admin') {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }
    }

    next();
  };
}
