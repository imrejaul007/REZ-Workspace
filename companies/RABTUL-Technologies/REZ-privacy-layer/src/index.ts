import logger from './utils/logger';

/**
 * Privacy Layer - GDPR, Consent, Data Management
 * Port: 4047
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
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 4047;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/privacy-layer';
const JWT_SECRET = process.env.JWT_SECRET || 'rez-privacy-layer-secret-change-in-production';

// ============================================
// Security Middleware
// ============================================

// Helmet - HTTP security headers
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

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://rez.money'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

app.use(globalLimiter);

// MongoDB input sanitization
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }) => {
    console.warn(`Sanitized potentially dangerous key: ${key}`);
  },
}));

// Body parser with size limit
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
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// ============================================
// Zod Validation Schemas
// ============================================

const consentSchema = z.object({
  userId: z.string().min(1).max(128),
  type: z.string().min(1).max(64),
  granted: z.boolean(),
});

const consentQuerySchema = z.object({
  userId: z.string().min(1).max(128),
});

// Validation middleware factory
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

// Input sanitization helper
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

// ============================================
// Consent Model
// ============================================

const ConsentSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true, index: true },
  granted: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
});

const Consent = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);

// ============================================
// Routes
// ============================================

// Health check (public)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'privacy-layer' });
});

// Grant consent - requires JWT
app.post('/api/consent',
  authLimiter,
  sanitizeInput,
  validateBody(consentSchema),
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { userId, type, granted } = req.body;

      const consent = await Consent.findOneAndUpdate(
        { userId, type },
        {
          granted,
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
        { upsert: true, new: true }
      );
      res.json({ success: true, data: consent });
    } catch (error) {
      console.error('Error granting consent:', error);
      res.status(500).json({ success: false, error: 'Failed to grant consent' });
    }
  }
);

// Get consent - requires JWT
app.get('/api/consent/:userId',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const consents = await Consent.find({ userId });
      res.json({ success: true, data: consents });
    } catch (error) {
      console.error('Error getting consent:', error);
      res.status(500).json({ success: false, error: 'Failed to get consent' });
    }
  }
);

// Delete user data (GDPR) - requires JWT
app.delete('/api/data/:userId',
  authLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Anonymize consent records instead of deleting
      await Consent.updateMany(
        { userId },
        {
          $set: {
            userId: `anonymized_${userId}_${Date.now()}`,
            ipAddress: 'anonymized',
 },
        }
      );
      res.json({ success: true, message: 'Data anonymized' });
    } catch (error) {
      console.error('Error deleting user data:', error);
      res.status(500).json({ success: false, error: 'Failed to delete user data' });
    }
  }
);

// Token generation endpoint (for testing)
app.post('/auth/token', authLimiter, async (req: Request, res: Response) => {
  try {
    const { userId, email } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const payload = { userId, email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      expiresIn: '24h',
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ success: false, error: 'Failed to generate token' });
  }
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
  }
  logger.info(`Privacy Layer on ${PORT}`);
  console.log('Security features: Helmet, JWT, Rate Limiting, CORS, MongoDB Sanitization, Zod Validation');
});

export default app;
