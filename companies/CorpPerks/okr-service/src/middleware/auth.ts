import { Request, Response, NextFunction } from 'express';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'okr-service-secret-token-change-in-production';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check for internal service token
  const internalToken = req.headers['x-internal-token'] as string;

  if (internalToken && internalToken === INTERNAL_SERVICE_TOKEN) {
    next();
    return;
  }

  // Check for Bearer token (user authentication)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In production, verify the JWT token here
    // For now, accept any Bearer token
    next();
    return;
  }

  res.status(401).json({
    success: false,
    error: 'Unauthorized. Provide X-Internal-Token or Bearer token.'
  });
}
