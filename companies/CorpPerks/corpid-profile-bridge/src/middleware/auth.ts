import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, AppError } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      isInternalService?: boolean;
    }
  }
}

/**
 * Timing-safe string comparison for tokens
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verify internal service token for service-to-service communication
 */
export function verifyInternalToken(req: Request, _res: Response, next: NextFunction): void {
  const internalToken = req.headers['x-internal-token'] as string | undefined;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!internalToken || !expectedToken) {
    throw new AppError(401, 'UNAUTHORIZED', 'Internal service token is required');
  }

  if (!timingSafeCompare(internalToken, expectedToken)) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid internal service token');
  }

  req.isInternalService = true;
  next();
}

/**
 * Verify JWT token for user authentication
 */
export function verifyJWT(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError(401, 'MISSING_TOKEN', 'Authorization header is required');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new AppError(401, 'INVALID_TOKEN_FORMAT', 'Authorization header must be: Bearer <token>');
  }

  const token = parts[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new AppError(500, 'CONFIG_ERROR', 'JWT secret is not configured');
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'TOKEN_EXPIRED', 'JWT token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid JWT token');
    }
    throw new AppError(500, 'AUTH_ERROR', 'Authentication failed');
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...allowedRoles: Array<JWTPayload['role']>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', `Access denied. Required roles: ${allowedRoles.join(', ')}`);
    }

    next();
  };
}

/**
 * Generate JWT token
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  const jwtSecret = process.env.JWT_SECRET;
  const expiresInValue = process.env.JWT_EXPIRES_IN || '7d';

  if (!jwtSecret) {
    throw new AppError(500, 'CONFIG_ERROR', 'JWT secret is not configured');
  }

  return jwt.sign(payload, jwtSecret, { expiresIn: expiresInValue as jwt.SignOptions['expiresIn'] });
}

/**
 * Verify that the user has access to the requested profile
 */
export function verifyProfileAccess(req: Request, _res: Response, next: NextFunction): void {
  const profileId = req.params.profileId || req.params.id;

  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  // Admin and HR can access all profiles
  if (req.user.role === 'admin' || req.user.role === 'hr') {
    return next();
  }

  // Managers can access their direct reports' profiles
  if (req.user.role === 'manager') {
    // Additional logic would check if profileId belongs to a direct report
    return next();
  }

  // Employees can only access their own profile
  if (req.user.role === 'employee' && req.user.profileId === profileId) {
    return next();
  }

  throw new AppError(403, 'FORBIDDEN', 'You do not have access to this profile');
}
