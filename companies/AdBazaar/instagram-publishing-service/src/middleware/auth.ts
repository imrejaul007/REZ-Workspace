import { Request, Response, NextFunction } from 'express';
import logger from 'utils/logger.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      accountId?: string;
      permissions?: string[];
    }
  }
}

// API Key authentication middleware
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('API request without API key', { path: req.path, ip: req.ip });
    res.status(401).json({ error: 'API key required' });
    return;
  }

  // In production, validate the API key against a database or secret manager
  // For now, we'll accept a simple check
  const validApiKey = process.env.API_KEY || 'demo-api-key';
  if (apiKey !== validApiKey) {
    logger.warn('Invalid API key attempt', { path: req.path, ip: req.ip });
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
};

// JWT authentication middleware (placeholder for future implementation)
export const jwtAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('JWT request without token', { path: req.path, ip: req.ip });
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.substring(7);

  // In production, verify the JWT token
  // For now, we'll simulate a successful auth
  try {
    // TODO: Implement actual JWT verification
    req.userId = 'user-123'; // Placeholder
    next();
  } catch (error) {
    logger.error('JWT verification failed', { error });
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Service-to-service authentication
export const serviceAuth = (req: Request, res: Response, next: NextFunction): void => {
  const serviceToken = req.headers['x-service-token'] as string;

  if (!serviceToken) {
    logger.warn('Service request without token', { path: req.path, ip: req.ip });
    res.status(401).json({ error: 'Service token required' });
    return;
  }

  const validToken = process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token';
  if (serviceToken !== validToken) {
    logger.warn('Invalid service token', { path: req.path, ip: req.ip });
    res.status(403).json({ error: 'Invalid service token' });
    return;
  }

  next();
};

// Optional authentication (doesn't fail if no auth provided)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If token is provided, verify it
    jwtAuth(req, res, next);
  } else {
    // Otherwise, continue without auth
    next();
  }
};

// Rate limiting tracking (simple in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(clientId);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(clientId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      logger.warn('Rate limit exceeded', { clientId, path: req.path });
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    record.count++;
    next();
  };
};

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute