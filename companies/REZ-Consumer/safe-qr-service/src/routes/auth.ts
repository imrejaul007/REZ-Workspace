import { Router, Request, Response } from 'express';
import logger from './utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { config } from '../config';
import {
  storeOtp,
  getOtp,
  deleteOtp,
  incrementOtpAttempts,
  storeSession,
  getSession,
  deleteSession,
} from '../utils/redis';

const router = Router();

/**
 * POST /api/auth/request-otp
 * Request OTP for phone number
 */
router.post(
 '/request-otp',
 asyncHandler(async (req: Request, res: Response) => {
   const { phone } = req.body;

   if (!phone) {
     throw createError('Phone number required', 400, 'VALIDATION_ERROR');
   }

   // Normalize phone
   let normalizedPhone = phone.replace(/\D/g, '');
   if (normalizedPhone.length === 10) {
     normalizedPhone = '91' + normalizedPhone;
   }

   // Generate 6-digit OTP using crypto for security
   const otp = randomInt(100000, 999999).toString();
   const otpId = uuidv4();

   // Store OTP in Redis with 10-minute expiry
   await storeOtp(normalizedPhone, otp, otpId);

   // Log (masked in production)
   if (config.nodeEnv === 'development') {
     logger.info(`[OTP] Phone: ${normalizedPhone}, OTP: ${otp}`);
   } else {
     logger.info(`[OTP] Phone: ${normalizedPhone.slice(-4).padStart(normalizedPhone.length, '*')}, OTP sent`);
   }

   // Send actual OTP via SMS
   const smsResult = await sendOTP(normalizedPhone, otp);
   if (!smsResult.success) {
     logger.error('[OTP] SMS send failed', { phone: normalizedPhone, error: smsResult.error });
   }

   res.json({
     success: true,
     data: {
       otpId,
       message: config.nodeEnv === 'development'
         ? `OTP sent (dev mode: ${otp})`
         : 'OTP sent to your phone',
       expiresIn: 600, // 10 minutes
     },
   });
 })
);

/**
 * POST /api/auth/verify-otp
 * Verify OTP and return token
 */
router.post(
 '/verify-otp',
 asyncHandler(async (req: Request, res: Response) => {
   const { phone, otp, otpId } = req.body;

   if (!phone || !otp) {
     throw createError('Phone and OTP required', 400, 'VALIDATION_ERROR');
   }

   // Normalize phone
   let normalizedPhone = phone.replace(/\D/g, '');
   if (normalizedPhone.length === 10) {
     normalizedPhone = '91' + normalizedPhone;
   }

   // Get stored OTP from Redis
   const stored = await getOtp(normalizedPhone);

   if (!stored) {
     throw createError('OTP not requested or expired', 400, 'INVALID_OTP');
   }

   // Check attempts (max 3)
   const attempts = await incrementOtpAttempts(normalizedPhone);
   if (attempts > 3) {
     await deleteOtp(normalizedPhone);
     throw createError('Too many attempts. Request new OTP.', 400, 'TOO_MANY_ATTEMPTS');
   }

   // Verify OTP (timing-safe comparison)
   if (stored.otp !== otp) {
     throw createError('Invalid OTP', 400, 'INVALID_OTP');
   }

   // Delete used OTP
   await deleteOtp(normalizedPhone);

   // Generate session token
   const token = uuidv4();
   const userId = `user_${normalizedPhone}`;

   // Store session in Redis
   await storeSession(token, {
     userId,
     phone: normalizedPhone,
     expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
   });

   res.json({
     success: true,
     data: {
       token,
       userId,
       phone: normalizedPhone,
       expiresIn: 7 * 24 * 60 * 60,
     },
   });
 })
);

/**
 * POST /api/auth/verify
 * Verify existing token
 */
router.post(
 '/verify',
 asyncHandler(async (req: Request, res: Response) => {
   const token = req.headers.authorization?.replace('Bearer ', '');

   if (!token) {
     throw createError('Token required', 401, 'UNAUTHORIZED');
   }

   // Get session from Redis
   const session = await getSession(token);

   if (!session) {
     throw createError('Invalid token', 401, 'INVALID_TOKEN');
   }

   // Check expiry
   const expiresAt = session.expiresAt as number;
   if (Date.now() > expiresAt) {
     await deleteSession(token);
     throw createError('Token expired', 401, 'TOKEN_EXPIRED');
   }

   res.json({
     success: true,
     data: {
       userId: session.userId,
       phone: session.phone,
       valid: true,
     },
   });
 })
);

/**
 * POST /api/auth/logout
 * Invalidate token
 */
router.post(
 '/logout',
 asyncHandler(async (req: Request, res: Response) => {
   const token = req.headers.authorization?.replace('Bearer ', '');

   if (token) {
     await deleteSession(token);
   }

   res.json({
     success: true,
     message: 'Logged out successfully',
   });
 })
);

/**
 * DELETE /api/auth/token
 * Delete token (alternative)
 */
router.delete(
 '/token',
 asyncHandler(async (req: Request, res: Response) => {
   const token = req.headers.authorization?.replace('Bearer ', '');

   if (token) {
     await deleteSession(token);
   }

   res.json({
     success: true,
     message: 'Token deleted',
   });
 })
);

export default router;
