import { logger } from './logger';
/**
 * RisnaEstate - Influencer Tracking Service
 *
 * Tracks influencer referrals, commissions, and conversions.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';

const app = express();
const PORT = process.env.PORT || 4118;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

const trackerEvents = new EventEmitter();

// =============================================
// SCHEMAS
// =============================================

/**
 * Influencer profile
 */
interface IInfluencer {
  influencerId: string;
  name: string;
  email: string;
  phone: string;
  handle: string;
  platform: 'instagram' | 'youtube' | 'twitter' | 'linkedin' | 'tiktok' | 'whatsapp';
  followers: number;
  verified: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  commission: {
    perLead: number;
    perBooking: number;
    percentage: number;
  };
  stats: {
    totalLeads: number;
    totalBookings: number;
    totalEarnings: number;
    paidOut: number;
    pendingPayout: number;
  };
  links: Array<{
    code: string;
    propertyIds: string[];
    createdAt: Date;
    clicks: number;
    leads: number;
    bookings: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const InfluencerSchema = new Schema<IInfluencer & Document>('Influencer', {
  influencerId: { type: String, unique: true, index: true },
  name: String,
  email: { type: String, index: true },
  phone: String,
  handle: String,
  platform: { type: String, enum: ['instagram', 'youtube', 'twitter', 'linkedin', 'tiktok', 'whatsapp'] },
  followers: Number,
  verified: { type: Boolean, default: false },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  commission: {
    perLead: { type: Number, default: 100 },
    perBooking: { type: Number, default: 5000 },
    percentage: { type: Number, default: 1 }
  },
  stats: {
    totalLeads: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    paidOut: { type: Number, default: 0 },
    pendingPayout: { type: Number, default: 0 }
  },
  links: [{
    code: String,
    propertyIds: [String],
    createdAt: Date,
    clicks: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 }
  }]
}, { timestamps: true });

const Influencer = mongoose.model<IInfluencer & Document>('Influencer', InfluencerSchema);

/**
 * Referral tracking
 */
interface IReferral {
  referralId: string;
  influencerId: string;
  linkCode: string;
  userId?: string;
  propertyId?: string;
  stage: 'click' | 'lead' | 'inquiry' | 'visit' | 'booking';
  earnings: number;
  paid: boolean;
  createdAt: Date;
  convertedAt?: Date;
}

const ReferralSchema = new Schema<IReferral & Document>('Referral', {
  referralId: { type: String, unique: true, index: true },
  influencerId: { type: String, index: true },
  linkCode: String,
  userId: String,
  propertyId: String,
  stage: { type: String, enum: ['click', 'lead', 'inquiry', 'visit', 'booking'], default: 'click' },
  earnings: { type: Number, default: 0 },
  paid: { type: Boolean, default: false }
}, { timestamps: true });

const Referral = mongoose.model<IReferral & Document>('Referral', ReferralSchema);

/**
 * Payout record
 */
interface IPayout {
  payoutId: string;
  influencerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'upi' | 'bank' | 'wallet';
  reference?: string;
  createdAt: Date;
  processedAt?: Date;
}

const PayoutSchema = new Schema<IPayout & Document>('Payout', {
  payoutId: { type: String, unique: true, index: true },
  influencerId: { type: String, index: true },
  amount: Number,
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  method: String,
  reference: String
}, { timestamps: true });

const Payout = mongoose.model<IPayout & Document>('Payout', PayoutSchema);

// =============================================
// HELPER FUNCTIONS
// =============================================

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function calculateTier(followers: number): string {
  if (followers >= 1000000) return 'platinum';
  if (followers >= 100000) return 'gold';
  if (followers >= 10000) return 'silver';
  return 'bronze';
}

function getCommission(tier: string): { perLead: number; perBooking: number; percentage: number } {
  const tiers = {
    bronze: { perLead: 100, perBooking: 2000, percentage: 0.5 },
    silver: { perLead: 200, perBooking: 5000, percentage: 1 },
    gold: { perLead: 500, perBooking: 10000, percentage: 1.5 },
    platinum: { perLead: 1000, perBooking: 20000, percentage: 2 }
  };
  return tiers[tier as keyof typeof tiers] || tiers.bronze;
}

async function processReferral(
  influencerId: string,
  linkCode: string,
  stage: IReferral['stage'],
  bookingAmount?: number
): Promise<number> {
  const influencer = await Influencer.findOne({ influencerId });
  if (!influencer) return 0;

  // Find or create referral
  let referral = await Referral.findOne({
    influencerId,
    linkCode,
    stage: { $ne: 'booking' }
  });

  if (!referral) {
    referral = new Referral({
      referralId: `ref_${Date.now()}`,
      influencerId,
      linkCode,
      stage: 'click'
    });
    await referral.save();
  }

  // Calculate earnings for this stage
  let earnings = 0;
  const commission = influencer.commission;

  if (stage === 'lead' && referral.stage === 'click') {
    earnings = commission.perLead;
    referral.stage = 'lead';
  } else if (stage === 'inquiry' && ['click', 'lead'].includes(referral.stage)) {
    earnings = commission.perLead * 0.5;
    referral.stage = 'inquiry';
  } else if (stage === 'visit' && ['click', 'lead', 'inquiry'].includes(referral.stage)) {
    earnings = commission.perLead;
    referral.stage = 'visit';
  } else if (stage === 'booking') {
    earnings = bookingAmount ? (bookingAmount * commission.percentage / 100) : commission.perBooking;
    referral.stage = 'booking';
    referral.convertedAt = new Date();
  }

  referral.earnings += earnings;
  await referral.save();

  // Update influencer stats
  influencer.stats.totalEarnings += earnings;
  influencer.stats.pendingPayout += earnings;

  if (stage === 'lead') influencer.stats.totalLeads++;
  if (stage === 'booking') influencer.stats.totalBookings++;

  await influencer.save();

  // Update link stats
  const link = influencer.links.find(l => l.code === linkCode);
  if (link) {
    if (stage === 'lead') link.leads++;
    if (stage === 'booking') link.bookings++;
    await influencer.save();
  }

  trackerEvents.emit('referral:updated', { influencerId, stage, earnings });

  return earnings;
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ service: 'risna-influencer-tracker', status: 'healthy' });
});

