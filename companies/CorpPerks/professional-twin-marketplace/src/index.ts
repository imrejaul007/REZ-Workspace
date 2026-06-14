import { logger } from '../../shared/logger';
/**
 * Professional Twin Marketplace
 *
 * The world's first Talent Twin Marketplace where:
 * - Employees OWN their professional twins
 * - Companies hire employees + their AI twins
 * - Twins travel with employees between jobs
 *
 * This transforms hiring from:
 *   Company → Hire 1 Human
 * To:
 *   Company → Hire 1 Human + N Professional Twins
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes } from 'crypto';

// Routes
import { twinRoutes } from './routes/twins.js';
import { marketplaceRoutes } from './routes/marketplace.js';
import { hiringRoutes } from './routes/hiring.js';
import { analyticsRoutes } from './routes/analytics.js';
import { exportRoutes } from './routes/export.js';
import { privacyRoutes } from './routes/privacy.js';
import { authRoutes } from './routes/auth.js';
import { memoryRoutes } from './routes/memory.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED' } }
}));

// Config
const PORT = parseInt(process.env.PORT || '4760', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/twin-marketplace';
const JWT_SECRET = process.env.JWT_SECRET || 'twin-marketplace-secret';

// CorpID Integration
const CORPID_URL = process.env.CORPID_URL || 'http://localhost:4702';
const CORPID_TOKEN = process.env.CORPID_TOKEN || 'corpid-internal-token';

// Salar OS Integration
const SALAR_URL = process.env.SALAR_URL || 'http://localhost:4710';

// =============================================================================
// MODELS
// =============================================================================

// Professional Twin Schema
const professionalTwinSchema = new mongoose.Schema({
  twinId: { type: String, required: true, unique: true, index: true },
  ownerCorpId: { type: String, required: true, index: true }, // Employee's CorpID
  ownerName: { type: String, required: true },
  ownerEmail: { type: String },

  twinType: {
    type: String,
    enum: ['KNOWLEDGE', 'SKILL', 'CAREER', 'PRODUCTIVITY', 'EXECUTION'],
    required: true
  },

  // Employee OWNS this, company has TEMPORARY ACCESS
  ownership: {
    ownedBy: { type: String, enum: ['EMPLOYEE'], default: 'EMPLOYEE' },
    transferRights: { type: Boolean, default: true },
    portability: { type: Boolean, default: true },
  },

  // Learning sources and data
  learning: {
    sources: [{
      sourceType: { type: String },
      lastSync: Date,
      dataPoints: Number
    }],
    totalTrainingHours: { type: Number, default: 0 },
    lastActiveAt: Date
  },

  // Accumulated knowledge
  knowledge: {
    domains: [String],
    expertise: [String],
    methodologies: [String],
    tools: [String],
    languages: [String]
  },

  // Behavior patterns
  behavior: {
    workStyle: String,
    communicationStyle: String,
    decisionPattern: String,
    learningStyle: String,
    strengths: [String],
    growthAreas: [String]
  },

  // Metrics (updated over time)
  metrics: {
    productivityMultiplier: { type: Number, default: 1.0 },
    knowledgeScore: { type: Number, default: 0 },
    executionScore: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 0 },
    combinedScore: { type: Number, default: 0 }
  },

  // Privacy settings (employee controls these)
  privacy: {
    shareWithCurrentEmployer: { type: Boolean, default: true },
    shareWithFutureEmployer: { type: Boolean, default: true },
    showInResume: { type: Boolean, default: true },
    verifiedClaims: [String]
  },

  // Status
  status: {
    type: String,
    enum: ['TRAINING', 'ACTIVE', 'ARCHIVED'],
    default: 'TRAINING'
  },

  // Versioning
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Twin Access Grant Schema (when company "hires" twin)
const accessGrantSchema = new mongoose.Schema({
  grantId: { type: String, required: true, unique: true, index: true },
  twinId: { type: String, required: true, index: true },
  ownerCorpId: { type: String, required: true },

  // Company that has access
  companyCorpId: { type: String, required: true, index: true },
  companyName: String,

  // Access details
  accessType: {
    type: String,
    enum: ['VIEW', 'USE', 'FULL'],
    default: 'USE'
  },

  // Employment relationship
  employmentStartDate: Date,
  employmentEndDate: Date,
  isActive: { type: Boolean, default: true },

  // Usage metrics
  usage: {
    totalInvocations: { type: Number, default: 0 },
    lastUsedAt: Date,
    avgSatisfaction: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

// Twin Rating/Review Schema
const twinReviewSchema = new mongoose.Schema({
  reviewId: { type: String, required: true, unique: true, index: true },
  twinId: { type: String, required: true, index: true },
  ownerCorpId: { type: String, required: true },

  reviewerCorpId: { type: String, required: true },
  reviewerName: String,
  reviewerCompany: String,

  rating: { type: Number, min: 1, max: 5, required: true },
  review: String,

  metrics: {
    accuracy: Number,
    reliability: Number,
    usefulness: Number
  },

  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Models
const ProfessionalTwin = mongoose.model('ProfessionalTwin', professionalTwinSchema);
const AccessGrant = mongoose.model('AccessGrant', accessGrantSchema);
const TwinReview = mongoose.model('TwinReview', twinReviewSchema);

// =============================================================================
// HELPERS
// =============================================================================

function generateId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36)}`;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'professional-twin-marketplace',
    version: '1.0.0',
    tagline: 'The World\'s First Talent Twin Marketplace',
    timestamp: new Date().toISOString()
  });
});

app.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const twinCount = await ProfessionalTwin.countDocuments();

    res.json({
      status: 'ready',
      mongodb: dbState,
      stats: {
        totalTwins: twinCount
      }
    });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: 'Health check failed' });
  }
});

// =============================================================================
// INFO
// =============================================================================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Professional Twin Marketplace',
    tagline: 'Hire Employees + Their AI Twins',
    description: 'The world\'s first Talent Twin Marketplace where professional twins are employee-owned',

    endpoints: {
      twins: {
        'POST /twins': 'Create professional twin for employee',
        'GET /twins/:twinId': 'Get twin details',
        'GET /twins/owner/:corpId': 'Get all twins for an owner',
        'PATCH /twins/:twinId': 'Update twin',
        'DELETE /twins/:twinId': 'Archive twin'
      },
      marketplace: {
        'GET /marketplace/search': 'Search available twins',
        'GET /marketplace/featured': 'Featured twins',
        'GET /marketplace/categories': 'Browse by category',
        'GET /marketplace/:twinId': 'View twin profile'
      },
      hiring: {
        'POST /hire': 'Request access to twin',
        'GET /hire/pending': 'Pending hire requests',
        'PATCH /hire/:grantId': 'Approve/reject hire request',
        'GET /hire/active': 'Active access grants',
        'DELETE /hire/:grantId': 'Revoke access'
      },
      analytics: {
        'GET /analytics/workforce': 'Workforce twin analytics',
        'GET /analytics/:twinId': 'Twin-specific analytics'
      }
    },

    concept: {
      today: 'Company → Hire 1 Human',
      future: 'Company → Hire 1 Human + N Professional Twins',
      benefit: 'Companies get 2-5x productivity with AI augmentation',
      ownership: 'Twins belong to employees, not companies'
    }
  });
});

// =============================================================================
// MOUNT ROUTES
// =============================================================================

app.use('/twins', twinRoutes);
app.use('/marketplace', marketplaceRoutes);
app.use('/hire', hiringRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/export', exportRoutes);
app.use('/privacy', privacyRoutes);
app.use('/auth', authRoutes);
app.use('/memory', memoryRoutes);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Twin Marketplace Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: err.message }
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
});

// =============================================================================
// START SERVER
// =============================================================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Create indexes
    await ProfessionalTwin.createIndexes();
    await AccessGrant.createIndexes();
    await TwinReview.createIndexes();

    app.listen(PORT, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   PROFESSIONAL TWIN MARKETPLACE                                     ║
║   The World's First Talent Twin Marketplace                        ║
║                                                                      ║
║   Port: ${PORT}                                                      ║
║                                                                      ║
║   CONCEPT:                                                          ║
║   Today:     Company → Hire 1 Human                                ║
║   Future:    Company → Hire 1 Human + N Professional Twins         ║
║                                                                      ║
║   BENEFIT:                                                          ║
║   Twins are EMPLOYEE-OWNED                                          ║
║   Twins TRAVEL with employees                                       ║
║   Companies get 2-5x productivity                                   ║
║                                                                      ║
║   Docs: http://localhost:${PORT}/                                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, ProfessionalTwin, AccessGrant, TwinReview };
