import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { RATE_LIMIT_KEY, RateLimitConfig } from './rate-limit.guard';

/**
 * Apply rate limiting to a controller method
 * @param config Rate limit configuration
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Predefined rate limit decorators for common use cases
 */

// Strict rate limiting - 10 requests per minute
export const RateLimitStrict = (key?: string) =>
  RateLimit({
    limit: 10,
    window: 60,
    key: key || 'strict',
  });

// Standard rate limiting - 100 requests per minute
export const RateLimitStandard = (key?: string) =>
  RateLimit({
    limit: 100,
    window: 60,
    key: key || 'standard',
  });

// Generous rate limiting - 1000 requests per minute
export const RateLimitGenerous = (key?: string) =>
  RateLimit({
    limit: 1000,
    window: 60,
    key: key || 'generous',
  });

// Authentication endpoints - 5 login attempts per 15 minutes per IP
export const RateLimitAuth = () =>
  RateLimit({
    limit: 5,
    window: 900, // 15 minutes
    key: 'auth',
    keyGenerator: (req: Request) => {
      // Always use IP for auth endpoints to prevent brute force
      const forwarded = req.headers['x-forwarded-for'] as string;
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
      return `ip:${ip}`;
    },
  });

// API key creation - 3 per hour per user
export const RateLimitApiKey = () =>
  RateLimit({
    limit: 3,
    window: 3600, // 1 hour
    key: 'api-key',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return `user:${user?.id || 'anonymous'}`;
    },
  });

// File upload endpoints - 10 uploads per 5 minutes per user
export const RateLimitUpload = () =>
  RateLimit({
    limit: 10,
    window: 300, // 5 minutes
    key: 'upload',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return user?.id ? `user:${user.id}` : `ip:${req.connection.remoteAddress}`;
    },
  });

// Search endpoints - 30 searches per minute per user
export const RateLimitSearch = () =>
  RateLimit({
    limit: 30,
    window: 60,
    key: 'search',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return user?.id ? `user:${user.id}` : `ip:${req.connection.remoteAddress}`;
    },
  });

// Job creation - 20 jobs per hour per user
export const RateLimitJobCreation = () =>
  RateLimit({
    limit: 20,
    window: 3600, // 1 hour
    key: 'job-creation',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return `user:${user?.id || 'anonymous'}`;
    },
  });

// Job application - 50 applications per day per user
export const RateLimitJobApplication = () =>
  RateLimit({
    limit: 50,
    window: 86400, // 24 hours
    key: 'job-application',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return `user:${user?.id || 'anonymous'}`;
    },
  });

// Public API - 1000 requests per hour per IP
export const RateLimitPublic = () =>
  RateLimit({
    limit: 1000,
    window: 3600, // 1 hour
    key: 'public',
    keyGenerator: (req: Request) => {
      const forwarded = req.headers['x-forwarded-for'] as string;
      const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;
      return `ip:${ip}`;
    },
  });

// Admin operations - 200 requests per hour per admin
export const RateLimitAdmin = () =>
  RateLimit({
    limit: 200,
    window: 3600, // 1 hour
    key: 'admin',
    skipIf: (req: Request) => {
      // Skip for super admins
      const user = (req as unknown).user;
      return user?.role === 'SUPER_ADMIN';
    },
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return `admin:${user?.id || 'anonymous'}`;
    },
  });

// Payment processing - 10 payments per hour per user
export const RateLimitPayment = () =>
  RateLimit({
    limit: 10,
    window: 3600, // 1 hour
    key: 'payment',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return `user:${user?.id || 'anonymous'}`;
    },
  });

// Email sending - 5 emails per hour per user
export const RateLimitEmail = () =>
  RateLimit({
    limit: 5,
    window: 3600, // 1 hour
    key: 'email',
    keyGenerator: (req: Request) => {
      const user = (req as unknown).user;
      return `user:${user?.id || 'anonymous'}`;
    },
  });