/**
 * REZ Cross-Company Integration Service
 * Connects all REZ ecosystem companies via shared events
 *
 * Features:
 * - Cross-company event bus
 * - Shared analytics
 * - Unified customer profiles
 * - Cross-company loyalty/points
 * - Shared offers
 *
 * Database: MongoDB
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4099;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-cross-company';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// MONGOOSE SCHEMAS
// ============================================

// Cross-Company Event Schema
const companyEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true, index: true },
  source: { type: String, required: true, index: true },
  target: [{ type: String }],
  type: { type: String, required: true, index: true },
  payload: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['pending', 'delivered', 'failed'], default: 'pending' },
  deliveredTo: [{ type: String }],
  retries: { type: Number, default: 0 }
}, { timestamps: true });

// Shared Analytics Schema
const sharedAnalyticsSchema = new mongoose.Schema({
  company: { type: String, required: true, index: true },
  metric: { type: String, required: true, index: true },
  value: mongoose.Schema.Types.Mixed,
  period: { type: String, default: 'daily' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Company Connection Schema
const companyConnectionSchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true, index: true },
  companyName: { type: String, required: true },
  services: [{
    name: String,
    url: String,
    port: Number,
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  }],
  webhookUrl: String,
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
}, { timestamps: true });

// Unified Profile Schema
const unifiedProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  companies: [{
    company: { type: String, required: true },
    externalId: String,
    email: String,
    phone: String,
    linkedAt: { type: Date, default: Date.now }
  }],
  points: [{
    company: { type: String, required: true },
    points: { type: Number, default: 0 },
    tier: String
  }]
}, { timestamps: true });

// Shared Offer Schema
const sharedOfferSchema = new mongoose.Schema({
  offerId: { type: String, required: true, unique: true, index: true },
  companies: [{ type: String }],
  title: String,
  description: String,
  discount: Number,
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  minPurchase: Number,
  maxDiscount: Number,
  validFrom: Date,
  validUntil: Date,
  status: { type: String, enum: ['active', 'expired', 'paused'], default: 'active' }
}, { timestamps: true });

// Create models
const CompanyEvent = mongoose.model('CompanyEvent', companyEventSchema);
const SharedAnalytics = mongoose.model('SharedAnalytics', sharedAnalyticsSchema);
const CompanyConnection = mongoose.model('CompanyConnection', companyConnectionSchema);
const UnifiedProfile = mongoose.model('UnifiedProfile', unifiedProfileSchema);
const SharedOffer = mongoose.model('SharedOffer', sharedOfferSchema);

// ============================================
// AUTH MIDDLEWARE
// ============================================

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token-here';

function requireInternal(req: Request, res: Response, next: express.NextFunction) {
  const token = req.headers['x-internal-token'] as string;
  if (token !== INTERNAL_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', async (_req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const stats = {
      events: await CompanyEvent.countDocuments(),
      companies: await CompanyConnection.countDocuments(),
      profiles: await UnifiedProfile.countDocuments(),
      offers: await SharedOffer.countDocuments()
    };

    res.json({
      status: 'ok',
      service: 'REZ-cross-company-service',
      timestamp: new Date().toISOString(),
      database: mongoStatus,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: (error as Error).message
    });
  }
});

// ============================================
// EVENT BUS APIs
// ============================================

// Emit cross-company event
app.post('/api/events', requireInternal, async (req: Request, res: Response) => {
  try {
    const { source, target, type, payload } = req.body;

    if (!source || !type) {
      res.status(400).json({ error: 'source and type are required' });
      return;
    }

    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const event = new CompanyEvent({
      eventId,
      source,
      target: target || [],
      type,
      payload,
      status: 'pending'
    });

    await event.save();
    console.log(`[${source}] → ${type}`, { target: target || 'all', eventId });

    res.json({ success: true, eventId });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get cross-company events
app.get('/api/events', requireInternal, async (req: Request, res: Response) => {
  try {
    const { company, type, limit = 100 } = req.query;
    const query: Record<string, unknown> = {};

    if (company) {
      query.$or = [
        { source: company },
        { target: company as string }
      ];
    }
    if (type) query.type = type;

    const events = await CompanyEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, events });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// COMPANY CONNECTION APIs
// ============================================

// Register company
app.post('/api/companies', requireInternal, async (req: Request, res: Response) => {
  try {
    const { companyId, companyName, services, webhookUrl } = req.body;

    if (!companyId || !companyName) {
      res.status(400).json({ error: 'companyId and companyName are required' });
      return;
    }

    const connection = await CompanyConnection.findOneAndUpdate(
      { companyId },
      { companyId, companyName, services, webhookUrl },
      { upsert: true, new: true }
    );

    res.json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get company
app.get('/api/companies/:companyId', async (req: Request, res: Response) => {
  try {
    const connection = await CompanyConnection.findOne({ companyId: req.params.companyId });

    if (!connection) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    res.json({ success: true, connection });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// List all companies
app.get('/api/companies', async (_req, res) => {
  try {
    const companies = await CompanyConnection.find().sort({ companyName: 1 });
    res.json({ success: true, companies });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// UNIFIED PROFILE APIs
// ============================================

// Link user across companies
app.post('/api/profiles/:userId/link', requireInternal, async (req: Request, res: Response) => {
  try {
    const { company, externalId, email, phone } = req.body;
    const { userId } = req.params;

    if (!company) {
      res.status(400).json({ error: 'company is required' });
      return;
    }

    let profile = await UnifiedProfile.findOne({ userId });

    if (!profile) {
      profile = new UnifiedProfile({ userId, companies: [], points: [] });
    }

    // Check if company already linked
    const existingIndex = profile.companies.findIndex(c => c.company === company);
    if (existingIndex >= 0) {
      profile.companies[existingIndex] = { company, externalId, email, phone, linkedAt: new Date() };
    } else {
      profile.companies.push({ company, externalId, email, phone, linkedAt: new Date() });
    }

    await profile.save();
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get unified profile
app.get('/api/profiles/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await UnifiedProfile.findOne({ userId: req.params.userId });

    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// CROSS-COMPANY POINTS APIs
// ============================================

// Get cross-company points
app.get('/api/points/:userId', async (req: Request, res: Response) => {
  try {
    const profile = await UnifiedProfile.findOne({ userId: req.params.userId });

    res.json({
      success: true,
      points: profile?.points || []
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update points
app.post('/api/points/:userId/update', requireInternal, async (req: Request, res: Response) => {
  try {
    const { company, points, tier } = req.body;
    const { userId } = req.params;

    let profile = await UnifiedProfile.findOne({ userId });

    if (!profile) {
      profile = new UnifiedProfile({ userId, companies: [], points: [] });
      await profile.save();
    }

    const existingIndex = profile.points.findIndex(p => p.company === company);
    if (existingIndex >= 0) {
      profile.points[existingIndex] = { company, points, tier };
    } else {
      profile.points.push({ company, points, tier });
    }

    await profile.save();
    res.json({ success: true, points: profile.points });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// SHARED OFFERS APIs
// ============================================

// Create cross-company offer
app.post('/api/offers', requireInternal, async (req: Request, res: Response) => {
  try {
    const { companies, title, description, discount, discountType, minPurchase, maxDiscount, validFrom, validUntil } = req.body;

    if (!title || discount === undefined) {
      res.status(400).json({ error: 'title and discount are required' });
      return;
    }

    const offerId = `offer_${Date.now()}`;

    const offer = new SharedOffer({
      offerId,
      companies: companies || ['all'],
      title,
      description,
      discount,
      discountType: discountType || 'percentage',
      minPurchase,
      maxDiscount,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    await offer.save();
    res.json({ success: true, offer });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get offers for company
app.get('/api/offers/:company', async (req: Request, res) => {
  try {
    const offers = await SharedOffer.find({
      $or: [
        { companies: req.params.company },
        { companies: 'all' }
      ],
      status: 'active',
      validUntil: { $gte: new Date() }
    });

    res.json({ success: true, offers });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// SHARED ANALYTICS APIs
// ============================================

// Record metric
app.post('/api/metrics', requireInternal, async (req: Request, res: Response) => {
  try {
    const { company, metric, value, period, metadata } = req.body;

    if (!company || !metric || value === undefined) {
      res.status(400).json({ error: 'company, metric, and value are required' });
      return;
    }

    const analytics = new SharedAnalytics({
      company,
      metric,
      value,
      period: period || 'daily',
      metadata
    });

    await analytics.save();
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get aggregated metrics
app.get('/api/metrics/:company/:metric', async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query;
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const metrics = await SharedAnalytics.aggregate([
      {
        $match: {
          company: req.params.company,
          metric: req.params.metric,
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$value' },
          avg: { $avg: '$value' },
          min: { $min: '$value' },
          max: { $max: '$value' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      metric: req.params.metric,
      period,
      stats: metrics[0] || { total: 0, avg: 0, min: 0, max: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create indexes
    await CompanyEvent.createIndexes();
    await SharedAnalytics.createIndexes();
    await CompanyConnection.createIndexes();
    await UnifiedProfile.createIndexes();
    await SharedOffer.createIndexes();

    app.listen(PORT, () => {
      console.log(`REZ Cross-Company Service running on port ${PORT}`);
      console.log('🔗 Connecting all REZ ecosystem companies');
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