import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Standard API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: { code: 'RATE_001', message: 'Too many requests, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] API rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: { code: 'RATE_001', message: 'Too many requests, please try again later' },
    });
  },
});

// Strict rate limiter for sensitive endpoints
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    success: false,
    error: { code: 'RATE_002', message: 'Too many requests, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] Strict rate limit exceeded:', {
      ip: req.ip,
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: { code: 'RATE_002', message: 'Too many requests, please try again later' },
    });
  },
});

// Internal service rate limiter
export const internalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500, // 500 requests per minute
  message: {
    success: false,
    error: { code: 'RATE_003', message: 'Service rate limit exceeded' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Referral creation rate limiter (prevent referral farming)
export const referralRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 referral registrations per hour
  keyGenerator: (req: Request) => {
    // Rate limit by referee (new user) to prevent farming
    return req.body?.refereeId || req.ip || 'unknown';
  },
  message: {
    success: false,
    error: { code: 'RATE_004', message: 'Too many referral registrations, please try again later' },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('[RateLimit] Referral rate limit exceeded:', {
      refereeId: req.body?.refereeId,
      ip: req.ip,
    });
    res.status(429).json({
      success: false,
      error: { code: 'RATE_004', message: 'Too many referral registrations, please try again later' },
    });
  },
});

// Share rate limiter (prevent spam sharing)
export const shareRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 share actions per minute
  keyGenerator: (req: Request) => {
    return req.userId || 'unknown';
  },
  message: {
    success: false,
    error: { code: 'RATE_005', message: 'Too many share actions, please slow down' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
