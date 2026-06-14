
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Merchant } from '../../models/Merchant';
import { MerchantUser } from '../../models/MerchantUser';
import { AuditLog } from '../../models/AuditLog';
import { merchantAuth } from '../../middleware/auth';
import { createServiceLogger } from '../../config/logger';
import { redis } from '../../config/redis';
import { getPermissionsForRole, getClientIp } from './shared';
import { createRateLimiter } from '@rez/shared';

const logger = createServiceLogger('auth');
const router = Router();

// ---------------------------------------------------------------------------
// Security constants & rate-limiters (Redis-backed)
// ---------------------------------------------------------------------------

const loginLimiter = createRateLimiter(
  redis.call.bind(redis),
  {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts, please try again later',
  }
);

const otpSendLimiter = createRateLimiter(
  redis.call.bind(redis),
  {
    windowMs: 5 * 60 * 1000,
    max: 1,
    keyPrefix: 'rl:otp:send',
    message: 'Too many OTP requests. Please wait 5 minutes.',
  }
);

// ROUTE-SEC-031/032/033: Failed attempt tracking and timing-safe comparison
const MAX_OTP_FAILURES = 5;
const LOCKOUT_SECONDS = 900; // 15 minutes

async function checkOtpLockout(phone: string): Promise<{ locked: boolean; ttl?: number }> {
  const lockKey = `merchant_otp_lockout:${phone}`;
  const ttl = await redis.ttl(lockKey);
  if (ttl > 0) {
    return { locked: true, ttl };
  }
  return { locked: false };
}

async function recordOtpFailure(phone: string): Promise<number> {
  const key = `merchant_otp_failures:${phone}`;
  const count = await redis.incr(key);
  await redis.expire(key, LOCKOUT_SECONDS);
  if (count >= MAX_OTP_FAILURES) {
    await redis.set(`merchant_otp_lockout:${phone}`, '1', 'EX', LOCKOUT_SECONDS);
    await redis.del(key);
    return MAX_OTP_FAILURES;
  }
  return count;
}

async function clearOtpFailures(phone: string): Promise<void> {
  await redis.del(`merchant_otp_failures:${phone}`);
}

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
/**
 * Authenticates a merchant or merchant user with email and password.
 * Supports both owner login (Merchant) and team member login (MerchantUser).
 * Issues a JWT access token and a rotating refresh token.
 */
