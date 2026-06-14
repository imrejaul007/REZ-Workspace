import { Request, Response, NextFunction } from 'express';
import { Merchant } from '../models';

export interface AuthenticatedRequest extends Request {
  merchant?: any;
}

// API Key authentication middleware
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required',
        hint: 'Add X-API-Key header'
      });
    }

    const merchant = await Merchant.findOne({ apiKey, isActive: true });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    req.merchant = merchant;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

// Optional auth - doesn't fail if no key
export async function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
      const merchant = await Merchant.findOne({ apiKey, isActive: true });
      if (merchant) {
        req.merchant = merchant;
      }
    }

    next();
  } catch (error) {
    next();
  }
}

// Rate limiting (simple in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(windowMs: number = 60000, maxRequests: number = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs };
      rateLimitMap.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetAt - now) / 1000)
      });
    }

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetAt).toISOString());

    next();
  };
}

// Input validation
export function validateRequest(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues
      });
    }

    req.body = result.data;
    next();
  };
}

// Error handler
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