/**
 * Register influencer
 * POST /api/influencers
 */
app.post('/api/influencers', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, handle, platform, followers } = req.body;

    const tier = calculateTier(followers || 0);
    const commission = getCommission(tier);

    const influencer = new Influencer({
      influencerId: `inf_${Date.now()}`,
      name,
      email,
      phone,
      handle,
      platform,
      followers: followers || 0,
      tier,
      commission
    });

    await influencer.save();

    res.json({ success: true, influencer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get influencer
 * GET /api/influencers/:id
 */
app.get('/api/influencers/:id', async (req: Request, res: Response) => {
  try {
    const influencer = await Influencer.findOne({ influencerId: req.params.id });
    if (!influencer) return res.status(404).json({ error: 'Not found' });
    res.json({ influencer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate referral link
 * POST /api/links
 */
app.post('/api/links', async (req: Request, res: Response) => {
  try {
    const { influencerId, propertyIds } = req.body;

    const influencer = await Influencer.findOne({ influencerId });
    if (!influencer) return res.status(404).json({ error: 'Influencer not found' });

    const code = generateReferralCode();

    influencer.links.push({
      code,
      propertyIds: propertyIds || [],
      createdAt: new Date(),
      clicks: 0,
      leads: 0,
      bookings: 0
    });

    await influencer.save();

    const linkUrl = `https://risnaestate.com/ref/${code}`;

    res.json({ success: true, code, link: linkUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track click
 * POST /api/track/click
 */
app.post('/api/track/click', async (req: Request, res: Response) => {
  try {
    const { code, influencerId } = req.body;

    const influencer = await Influencer.findOne({ influencerId });
    if (!influencer) return res.status(404).json({ error: 'Influencer not found' });

    const link = influencer.links.find(l => l.code === code);
    if (link) {
      link.clicks++;
      await influencer.save();
    }

    // Create referral record
    const referral = new Referral({
      referralId: `ref_${Date.now()}`,
      influencerId,
      linkCode: code,
      stage: 'click'
    });
    await referral.save();

    trackerEvents.emit('click:tracked', { influencerId, code });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track conversion
 * POST /api/track/conversion
 */
app.post('/api/track/conversion', async (req: Request, res: Response) => {
  try {
    const { code, influencerId, stage, userId, propertyId, bookingAmount } = req.body;

    const earnings = await processReferral(
      influencerId,
      code,
      stage,
      bookingAmount
    );

    // Update referral with user/property
    await Referral.findOneAndUpdate(
      { influencerId, linkCode: code, stage: { $ne: 'booking' } },
      { userId, propertyId }
    );

    res.json({ success: true, earnings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get influencer stats
 * GET /api/influencers/:id/stats
 */
app.get('/api/influencers/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await Referral.aggregate([
      { $match: { influencerId: req.params.id } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          earnings: { $sum: '$earnings' }
        }
      }
    ]);

    const referrals = await Referral.find({ influencerId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ stats, recent: referrals });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get leaderboard
 * GET /api/leaderboard
 */
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = 20, sort = 'earnings' } = req.query;

    const sortField = sort === 'bookings' ? 'stats.totalBookings' :
      sort === 'leads' ? 'stats.totalLeads' : 'stats.totalEarnings';

    const leaders = await Influencer.find({ verified: true })
      .sort({ [sortField as string]: -1 })
      .limit(parseInt(limit as string))
      .select('name handle platform followers tier stats');

    res.json({ leaders });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Request payout
 * POST /api/payouts
 */
app.post('/api/payouts', async (req: Request, res: Response) => {
  try {
    const { influencerId, amount, method } = req.body;

    const influencer = await Influencer.findOne({ influencerId });
    if (!influencer) return res.status(404).json({ error: 'Influencer not found' });

    if (influencer.stats.pendingPayout < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const payout = new Payout({
      payoutId: `pay_${Date.now()}`,
      influencerId,
      amount,
      method: method || 'wallet'
    });

    await payout.save();

    res.json({ success: true, payout });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get payouts
 * GET /api/payouts/:influencerId
 */
app.get('/api/payouts/:influencerId', async (req: Request, res: Response) => {
  try {
    const payouts = await Payout.find({ influencerId: req.params.influencerId })
      .sort({ createdAt: -1 });

    res.json({ payouts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-influencer-tracker');
    logger.info('✅ Connected to MongoDB');

    await Influencer.createIndexes();
    await Referral.createIndexes();
    await Payout.createIndexes();

    app.listen(PORT, () => {
      logger.info(`🚀 RisnaEstate Influencer Tracker running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
