import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Internal service authentication middleware
 * Verifies the X-Internal-Token header for service-to-service communication
 */
export function internalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN;

  if (!expectedToken) {
    logger.warn('INTERNAL_SERVICE_TOKEN not configured, skipping auth');
    next();
    return;
  }

  if (!internalToken) {
    res.status(401).json({
      success: false,
      error: 'Missing internal token',
    });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(internalToken);

  if (expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer)) {
    res.status(401).json({
      success: false,
      error: 'Invalid internal token',
    });
    return;
  }

  next();
}

/**
 * User authentication middleware (simplified for CorpPerks)
 * In production, this would verify JWT or session tokens
 */
export function userAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check for user ID in header (from API Gateway)
  const userId = req.headers['x-user-id'] as string;
  const companyId = req.headers['x-company-id'] as string;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Attach user context to request
  (req as Request & { user?: { userId: string; companyId?: string } }).user = {
    userId,
    companyId,
  };

  next();
}

/**
 * Optional auth - doesn't fail if no token provided
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const userId = req.headers['x-user-id'] as string;
  const companyId = req.headers['x-company-id'] as string;

  if (userId) {
    (req as Request & { user?: { userId: string; companyId?: string } }).user = {
      userId,
      companyId,
    };
  }

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        companyId?: string;
      };
    }
  }
}
