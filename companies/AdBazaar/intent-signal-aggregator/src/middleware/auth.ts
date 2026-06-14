import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../config/logger';

interface JwtPayload {
  userId: string;
  email?: string;
  role?: string;
  iat: number;
  exp: number;
}

interface ServiceAuthPayload {
  serviceId: string;
  serviceName: string;
  permissions: string[];
}

export function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization header',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logger.warn('JWT verification failed', { error: (error as Error).message });
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}

export function authenticateInternalService(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const serviceKey = req.headers['x-internal-service-key'] as string;

  if (!serviceKey) {
    res.status(401).json({
      success: false,
      error: 'Missing internal service key',
    });
    return;
  }

  if (serviceKey !== config.internalServiceKey) {
    logger.warn('Invalid internal service key attempt', {
      keyProvided: serviceKey.substring(0, 8) + '...',
    });
    res.status(403).json({
      success: false,
      error: 'Invalid internal service key',
    });
    return;
  }

  req.isInternalService = true;
  next();
}

export function authenticateAny(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Try JWT first
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJwt(req, res, next);
  }

  // Try internal service key
  const serviceKey = req.headers['x-internal-service-key'] as string;
  if (serviceKey) {
    return authenticateInternalService(req, res, next);
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}

// Optional auth - doesn't fail if no auth provided
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const serviceKey = req.headers['x-internal-service-key'] as string;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateJwt(req, res, next);
  }

  if (serviceKey) {
    return authenticateInternalService(req, res, next);
  }

  // No auth provided, continue without user context
  next();
}

// Generate service token for internal service-to-service communication
export function generateServiceToken(serviceName: string): string {
  const payload: ServiceAuthPayload = {
    serviceId: `service-${serviceName}-${Date.now()}`,
    serviceName,
    permissions: ['signal:write', 'signal:read'],
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });
}