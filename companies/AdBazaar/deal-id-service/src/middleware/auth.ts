import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'deal-id-service-internal-token';

export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    logger.warn('Missing authorization header', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    logger.warn('Invalid authorization format', {
      path: req.path,
      ip: req.ip,
    });
    res.status(401).json({ error: 'Invalid authorization format' });
    return;
  }

  if (token !== INTERNAL_SERVICE_TOKEN) {
    logger.warn('Invalid service token', {
      path: req.path,
      ip: req.ip,
    });
    res.status(403).json({ error: 'Invalid service token' });
    return;
  }

  next();
}

export function validateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',').filter(Boolean);

  if (validApiKeys.length === 0) {
    return next();
  }

  if (!apiKey || !validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key', {
      path: req.path,
      ip: req.ip,
    });
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  next();
}

export function rateLimitByIp(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  // Simple in-memory rate limiting (use Redis in production)
  const key = `rate_limit:${ip}`;
  const timestamp = now;

  // This would be better with Redis, but for now we just pass through
  // In production, use a proper rate limiting solution
  next();
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

export function corsOptions(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').filter(Boolean);
  const origin = req.headers.origin;

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin || '')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  next();
}