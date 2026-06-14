/**
 * BIZORA Auth Service - Production Version
 * MongoDB-backed Authentication & Authorization
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '4001');
const JWT_SECRET = process.env.JWT_SECRET || 'bizora-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bizora';

// ============================================================================
// MongoDB Schemas
// ============================================================================

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  type: { type: String, enum: ['business_owner', 'agency', 'admin', 'support'], default: 'business_owner' },
  avatar: { type: String },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  refreshTokens: [{ token: String, expiresAt: Date }],
  lastLogin: { type: Date },
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  passwordChangedAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
}, { timestamps: true });

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 });
userSchema.index({ type: 1 });
userSchema.index({ createdAt: -1 });

// Refresh Token Schema
const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
}, { timestamps: true });

refreshTokenSchema.index({ token: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// OTP Schema
const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  email: { type: String },
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'register', 'reset_password', 'verify_phone'], default: 'login' },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

otpSchema.index({ phone: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String },
  resourceId: { type: String },
  ip: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failed'] },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Create models
const User = mongoose.model('User', userSchema);
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
const OTP = mongoose.model('OTP', otpSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ============================================================================
// Validation Schemas
// ============================================================================

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Invalid phone number').max(15),
  type: z.enum(['business_owner', 'agency']).default('business_owner'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SendOTPSchema = z.object({
  phone: z.string().min(10),
  purpose: z.enum(['login', 'register', 'reset_password', 'verify_phone']).default('login'),
});

const VerifyOTPSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().length(6),
  password: z.string().min(8).optional(),
  name: z.string().min(2).optional(),
  type: z.enum(['business_owner', 'agency']).optional(),
});

// ============================================================================
// Utility Functions
// ============================================================================

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

function generateTokens(user: any): { token: string; refreshToken: string } {
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      type: user.type,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = generateRefreshToken();

  return { token, refreshToken };
}

async function saveRefreshToken(userId: string, refreshToken: string, ip?: string, userAgent?: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt,
    ip,
    userAgent,
  });
}

async function revokeRefreshToken(token: string): Promise<void> {
  await RefreshToken.deleteOne({ token });
}

async function revokeAllUserTokens(userId: string): Promise<void> {
  await RefreshToken.deleteMany({ userId });
}

async function logAudit(userId: string, action: string, resource?: string, resourceId?: string, status: 'success' | 'failed' = 'success', metadata?: any, ip?: string, userAgent?: string): Promise<void> {
  await AuditLog.create({
    userId,
    action,
    resource,
    resourceId,
    status,
    metadata,
    ip,
    userAgent,
  });
}

function sanitizeUser(user: any): any {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
}

// ============================================================================
// Rate Limiting
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= max) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// Express App
// ============================================================================

const app = express();

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
}));

app.use(express.json({ limit: '10kb' }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check
app.get('/health', async (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    service: 'auth-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbState,
  });
});

// ============================================================================
// Auth Routes
// ============================================================================

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    // Rate limit
    const rateLimitKey = `register:${req.ip}`;
    if (!checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many registration attempts', code: 'RATE_LIMITED' });
    }

    const data = RegisterSchema.parse(req.body);

    // Check if user exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await User.create({
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      phone: data.phone,
      type: data.type,
      emailVerified: false,
    });

    // Generate tokens
    const { token, refreshToken } = generateTokens(user);
    await saveRefreshToken(user._id.toString(), refreshToken, req.ip, req.get('user-agent'));

    // Log audit
    await logAudit(user._id.toString(), 'REGISTER', 'User', user._id.toString(), 'success', { type: data.type }, req.ip, req.get('user-agent'));

    res.status(201).json({
      user: sanitizeUser(user),
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors });
    }
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    // Rate limit
    const rateLimitKey = `login:${req.ip}`;
    if (!checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many login attempts', code: 'RATE_LIMITED' });
    }

    const data = LoginSchema.parse(req.body);

    // Find user
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      await logAudit(undefined, 'LOGIN_FAILED', 'User', undefined, 'failed', { email: data.email, reason: 'User not found' }, req.ip, req.get('user-agent'));
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED' });
    }

    // Verify password
    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      await logAudit(user._id.toString(), 'LOGIN_FAILED', 'User', user._id.toString(), 'failed', { reason: 'Invalid password' }, req.ip, req.get('user-agent'));
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Generate tokens
    const { token, refreshToken } = generateTokens(user);
    await saveRefreshToken(user._id.toString(), refreshToken, req.ip, req.get('user-agent'));

    // Update last login
    user.lastLogin = new Date();
    user.loginHistory.push({ ip: req.ip || '', userAgent: req.get('user-agent') || '', timestamp: new Date() });
    if (user.loginHistory.length > 10) user.loginHistory = user.loginHistory.slice(-10);
    await user.save();

    // Log audit
    await logAudit(user._id.toString(), 'LOGIN', 'User', user._id.toString(), 'success', {}, req.ip, req.get('user-agent'));

    res.json({
      user: sanitizeUser(user),
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors });
    }
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Send OTP
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  try {
    // Rate limit
    const rateLimitKey = `otp:${req.ip}`;
    if (!checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)) {
      return res.status(429).json({ error: 'Too many OTP requests', code: 'RATE_LIMITED' });
    }

    const data = SendOTPSchema.parse(req.body);

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this phone
    await OTP.deleteMany({ phone: data.phone, purpose: data.purpose, verified: false });

    // Create new OTP
    await OTP.create({
      phone: data.phone,
      otp,
      purpose: data.purpose,
      expiresAt,
    });

    // In production, send OTP via SMS/WhatsApp
    logger.info(`[OTP] Phone: ${data.phone}, OTP: ${otp}, Purpose: ${data.purpose}`);

    res.json({
      sent: true,
      message: 'OTP sent successfully',
      // Development only - remove in production
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors });
    }
    logger.error('Send OTP error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const data = VerifyOTPSchema.parse(req.body);

    // Find OTP
    const otpRecord = await OTP.findOne({
      phone: data.phone,
      otp: data.otp,
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired OTP', code: 'INVALID_OTP' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP expired', code: 'OTP_EXPIRED' });
    }

    if (otpRecord.attempts >= 3) {
      return res.status(400).json({ error: 'Too many attempts', code: 'OTP_ATTEMPTS_EXCEEDED' });
    }

    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();

    // Verify OTP
    otpRecord.verified = true;
    await otpRecord.save();

    // Handle based on purpose
    if (otpRecord.purpose === 'register' || otpRecord.purpose === 'login') {
      // Find or create user
      let user = await User.findOne({ phone: data.phone });

      if (otpRecord.purpose === 'register' && !user && data.password && data.name && data.type) {
        const hashedPassword = await hashPassword(data.password);
        user = await User.create({
          email: `${data.phone}@temp.bizora.com`, // Temporary email
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
          type: data.type,
          phoneVerified: true,
        });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found. Please register first.', code: 'USER_NOT_FOUND' });
      }

      // Mark phone as verified
      user.phoneVerified = true;
      await user.save();

      // Generate tokens
      const { token, refreshToken } = generateTokens(user);
      await saveRefreshToken(user._id.toString(), refreshToken, req.ip, req.get('user-agent'));

      await logAudit(user._id.toString(), 'OTP_LOGIN', 'User', user._id.toString(), 'success', { purpose: otpRecord.purpose }, req.ip, req.get('user-agent'));

      res.json({
        user: sanitizeUser(user),
        token,
        refreshToken,
      });
    } else if (otpRecord.purpose === 'reset_password') {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      await User.findOneAndUpdate(
        { phone: data.phone },
        {
          passwordResetToken: hashedToken,
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        }
      );

      res.json({
        resetToken, // In production, this would be sent via SMS/email
        message: 'OTP verified. Use the reset token to set new password.',
      });
    } else {
      res.json({ verified: true });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors });
    }
    logger.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Verify Token
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided', code: 'NO_TOKEN' });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED' });
      }

      res.json({ user: sanitizeUser(user) });
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Verify token error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Refresh Token
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required', code: 'NO_REFRESH_TOKEN' });
    }

    // Find refresh token
    const storedToken = await RefreshToken.findOne({ token: refreshToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }

    // Get user
    const user = await User.findById(storedToken.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive', code: 'USER_INVALID' });
    }

    // Revoke old token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    // Generate new tokens
    const tokens = generateTokens(user);
    await saveRefreshToken(user._id.toString(), tokens.refreshToken, req.ip, req.get('user-agent'));

    await logAudit(user._id.toString(), 'TOKEN_REFRESH', 'User', user._id.toString(), 'success', {}, req.ip, req.get('user-agent'));

    res.json(tokens);
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Logout
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required', code: 'EMAIL_REQUIRED' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Don't reveal if user exists
    if (!user) {
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    logger.info(`[Password Reset] Token for ${email}: ${resetToken}`);

    // In production, send email with reset link
    // await sendEmail(email, 'Password Reset', `Reset link: https://bizora.com/reset-password?token=${resetToken}`);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password required', code: 'MISSING_FIELDS' });
    }

    // Hash token to compare
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token', code: 'INVALID_RESET_TOKEN' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Revoke all existing tokens
    await RefreshToken.deleteMany({ userId: user._id });

    await user.save();

    await logAudit(user._id.toString(), 'PASSWORD_RESET', 'User', user._id.toString(), 'success', {}, req.ip, req.get('user-agent'));

    res.json({ message: 'Password reset successful. Please login again.' });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Change Password (Authenticated)
app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.slice(7);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required', code: 'MISSING_FIELDS' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters', code: 'WEAK_PASSWORD' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      // Verify current password
      const isValid = await comparePassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
      }

      // Check if new password is same as current
      const isSame = await comparePassword(newPassword, user.password);
      if (isSame) {
        return res.status(400).json({ error: 'New password must be different', code: 'SAME_PASSWORD' });
      }

      // Update password
      user.password = await hashPassword(newPassword);
      user.passwordChangedAt = new Date();
      await user.save();

      // Revoke all existing tokens
      await RefreshToken.deleteMany({ userId: user._id });

      await logAudit(user._id.toString(), 'PASSWORD_CHANGED', 'User', user._id.toString(), 'success', {}, req.ip, req.get('user-agent'));

      res.json({ message: 'Password changed successfully. Please login again.' });
    } catch {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Update Profile
app.patch('/api/auth/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const updates = req.body;

      // Only allow certain fields
      const allowedUpdates = ['name', 'phone', 'avatar'];
      const filteredUpdates: Record<string, any> = {};

      for (const key of Object.keys(updates)) {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        decoded.userId,
        filteredUpdates,
        { new: true }
      );

      if (!user) {
        return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      await logAudit(user._id.toString(), 'PROFILE_UPDATE', 'User', user._id.toString(), 'success', { fields: Object.keys(filteredUpdates) }, req.ip, req.get('user-agent'));

      res.json({ user: sanitizeUser(user) });
    } catch {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// Get Profile
app.get('/api/auth/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      res.json({ user: sanitizeUser(user) });
    } catch {
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// ============================================================================
// Database Connection & Server Start
// ============================================================================

async function startServer() {
  try {
    logger.info('[MongoDB] Connecting to:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('[MongoDB] Connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('[MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('[MongoDB] Disconnected');
    });

    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔐 BIZORA Auth Service (Production)                   ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   MongoDB: ✅ Connected                                  ║
║   Status: Running                                        ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST /api/auth/register                              ║
║   • POST /api/auth/login                               ║
║   • POST /api/auth/send-otp                             ║
║   • POST /api/auth/verify-otp                           ║
║   • POST /api/auth/verify                               ║
║   • POST /api/auth/refresh                              ║
║   • POST /api/auth/logout                               ║
║   • POST /api/auth/forgot-password                      ║
║   • POST /api/auth/reset-password                       ║
║   • POST /api/auth/change-password                      ║
║   • GET /api/auth/profile                               ║
║   • PATCH /api/auth/profile                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);

      // Create demo user
      createDemoUser();
    });
  } catch (error) {
    logger.error('[Auth Service] Failed to start:', error);
    process.exit(1);
  }
}

async function createDemoUser() {
  try {
    const existingUser = await User.findOne({ email: 'demo@bizora.com' });

    if (!existingUser) {
      const hashedPassword = await hashPassword('demo1234');
      await User.create({
        email: 'demo@bizora.com',
        password: hashedPassword,
        name: 'Demo User',
        phone: '+919876543210',
        type: 'business_owner',
        emailVerified: true,
        phoneVerified: true,
      });
      logger.info('[Demo] Created: demo@bizora.com / demo1234');
    }
  } catch (error) {
    logger.error('[Demo] Failed to create demo user:', error);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('[Auth Service] SIGTERM received, shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('[Auth Service] SIGINT received, shutting down...');
  await mongoose.disconnect();
  process.exit(0);
});

startServer();
