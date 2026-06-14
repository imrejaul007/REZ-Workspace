/**
 * REZ Verify QR Service - Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Redis client for rate limiting
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false
});

redisClient.on('error', (err) => {
  console.error('Redis rate limit client error:', err.message);
});

// In-memory store fallback
const memoryStore = new Map();

// ============================================
// RATE LIMITING CONFIGS
// ============================================

// Public API - Verification (stricter for abuse prevention)
export const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 verifications per 15 minutes
  message: {
    error: 'Too many verification requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  }
});

// Public API - General (less strict)
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Authenticated API - Service Booking
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 bookings per minute
  message: {
    error: 'Too many booking requests',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.user_id || req.ip || 'unknown';
  }
});

// Authenticated API - Claims
export const claimLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 claims per hour
  message: {
    error: 'Too many claim requests',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.user_id || req.ip || 'unknown';
  }
});

// Admin API - More generous
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute
  message: {
    error: 'Too many admin requests',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-admin-id'] as string || req.ip || 'unknown';
  }
});

// Subscription/Warranty plans - Prevent abuse
export const subscriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 subscriptions per hour
  message: {
    error: 'Too many subscription requests',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.user_id || req.ip || 'unknown';
  }
});

// Search/Lookup endpoints
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  message: {
    error: 'Too many search requests',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// OTP/Auth endpoints - Very strict
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per 15 minutes
  message: {
    error: 'Too many authentication requests',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Webhook endpoints
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // High limit for webhooks
  message: {
    error: 'Webhook rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-webhook-source'] as string || req.ip || 'unknown';
  }
});

// Cleanup old entries from memory store periodically
if (process.env.NODE_ENV !== 'production') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      const resetTime = (value as unknown).resetTime;
      if (resetTime && resetTime < now) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Every minute
}

export { redisClient };
