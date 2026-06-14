/**
 * REZ Auth Service - RABTUL
 * Port: 4002
 *
 * Production-ready authentication service with JWT and MongoDB
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import winston from 'winston';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Configuration
const PORT = parseInt(process.env.PORT || '4002', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-auth';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const NODE_ENV = process.env.NODE_ENV || 'development';
const BCRYPT_ROUNDS = 12;

// Logger setup
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Express app
const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json({ limit: '10mb' }));

// ============================================
// MONGODB SCHEMAS
// ============================================

// Guest User Schema
const guestSchema = new mongoose.Schema({
  guestId: { type: String, required: true, unique: true, index: true },
  email: { type: String, sparse: true },
  phone: { type: String, required: true, index: true },
  passwordHash: { type: String },
  firstName: String,
  lastName: String,
  verified: { type: Boolean, default: false },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: String,
  profile: {
    avatar: String,
    nationality: String,
    dateOfBirth: Date,
  },
  preferences: {
    language: { type: String, default: 'en' },
    marketingOptIn: { type: Boolean, default: false },
  },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Guest = mongoose.model('Guest', guestSchema);

// Token Schema (for refresh tokens and magic links)
const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  guestId: { type: String, required: true, index: true },
  type: { type: String, enum: ['refresh', 'magic_link', 'verification', 'reset'], required: true },
  expiresAt: { type: Date, required: true, index: true },
  usedAt: Date,
  metadata: {
    ip: String,
    userAgent: String,
  },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

tokenSchema.index({ token: 1, type: 1 });
tokenSchema.index({ guestId: 1, type: 1 });

const Token = mongoose.model('Token', tokenSchema);

// Session Schema (for active sessions tracking)
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  guestId: { type: String, required: true, index: true },
  refreshToken: { type: String, required: true },
  ip: String,
  userAgent: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model('Session', sessionSchema);

// ============================================
// DATABASE CONNECTION
// ============================================

let isConnected = false;

async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    logger.info('Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@') });
  } catch (error) {
    isConnected = false;
    logger.error('Failed to connect to MongoDB', { error: (error as Error).message });
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// ============================================
// HEALTH ENDPOINTS
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-auth',
    version: '1.0.0',
    database: isConnected ? 'MongoDB' : 'disconnected',
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/ready', (_req: Request, res: Response) => {
  res.status(isConnected ? 200 : 503).json({
    ready: isConnected,
    database: isConnected ? 'connected' : 'disconnected',
  });
});

// ============================================
// AUTH HELPERS
// ============================================

interface TokenPayload {
  guestId: string;
  email?: string;
  phone: string;
  type: 'access' | 'refresh';
}

function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

function generateGuestId(): string {
  return `guest_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

// ============================================
// REGISTER / SIGNUP
// ============================================

/**
 * Register new guest (phone + password or phone only)
 */
