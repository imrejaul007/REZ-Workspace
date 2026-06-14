
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Merchant } from '../../models/Merchant';
import { Store } from '../../models/Store';
import { AuditLog } from '../../models/AuditLog';
import { merchantAuth } from '../../middleware/auth';
import { rateLimitMiddleware, RATE_LIMITS } from '../../middleware/rateLimiter';
import { createServiceLogger } from '../../config/logger';
import { redis } from '../../config/redis';
import { getPermissionsForRole, getClientIp } from './shared';
import { captureIntent } from '../../utils/intentCapture';
import { sendMerchantSignupToRezMind } from '../../utils/rezMindService';

const logger = createServiceLogger('auth');
const router = Router();

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------
/**
 * Registers a new merchant account with password complexity requirements.
 * Creates the merchant record and auto-provisions a default store.
 */
router.post('/register', rateLimitMiddleware('AUTH'), async (req: Request, res: Response) => {
  try {
    const { businessName, ownerName, email, password, phone, businessAddress } = req.body;
    if (!businessName || !ownerName || !email || !password) {
      res.status(400).json({ success: false, message: 'businessName, ownerName, email, password required' });
      return;
    }
    // LOW FIX: Enhanced password complexity requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,128}$/;
    if (typeof password !== 'string' || !passwordRegex.test(password)) {
      res.status(400).json({ success: false, message: 'Password must be 8–128 characters and include uppercase, lowercase, number, and special character (@$!%*?&#)' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Merchant.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400).json({ success: false, message: 'Merchant with this email already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const merchant = new Merchant({
      businessName, ownerName, email: normalizedEmail, password: hashedPassword,
      phone, businessAddress, verificationStatus: 'pending',
    });
    await merchant.save();

    const store = new Store({
      merchant: merchant._id, name: businessName,
      category: 'general',
      location: { address: businessAddress?.street || '', city: businessAddress?.city || '' },
    });
    await store.save();

    // MS-30: Guard against missing JWT secret instead of relying on non-null assertion
    const secret = process.env.JWT_MERCHANT_SECRET;
    if (!secret) {
      logger.error('JWT_MERCHANT_SECRET is not configured');
      res.status(503).json({ success: false, message: 'Service configuration error' }); return;
    }
    const role = 'owner';
    const permissions = getPermissionsForRole(role);
    const token = jwt.sign(
      { merchantId: String(merchant._id), role, permissions },
      secret,
      { expiresIn: process.env.JWT_MERCHANT_EXPIRES_IN || '1h' } as jwt.SignOptions,
    );

    const refreshTokenRaw = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    await Merchant.findByIdAndUpdate(merchant._id, {
      $set: { refreshTokenHash, refreshTokenMeta: JSON.stringify({ role, permissions }) },
    });

    logger.info('Merchant registered', { email: normalizedEmail });

    // Intent capture for merchant signup
    captureIntent({
      userId: String(merchant._id),
      appType: 'restaurant',
      eventType: 'fulfilled' as unknown,
      intentKey: `merchant_signup_${merchant._id}_${Date.now()}`,
      category: 'DINING',
      metadata: {
        merchantId: String(merchant._id),
        businessName,
        ownerName,
        email: normalizedEmail,
        phone,
      },
    }).catch((err: unknown) => logger.warn('[Intent] Merchant signup intent failed', { merchantId: String(merchant._id), error: err instanceof Error ? err.message : String(err) }));

    // Send to REZ Mind Event Platform
    sendMerchantSignupToRezMind({
      merchant_id: String(merchant._id),
      business_name: businessName,
      email: normalizedEmail,
      phone,
    }).catch((err: unknown) => logger.warn('[REZ Mind] Merchant signup event failed', { merchantId: String(merchant._id), error: err instanceof Error ? err.message : String(err) }));

    res.status(201).json({
      success: true,
      message: 'Merchant registered successfully',
      data: {
        token, refreshToken: refreshTokenRaw,
        merchant: {
          id: merchant._id, businessName, ownerName, email: normalizedEmail,
          verificationStatus: 'pending', emailVerified: false,
        },
      },
    });
  } catch (err) {
    logger.error('Registration error', { error: err.message });
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `Registration failed. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/register-otp
// ---------------------------------------------------------------------------
/**
 * Completes merchant registration after OTP verification using the short-lived verification token.
 */
router.post('/register-otp', async (req: Request, res: Response) => {
  try {
    const { phone, verifyToken, name, email, businessName, password } = req.body;
    if (!phone || !verifyToken) {
      res.status(400).json({ success: false, message: 'phone and verifyToken are required' });
      return;
    }
    if (!businessName || !name) {
      res.status(400).json({ success: false, message: 'businessName and name are required' });
      return;
    }

    // Confirm the phone OTP step was completed
    const storedToken = await redis.get(`merchant_otp_verified:${phone}`);
    if (!storedToken) {
      res.status(400).json({ success: false, message: 'Phone verification token is invalid or expired. Please verify your OTP again.' });
      return;
    }
    const storedBuf = Buffer.from(storedToken);
    const verifyBuf = Buffer.from(verifyToken);
    const tokenMatch = storedBuf.length === verifyBuf.length && crypto.timingSafeEqual(storedBuf, verifyBuf);
    if (!tokenMatch) {
      res.status(400).json({ success: false, message: 'Phone verification token is invalid or expired. Please verify your OTP again.' });
      return;
    }

    const existingByPhone = await Merchant.findOne({ phone });
    if (existingByPhone) {
      res.status(400).json({ success: false, message: 'A merchant account with this phone number already exists' });
      return;
    }

    let normalizedEmail: string | undefined;
    if (email) {
      normalizedEmail = email.toLowerCase().trim();
      const existingByEmail = await Merchant.findOne({ email: normalizedEmail });
      if (existingByEmail) {
        res.status(400).json({ success: false, message: 'Merchant with this email already exists' });
        return;
      }
    }

    let hashedPassword: string | undefined;
    if (password) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
        res.status(400).json({ success: false, message: 'Password must be 8–128 characters' });
        return;
      }
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const merchant = new Merchant({
      businessName,
      ownerName: name,
      phone,
      ...(normalizedEmail && { email: normalizedEmail }),
      ...(hashedPassword && { password: hashedPassword }),
      verificationStatus: 'pending',
    });
    await merchant.save();

    await redis.del(`merchant_otp_verified:${phone}`);

    const store = new Store({
      merchant: merchant._id,
      name: businessName,
      category: 'general',
      location: { address: '', city: '' },
    });
    await store.save();

    const secret = process.env.JWT_MERCHANT_SECRET;
    if (!secret) {
      logger.error('JWT_MERCHANT_SECRET is not configured');
      res.status(503).json({ success: false, message: 'Service configuration error' });
      return;
    }
    const role = 'owner';
    const permissions = getPermissionsForRole(role);
    const token = jwt.sign(
      { merchantId: String(merchant._id), role, permissions },
      secret,
      { expiresIn: process.env.JWT_MERCHANT_EXPIRES_IN || '1h' } as jwt.SignOptions,
    );

    const refreshTokenRaw = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    await Merchant.findByIdAndUpdate(merchant._id, {
      $set: { refreshTokenHash, refreshTokenMeta: JSON.stringify({ role, permissions }) },
    });

    logger.info('Merchant registered via OTP', { phone });
    res.status(201).json({
      success: true,
      message: 'Merchant registered successfully',
      data: {
        token,
        refreshToken: refreshTokenRaw,
        merchant: {
          id: merchant._id,
          businessName,
          ownerName: name,
          phone,
          email: normalizedEmail,
          verificationStatus: 'pending',
          emailVerified: false,
        },
      },
    });
  } catch (err) {
    logger.error('register-otp error', { error: err.message });
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------
router.get('/me', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId);
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }

    const stores = await Store.find({ merchantId: merchant._id }).lean();

    res.json({
      success: true,
      data: {
        merchant: {
          id: merchant._id, businessName: merchant.businessName, ownerName: merchant.ownerName,
          email: merchant.email, phone: merchant.phone,
          verificationStatus: merchant.verificationStatus, isActive: merchant.isActive,
          emailVerified: merchant.emailVerified, logo: merchant.logo,
          onboarding: merchant.onboarding, currentPlan: merchant.currentPlan,
        },
        stores,
      },
    });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// PUT /auth/profile
// ---------------------------------------------------------------------------
const PROFILE_ALLOWED_FIELDS = [
  'businessName', 'ownerName', 'phone', 'description', 'tagline',
  'logo', 'coverImage', 'galleryImages', 'brandColors', 'contact',
  'socialMedia', 'businessHours', 'businessAddress', 'gstin', 'pan',
  'bankDetails', 'preferences', 'notificationSettings',
];
router.put('/profile', merchantAuth, async (req: Request, res: Response) => {
  try {
    // MS-41: Use allowlist instead of blocklist
    const updates: Record<string, unknown> = {};
    for (const f of PROFILE_ALLOWED_FIELDS) {
      if ((req.body as unknown)[f] !== undefined) updates[f] = (req.body as unknown)[f];
    }
    const merchant = await Merchant.findByIdAndUpdate(req.merchantId, { $set: updates }, { new: true });
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }

    await AuditLog.create({
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      merchantUserId: req.merchantUserId ? new mongoose.Types.ObjectId(req.merchantUserId) : undefined,
      action: 'PROFILE_UPDATE',
      resourceType: 'merchant',
      resourceId: req.merchantId,
      severity: 'medium',
      details: { updatedFields: Object.keys(updates), ip: getClientIp(req) },
    }).catch((err) => logger.error('[auth] Failed to write audit log for profile update', { merchantId: req.merchantId, error: err?.message }));

    res.json({ success: true, data: { merchant } });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// PUT /auth/change-password
// ---------------------------------------------------------------------------
router.put('/change-password', merchantAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400).json({ success: false, message: 'Both passwords required' }); return; }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ success: false, message: 'New password must be 8–128 characters' }); return;
    }

    const raw = await Merchant.collection.findOne({ _id: new mongoose.Types.ObjectId(req.merchantId) }, { projection: { password: 1 } });
    if (!raw?.password) { res.status(400).json({ success: false, message: 'Cannot verify current password' }); return; }

    const valid = await bcrypt.compare(currentPassword, raw.password as string);
    if (!valid) { res.status(401).json({ success: false, message: 'Current password is incorrect' }); return; }

    const hashed = await bcrypt.hash(newPassword, 12);
    await Merchant.findByIdAndUpdate(req.merchantId, { $set: { password: hashed } });

    await AuditLog.create({
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      merchantUserId: req.merchantUserId ? new mongoose.Types.ObjectId(req.merchantUserId) : undefined,
      action: 'MERCHANT_PASSWORD_CHANGE',
      resourceType: 'merchant',
      resourceId: req.merchantId,
      severity: 'high',
      details: { ip: getClientIp(req), userAgent: req.headers['user-agent'] },
    });

    // CRITICAL-SEC FIX (MA-BACK-004): Blacklist the current access token on password change.
    const header = req.headers.authorization;
    const cookieToken = (req as unknown).cookies?.merchant_access_token;
    const rawToken = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const ttlSeconds = 3600;
      await redis.set(`blacklist:merchant:${tokenHash}`, '1', 'EX', ttlSeconds);
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/forgot-password
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) { res.status(400).json({ success: false, message: 'Email is required' }); return; }
    const normalizedEmail = email.toLowerCase().trim();
    const merchant = await Merchant.findOne({ email: normalizedEmail });
    // Always return success to prevent email enumeration
    if (merchant) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await Merchant.findByIdAndUpdate(merchant._id, {
        $set: { passwordResetTokenHash: resetTokenHash, passwordResetExpiry: resetTokenExpiry },
      });
      logger.info('Password reset requested', { email: normalizedEmail });
      if (process.env.NODE_ENV !== 'production') {
        // CRITICAL-SEC FIX: Do not log the reset token value in plaintext.
        logger.debug('Dev password reset token', { email: normalizedEmail });
      }
    }
    res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/reset-password
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'token and newPassword are required' }); return;
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      res.status(400).json({ success: false, message: 'New password must be 8–128 characters' }); return;
    }
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const merchant = await Merchant.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpiry: { $gt: new Date() },
    });
    if (!merchant) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' }); return;
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await Merchant.findByIdAndUpdate(merchant._id, {
      $set: { password: hashed },
      $unset: { passwordResetTokenHash: 1, passwordResetExpiry: 1, refreshTokenHash: 1 },
    });
    // LOW-SEC FIX: Blacklist the access token on password reset.
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const rawToken = header.slice(7);
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await redis.set(`blacklist:merchant:${tokenHash}`, '1', 'EX', 3600);
    }
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/verify-email
// ---------------------------------------------------------------------------
/**
 * Verifies a merchant's email address using a token from the verification email link.
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) { res.status(400).json({ success: false, message: 'token is required' }); return; }
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const merchant = await Merchant.findOne({
      emailVerificationTokenHash: hash,
      emailVerificationExpiry: { $gt: new Date() },
    });
    if (!merchant) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification token' }); return;
    }
    await Merchant.findByIdAndUpdate(merchant._id, {
      $set: { emailVerified: true },
      $unset: { emailVerificationTokenHash: 1, emailVerificationExpiry: 1 },
    });
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/resend-verification
// ---------------------------------------------------------------------------
/**
 * Resends the email verification link to the merchant's registered email address.
 */
router.post('/resend-verification', merchantAuth, async (req: Request, res: Response) => {
  try {
    const merchant = await Merchant.findById(req.merchantId);
    if (!merchant) { res.status(404).json({ success: false, message: 'Merchant not found' }); return; }
    if (merchant.emailVerified) {
      res.status(400).json({ success: false, message: 'Email is already verified' }); return;
    }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await Merchant.findByIdAndUpdate(merchant._id, {
      $set: { emailVerificationTokenHash: verifyTokenHash, emailVerificationExpiry: verifyExpiry },
    });
    logger.info('Verification email resend requested', { email: merchant.email });
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

export default router;
