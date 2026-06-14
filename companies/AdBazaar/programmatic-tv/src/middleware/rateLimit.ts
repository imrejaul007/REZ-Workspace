import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../services/database.js';
import { config } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Rate Limiter
// ============================================================================

interface RateLimitInfo {
  remaining: number;
  limit: number;
  reset: number;
}

const WINDOW_SIZE = config.rateLimit.windowMs;

// In-memory tracking for distributed rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimiter(type: 'bid' | 'deals' | 'seats' | 'floors') {
  const limit = config.rateLimit[type === 'bid' ? 'bidRequests' : `${type}Requests`];

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = getRedisClient();
      const clientId = getClientId(req);
      const key = `ratelimit:${type}:${clientId}`;

      const now = Date.now();
      const windowStart = now - WINDOW_SIZE;

      // Get current count
      let data = await redis.get(key);
      let countData: { count: number; resetTime: number };

      if (data) {
        countData = JSON.parse(data);
        // Reset if window expired
        if (countData.resetTime < now) {
          countData = { count: 0, resetTime: now + WINDOW_SIZE };
        }
      } else {
        countData = { count: 0, resetTime: now + WINDOW_SIZE };
      }

      countData.count++;

      // Check if over limit
      if (countData.count > limit) {
        res.set('X-RateLimit-Limit', String(limit));
        res.set('X-RateLimit-Remaining', '0');
        res.set('X-RateLimit-Reset', String(Math.ceil(countData.resetTime / 1000)));
        res.set('Retry-After', String(Math.ceil((countData.resetTime - now) / 1000)));

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Try again in ${Math.ceil((countData.resetTime - now) / 1000)} seconds.`,
          },
        });
        return;
      }

      // Save updated count
      await redis.setex(key, Math.ceil(WINDOW_SIZE / 1000), JSON.stringify(countData));

      // Set headers
      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', String(limit - countData.count));
      res.set('X-RateLimit-Reset', String(Math.ceil(countData.resetTime / 1000)));

      next();
    } catch (error) {
      // If Redis fails, allow the request but log the error
      logger.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Get client identifier from request
 */
function getClientId(req: Request): string {
  // Use X-Forwarded-For if behind a proxy, otherwise use IP
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

  // Include seatId if authenticated
  const seatId = req.auth?.seatId || '';

  return `${ip}:${seatId}`.replace(/[^a-zA-Z0-9:]/g, '');
}

// ============================================================================
// Request ID Middleware
// ============================================================================

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers['x-request-id'] as string) || uuidv4();
  req.headers['x-request-id'] = id;
  res.set('X-Request-ID', id);
  next();
}

// ============================================================================
// Request Logger Middleware
// ============================================================================

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLine = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 400) {
      logger.error(`[ERROR] ${logLine}`);
    } else {
      logger.info(`[INFO] ${logLine}`);
    }
  });

  next();
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error('Unhandled error:', err);

  // Handle specific error types
  if (err.name === 'MongoServerError') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
      },
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}