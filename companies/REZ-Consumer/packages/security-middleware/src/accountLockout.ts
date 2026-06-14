/**
 * Account Lockout Security Middleware
 *
 * Prevents brute force attacks by locking accounts after failed attempts
 *
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 30 * 60 * 1000; // 30 minute window

interface LockoutEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

/**
 * In-memory lockout store (use Redis in production)
 * Key: userId or identifier
 * Value: LockoutEntry
 */
const lockoutStore = new Map<string, LockoutEntry>();

/**
 * Check if a user is currently locked out
 */
export function isLockedOut(userId: string): boolean {
  const entry = lockoutStore.get(userId);

  if (!entry) return false;

  // Check if lockout has expired
  if (entry.lockedUntil && Date.now() > entry.lockedUntil) {
    // Lockout expired, reset
    lockoutStore.delete(userId);
    return false;
  }

  return entry.lockedUntil !== null;
}

/**
 * Get remaining lockout time in milliseconds
 */
export function getRemainingLockoutTime(userId: string): number {
  const entry = lockoutStore.get(userId);

  if (!entry || !entry.lockedUntil) return 0;

  const remaining = entry.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAttempt(userId: string): void {
  const now = Date.now();
  let entry = lockoutStore.get(userId);

  if (!entry) {
    entry = {
      attempts: 0,
      firstAttempt: now,
      lockedUntil: null,
    };
  }

  // Reset if window has passed
  if (now - entry.firstAttempt > WINDOW_MS) {
    entry = {
      attempts: 0,
      firstAttempt: now,
      lockedUntil: null,
    };
  }

  entry.attempts++;

  // Lock if max attempts reached
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  lockoutStore.set(userId, entry);
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(userId: string): void {
  lockoutStore.delete(userId);
}

/**
 * Get current attempt count for a user
 */
export function getAttemptCount(userId: string): number {
  const entry = lockoutStore.get(userId);
  if (!entry) return 0;

  // Reset if window has passed
  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    lockoutStore.delete(userId);
    return 0;
  }

  return entry.attempts;
}

/**
 * Get remaining attempts before lockout
 */
export function getRemainingAttempts(userId: string): number {
  return Math.max(0, MAX_ATTEMPTS - getAttemptCount(userId));
}

/**
 * Express middleware for account lockout protection
 *
 * Usage:
 *   import { accountLockoutMiddleware } from '@rez/security-middleware';
 *   app.post('/login', accountLockoutMiddleware('userId'), loginHandler);
 */
export function accountLockoutMiddleware(getUserId: (req: Request) => string | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = getUserId(req);

    if (!userId) {
      next();
      return;
    }

    // Check if locked
    if (isLockedOut(userId)) {
      const remainingMs = getRemainingLockoutTime(userId);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: remainingMinutes,
        message: `Please try again in ${remainingMinutes} minutes`,
      });
      return;
    }

    // Add helpers to request for use in route handlers
    (req as any).lockout = {
      recordFailed: () => recordFailedAttempt(userId),
      clearOnSuccess: () => clearFailedAttempts(userId),
      getRemaining: () => getRemainingAttempts(userId),
      getUserId: () => userId,
    };

    next();
  };
}

/**
 * Middleware that wraps a handler with lockout protection
 * Automatically records failures and clears on success
 */
export function withLockoutProtection<T>(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).lockout?.getUserId?.();

    if (!userId) {
      await handler(req, res, next);
      return;
    }

    try {
      const result = await handler(req, res, next);

      // Clear lockout on successful completion
      clearFailedAttempts(userId);

    } catch (error) {
      // Record failed attempt on error
      recordFailedAttempt(userId);

      // Check if now locked
      if (isLockedOut(userId)) {
        const remainingMs = getRemainingLockoutTime(userId);
        const remainingMinutes = Math.ceil(remainingMs / 60000);

        res.status(423).json({
          success: false,
          error: 'Account temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED',
          retryAfter: remainingMinutes,
          message: `Please try again in ${remainingMinutes} minutes`,
        });
        return;
      }

      next(error);
    }
  };
}

/**
 * Password policy validator
 */
export interface PasswordPolicy {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
  specialChars?: string;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Validate password against policy
 */
export function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (policy.minLength && password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }

  if (policy.maxLength && password.length > policy.maxLength) {
    errors.push(`Password must be at most ${policy.maxLength} characters`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least 1 uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least 1 lowercase letter');
  }

  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least 1 number');
  }

  if (policy.requireSpecial) {
    const specialPattern = new RegExp(`[${policy.specialChars?.replace(/[-[\]{}()*+?.,\\^$|#\\s]/g, '\\$&')}]`);
    if (!specialPattern.test(password)) {
      errors.push(`Password must contain at least 1 special character (${policy.specialChars})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Session configuration
 */
export interface SessionConfig {
  maxAge?: number; // in milliseconds
  slidingWindow?: boolean;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  slidingWindow: true,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
};

/**
 * Create session middleware configuration
 */
export function createSessionConfig(custom?: Partial<SessionConfig>): SessionConfig {
  return {
    ...DEFAULT_SESSION_CONFIG,
    ...custom,
  };
}

// Export for testing
export const __testing__ = {
  lockoutStore,
  resetStore: () => lockoutStore.clear(),
  MAX_ATTEMPTS,
  LOCKOUT_DURATION_MS,
};
