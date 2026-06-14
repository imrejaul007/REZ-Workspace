import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config';
import { ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// Rate limiter for general API requests
const rateLimiter = new RateLimiterMemory({
  points: config.rateLimit.maxRequests,
  duration: config.rateLimit.windowMs / 1000,
});

// Rate limiter for notification sending (stricter limits)
const notificationRateLimiter = new RateLimiterMemory({
  points: 50, // 50 notifications per window
  duration: 60, // per minute
});

// Rate limiter for auth endpoints
const authRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const clientIp = getClientIp(req);
  const key = `global:${clientIp}`;

  try {
    const result = await rateLimiter.consume(key);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', result.remainingPoints.toString());
    res.setHeader('X-RateLimit-Reset', result.msBeforeNext.toString());

    next();
  } catch {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
      meta: {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
      },
    };

    res.status(429).json(response);
  }
};

export const notificationRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const clientIp = getClientIp(req);
  const key = `notifications:${clientIp}`;

  try {
    const result = await notificationRateLimiter.consume(key);

    res.setHeader('X-RateLimit-Limit', '50');
    res.setHeader('X-RateLimit-Remaining', result.remainingPoints.toString());
    res.setHeader('X-RateLimit-Reset', result.msBeforeNext.toString());

    next();
  } catch {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many notification requests, please slow down',
      },
      meta: {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
      },
    };

    logger.warn('Notification rate limit exceeded', { clientIp });

    res.status(429).json(response);
  }
};

export const authRateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const clientIp = getClientIp(req);
  const key = `auth:${clientIp}`;

  try {
    await authRateLimiter.consume(key);
    next();
  } catch {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later',
      },
      meta: {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
      },
    };

    res.status(429).json(response);
  }
};