router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    let merchant = await Merchant.findOne({ email: normalizedEmail });
    let merchantUser: unknown = null;
    let isOwnerLogin = false;

    if (merchant) {
      const raw = await Merchant.collection.findOne({ _id: merchant._id }, { projection: { password: 1 } });
      if (raw?.password) (merchant as unknown).password = raw.password;
      isOwnerLogin = true;
    }

    if (!merchant) {
      merchantUser = await MerchantUser.findOne({ email: normalizedEmail }).populate('merchantId');
      if (merchantUser) {
        const raw = await MerchantUser.collection.findOne({ _id: merchantUser._id }, { projection: { password: 1 } });
        if (raw?.password) (merchantUser as unknown).password = raw.password;
        merchant = merchantUser.merchantId as unknown;
      }
      if (!merchant) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      if (merchantUser.status !== 'active') {
        res.status(403).json({ success: false, message: `Account is ${merchantUser.status}` });
        return;
      }
    }

    const account = merchantUser || merchant;
    if (account.accountLockedUntil && account.accountLockedUntil > new Date()) {
      const mins = Math.ceil((account.accountLockedUntil.getTime() - Date.now()) / 60000);
      res.status(423).json({ success: false, message: `Account locked. Try again in ${mins} minutes.` });
      return;
    }

    const passwordHash = merchantUser?.password || (merchant as unknown).password;
    if (!passwordHash) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      await AuditLog.create({
        action: 'login_failed',
        resource: 'auth',
        resourceId: String(merchant._id),
        merchantId: merchant._id,
        performedBy: String(merchant._id),
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown',
        metadata: {
          reason: 'invalid_password',
          failedAttempts: (account.failedLoginAttempts || 0) + 1,
          email: normalizedEmail,
        },
      }).catch((err) => logger.error('Failed to create audit log', { error: err.message }));

      account.failedLoginAttempts = (account.failedLoginAttempts || 0) + 1;
      if (account.failedLoginAttempts >= 5) {
        account.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await account.save();
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    account.failedLoginAttempts = 0;
    account.accountLockedUntil = undefined;
    account.lastLoginAt = new Date();
    account.lastLoginIP = getClientIp(req);
    await account.save();

    const secret = process.env.JWT_MERCHANT_SECRET;
    if (!secret) {
      logger.error('JWT_MERCHANT_SECRET is not configured');
      res.status(503).json({ success: false, message: 'Service configuration error' }); return;
    }
    const role = merchantUser?.role || 'owner';
    const permissions = merchantUser ? getPermissionsForRole(merchantUser.role) : getPermissionsForRole('owner');
    const tokenPayload: unknown = { merchantId: String(merchant._id), role, permissions };
    if (merchantUser) tokenPayload.merchantUserId = String(merchantUser._id);
    const token = jwt.sign(tokenPayload, secret, { expiresIn: process.env.JWT_MERCHANT_EXPIRES_IN || '1h' } as jwt.SignOptions);

    const refreshTokenRaw = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const refreshTokenMeta = JSON.stringify({ role, permissions, ...(merchantUser ? { merchantUserId: String(merchantUser._id) } : {}) });
    // FIX-AUTH-001: Add 30-day expiry to refresh tokens. Previously tokens were valid
    // indefinitely until manual logout, enabling indefinite access if stolen.
    const refreshTokenExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await Merchant.findByIdAndUpdate(merchant._id, { $set: { refreshTokenHash, refreshTokenMeta, refreshTokenExpiry } });

    const responseData: unknown = {
      token, refreshToken: refreshTokenRaw, role, permissions,
      merchant: {
        id: merchant._id, businessName: merchant.businessName,
        email: isOwnerLogin ? merchant.email : email,
        verificationStatus: merchant.verificationStatus,
        isActive: merchant.isActive, emailVerified: merchant.emailVerified,
      },
    };
    if (merchantUser) {
      responseData.user = { id: merchantUser._id, name: merchantUser.name, email: merchantUser.email, role: merchantUser.role, status: merchantUser.status };
    } else {
      responseData.merchant.ownerName = merchant.ownerName;
    }

    logger.info('Login successful', { email: normalizedEmail, role });

    const isSecure = process.env.NODE_ENV === 'production';
    res.cookie('merchant_access_token', token, {
      httpOnly: true, secure: isSecure, sameSite: 'strict',
      maxAge: 60 * 60 * 1000, path: '/',
    });
    res.cookie('merchant_refresh_token', refreshTokenRaw, {
      httpOnly: true, secure: isSecure, sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/merchant/auth/refresh',
    });

    res.json({ success: true, message: 'Login successful', data: responseData });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `Login failed. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/logout
// ---------------------------------------------------------------------------
router.post('/logout', merchantAuth, async (req: Request, res: Response) => {
  try {
    const header = req.headers.authorization;
    const cookieToken = (req as unknown).cookies?.merchant_access_token;
    const rawToken = header?.startsWith('Bearer ') ? header.slice(7) : cookieToken;
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const ttlSeconds = 3600;
      await redis.set(`blacklist:merchant:${tokenHash}`, '1', 'EX', ttlSeconds);
    }

    await Merchant.findByIdAndUpdate(req.merchantId, { $unset: { refreshTokenHash: 1, refreshTokenMeta: 1, refreshTokenExpiry: 1 } });

    await AuditLog.create({
      merchantId: new mongoose.Types.ObjectId(req.merchantId as string),
      merchantUserId: req.merchantUserId ? new mongoose.Types.ObjectId(req.merchantUserId) : undefined,
      action: 'MERCHANT_LOGOUT',
      resourceType: 'merchant_session',
      resourceId: req.merchantId,
      severity: 'low',
      details: { ip: getClientIp(req), userAgent: req.headers['user-agent'] },
    }).catch((err) => logger.error('[auth] Failed to write audit log for logout', { merchantId: req.merchantId, error: err?.message }));

    res.clearCookie('merchant_access_token', { path: '/' });
    res.clearCookie('merchant_refresh_token', { path: '/api/merchant/auth/refresh' });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `An error occurred. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/refresh
// ---------------------------------------------------------------------------
/**
 * Refreshes the JWT access token using the stored refresh token hash.
 * Issues a new access token and updates the refresh token hash (rotation).
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ success: false, message: 'Refresh token required' }); return; }

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const merchant = await Merchant.findOne({ refreshTokenHash: hash }).select('+refreshTokenExpiry');
    if (!merchant) { res.status(401).json({ success: false, message: 'Invalid refresh token' }); return; }

    // FIX-AUTH-001: Validate refresh token expiry
    if (merchant.refreshTokenExpiry && merchant.refreshTokenExpiry < new Date()) {
      logger.info('Refresh token expired', { merchantId: merchant._id });
      return res.status(401).json({ success: false, message: 'Refresh token expired. Please login again.' });
    }

    let meta: unknown = {};
    try { meta = JSON.parse(merchant.refreshTokenMeta || '{}'); } catch (parseErr) {
      logger.warn('Failed to parse refreshTokenMeta — using defaults', { error: parseErr.message });
    }

    const secret = process.env.JWT_MERCHANT_SECRET;
    if (!secret) {
      logger.error('JWT_MERCHANT_SECRET is not configured');
      res.status(503).json({ success: false, message: 'Service configuration error' }); return;
    }
    const role = meta.role || 'owner';
    const permissions = meta.permissions || getPermissionsForRole(role);
    const tokenPayload: unknown = { merchantId: String(merchant._id), role, permissions };
    if (meta.merchantUserId) tokenPayload.merchantUserId = meta.merchantUserId;
    const token = jwt.sign(tokenPayload, secret, { expiresIn: process.env.JWT_MERCHANT_EXPIRES_IN || '1h' } as jwt.SignOptions);

    const newRefresh = crypto.randomBytes(64).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
    // FIX-AUTH-001: Reset expiry on token rotation
    const newRefreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await Merchant.findByIdAndUpdate(merchant._id, { $set: { refreshTokenHash: newHash, refreshTokenExpiry: newRefreshExpiry } });

    const isSecure = process.env.NODE_ENV === 'production';
    res.cookie('merchant_access_token', token, {
      httpOnly: true, secure: isSecure, sameSite: 'strict',
      maxAge: 60 * 60 * 1000, path: '/',
    });
    res.cookie('merchant_refresh_token', newRefresh, {
      httpOnly: true, secure: isSecure, sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/merchant/auth/refresh',
    });

    res.json({ success: true, data: { token, refreshToken: newRefresh } });
  } catch (err) {
    const requestId = (req as unknown).res?.locals?.requestId;
    const msg = process.env.NODE_ENV === 'production'
      ? `Token refresh failed. Reference: ${requestId || 'unknown'}`
      : err.message;
    res.status(500).json({ success: false, message: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/send-otp
// ---------------------------------------------------------------------------
/**
 * Sends a merchant OTP to the specified phone number.
 * Rate-limited to 1 OTP per (IP + phone) every 5 minutes.
 * Generates a 6-digit OTP stored in Redis for 5 minutes.
 */
router.post('/send-otp', otpSendLimiter, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'phone is required' });
      return;
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    // C6 FIX + FIX-OTP-001: Add server-side pepper to prevent rainbow table attacks on 6-digit OTP.
    // The pepper is stored in environment and never sent to the client, making the hash
    // resistant to precomputed rainbow tables even with a small OTP space.
    const otpPepper = process.env.OTP_PEPPER || '';
    const otpHash = crypto.createHash('sha256').update(`${phone}:${otp}:${otpPepper}`).digest('hex');
    await redis.set(`merchant_otp:${phone}`, otpHash, 'EX', 300);
    logger.info('Merchant OTP sent', { phone: phone.slice(-4).padStart(phone.length, '*') });
    if (process.env.NODE_ENV !== 'production') {
      // CRITICAL-SEC FIX (MA-BACK-005): Never log OTP value or any derived PII in dev logs.
      logger.debug('Dev merchant OTP sent', { phone: phone.slice(-4).padStart(phone.length, '*') });
      res.json({ success: true, message: 'OTP sent' });
      return;
    }
    const msg91Key = process.env.MSG91_API_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    if (!msg91Key && !twilioSid) {
      logger.error('[OTP] No SMS provider configured — MSG91_API_KEY or TWILIO_ACCOUNT_SID required in production');
      await redis.del(`merchant_otp:${phone}`);
      res.status(503).json({ success: false, message: 'OTP delivery not configured. Contact support.' });
      return;
    }
    if (msg91Key) {
      const msg91Url = `https://api.msg91.com/api/v5/otp?template_id=${encodeURIComponent(process.env.MSG91_TEMPLATE_ID || '')}&mobile=${encodeURIComponent(phone)}&authkey=${msg91Key}&otp=${otp}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const smsRes = await fetch(msg91Url, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);
        if (!smsRes.ok) {
          logger.error('[OTP] MSG91 delivery failed', { status: smsRes.status, phone });
          await redis.del(`merchant_otp:${phone}`);
          res.status(502).json({ success: false, message: 'Failed to send OTP. Please try again.' });
          return;
        }
      } catch (fetchErr) {
        clearTimeout(timeout);
        logger.error('[OTP] MSG91 delivery failed', { error: (fetchErr as Error).message, phone });
        await redis.del(`merchant_otp:${phone}`);
        res.status(502).json({ success: false, message: 'Failed to send OTP. Please try again.' });
        return;
      }
    }
    res.json({ success: true, message: 'OTP sent' });
  } catch (err) {
    logger.error('send-otp error', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// ---------------------------------------------------------------------------
// POST /auth/verify-otp
// ---------------------------------------------------------------------------
/**
 * Verifies a merchant OTP and issues a short-lived verification token for password setup.
 * ROUTE-SEC-031: Account locked after 5 failed attempts (15-min lockout).
 * ROUTE-SEC-032/033: Uses crypto.timingSafeEqual for constant-time OTP comparison.
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      res.status(400).json({ success: false, message: 'phone and otp are required' });
      return;
    }

    // HIGH-SEC FIX: Validate OTP is exactly 6 numeric digits before timing-safe comparison.
    const otpStr = String(otp).trim();
    if (!/^\d{6}$/.test(otpStr)) {
      await recordOtpFailure(phone);
      res.status(400).json({ success: false, message: 'Invalid OTP format. Must be 6 digits.' });
      return;
    }

    // ROUTE-SEC-031 FIX: Check lockout before processing
    const lockout = await checkOtpLockout(phone);
    if (lockout.locked) {
      res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${lockout.ttl} seconds.`,
      });
      return;
    }

    const storedHash = await redis.get(`merchant_otp:${phone}`);
    if (!storedHash) {
      res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      return;
    }

    // C6 FIX + CRITICAL-SEC FIX + FIX-OTP-001: Hash + crypto.timingSafeEqual with pepper
    const otpPepper = process.env.OTP_PEPPER || '';
    const providedHash = crypto.createHash('sha256').update(`${phone}:${otpStr}:${otpPepper}`).digest('hex');
    const storedBuf = Buffer.from(storedHash);
    const providedBuf = Buffer.from(providedHash);
    let match = false;
    if (storedBuf.length === providedBuf.length) {
      match = crypto.timingSafeEqual(storedBuf, providedBuf);
    }

    if (!match) {
      const failures = await recordOtpFailure(phone);
      const remaining = MAX_OTP_FAILURES - failures;
      if (remaining > 0) {
        res.status(400).json({ success: false, message: `Invalid OTP. ${remaining} attempts remaining.` });
      } else {
        res.status(429).json({ success: false, message: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.' });
      }
      return;
    }

    await redis.del(`merchant_otp:${phone}`);
    await clearOtpFailures(phone);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await redis.set(`merchant_otp_verified:${phone}`, verifyToken, 'EX', 600);
    logger.info('Merchant OTP verified', { phone });
    res.json({ success: true, message: 'OTP verified', verifyToken });
  } catch (err) {
    logger.error('verify-otp error', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// ---------------------------------------------------------------------------
// GET /auth/verify-phone
// ---------------------------------------------------------------------------
router.get('/verify-phone', async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'OTP verification endpoint. Use POST /auth/verify-otp.' });
});

// ---------------------------------------------------------------------------
// GET /auth/verify-phone/:merchantId
// ---------------------------------------------------------------------------
router.get('/verify-phone/:merchantId', async (req: Request, res: Response) => {
  const { merchantId } = req.params;
  res.json({ success: true, merchantId, message: 'OTP verification endpoint. Use POST /auth/verify-otp.' });
});

export default router;
