/**
 * Security Utilities
 *
 * Features:
 * - Password hashing (bcrypt)
 * - JWT token generation/verification
 * - Input sanitization
 * - Rate limiting middleware
 *
 * @module @adbazaar/shared-utils/security
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loadConfig } from './config';
import { createLogger } from './logger';

const logger = createLogger('security');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(
  payload: Record<string, unknown>,
  expiresIn?: string
): string {
  const config = loadConfig();
  const secret = process.env.JWT_SECRET || config.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn || config.JWT_EXPIRES_IN,
    algorithm: config.JWT_ALGORITHM as jwt.Algorithm,
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): Record<string, unknown> {
  const config = loadConfig();
  const secret = process.env.JWT_SECRET || config.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  try {
    return jwt.verify(token, secret) as Record<string, unknown>;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password', 'secret', 'token', 'apiKey', 'apikey',
    'creditCard', 'cvv', 'ssn', 'pin', 'otp'
  ];

  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export function rateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
} = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests',
    keyGenerator = (req: Request) => req.ip || 'unknown',
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    const record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    record.count++;

    if (record.count > max) {
      logger.warn('Rate limit exceeded', { key, count: record.count });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        },
      });
      return;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    next();
  };
}

/**
 * Auth middleware to verify JWT
 */
export function authMiddleware(required: boolean = true) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (required) {
        throw new Error('No authorization header');
      }
      return next();
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new Error('Invalid authorization format');
    }

    try {
      const decoded = verifyToken(token);
      (req as Request & { user?: Record<string, unknown> }).user = decoded;
      next();
    } catch (error) {
      if (required) {
        throw new Error('Invalid token');
      }
      next();
    }
  };
}

/**
 * Generate secure random string
 */
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  require('crypto').randomFillSync(randomValues);
  return Array.from(randomValues, v => chars[v % chars.length]).join('');
}

export default {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  sanitizeInput,
  maskSensitiveData,
  rateLimiter,
  authMiddleware,
  generateSecureId,
};
