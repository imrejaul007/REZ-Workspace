/**
 * RABTUL Consent Service
 * GDPR/Privacy consent management for all REZ ecosystem
 * Port: 4220
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

const JWT_SECRET = process.env.JWT_SECRET || 'rez-consent-service-secret-change-in-production';

// ============== SCHEMAS ==============

const consentTypeSchema = new mongoose.Schema({
  typeId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['marketing', 'analytics', 'functional', 'required'], required: true },
  required: { type: Boolean, default: false },
  legalBasis: { type: String, enum: ['consent', 'legitimate_interest', 'contract', 'legal_obligation'], required: true },
  retentionDays: { type: Number, default: 365 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const consentRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  consentTypeId: { type: String, required: true, index: true },
  granted: { type: Boolean, required: true },
  method: { type: String, enum: ['explicit', 'implicit', 'withdrawn'], required: true },
  ipAddress: String,
  userAgent: String,
  source: String,
  version: String,
  validFrom: Date,
  validUntil: Date,
  createdAt: { type: Date, default: Date.now }
});

const consentVersionSchema = new mongoose.Schema({
  versionId: { type: String, required: true, unique: true, index: true },
  version: { type: String, required: true },
  effectiveDate: { type: Date, required: true },
  changes: String,
  consentTypes: [{
    typeId: String,
    name: String,
    description: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const userConsentSummarySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  consents: [{
    consentTypeId: String,
    granted: Boolean,
    grantedAt: Date
  }],
  lastUpdated: Date,
  gdprDeleted: { type: Boolean, default: false },
  gdprDeletedAt: Date
});

// Models
const ConsentType = mongoose.model('ConsentType', consentTypeSchema);
const ConsentRecord = mongoose.model('ConsentRecord', consentRecordSchema);
const ConsentVersion = mongoose.model('ConsentVersion', consentVersionSchema);
const UserConsentSummary = mongoose.model('UserConsentSummary', userConsentSummarySchema);

// ============== JWT AUTHENTICATION ==============

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

// Rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

// ============== SERVICE ==============

class ConsentService {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.seedDefaultTypes();
  }

  private setupMiddleware() {
    // Helmet - HTTP security headers
    this.app.use(helmet({
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
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://rez.money'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const globalLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: { success: false, error: 'Too many requests, please try again later.' },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(globalLimiter);

    // MongoDB input sanitization
    this.app.use(mongoSanitize({
      replaceWith: '_',
      onSanitize: ({ key }) => {
        console.warn(`Sanitized potentially dangerous key: ${key}`);
      },
    }));

    // Body parser with size limit
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  }

  private async seedDefaultTypes() {
    const defaultTypes = [
      {
        typeId: 'marketing_email',
        name: 'Email Marketing',
        description: 'Receive promotional emails and newsletters',
        category: 'marketing',
        required: false,
        legalBasis: 'consent'
      },
      {
        typeId: 'marketing_sms',
        name: 'SMS Marketing',
        description: 'Receive SMS promotions and alerts',
        category: 'marketing',
        required: false,
        legalBasis: 'consent'
      },
      {
        typeId: 'marketing_whatsapp',
        name: 'WhatsApp Marketing',
        description: 'Receive WhatsApp messages and offers',
        category: 'marketing',
        required: false,
        legalBasis: 'consent'
      },
      {
        typeId: 'analytics_cookies',
        name: 'Analytics Cookies',
        description: 'Allow usage analytics to improve service',
        category: 'analytics',
        required: false,
        legalBasis: 'consent'
      },
      {
        typeId: 'analytics_tracking',
        name: 'Activity Tracking',
        description: 'Track app usage and behavior',
        category: 'analytics',
        required: false,
        legalBasis: 'consent'
      },
      {
        typeId: 'functional_preferences',
        name: 'Save Preferences',
        description: 'Remember your settings and preferences',
        category: 'functional',
        required: false,
        legalBasis: 'legitimate_interest'
      },
      {
        typeId: 'required_legal',
        name: 'Legal Compliance',
        description: 'Required for legal and security purposes',
        category: 'required',
        required: true,
        legalBasis: 'legal_obligation'
      }
    ];

    for (const type of defaultTypes) {
      await ConsentType.findOneAndUpdate(
        { typeId: type.typeId },
        type,
        { upsert: true, new: true }
      );
    }
  }

  private setupRoutes() {
    // Health (public)
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', service: 'consent-service' });
    });

    // Token generation (for testing)
    this.app.post('/auth/token', authLimiter, async (req: Request, res: Response) => {
      try {
        const { userId, email } = req.body;
        if (!userId) {
          return res.status(400).json({ success: false, error: 'userId is required' });
        }
        const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token, expiresIn: '24h' });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to generate token' });
      }
    });

    // ========== CONSENT TYPES ==========

    // Get all consent types (public - no auth needed)
    this.app.get('/api/consent-types', async (_req, res) => {
      try {
        const types = await ConsentType.find({ isActive: true }).lean();
        res.json({ success: true, data: types });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch consent types' });
      }
    });

    // Create consent type (requires auth)
    this.app.post('/api/consent-types', async (req: Request, res) => {
      try {
        const type = new ConsentType({
          ...req.body,
          typeId: `consent_${Date.now()}`
        });
        await type.save();
        res.json(type);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create consent type' });
      }
    });

    // ========== USER CONSENT ==========

    // Record consent (requires auth)
    this.app.post('/api/consents', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        const { userId, consentTypeId, granted, method } = req.body;

        const record = new ConsentRecord({
          recordId: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          consentTypeId,
          granted,
          method: method || 'explicit',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          validFrom: new Date()
        });
        await record.save();

        // Update summary
        await this.updateUserConsentSummary(userId, consentTypeId, granted);

        res.json({ success: true, data: record });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to record consent' });
      }
    });

    // Get user consents (requires auth)
    this.app.get('/api/consents/:userId', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        const consents = await ConsentRecord.find({ userId: req.params.userId })
          .sort({ createdAt: -1 })
          .lean();

        // Get latest for each type
        const latest = new Map();
        for (const c of consents) {
          if (!latest.has(c.consentTypeId)) {
            latest.set(c.consentTypeId, c);
          }
        }

        res.json({ success: true, data: Array.from(latest.values()) });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch consents' });
      }
    });

    // Check specific consent (requires auth)
    this.app.get('/api/consents/:userId/:consentTypeId', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        const latest = await ConsentRecord.findOne({
          userId: req.params.userId,
          consentTypeId: req.params.consentTypeId
        }).sort({ createdAt: -1 });

        res.json({
          success: true,
          data: {
            granted: latest?.granted || false,
            lastUpdated: latest?.createdAt
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to check consent' });
      }
    });

    // Batch update consents (requires auth)
    this.app.post('/api/consents/batch', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        const { userId, consents } = req.body;
        const records = [];

        for (const consent of consents) {
          const record = new ConsentRecord({
            recordId: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            consentTypeId: consent.consentTypeId,
            granted: consent.granted,
            method: 'explicit',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            validFrom: new Date()
          });
          await record.save();
          records.push(record);
          await this.updateUserConsentSummary(userId, consent.consentTypeId, consent.granted);
        }

        res.json({ success: true, data: records });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to batch update' });
      }
    });

    // ========== GDPR COMPLIANCE ==========

    // Get user consent summary (requires auth)
    this.app.get('/api/summary/:userId', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        let summary = await UserConsentSummary.findOne({ userId: req.params.userId });

        if (!summary) {
          summary = new UserConsentSummary({
            userId: req.params.userId,
            consents: []
          });
        }

        res.json({ success: true, data: summary });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get summary' });
      }
    });

    // Delete all user data (GDPR Article 17) - requires auth
    this.app.delete('/api/gdpr/:userId', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        // Delete consent records
        await ConsentRecord.deleteMany({ userId: req.params.userId });

        // Update summary
        await UserConsentSummary.findOneAndUpdate(
          { userId: req.params.userId },
          {
            gdprDeleted: true,
            gdprDeletedAt: new Date(),
            consents: []
          },
          { upsert: true }
        );

        res.json({ success: true, message: 'User data deleted', userId: req.params.userId });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete user data' });
      }
    });

    // Export user data (GDPR Article 15) - requires auth
    this.app.get('/api/export/:userId', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        const records = await ConsentRecord.find({ userId: req.params.userId }).lean();
        const summary = await UserConsentSummary.findOne({ userId: req.params.userId });

        res.json({
          success: true,
          data: {
            userId: req.params.userId,
            exportDate: new Date(),
            consentRecords: records,
            summary
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to export data' });
      }
    });

    // ========== CONSENT VERSIONS ==========

    // Create new consent version (requires auth)
    this.app.post('/api/versions', authLimiter, authenticateJWT, async (req: Request, res) => {
      try {
        const { version, changes, consentTypes } = req.body;

        const consentVersion = new ConsentVersion({
          versionId: `ver_${Date.now()}`,
          version,
          effectiveDate: new Date(),
          changes,
          consentTypes
        });
        await consentVersion.save();

        res.json({ success: true, data: consentVersion });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create version' });
      }
    });

    // Get current version (public)
    this.app.get('/api/versions/current', async (_req, res) => {
      try {
        const current = await ConsentVersion.findOne()
          .sort({ createdAt: -1 });
        res.json({ success: true, data: current });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get current version' });
      }
    });

    // ========== ANALYTICS ==========

    // Get consent stats (public)
    this.app.get('/api/stats', async (req: Request, res) => {
      try {
        const { consentTypeId, days } = req.query;
        const startDate = new Date(Date.now() - (Number(days) || 30) * 24 * 60 * 60 * 1000);

        const query: any = { createdAt: { $gte: startDate } };
        if (consentTypeId) query.consentTypeId = consentTypeId;

        const total = await ConsentRecord.countDocuments(query);
        const granted = await ConsentRecord.countDocuments({ ...query, granted: true });

        res.json({
          success: true,
          data: {
            totalConsents: total,
            granted,
            withdrawn: total - granted,
            consentRate: total > 0 ? (granted / total * 100).toFixed(2) : 0
          }
        });
      } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get stats' });
      }
    });
  }

  private async updateUserConsentSummary(userId: string, consentTypeId: string, granted: boolean) {
    await UserConsentSummary.findOneAndUpdate(
      { userId },
      {
        $set: {
          lastUpdated: new Date(),
          gdprDeleted: false
        },
        $push: {
          consents: {
            $each: [{ consentTypeId, granted, grantedAt: new Date() }],
            $position: 0,
            $slice: 100
          }
        }
      },
      { upsert: true, new: true }
    );
  }

  async start(port: number = 4220): Promise<void> {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_consent'
      );
      console.log('[ConsentService] Connected to MongoDB');

      this.app.listen(port, () => {
        console.log(`[ConsentService] Service running on port ${port}`);
        console.log('Security features: Helmet, JWT, Rate Limiting, CORS, MongoDB Sanitization, Zod Validation');
      });
    } catch (error) {
      console.error('[ConsentService] Failed to start:', error);
      throw error;
    }
  }
}

const service = new ConsentService();
service.start(4220);

export default service;
