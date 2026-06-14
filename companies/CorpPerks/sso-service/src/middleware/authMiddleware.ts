import { Request, Response, NextFunction } from 'express';
import { ssoService } from '../services/ssoService';
import { TokenPayload } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      sessionId?: string;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user info to request
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization header required',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = ssoService.verifyToken(token);
    req.user = payload;
    req.sessionId = payload.sessionId;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user info if token present, but doesn't require it
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = ssoService.verifyToken(token);
    req.user = payload;
    req.sessionId = payload.sessionId;
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

/**
 * Company check middleware
 * Ensures user belongs to the requested company
 */
export const companyCheckMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { companyId } = req.params;
  const userCompanyId = req.headers['x-company-id'] as string;
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Allow if user belongs to the company
  if (user.companyId !== companyId && user.companyId !== userCompanyId) {
    res.status(403).json({
      success: false,
      error: 'Access denied to this company',
    });
    return;
  }

  next();
};

/**
 * Admin check middleware
 * Ensures user has admin role
 */
export const adminCheckMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Check for admin role (this would typically check against actual roles)
  if (!user.roles?.includes('admin') && !user.roles?.includes('super_admin')) {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
};

/**
 * Internal service authentication middleware
 * Validates internal service token
 */
export const internalServiceMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const internalToken = req.headers['x-internal-token'] as string;

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Internal token required',
    });
    return;
  }

  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (internalToken !== expectedToken) {
    res.status(403).json({
      success: false,
      error: 'Invalid internal token',
    });
    return;
  }

  next();
};
