import { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    name: string;
    email: string;
    companyId: string;
    role: string;
    avatar?: string;
  };
  internalService?: {
    name: string;
  };
}

interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  companyId: string;
  role: string;
  avatar?: string;
}

interface ServiceTokenPayload {
  serviceName: string;
  permissions: string[];
}

// Verify user JWT token
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Authorization header missing or invalid format',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Call RABTUL Auth service to verify token
    const response = await axios.post<TokenPayload>(
      `${AUTH_SERVICE_URL}/api/auth/verify`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    if (!response.data || !response.data.userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    req.user = {
      userId: response.data.userId,
      name: response.data.name,
      email: response.data.email,
      companyId: response.data.companyId,
      role: response.data.role,
      avatar: response.data.avatar,
    };

    next();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        res.status(401).json({
          success: false,
          error: 'Token verification failed',
        });
        return;
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        logger.error('Auth service unavailable:', error.code);
        res.status(503).json({
          success: false,
          error: 'Authentication service temporarily unavailable',
        });
        return;
      }
    }

    logger.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
    });
  }
}

// Verify internal service token (for service-to-service communication)
export function verifyInternalToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const internalToken = req.headers['x-internal-token'];

    if (!internalToken || typeof internalToken !== 'string') {
      res.status(401).json({
        success: false,
        error: 'Internal token missing',
      });
      return;
    }

    if (internalToken !== INTERNAL_SERVICE_TOKEN) {
      res.status(403).json({
        success: false,
        error: 'Invalid internal token',
      });
      return;
    }

    const serviceName = req.headers['x-service-name'] as string;

    req.internalService = {
      name: serviceName || 'unknown',
    };

    next();
  } catch (error) {
    logger.error('Internal token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

// Combined auth middleware - accepts either user token or internal token
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'];

  if (internalToken) {
    return verifyInternalToken(req, res, next);
  }

  return verifyToken(req, res, next);
}

// Require specific role
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

// Check if user belongs to company
export function requireCompany(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  const { companyId } = req.params;
  const queryCompanyId = req.query.companyId as string;

  // Allow if user's company matches or user is admin
  if (
    req.user.companyId === companyId ||
    req.user.companyId === queryCompanyId ||
    req.user.role === 'admin' ||
    req.user.role === 'superadmin'
  ) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'Access denied to this company',
  });
}

// Optional auth - doesn't fail if no token provided
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  try {
    await verifyToken(req, res, next);
  } catch {
    // If token verification fails, continue without user
    next();
  }
}

// Rate limiter helper for auth
export function getClientIdentifier(req: AuthenticatedRequest): string {
  const userId = req.user?.userId;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return `${userId || forwarded.split(',')[0]}`;
  }

  return userId || ip;
}