app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { phone, email, password, firstName, lastName } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Check if guest already exists
    const existingGuest = await Guest.findOne({ phone });
    if (existingGuest) {
      return res.status(409).json({ error: 'Guest with this phone already exists' });
    }

    // Create guest
    const guestId = generateGuestId();
    const guest = new Guest({
      guestId,
      phone,
      email,
      firstName,
      lastName,
      ...(password && { passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS) }),
    });

    await guest.save();

    // Generate tokens
    const accessToken = generateAccessToken({ guestId, phone, type: 'access' });
    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store refresh token
    await Token.create({
      token: refreshToken,
      guestId,
      type: 'refresh',
      expiresAt,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    logger.info('Guest registered', { guestId, phone });

    return res.status(201).json({
      success: true,
      guest: { guestId, phone, email, firstName, lastName },
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    logger.error('Registration failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// LOGIN
// ============================================

/**
 * Login with phone + password
 */
app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Find guest
    const guest = await Guest.findOne({ phone });
    if (!guest) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if locked
    if (guest.lockedUntil && guest.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Account temporarily locked',
        lockedUntil: guest.lockedUntil,
      });
    }

    // Verify password
    if (!guest.passwordHash || !(await bcrypt.compare(password, guest.passwordHash))) {
      // Increment login attempts
      await Guest.findByIdAndUpdate(guest._id, {
        $inc: { loginAttempts: 1 },
        ...(guest.loginAttempts >= 4 ? { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : {}),
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts
    await Guest.findByIdAndUpdate(guest._id, {
      loginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      guestId: guest.guestId,
      phone: guest.phone,
      email: guest.email,
      type: 'access',
    });

    const refreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store refresh token
    await Token.create({
      token: refreshToken,
      guestId: guest.guestId,
      type: 'refresh',
      expiresAt,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    logger.info('Guest logged in', { guestId: guest.guestId });

    return res.json({
      success: true,
      guest: {
        guestId: guest.guestId,
        phone: guest.phone,
        email: guest.email,
        firstName: guest.firstName,
        lastName: guest.lastName,
      },
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    logger.error('Login failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// VERIFY TOKEN
// ============================================

/**
 * Verify access token
 */
app.post('/auth/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Token required', valid: false });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // Verify guest still exists
      const guest = await Guest.findOne({ guestId: decoded.guestId });
      if (!guest) {
        return res.status(401).json({ error: 'Guest not found', valid: false });
      }

      return res.json({
        valid: true,
        guestId: decoded.guestId,
        phone: decoded.phone,
        email: decoded.email,
        expiresAt: new Date(decoded.exp as number * 1000).toISOString(),
      });
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', valid: false, expired: true });
      }
      return res.status(401).json({ error: 'Invalid token', valid: false });
    }
  } catch (error) {
    logger.error('Token verification failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// REFRESH TOKEN
// ============================================

/**
 * Refresh access token using refresh token
 */
app.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Find token in database
    const tokenDoc = await Token.findOne({
      token: refreshToken,
      type: 'refresh',
      usedAt: null,
    });

    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    if (isTokenExpired(tokenDoc.expiresAt)) {
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    // Get guest
    const guest = await Guest.findOne({ guestId: tokenDoc.guestId });
    if (!guest) {
      return res.status(401).json({ error: 'Guest not found' });
    }

    // Mark old token as used
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      guestId: guest.guestId,
      phone: guest.phone,
      email: guest.email,
      type: 'access',
    });

    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store new refresh token
    await Token.create({
      token: newRefreshToken,
      guestId: guest.guestId,
      type: 'refresh',
      expiresAt,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    logger.info('Token refreshed', { guestId: guest.guestId });

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN,
    });
  } catch (error) {
    logger.error('Token refresh failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

// ============================================
// LOGOUT
// ============================================

/**
 * Logout (invalidate refresh token)
 */
app.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await Token.findOneAndUpdate(
        { token: refreshToken, type: 'refresh' },
        { usedAt: new Date() }
      );
    }

    logger.info('Guest logged out');
    return res.json({ success: true });
  } catch (error) {
    logger.error('Logout failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// MAGIC LINK (Passwordless)
// ============================================

/**
 * Send magic link to phone
 */
app.post('/auth/magic-link', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const guest = await Guest.findOne({ phone });
    if (!guest) {
      // Don't reveal if guest exists
      return res.json({ success: true, message: 'If registered, magic link sent' });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await Token.create({
      token,
      guestId: guest.guestId,
      type: 'magic_link',
      expiresAt,
      metadata: { ip: req.ip, userAgent: req.get('user-agent') },
    });

    // In production, send SMS with link
    const magicLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;

    logger.info('Magic link generated', { guestId: guest.guestId });

    // In development, return link directly
    if (NODE_ENV === 'development') {
      return res.json({ success: true, magicLink });
    }

    return res.json({ success: true, message: 'Magic link sent to your phone' });
  } catch (error) {
    logger.error('Magic link failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to send magic link' });
  }
});

/**
 * Verify magic link
 */
app.post('/auth/magic-link/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const tokenDoc = await Token.findOne({
      token,
      type: 'magic_link',
      usedAt: null,
    });

    if (!tokenDoc || isTokenExpired(tokenDoc.expiresAt)) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get guest
    const guest = await Guest.findOne({ guestId: tokenDoc.guestId });
    if (!guest) {
      return res.status(401).json({ error: 'Guest not found' });
    }

    // Mark token as used
    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    // Generate access token
    const accessToken = generateAccessToken({
      guestId: guest.guestId,
      phone: guest.phone,
      email: guest.email,
      type: 'access',
    });

    logger.info('Magic link verified', { guestId: guest.guestId });

    return res.json({
      success: true,
      accessToken,
      guest: {
        guestId: guest.guestId,
        phone: guest.phone,
        email: guest.email,
      },
    });
  } catch (error) {
    logger.error('Magic link verification failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ============================================
// GUEST MANAGEMENT
// ============================================

/**
 * Get guest profile
 */
app.get('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const guest = await Guest.findOne({ guestId }, { passwordHash: 0, mfaSecret: 0 });
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    return res.json({ guest });
  } catch (error) {
    logger.error('Failed to get guest', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to get guest' });
  }
});

/**
 * Update guest profile
 */
app.patch('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.passwordHash;
    delete updates.guestId;
    delete updates.loginAttempts;
    delete updates.lockedUntil;

    const guest = await Guest.findOneAndUpdate(
      { guestId },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    logger.info('Guest profile updated', { guestId });

    return res.json({ success: true, guest });
  } catch (error) {
    logger.error('Failed to update guest', { error: (error as Error).message });
    return res.status(500).json({ error: 'Failed to update guest' });
  }
});

// ============================================
// INTERNAL SERVICE AUTH
// ============================================

/**
 * Validate internal service token (for service-to-service communication)
 */
app.post('/internal/validate', (req: Request, res: Response) => {
  try {
    const { token, service } = req.body;
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;

    if (!internalToken) {
      return res.status(500).json({ error: 'Internal token not configured' });
    }

    if (token !== internalToken) {
      return res.status(401).json({ error: 'Invalid internal token' });
    }

    logger.debug('Internal token validated', { service });

    return res.json({
      valid: true,
      service,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Internal validation failed', { error: (error as Error).message });
    return res.status(500).json({ error: 'Validation failed' });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (isConnected) {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  }
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================

async function start(): Promise<void> {
  await connectDatabase();

  app.listen(PORT, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║           REZ Auth Service v1.0.0                ║
╠═══════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                            ║
║  Database: ${isConnected ? 'MongoDB ✅' : 'Disconnected ⚠️'}                       ║
║  Mode:     ${NODE_ENV}                                        ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

start();

export { app };