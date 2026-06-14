import { Request, Response, NextFunction } from 'express';
import { logger } from 'utils/logger.js';

// Internal service authentication middleware
export const internalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const internalToken = req.headers['x-internal-token'] as string;
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || 'fill-rate-optimizer-secret';

  // In development, allow requests without token
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  // Validate token
  if (!internalToken) {
    logger.warn('Missing internal token', {
      path: req.path,
      ip: req.ip,
      requestId: req.headers['x-request-id']
    });
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing internal service token',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (internalToken !== expectedToken) {
    logger.warn('Invalid internal token', {
      path: req.path,
      ip: req.ip,
      requestId: req.headers['x-request-id']
    });
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid internal service token',
      timestamp: new Date().toISOString()
    });
    return;
  }

  next();
};

// Optional: Add rate limiting middleware
export const rateLimiter = (maxRequests: number = 100, windowMs: number = 60000) => {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this client
    let clientRequests = requests.get(clientId) || [];
    clientRequests = clientRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (clientRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        clientId,
        requests: clientRequests.length,
        limit: maxRequests,
        requestId: req.headers['x-request-id']
      });
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs / 1000}s`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Add current request
    clientRequests.push(now);
    requests.set(clientId, clientRequests);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - clientRequests.length).toString());
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      logger.warn('Request validation failed', {
        errors: error.errors,
        path: req.path,
        requestId: req.headers['x-request-id']
      });
      res.status(400).json({
        error: 'Validation Error',
        message: 'Request body validation failed',
        details: error.errors,
        timestamp: new Date().toISOString()
      });
    }
  };
};