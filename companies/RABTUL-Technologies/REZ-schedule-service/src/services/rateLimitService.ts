// ReZ Schedule - Rate Limiting Service
// Token bucket rate limiting with Redis
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  blockDurationMs: number; // How long to block after limit exceeded
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

// Default limits
const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  default: { windowMs: 60000, maxRequests: 100, blockDurationMs: 60000 },
  auth: { windowMs: 300000, maxRequests: 10, blockDurationMs: 300000 },
  booking: { windowMs: 60000, maxRequests: 20, blockDurationMs: 300000 },
  availability: { windowMs: 60000, maxRequests: 60, blockDurationMs: 60000 },
  search: { windowMs: 60000, maxRequests: 30, blockDurationMs: 120000 },
};

// Simple in-memory store (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();

export class RateLimitService {
  /**
   * Check rate limit for an identifier (IP, user ID, API key)
   */
  async checkLimit(
    identifier: string,
    limitType: keyof typeof DEFAULT_LIMITS = 'default'
  ): Promise<RateLimitResult> {
    const config = DEFAULT_LIMITS[limitType] || DEFAULT_LIMITS.default;
    const key = `${limitType}:${identifier}`;

    const now = Date.now();
    const stored = rateLimitStore.get(key);

    // Check if currently blocked
    if (stored?.blockedUntil && now < stored.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(stored.blockedUntil),
        retryAfterMs: stored.blockedUntil - now,
      };
    }

    // Initialize or reset window
    if (!stored || now >= stored.resetAt) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + config.windowMs,
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now + config.windowMs),
      };
    }

    // Increment count
    stored.count++;

    // Check if limit exceeded
    if (stored.count > config.maxRequests) {
      stored.blockedUntil = now + config.blockDurationMs;
      rateLimitStore.set(key, stored);

      logger.warn(`[RateLimit] Blocked ${identifier} for ${limitType}`);

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(stored.blockedUntil),
        retryAfterMs: config.blockDurationMs,
      };
    }

    rateLimitStore.set(key, stored);

    return {
      allowed: true,
      remaining: config.maxRequests - stored.count,
      resetAt: new Date(stored.resetAt),
    };
  }

  /**
   * Middleware factory for Express
   */
  createMiddleware(limitType: keyof typeof DEFAULT_LIMITS = 'default') {
    return async (req: { ip?: string; headers?: Record<string, string | undefined>; userId?: string }, res: { status: (code: number) => { json: (data: object) => void }; setHeader: (key: string, value: string) => void }) => {
      // Get identifier
      const identifier = req.userId || req.ip || req.headers['x-forwarded-for'] as string || 'unknown';

      const result = await this.checkLimit(identifier, limitType);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', DEFAULT_LIMITS[limitType]?.maxRequests.toString() || '100');
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil((result.retryAfterMs || 0) / 1000).toString());
        res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.retryAfterMs || 0) / 1000),
        });
        return false;
      }

      return true;
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  resetLimit(identifier: string, limitType?: string): void {
    if (limitType) {
      rateLimitStore.delete(`${limitType}:${identifier}`);
    } else {
      // Clear all limits for this identifier
      for (const key of rateLimitStore.keys()) {
        if (key.endsWith(`:${identifier}`)) {
          rateLimitStore.delete(key);
        }
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(identifier: string, limitType: keyof typeof DEFAULT_LIMITS = 'default'): RateLimitResult {
    const key = `${limitType}:${identifier}`;
    const stored = rateLimitStore.get(key);

    if (!stored) {
      return {
        allowed: true,
        remaining: DEFAULT_LIMITS[limitType]?.maxRequests || 100,
        resetAt: new Date(Date.now() + (DEFAULT_LIMITS[limitType]?.windowMs || 60000)),
      };
    }

    return {
      allowed: !stored.blockedUntil || Date.now() >= stored.blockedUntil,
      remaining: Math.max(0, (DEFAULT_LIMITS[limitType]?.maxRequests || 100) - stored.count),
      resetAt: new Date(stored.resetAt),
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now && (!value.blockedUntil || value.blockedUntil < now)) {
        rateLimitStore.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

export const rateLimitService = new RateLimitService();
export default rateLimitService;
