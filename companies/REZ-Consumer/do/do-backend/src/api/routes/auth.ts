import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { AuthUser } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { authService } from '../../integrations/rezIntegrations.js';
import {
  isLockedOut,
  getRemainingLockoutTime,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
} from '../../../../packages/security-middleware/src/accountLockout.js';

export const authRouter = Router();

const phoneRegex = /^[6-9]\d{9}$/;

// In-memory user store (synced with ReZ Auth)
const userStore = new Map<string, AuthUser & { createdAt: Date; token: string }>();

// Validation schemas
const sendOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  otp: z.string().length(4, 'OTP must be 4 digits'),
});

// POST /auth/otp/send - Send OTP
authRouter.post(
  '/otp/send',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { phone } = sendOtpSchema.parse(req.body);
    const formattedPhone = `+91${phone}`;

    // Check if account is locked
    if (isLockedOut(formattedPhone)) {
      const remainingMs = getRemainingLockoutTime(formattedPhone);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      logger.warn('OTP send blocked - account locked', { phone: formattedPhone });

      res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: remainingMinutes,
        message: `Please try again in ${remainingMinutes} minutes`,
      });
      return;
    }

    logger.info('OTP send requested', { phone });

    // Always use ReZ Auth Service - no fallback for production
    try {
      const result = await authService.sendOTP(formattedPhone);

      if (result.success) {
        res.json({
          success: true,
          message: 'OTP sent successfully',
          expiresIn: result.expiresIn || 300,
        });
      } else {
        throw new Error('Auth service returned failure');
      }
    } catch (error) {
      logger.error('ReZ Auth failed', { error: error.message });
      // Never expose internal fallbacks in production
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
      });
    }
  })
);

// POST /auth/otp/verify - Verify OTP
authRouter.post(
  '/otp/verify',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { phone, otp } = verifyOtpSchema.parse(req.body);
    const formattedPhone = `+91${phone}`;

    // Check if account is locked BEFORE verification
    if (isLockedOut(formattedPhone)) {
      const remainingMs = getRemainingLockoutTime(formattedPhone);
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      logger.warn('OTP verify blocked - account locked', { phone: formattedPhone });

      res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to too many failed attempts',
        code: 'ACCOUNT_LOCKED',
        retryAfter: remainingMinutes,
        message: `Please try again in ${remainingMinutes} minutes`,
      });
      return;
    }

    logger.info('OTP verify requested', { phone });

    // Always use ReZ Auth Service - no fallback for production
    try {
      const result = await authService.verifyOTP(formattedPhone, otp);

      if (result.success && result.token) {
        // Clear failed attempts on successful verification
        clearFailedAttempts(formattedPhone);

        // Get user profile
        const profile = await authService.getProfile(result.token);

        // Store user session
        const user: AuthUser & { createdAt: Date; token: string } = {
          id: profile.id || uuidv4(),
          phone: formattedPhone,
          name: profile.name,
          createdAt: new Date(),
          token: result.token,
        };
        userStore.set(formattedPhone, user);

        res.json({
          success: true,
          token: result.token,
          refreshToken: result.refreshToken,
          expiresIn: result.expiresIn || 3600,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
          },
        });
      } else {
        // Record failed attempt
        recordFailedAttempt(formattedPhone);
        const remaining = getRemainingAttempts(formattedPhone);

        res.status(401).json({
          success: false,
          message: 'Invalid OTP',
          remainingAttempts: remaining,
        });
      }
    } catch (error) {
      logger.error('ReZ Auth verify failed', { error: error.message });
      // Never fall back to accepting any OTP in production
      res.status(401).json({
        success: false,
        message: 'Authentication service unavailable. Please try again later.',
      });
    }
  })
);

// GET /auth/me - Get current user
authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Try ReZ Auth
    try {
      const profile = await authService.getProfile(token);
      res.json({
        success: true,
        user: profile,
      });
    } catch {
      // Fallback to local store
      const user = Array.from(userStore.values()).find(u => u.token === token);

      if (user) {
        res.json({
          success: true,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
          },
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
    }
  })
);

// POST /auth/logout - Logout
authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Remove from local store
      for (const [phone, user] of userStore.entries()) {
        if (user.token === token) {
          userStore.delete(phone);
          break;
        }
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  })
);

// POST /auth/refresh - Refresh token
authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    try {
      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        token: result.token,
        refreshToken: result.refreshToken,
      });
    } catch {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  })
);

// Health check
authRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    service: 'do-auth',
  });
});
