/**
 * REZ Merchant Auth Service
 *
 * Unified SSO (Single Sign-On) for all merchant applications.
 *
 * Features:
 * - Single login for all merchant apps
 * - JWT with embedded permissions
 * - Role-based access control (RBAC)
 * - Multi-tenant support
 * - API key generation for integrations
 * - Session management
 * - Audit logging
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { logger } from './services/logger.js';

config();

const app = express();
const PORT = process.env.PORT || 4015;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-merchant-auth';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// JWT Secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-min-64-chars-for-merchants';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

// Redis
const redis = new Redis(REDIS_URL);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ============================================
// MONGODB MODELS
// ============================================

const merchantUserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String },
  role: { type: String, enum: ['owner', 'admin', 'manager', 'staff'], default: 'staff' },
  permissions: [String],
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const apiKeySchema = new mongoose.Schema({
  keyId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  userId: { type: String },
  name: { type: String, required: true },
  keyHash: { type: String, required: true },
  permissions: [String],
  expiresAt: Date,
  lastUsed: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true },
  refreshTokenHash: { type: String, required: true },
  ipAddress: String,
  userAgent: String,
  expiresAt: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const auditLogSchema = new mongoose.Schema({
  auditId: { type: String, required: true, unique: true },
  userId: String,
  merchantId: String,
  action: String,
  resource: String,
  ipAddress: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

const MerchantUser = mongoose.model('MerchantUser', merchantUserSchema);
const ApiKey = mongoose.model('ApiKey', apiKeySchema);
const Session = mongoose.model('Session', sessionSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ============================================
// PERMISSIONS
// ============================================

const PERMISSIONS = {
  // Dashboard
  'dashboard:read': 'View dashboard',

  // Orders
  'orders:read': 'View orders',
  'orders:create': 'Create orders',
  'orders:update': 'Update orders',
  'orders:cancel': 'Cancel orders',
  'orders:refund': 'Process refunds',

  // Products
  'products:read': 'View products',
  'products:write': 'Manage products',
  'products:delete': 'Delete products',

  // Inventory
  'inventory:read': 'View inventory',
  'inventory:write': 'Manage inventory',

  // Customers
  'customers:read': 'View customers',
  'customers:write': 'Manage customers',

  // B2B
  'b2b:suppliers': 'Manage suppliers',
  'b2b:purchase-orders': 'Manage purchase orders',
  'b2b:payments': 'B2B payments',

  // Finance
  'finance:read': 'View finances',
  'finance:write': 'Manage finances',
  'finance:withdraw': 'Withdraw funds',

  // Marketing
  'marketing:campaigns': 'Manage campaigns',
  'marketing:offers': 'Manage offers',

  // Settings
  'settings:read': 'View settings',
  'settings:write': 'Manage settings',
  'settings:users': 'Manage users',

  // Reports
  'reports:read': 'View reports',
  'reports:export': 'Export reports'
};

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: Object.keys(PERMISSIONS),
  admin: [
    'dashboard:read',
    'orders:read', 'orders:create', 'orders:update', 'orders:cancel', 'orders:refund',
    'products:read', 'products:write', 'products:delete',
    'inventory:read', 'inventory:write',
    'customers:read', 'customers:write',
    'b2b:suppliers', 'b2b:purchase-orders', 'b2b:payments',
    'finance:read', 'finance:write', 'finance:withdraw',
    'marketing:campaigns', 'marketing:offers',
    'settings:read', 'settings:write',
    'reports:read', 'reports:export'
  ],
  manager: [
    'dashboard:read',
    'orders:read', 'orders:create', 'orders:update', 'orders:cancel',
    'products:read', 'products:write',
    'inventory:read', 'inventory:write',
    'customers:read', 'customers:write',
    'reports:read'
  ],
  staff: [
    'dashboard:read',
    'orders:read', 'orders:create',
    'products:read',
    'inventory:read',
    'customers:read'
  ]
};

// ============================================
// AUTH ROUTES
// ============================================

/**
 * POST /api/v1/auth/register
 * Register new merchant user
 */
