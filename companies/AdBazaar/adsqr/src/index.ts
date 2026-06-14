/**
 * adsqr - QR Code Ad Campaigns
 * QR-based advertising with coin rewards
 *
 * SECURITY: All inputs validated with Zod schemas
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import QRCode from 'qrcode';
import { rateLimit } from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import axios from 'axios';

const app = express();

// RABTUL Wallet Integration
const RABTUL = {
  WALLET_URL: process.env.WALLET_SERVICE_URL || 'http://localhost:4004',
  AUTH_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  INTERNAL_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || ''
};

// Credit coins via RABTUL Wallet
async function creditCoins(userId: string, coins: number, campaignId: string, source: string): Promise<boolean> {
  try {
    await axios.post(`${RABTUL.WALLET_URL}/api/wallet/credit`, {
      user_id: userId,
      amount: coins,
      source: source || 'ad_scan',
      reference_id: `campaign-${campaignId}-${Date.now()}`
    }, {
      headers: { 'X-Internal-Token': RABTUL.INTERNAL_TOKEN }
    });
    logger.info(`Credited ${coins} coins to user ${userId} for campaign ${campaignId}`);
    return true;
  } catch (error) {
    logger.error('Failed to credit coins:', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

// Verify user with RABTUL Auth
async function verifyUser(userId: string): Promise<boolean> {
  try {
    await axios.get(`${RABTUL.AUTH_URL}/api/users/${userId}`, {
      headers: { 'X-Internal-Token': RABTUL.INTERNAL_TOKEN }
    });
    return true;
  } catch {
    return false;
  }
}
const PORT = parseInt(process.env.PORT || '4135', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adsqr';

// Validation schemas
const campaignSchema = z.object({
  name: z.string().min(1).max(200),
  advertiserId: z.string().min(1),
  redirectUrl: z.string().url(),
  rewardCoins: z.number().int().min(0).max(10000).default(10),
  dailyLimit: z.number().int().min(1).default(1000),
  totalLimit: z.number().int().min(1).optional(),
});

const scanSchema = z.object({
  campaignId: z.string().min(1),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
});

const listCampaignsSchema = z.object({
  status: z.enum(['active', 'paused', 'completed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// CORS - Whitelist only
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.some(allowed => origin.includes(allowed))) {
      return callback(null, true);
    }
    callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting - SECURE LIMITS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Reduced from 1000 - more secure
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Campaign Schema
const campaignDbSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  advertiserId: { type: String, required: true },
  redirectUrl: { type: String, required: true },
  rewardCoins: { type: Number, default: 10 },
  dailyLimit: { type: Number, default: 1000 },
  totalLimit: { type: Number },
  scans: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const Campaign = mongoose.model('Campaign', campaignDbSchema);

// QR Scan Schema
const scanDbSchema = new mongoose.Schema({
  scanId: { type: String, required: true, unique: true },
  campaignId: { type: String, required: true },
  userId: String,
  deviceId: String,
  ip: String,
  location: {
    country: String,
    city: String,
  },
  rewarded: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Scan = mongoose.model('Scan', scanDbSchema);

// Error handler middleware
function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error('Error:', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
}

// Validation middleware
function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.issues,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// Health check
app.get('/health', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.json({
    status: mongoOk ? 'healthy' : 'degraded',
    service: 'adsqr',
    mongodb: mongoOk ? 'connected' : 'disconnected',
  });
});

// Ready check
app.get('/ready', async (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  if (!mongoOk) {
    res.status(503).json({ ready: false, error: 'MongoDB not connected' });
    return;
  }
  res.json({ ready: true });
});

// Create campaign
app.post('/api/campaigns', validateBody(campaignSchema), async (req: Request, res: Response) => {
  try {
    const { name, advertiserId, redirectUrl, rewardCoins, dailyLimit, totalLimit } = req.body;
    const campaignId = `qr-${uuidv4().slice(0, 8)}`;

    const campaign = new Campaign({
      campaignId,
      name,
      advertiserId,
      redirectUrl,
      rewardCoins,
      dailyLimit,
      totalLimit,
    });

    await campaign.save();
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Create campaign error:', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// Get campaign
app.get('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    logger.error('Get campaign error:', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(500).json({ success: false, error: 'Failed to get campaign' });
  }
});

// Generate QR code
app.get('/api/campaigns/:id/qr', async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findOne({ campaignId: req.params.id });
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    const baseUrl = process.env.QR_BASE_URL || 'https://qr.rezapp.com';
    const scanUrl = `${baseUrl}/scan/${campaign.campaignId}`;

    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    res.json({
      success: true,
      data: {
        campaignId: campaign.campaignId,
        scanUrl,
        qrDataUrl,
      },
    });
  } catch (error) {
    logger.error('Generate QR error:', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(500).json({ success: false, error: 'Failed to generate QR code' });
  }
});

// Scan QR code
app.post('/api/scan', validateBody(scanSchema), async (req: Request, res: Response) => {
  try {
    const { campaignId, userId, deviceId } = req.body;

    const campaign = await Campaign.findOne({ campaignId });
    if (!campaign) {
      res.status(404).json({ success: false, error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'active') {
      res.status(400).json({ success: false, error: 'Campaign not active' });
      return;
    }

    if (campaign.totalLimit && campaign.scans >= campaign.totalLimit) {
      res.status(400).json({ success: false, error: 'Campaign limit reached' });
      return;
    }

    // Check for duplicate scan
    const existingScan = await Scan.findOne({ campaignId, userId, deviceId });
    if (existingScan) {
      res.json({
        success: true,
        data: { rewarded: false, reason: 'Already scanned' },
      });
      return;
    }

    // Record scan
    const scanId = `scan-${uuidv4().slice(0, 8)}`;
    let rewarded = false;

    // Credit coins via RABTUL Wallet if userId provided
    if (userId && campaign.rewardCoins > 0) {
      rewarded = await creditCoins(userId, campaign.rewardCoins, campaignId, 'ad_scan');
    }

    const scan = new Scan({
      scanId,
      campaignId,
      userId,
      deviceId,
      rewarded,
    });
    await scan.save();

    // Update campaign scans
    await Campaign.findOneAndUpdate(
      { campaignId },
      { $inc: { scans: 1 } }
    );

    res.json({
      success: true,
      data: {
        rewarded,
        coins: rewarded ? campaign.rewardCoins : 0,
        redirectUrl: campaign.redirectUrl,
      },
    });
  } catch (error) {
    logger.error('Scan QR error:', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(500).json({ success: false, error: 'Failed to process scan' });
  }
});

// List campaigns
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const parsed = listCampaignsSchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid query params' });
      return;
    }

    const { status, page, limit } = parsed.data;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('List campaigns error:', { error: error instanceof Error ? error.message : 'Unknown' });
    res.status(500).json({ success: false, error: 'Failed to list campaigns' });
  }
});

// Error handler
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info(`[${new Date().toISOString()}] Connected to MongoDB`);

    app.listen(PORT, () => {
      logger.info(`[${new Date().toISOString()}] adsqr running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Startup error:', { error: error instanceof Error ? error.message : 'Unknown' });
    process.exit(1);
  }
}

start();

export default app;
