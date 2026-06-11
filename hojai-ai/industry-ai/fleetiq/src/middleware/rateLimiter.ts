/**
 * FLEETIQ - Rate Limiting Middleware
 * Production-ready rate limiting with different tiers
 */

import rateLimit from 'express-rate-limit';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

// ============================================
// RATE LIMIT ERROR RESPONSE
// ============================================

const rateLimitMessage = {
  success: false,
  error: 'Too many requests, please try again later',
  code: 'RATE_LIMIT_EXCEEDED',
  retryAfter: undefined as number | undefined
};

// ============================================
// STANDARD RATE LIMITER (100 requests per 15 minutes)
// ============================================

export const standardLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: rateLimitMessage,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json(options.message);
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return (req as any).userId || req.ip || 'unknown';
  }
});

// ============================================
// AUTH RATE LIMITER (10 requests per minute)
// ============================================

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: config.rateLimit.authMaxRequests,
  message: {
    success: false,
    error: 'Too many authentication attempts',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res, _next, options) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json(options.message);
  }
});

// ============================================
// AI AGENT RATE LIMITER (more lenient for AI operations)
// ============================================

export const aiAgentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute for AI endpoints
  message: {
    success: false,
    error: 'AI service rate limit exceeded',
    code: 'AI_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // AI agents get a separate quota
    return `ai:${(req as any).userId || req.ip || 'unknown'}`;
  }
});

// ============================================
// STRICT RATE LIMITER (for sensitive operations)
// ============================================

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Only 5 requests per minute for sensitive ops
  message: {
    success: false,
    error: 'Too many requests to sensitive endpoint',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// BURST PROTECTION (for large data operations)
// ============================================

export const burstLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: 'Too many bulk operations',
    code: 'BURST_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================
// GEOLOCATION RATE LIMITER (per location)
// ============================================

export const geolocationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Geolocation service rate limit exceeded',
    code: 'GEO_RATE_LIMIT_EXCEEDED'
  },
  keyGenerator: (req) => {
    // Combine IP with location for more granular limiting
    const location = req.query.lat && req.query.lng
      ? `${req.query.lat}:${req.query.lng}`
      : 'default';
    return `geo:${req.ip}:${location}`;
  }
});

export default {
  standardLimiter,
  authLimiter,
  aiAgentLimiter,
  strictLimiter,
  burstLimiter,
  geolocationLimiter
};