app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, merchantId, phone, role = 'staff', name } = req.body;

    // Check existing
    const existing = await MerchantUser.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await MerchantUser.create({
      userId: `user_${uuid()}`,
      merchantId,
      email,
      phone,
      passwordHash,
      role,
      permissions: ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.staff,
      metadata: { name }
    });

    // Generate tokens
    const tokens = await generateTokens(user);

    // Log audit
    await createAuditLog(user.userId, merchantId, 'register', 'user');

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens
      }
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/v1/auth/login
 * Login with email/password
 */
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await MerchantUser.findOne({ email, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Account locked',
        lockedUntil: user.lockedUntil
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      // Increment failed attempts
      user.failedLoginAttempts++;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    user.loginCount++;
    await user.save();

    // Generate tokens
    const tokens = await generateTokens(user);

    // Log audit
    await createAuditLog(user.userId, user.merchantId, 'login', 'session', {
      ip: req.ip
    });

    res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        ...tokens
      }
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
app.post('/api/v1/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as unknown;

    // Find session
    const session = await Session.findOne({
      sessionId: decoded.sessionId,
      isActive: true
    });

    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Find user
    const user = await MerchantUser.findOne({ userId: session.userId, isActive: true });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = await generateTokens(user, session.sessionId);

    // Log audit
    await createAuditLog(user.userId, user.merchantId, 'refresh', 'session');

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    logger.error('Refresh failed', { error: error.message });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout (invalidate session)
 */
app.post('/api/v1/auth/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as unknown;

    // Invalidate session
    await Session.updateOne(
      { sessionId: decoded.sessionId },
      { isActive: false }
    );

    // Blacklist token
    await redis.setex(`blacklist:${token}`, 86400, '1');

    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user
 */
app.get('/api/v1/auth/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await MerchantUser.findOne({ userId: (req as unknown).userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    logger.error('Get user failed', { error: error.message });
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// API KEY ROUTES
// ============================================

/**
 * POST /api/v1/api-keys
 * Generate API key
 */
app.post('/api/v1/api-keys', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, permissions, expiresIn } = req.body;
    const merchantId = (req as unknown).merchantId;
    const userId = (req as unknown).userId;

    // Generate key
    const apiKey = `sk_${uuid()}_${uuid()}`.replace(/-/g, '');
    const keyHash = await bcrypt.hash(apiKey, 10);

    const key = await ApiKey.create({
      keyId: `key_${uuid()}`,
      merchantId,
      userId,
      name,
      keyHash,
      permissions: permissions || ROLE_PERMISSIONS.staff,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null
    });

    // Log audit
    await createAuditLog(userId, merchantId, 'create_api_key', 'api_key', { keyId: key.keyId });

    res.json({
      success: true,
      data: {
        keyId: key.keyId,
        apiKey, // Only returned once
        name: key.name,
        permissions: key.permissions,
        expiresAt: key.expiresAt
      }
    });
  } catch (error) {
    logger.error('API key creation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * GET /api/v1/api-keys
 * List API keys
 */
app.get('/api/v1/api-keys', authenticate, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;

    const keys = await ApiKey.find({ merchantId, isActive: true })
      .select('-keyHash');

    res.json({ success: true, data: keys });
  } catch (error) {
    logger.error('API keys fetch failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * DELETE /api/v1/api-keys/:keyId
 * Revoke API key
 */
app.delete('/api/v1/api-keys/:keyId', authenticate, async (req: Request, res: Response) => {
  try {
    const { keyId } = req.params;
    const merchantId = (req as unknown).merchantId;
    const userId = (req as unknown).userId;

    await ApiKey.updateOne(
      { keyId, merchantId },
      { isActive: false }
    );

    // Log audit
    await createAuditLog(userId, merchantId, 'revoke_api_key', 'api_key', { keyId });

    res.json({ success: true });
  } catch (error) {
    logger.error('API key revocation failed', { error: error.message });
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * GET /api/v1/users
 * List merchant users
 */
app.get('/api/v1/users', authenticate, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const users = await MerchantUser.find({ merchantId, isActive: true })
      .select('-passwordHash');

    res.json({ success: true, data: users });
  } catch (error) {
    logger.error('Users fetch failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * PATCH /api/v1/users/:userId
 * Update user
 */
app.patch('/api/v1/users/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role, permissions, isActive } = req.body;
    const merchantId = (req as unknown).merchantId;

    const user = await MerchantUser.findOneAndUpdate(
      { userId, merchantId },
      {
        ...(role && { role, permissions: ROLE_PERMISSIONS[role] }),
        ...(permissions && { permissions }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('User update failed', { error: error.message });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ============================================
// AUDIT LOG
// ============================================

/**
 * GET /api/v1/audit
 * Get audit logs
 */
app.get('/api/v1/audit', authenticate, async (req: Request, res: Response) => {
  try {
    const merchantId = (req as unknown).merchantId;
    const { action, userId, limit = 100 } = req.query;

    const query: unknown = { merchantId };
    if (action) query.action = action;
    if (userId) query.userId = userId;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: logs });
  } catch (error) {
    logger.error('Audit fetch failed', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ============================================
// HEALTH
// ============================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'rez-merchant-auth',
    version: '1.0.0'
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate JWT tokens
 */
async function generateTokens(user, existingSessionId?: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}> {
  const sessionId = existingSessionId || `sess_${uuid()}`;

  // Access token
  const accessToken = jwt.sign({
    userId: user.userId,
    merchantId: user.merchantId,
    role: user.role,
    permissions: user.permissions,
    sessionId
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // Refresh token
  const refreshToken = jwt.sign({
    sessionId,
    userId: user.userId
  }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

  // Store session
  await Session.create({
    sessionId,
    userId: user.userId,
    merchantId: user.merchantId,
    refreshTokenHash: await bcrypt.hash(refreshToken, 10),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN
  };
}

/**
 * Authenticate middleware
 */
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  const token = authHeader.substring(7);

  // Check blacklist
  redis.get(`blacklist:${token}`).then(blacklisted => {
    if (blacklisted) {
      return res.status(401).json({ error: 'Token invalidated' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as unknown;
      (req as unknown).userId = decoded.userId;
      (req as unknown).merchantId = decoded.merchantId;
      (req as unknown).role = decoded.role;
      (req as unknown).permissions = decoded.permissions;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  });
}

/**
 * Require permission middleware
 */
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = (req as unknown).permissions || [];
    if (permissions.includes(permission) || permissions.includes('*')) {
      return next();
    }
    return res.status(403).json({ error: 'Permission denied', required: permission });
  };
}

/**
 * Sanitize user object
 */
function sanitizeUser(user) {
  return {
    userId: user.userId,
    merchantId: user.merchantId,
    email: user.email,
    phone: user.phone,
    role: user.role,
    permissions: user.permissions,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
    metadata: user.metadata
  };
}

/**
 * Create audit log
 */
async function createAuditLog(
  userId: string,
  merchantId: string,
  action: string,
  resource: string,
  metadata?: unknown
) {
  try {
    await AuditLog.create({
      auditId: `audit_${uuid()}`,
      userId,
      merchantId,
      action,
      resource,
      metadata
    });
  } catch (error) {
    logger.error('Audit log failed', { error });
  }
}

// ============================================
// STARTUP
// ============================================

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    if (redis.status !== 'ready') {
      await new Promise<void>((resolve) => {
        redis.on('ready', resolve);
      });
    }
    logger.info('Connected to Redis');

    app.listen(PORT, () => {
      logger.info(`REZ Merchant Auth Service started on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start', { error });
    process.exit(1);
  }
}

start();

export { app };
