/**
 * REZ QR Unified Hub Service
 * Cross-company QR integration and analytics
 *
 * Port: 4090
 *
 * Features:
 * 1. Unified QR scanning (all companies)
 * 2. Cross-company rewards/loyalty
 * 3. QR Analytics Hub
 * 4. Cross-promotion engine
 * 5. Unified QR Dashboard API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoose from 'mongoose';
import { z } from 'zod';

const app = express();
const PORT = parseInt(process.env.PORT || '4090', 10);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
}));

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://rez.money,https://admin.rez.money,https://now.rez.money,https://karma.app,https://stayown.app').split(',');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests' },
}));

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

// QR Scan Event
const QRScanSchema = new mongoose.Schema({
  scanId: { type: String, required: true, unique: true },
  qrId: { type: String, required: true, index: true },
  intent: { type: String, required: true, index: true },
  company: { type: String, required: true, index: true },
  userId: { type: String, sparse: true },
  deviceId: { type: String },
  location: { type: { lat: Number, lng: Number } },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});

QRScanSchema.index({ company: 1, timestamp: -1 });
QRScanSchema.index({ userId: 1, timestamp: -1 });

// Cross-Company Reward
const CrossRewardSchema = new mongoose.Schema({
  rewardId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  sourceCompany: { type: String, required: true },
  targetCompany: { type: String, required: true },
  type: { type: String, enum: ['coins', 'discount', 'points', 'cashback'], required: true },
  value: { type: Number, required: true },
  currency: { type: String, default: 'coins' },
  qrScanId: { type: String },
  status: { type: String, enum: ['pending', 'issued', 'redeemed', 'expired'], default: 'pending' },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// Cross-Promotion Campaign
const CrossPromoSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sourceCompany: { type: String, required: true },
  targetCompany: { type: String, required: true },
  triggerIntent: { type: String, required: true },
  reward: {
    type: { type: String, enum: ['coins', 'discount', 'points'], required: true },
    value: { type: Number, required: true },
    minSpend: { type: Number, default: 0 },
  },
  targetAudience: {
    segments: [String],
    minLifetimeValue: { type: Number },
    lastVisitDays: { type: Number },
  },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  startDate: { type: Date },
  endDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// QR Analytics
const QRAnalyticsSchema = new mongoose.Schema({
  qrId: { type: String, required: true },
  company: { type: String, required: true },
  intent: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  scans: { type: Number, default: 0 },
  uniqueUsers: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
});

QRAnalyticsSchema.index({ qrId: 1, date: 1 }, { unique: true });

const QRScan = mongoose.model('QRScan', QRScanSchema);
const CrossReward = mongoose.model('CrossReward', CrossRewardSchema);
const CrossPromo = mongoose.model('CrossPromo', CrossPromoSchema);
const QRAnalytics = mongoose.model('QRAnalytics', QRAnalyticsSchema);

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const ScanSchema = z.object({
  qrId: z.string().min(1),
  intent: z.string().min(1),
  company: z.string().min(1),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const RewardSchema = z.object({
  userId: z.string().min(1),
  sourceCompany: z.string().min(1),
  targetCompany: z.string().min(1),
  type: z.enum(['coins', 'discount', 'points', 'cashback']),
  value: z.number().positive(),
  qrScanId: z.string().optional(),
});

const CampaignSchema = z.object({
  name: z.string().min(1),
  sourceCompany: z.string().min(1),
  targetCompany: z.string().min(1),
  triggerIntent: z.string().min(1),
  reward: z.object({
    type: z.enum(['coins', 'discount', 'points']),
    value: z.number().positive(),
    minSpend: z.number().optional(),
  }),
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANY REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

export const COMPANY_CONFIG: Record<string, {
  name: string;
  color: string;
  icon: string;
  intents: string[];
  rewardsEnabled: boolean;
}> = {
  'rez-consumer': {
    name: 'REZ Consumer',
    color: '#6366F1',
    icon: 'shopping-bag',
    intents: ['safe-qr', 'creator-qr', 'verify-qr'],
    rewardsEnabled: true,
  },
  'rez-merchant': {
    name: 'REZ Merchant',
    color: '#10B981',
    icon: 'store',
    intents: ['menu-qr', 'table-qr', 'salon-qr', 'pay-bill'],
    rewardsEnabled: true,
  },
  'rez-media': {
    name: 'REZ Media',
    color: '#F59E0B',
    icon: 'megaphone',
    intents: ['ad-campaign', 'dooh-qr'],
    rewardsEnabled: true,
  },
  'stayown': {
    name: 'StayOwn',
    color: '#8B5CF6',
    icon: 'building',
    intents: ['room-hub', 'menu-qr'],
    rewardsEnabled: true,
  },
  'karma-foundation': {
    name: 'Karma Foundation',
    color: '#22C55E',
    icon: 'heart',
    intents: ['event-checkin', 'qr-in', 'qr-out'],
    rewardsEnabled: true,
  },
  'corpperks': {
    name: 'CorpPerks',
    color: '#3B82F6',
    icon: 'briefcase',
    intents: ['employee-qr', 'event-qr'],
    rewardsEnabled: true,
  },
  'nextha': {
    name: 'NeXha',
    color: '#EC4899',
    icon: 'shopping-cart',
    intents: ['b2b-qr', 'procurement-qr'],
    rewardsEnabled: true,
  },
  'risacare': {
    name: 'RisaCare',
    color: '#06B6D4',
    icon: 'heart-pulse',
    intents: ['health-qr', 'appointment-qr'],
    rewardsEnabled: true,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'REZ QR Unified Hub',
    version: '1.0.0',
    companies: Object.keys(COMPANY_CONFIG).length,
    timestamp: new Date().toISOString(),
  });
});

// ── QR Scanning ──────────────────────────────────────────────────────────────

// Record QR scan
app.post('/api/scans', async (req, res) => {
  try {
    const parsed = ScanSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues });
    }

    const { qrId, intent, company, userId, deviceId, location, metadata } = parsed.data;
    const scanId = `SCAN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Record scan
    await QRScan.create({
      scanId,
      qrId,
      intent,
      company,
      userId,
      deviceId,
      location,
      metadata,
    });

    // Update analytics
    const today = new Date().toISOString().split('T')[0];
    await QRAnalytics.findOneAndUpdate(
      { qrId, date: today },
      {
        $inc: { scans: 1 },
        $setOnInsert: { company, intent }
      },
      { upsert: true }
    );

    // Check for cross-promotions
    const promotions = await CrossPromo.find({
      status: 'active',
      sourceCompany: company,
      triggerIntent: intent,
      $or: [
        { startDate: null },
        { startDate: { $lte: new Date() } },
      ],
      $and: [
        { $or: [{ endDate: null }, { endDate: { $gte: new Date() } }] },
      ],
    });

    const eligibleRewards = [];
    for (const promo of promotions) {
      if (userId && promo.targetCompany === company) {
        eligibleRewards.push({
          campaignId: promo.campaignId,
          targetCompany: promo.targetCompany,
          reward: promo.reward,
        });
      }
    }

    res.json({
      success: true,
      data: {
        scanId,
        timestamp: new Date().toISOString(),
        promotions: eligibleRewards,
      },
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── Cross-Company Rewards ────────────────────────────────────────────────────

// Issue reward
app.post('/api/rewards', async (req, res) => {
  try {
    const parsed = RewardSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues });
    }

    const { userId, sourceCompany, targetCompany, type, value, qrScanId } = parsed.data;
    const rewardId = `REWARD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const reward = await CrossReward.create({
      rewardId,
      userId,
      sourceCompany,
      targetCompany,
      type,
      value,
      qrScanId,
      status: 'issued',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.json({
      success: true,
      data: {
        rewardId,
        type,
        value,
        currency: type === 'coins' ? 'coins' : type === 'cashback' ? '₹' : 'points',
        expiresAt: reward.expiresAt,
      },
    });
  } catch (err) {
    console.error('Reward error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user rewards
app.get('/api/rewards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, company } = req.query;

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;
    if (company) query.$or = [{ sourceCompany: company }, { targetCompany: company }];

    const rewards = await CrossReward.find(query).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      data: rewards.map(r => ({
        rewardId: r.rewardId,
        sourceCompany: r.sourceCompany,
        targetCompany: r.targetCompany,
        type: r.type,
        value: r.value,
        status: r.status,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get rewards error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── Cross-Promotion Campaigns ─────────────────────────────────────────────────

// Create campaign
app.post('/api/campaigns', async (req, res) => {
  try {
    const parsed = CampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues });
    }

    const campaignId = `XPROMO-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const campaign = await CrossPromo.create({
      campaignId,
      ...parsed.data,
      status: 'active',
      startDate: new Date(),
    });

    res.json({
      success: true,
      data: { campaignId },
    });
  } catch (err) {
    console.error('Campaign error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// List campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const { company, status } = req.query;
    const query: Record<string, unknown> = {};
    if (company) query.$or = [{ sourceCompany: company }, { targetCompany: company }];
    if (status) query.status = status;

    const campaigns = await CrossPromo.find(query).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      data: campaigns.map(c => ({
        campaignId: c.campaignId,
        name: c.name,
        sourceCompany: c.sourceCompany,
        targetCompany: c.targetCompany,
        triggerIntent: c.triggerIntent,
        reward: c.reward,
        status: c.status,
      })),
    });
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── Analytics ────────────────────────────────────────────────────────────────

// Get QR stats
app.get('/api/analytics/:company', async (req, res) => {
  try {
    const { company } = req.params;
    const { from, to, intent } = req.query;

    const match: Record<string, unknown> = { company };
    if (intent) match.intent = intent;
    if (from && to) {
      match.timestamp = { $gte: new Date(from as string), $lte: new Date(to as string) };
    }

    const [stats, recentScans, topIntents] = await Promise.all([
      QRScan.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: 1 }, unique: { $addToSet: '$userId' } } },
      ]),
      QRScan.find(match).sort({ timestamp: -1 }).limit(10),
      QRScan.aggregate([
        { $match: { company } },
        { $group: { _id: '$intent', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalScans: stats[0]?.total || 0,
        uniqueUsers: stats[0]?.unique?.length || 0,
        topIntents,
        recentScans: recentScans.map(s => ({
          scanId: s.scanId,
          intent: s.intent,
          timestamp: s.timestamp,
        })),
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ── Company Info ──────────────────────────────────────────────────────────────

// Get company config
app.get('/api/companies', (req, res) => {
  res.json({
    success: true,
    data: Object.entries(COMPANY_CONFIG).map(([id, config]) => ({
      id,
      ...config,
    })),
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-qr-unified';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected');

    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           REZ QR Unified Hub v1.0.0                      ║
║═══════════════════════════════════════════════════════════════║
║  Port:    ${PORT}                                              ║
║  Companies: ${Object.keys(COMPANY_CONFIG).length}                                       ║
║  Features:                                           ║
║    • Unified QR Scanning                             ║
║    • Cross-Company Rewards                           ║
║    • QR Analytics Hub                                 ║
║    • Cross-Promotion Engine                          ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();

export default app;
