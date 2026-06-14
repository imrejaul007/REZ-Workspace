/**
 * REZ Unified Identity Service - MongoDB Version
 * Port: 4060
 *
 * Consolidates identity across all platforms with MongoDB persistence
 * - Identity resolution
 * - Cross-device tracking
 * - Unified profiles
 * - Identity linking
 *
 * Security Features:
 * - Helmet (HTTP security headers)
 * - JWT authentication
 * - Rate limiting
 * - CORS configuration
 * - MongoDB input sanitization
 * - Zod request validation
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { z } from 'zod';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4060;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-unified-identity';
const JWT_SECRET = process.env.JWT_SECRET || 'rez-unified-identity-secret-change-in-production';

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// Identity Schema
const identitySchema = new mongoose.Schema({
  userId: { type: String, index: true },
  email: { type: String, index: true, sparse: true },
  phone: { type: String, index: true, sparse: true },
  deviceId: { type: String, index: true, sparse: true },
  oauthId: { type: String, index: true, sparse: true },
  linkedIdentities: [{ type: String }],
  source: { type: String, default: 'api' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Device Schema
const deviceSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  fingerprint: { type: String, required: true, index: true },
  type: { type: String, enum: ['mobile', 'desktop', 'tablet', 'other'], default: 'other' },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Unified Profile Schema
const unifiedProfileSchema = new mongoose.Schema({
  identityId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, index: true },
  email: { type: String },
  phone: { type: String },
  name: { type: String },
  avatar: { type: String },
  devices: [{ type: String }],
  linkedIdentities: [{ type: String }],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Identity Link Schema (for tracking links between identities)
const identityLinkSchema = new mongoose.Schema({
  sourceIdentityId: { type: String, required: true, index: true },
  targetIdentityId: { type: String, required: true, index: true },
  linkType: { type: String, enum: ['email', 'phone', 'device', 'oauth', 'manual'], default: 'manual' },
  confidence: { type: Number, default: 1.0 },
  linkedBy: String,
  verified: { type: Boolean, default: false }
}, { timestamps: true });

// Create models
const Identity = mongoose.model('Identity', identitySchema);
const Device = mongoose.model('Device', deviceSchema);
const UnifiedProfile = mongoose.model('UnifiedProfile', unifiedProfileSchema);
const IdentityLink = mongoose.model('IdentityLink', identityLinkSchema);

// ============================================
// Security Middleware
// ============================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://rez.money'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
});

app.use(globalLimiter);
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================
// JWT Authentication Middleware
// ============================================

interface JwtPayload {
  userId: string;
  email?: string;
  iat: number;
  exp: number;
}

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: 'Invalid authorization format. Use: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// ============================================
// Zod Validation Schemas
// ============================================

const identityResolveSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  deviceId: z.string().min(1).max(256).optional(),
  userId: z.string().min(1).max(128).optional(),
  oauthId: z.string().optional(),
}).refine(data => data.email || data.phone || data.deviceId || data.userId || data.oauthId, {
  message: 'At least one identifier is required',
});

const identityLinkSchema = z.object({
  sourceId: z.string().min(1).max(64),
  targetId: z.string().min(1).max(64),
  linkType: z.enum(['email', 'phone', 'device', 'oauth', 'manual']).default('manual'),
});

const deviceSchema = z.object({
  userId: z.string().min(1).max(128),
  fingerprint: z.string().min(1).max(512),
  type: z.enum(['mobile', 'desktop', 'tablet', 'other']).default('other'),
  metadata: z.record(z.unknown()).optional(),
});

const profileUpdateSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  name: z.string().min(1).max(256).optional(),
  avatar: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ============================================
// Health Check
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const stats = {
      identities: await Identity.countDocuments(),
      devices: await Device.countDocuments(),
      profiles: await UnifiedProfile.countDocuments(),
      links: await IdentityLink.countDocuments()
    };

    res.json({
      status: 'healthy',
      service: 'unified-identity',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      service: 'unified-identity',
      error: (error as Error).message
    });
  }
});

// ============================================
// Identity Routes
// ============================================

// Resolve identity (find by any identifier)
app.post('/identity/resolve',
  authLimiter,
  sanitizeInput,
  validateBody(identityResolveSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, phone, deviceId, userId, oauthId } = req.body;

      // Build query based on provided identifiers
      const query: Record<string, unknown> = {};
      if (email) query.email = email;
      if (phone) query.phone = phone;
      if (deviceId) query.deviceId = deviceId;
      if (userId) query.userId = userId;
      if (oauthId) query.oauthId = oauthId;

      // Find existing identity
      let identity = await Identity.findOne(query);

      if (identity) {
        // Update last seen
        identity.updatedAt = new Date();
        await identity.save();

        // Get linked identities
        const links = await IdentityLink.find({
          $or: [{ sourceIdentityId: identity._id }, { targetIdentityId: identity._id }]
        });

        return res.json({
          success: true,
          data: identity,
          resolved: true,
          linkedCount: links.length
        });
      }

      // Create new identity
      identity = new Identity({
        userId,
        email,
        phone,
        deviceId,
        oauthId,
        linkedIdentities: [],
        source: 'api'
      });

      await identity.save();

      res.status(201).json({
        success: true,
        data: identity,
        resolved: false
      });
    } catch (error) {
      console.error('Error resolving identity:', error);
      res.status(500).json({ success: false, error: 'Failed to resolve identity' });
    }
  }
);

// Link identities
app.post('/identity/link',
  authLimiter,
  sanitizeInput,
  validateBody(identityLinkSchema),
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { sourceId, targetId, linkType } = req.body;

      const sourceIdentity = await Identity.findById(sourceId);
      const targetIdentity = await Identity.findById(targetId);

      if (!sourceIdentity || !targetIdentity) {
        return res.status(404).json({ success: false, error: 'Identity not found' });
      }

      // Check if already linked
      const existingLink = await IdentityLink.findOne({
        $or: [
          { sourceIdentityId: sourceId, targetIdentityId: targetId },
          { sourceIdentityId: targetId, targetIdentityId: sourceId }
        ]
      });

      if (existingLink) {
        return res.status(400).json({ success: false, error: 'Identities already linked' });
      }

      // Create link
      const link = new IdentityLink({
        sourceIdentityId: sourceId,
        targetIdentityId: targetId,
        linkType: linkType || 'manual',
        linkedBy: (req as any).user?.userId || 'system',
        verified: false
      });

      await link.save();

      // Update linked identities
      await Identity.findByIdAndUpdate(sourceId, {
        $addToSet: { linkedIdentities: targetId }
      });
      await Identity.findByIdAndUpdate(targetId, {
        $addToSet: { linkedIdentities: sourceId }
      });

      // Create unified profile if needed
      await ensureUnifiedProfile(sourceId);

      res.json({
        success: true,
        data: {
          linkId: link._id,
          sourceId,
          targetId,
          linkType
        }
      });
    } catch (error) {
      console.error('Error linking identities:', error);
      res.status(500).json({ success: false, error: 'Failed to link identities' });
    }
  }
);

// Get identity by ID
app.get('/identity/:id',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const identity = await Identity.findById(req.params.id);

      if (!identity) {
        return res.status(404).json({ success: false, error: 'Identity not found' });
      }

      // Get linked identities
      const links = await IdentityLink.find({
        $or: [{ sourceIdentityId: identity._id }, { targetIdentityId: identity._id }]
      });

      const linkedIds = links.map(l =>
        l.sourceIdentityId.toString() === identity._id.toString()
          ? l.targetIdentityId.toString()
          : l.sourceIdentityId.toString()
      );

      res.json({
        success: true,
        data: {
          ...identity.toObject(),
          linkedIdentities: linkedIds
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get identity' });
    }
  }
);

// List identities
app.get('/identities',
  authLimiter,
  authenticateJWT,
  async (req: res, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 100, 1000);
      const page = Number(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const identities = await Identity.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Identity.countDocuments();

      res.json({
        success: true,
        data: identities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to list identities' });
    }
  }
);

// ============================================
// Device Routes
// ============================================

app.post('/devices',
  authLimiter,
  sanitizeInput,
  validateBody(deviceSchema),
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { userId, fingerprint, type, metadata } = req.body;

      // Check if device already exists
      let device = await Device.findOne({ fingerprint });

      if (device) {
        device.lastSeen = new Date();
        if (metadata) device.metadata = { ...device.metadata, ...metadata };
        await device.save();

        // Update identity with device
        await Identity.findOneAndUpdate(
          { userId: device.userId },
          { $set: { deviceId: fingerprint } }
        );

        return res.json({ success: true, data: device, action: 'updated' });
      }

      // Create new device
      device = new Device({
        userId,
        fingerprint,
        type: type || 'other',
        firstSeen: new Date(),
        lastSeen: new Date(),
        metadata: metadata || {}
      });

      await device.save();

      // Update identity with device
      await Identity.findOneAndUpdate(
        { userId },
        { deviceId: fingerprint }
      );

      res.status(201).json({ success: true, data: device });
    } catch (error) {
      console.error('Error adding device:', error);
      res.status(500).json({ success: false, error: 'Failed to add device' });
    }
  }
);

app.get('/devices/:userId',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const devices = await Device.find({ userId: req.params.userId })
        .sort({ lastSeen: -1 });

      res.json({ success: true, data: devices });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get devices' });
    }
  }
);

app.delete('/devices/:id',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const device = await Device.findByIdAndDelete(req.params.id);

      if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found' });
      }

      res.json({ success: true, message: 'Device deleted' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete device' });
    }
  }
);

// ============================================
// Unified Profile Routes
// ============================================

app.get('/profiles/:id',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const profile = await UnifiedProfile.findOne({ identityId: req.params.id })
        .populate('linkedIdentities');

      if (!profile) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
      }

      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get profile' });
    }
  }
);

app.put('/profiles/:id',
  authLimiter,
  sanitizeInput,
  validateBody(profileUpdateSchema),
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { email, phone, name, avatar, metadata } = req.body;

      const profile = await UnifiedProfile.findOneAndUpdate(
        { identityId: req.params.id },
        {
          $set: {
            ...(email && { email }),
            ...(phone && { phone }),
            ...(name && { name }),
            ...(avatar && { avatar }),
            ...(metadata && { metadata })
          }
        },
        { upsert: true, new: true }
      );

      res.json({ success: true, data: profile });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update profile' });
    }
  }
);

app.get('/profiles',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { email, phone } = req.query;

      const query: Record<string, unknown> = {};
      if (email) query.email = email;
      if (phone) query.phone = phone;

      if (Object.keys(query).length === 0) {
        return res.status(400).json({ success: false, error: 'email or phone query param required' });
      }

      const profile = await UnifiedProfile.findOne(query);
      res.json({ success: true, data: profile || null });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to search profiles' });
    }
  }
);

// ============================================
// Auth Endpoints
// ============================================

app.post('/auth/token', authLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const payload = { userId, email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token, expiresIn: '24h' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate token' });
  }
});

app.post('/auth/verify', authLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'token is required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    res.json({ success: true, user: decoded });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Token expired' });
    }
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// ============================================
// Statistics
// ============================================

app.get('/stats', async (_req, res) => {
  try {
    const stats = {
      identities: await Identity.countDocuments(),
      devices: await Device.countDocuments(),
      profiles: await UnifiedProfile.countDocuments(),
      links: await IdentityLink.countDocuments()
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// ============================================
// Helper Functions
// ============================================

async function ensureUnifiedProfile(identityId: string) {
  const identity = await Identity.findById(identityId);
  if (!identity) return;

  let profile = await UnifiedProfile.findOne({ identityId });

  if (!profile) {
    profile = new UnifiedProfile({
      identityId,
      userId: identity.userId,
      email: identity.email,
      phone: identity.phone
    });
    await profile.save();
  }

  // Get linked identities
  const links = await IdentityLink.find({
    $or: [{ sourceIdentityId: identityId }, { targetIdentityId: identityId }]
  });

  const linkedIds = links.map(l =>
    l.sourceIdentityId.toString() === identityId
      ? l.targetIdentityId.toString()
      : l.sourceIdentityId.toString()
  );

  profile.linkedIdentities = linkedIds;
  await profile.save();

  return profile;
}

// ============================================
// Error Handler
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ============================================
// Database Connection & Server Start
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create indexes
    await Identity.createIndexes();
    await Device.createIndexes();
    await UnifiedProfile.createIndexes();
    await IdentityLink.createIndexes();

    app.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] REZ Unified Identity Service running on port ${PORT}`);
      console.log('Security: Helmet, JWT, Rate Limiting, CORS, MongoDB Sanitization, Zod Validation');
      console.log(`Database: ${MONGODB_URI}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

export default app;