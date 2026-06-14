import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

/**
 * Internal service authentication middleware
 * Validates X-Internal-Token header for service-to-service communication
 */
export function internalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Internal service token is required',
    });
    return;
  }

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(INTERNAL_SERVICE_TOKEN);

  if (tokenBuffer.length !== expectedBuffer.length) {
    res.status(401).json({
      success: false,
      error: 'Invalid internal service token',
    });
    return;
  }

  if (!crypto.timingSafeEqual(tokenBuffer, expectedBuffer)) {
    res.status(401).json({
      success: false,
      error: 'Invalid internal service token',
    });
    return;
  }

  next();
}

/**
 * Optional internal auth - continues if no token provided
 */
export function optionalInternalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = req.headers['x-internal-token'] as string;

  if (!token) {
    // No token provided, continue without auth
    next();
    return;
  }

  // If token provided, validate it
  internalAuth(req, _res, next);
}

/**
 * JWT validation middleware (for future RABTUL Auth integration)
 * Currently a placeholder that can be extended
 */
export async function jwtAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Authorization header is required',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // TODO: Integrate with RABTUL Auth Service (port 4002)
    // For now, just validate that token exists
    // In production, this would verify with the auth service

    // Example integration:
    // const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
    // const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify`, {
    //   method: 'POST',
    //   headers: {
    //     'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ token }),
    // });

    // if (!response.ok) {
    //   res.status(401).json({ success: false, error: 'Invalid token' });
    //   return;
    // }

    // Attach user info to request
    // const user = await response.json();
    // (req as any).user = user;

    // Placeholder: just pass through
    (req as any).user = { id: 'anonymous' };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token validation failed',
    });
  }
}

/**
 * Combined auth middleware - accepts either internal or JWT token
 */
export function combinedAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const internalToken = req.headers['x-internal-token'] as string;
  const authHeader = req.headers.authorization;

  if (internalToken) {
    internalAuth(req, res, next);
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Sync call for JWT validation
    jwtAuth(req, res, next);
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Authentication required',
  });
}
