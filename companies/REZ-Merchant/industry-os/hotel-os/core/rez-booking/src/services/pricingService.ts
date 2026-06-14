import { logger } from ;
/**
 * REZ Hotel Pricing Service
 * Port: 4022
 *
 * Pricing Tiers & Subscription Management
 * - Listing tiers (Basic/Pro/Premium)
 * - Sponsored placements
 * - Commission management
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const config = {
  port: parseInt(process.env.PORT || '4022'),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/rez_hotel_pricing',
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
};

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// SCHEMAS
const TierSchema = z.object({
  hotelId: z.string().min(1),
  currentTier: z.enum(['basic', 'pro', 'premium']),
  upgradeTo: z.enum(['pro', 'premium']).optional(),
  duration: z.enum(['monthly', 'yearly']).default('monthly'),
  promoCode: z.string().optional(),
});

const SponsorSchema = z.object({
  hotelId: z.string().min(1),
  tier: z.enum(['basic', 'pro', 'premium']),
  sponsoredCategories: z.array(z.string()).optional(),
  sponsoredCities: z.array(z.string()).optional(),
  sponsoredKeywords: z.array(z.string()).optional(),
  dailyBudget: z.number().min(0),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const PricingConfigSchema = z.object({
  tier: z.enum(['basic', 'pro', 'premium']),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  features: z.array(z.string()),
  commission: z.number().min(0).max(100),
});

// MODELS
const HotelSubscriptionSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, unique: true, index: true },
  tier: { type: String, enum: ['basic', 'pro', 'premium'], default: 'basic' },
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'trial'], default: 'basic' },
  startDate: Date,
  endDate: Date,
  autoRenew: { type: Boolean, default: false },
  paymentHistory: [{
    id: String,
    amount: Number,
    currency: String,
    status: String,
    paidAt: Date,
  }],
  features: [String],
  createdAt: { type: Date, default: Date.now },
});

const SponsoredListingSchema = new mongoose.Schema({
  hotelId: { type: String, required: true, index: true },
  tier: String,
  sponsoredCategories: [String],
  sponsoredCities: [String],
  sponsoredKeywords: [String],
  dailyBudget: Number,
  totalSpent: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  bookings: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  startDate: Date,
  endDate: Date,
  status: { type: String, enum: ['active', 'paused', 'ended', 'exhausted'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
});

const PricingTierSchema = new mongoose.Schema({
  tier: { type: String, enum: ['basic', 'pro', 'premium'], required: true, unique: true },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number, required: true },
  commission: { type: Number, required: true },
  features: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// PRICING CONFIG
const PRICING_TIERS = {
  basic: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    commission: 15, // 15% commission
    features: [
      'Basic listing',
      'Email support',
      '5% platform fee on bookings',
      'Basic dashboard',
      '1 OTA channel (StayOwn)',
    ],
  },
  pro: {
    monthlyPrice: 999,
    yearlyPrice: 9999,
    commission: 10, // 10% commission
    features: [
      'Featured listing in search',
      'Priority support',
      '7% platform fee on bookings',
      'Analytics dashboard',
      '3 OTA channels',
      'QR check-in',
      'Basic messaging',
    ],
  },
  premium: {
    monthlyPrice: 4999,
    yearlyPrice: 49999,
    commission: 5, // 5% commission
    features: [
      'Top featured placement',
      'Dedicated support manager',
      '3% platform fee on bookings',
      'Advanced analytics & AI insights',
      'Unlimited OTA channels',
      'QR check-in + digital key',
      'Unlimited messaging',
      'Review management',
      'Maintenance tracking',
      'API access',
      'White-label option',
    ],
  },
};

const SponsoredPricing = {
  dailyBudgetMin: 100,
  dailyBudgetMax: 10000,
  costPerClick: 2,
  costPerImpression: 0.1,
  bookingCommission: 5, // Extra 5% on sponsored bookings
};

const HotelSubscription = mongoose.model('HotelSubscription', HotelSubscriptionSchema);
const SponsoredListing = mongoose.model('SponsoredListing', SponsoredListingSchema);
const PricingTier = mongoose.model('PricingTier', PricingTierSchema);

// ENDPOINTS
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rez-hotel-pricing-service', port: config.port });
});

/** GET /api/pricing - Get pricing tiers */
app.get('/api/pricing', (_req, res) => {
  res.json({
    success: true,
    data: {
      tiers: PRICING_TIERS,
      sponsored: SponsoredPricing,
    },
  });
});

/** GET /api/subscription/:hotelId - Get hotel's subscription */
app.get('/api/subscription/:hotelId', async (req: res, next) => {
  try {
    const subscription = await HotelSubscription.findOne({ hotelId: req.params.hotelId });
    res.json({ success: true, data: { subscription, tiers: PRICING_TIERS } });
  } catch (error) { next(error); }
});

/** POST /api/subscription - Create/update subscription */
app.post('/api/subscription', async (req: res, next) => {
  try {
    const data = TierSchema.parse(req.body);
    const { hotelId, currentTier, upgradeTo, duration, promoCode } = data;

    const targetTier = upgradeTo || currentTier;
    const tierConfig = PRICING_TIERS[targetTier];
    const price = duration === 'yearly' ? tierConfig.yearlyPrice : tierConfig.monthlyPrice;

    // Apply promo code discount (placeholder)
    let finalPrice = price;
    if (promoCode) {
      // In production: check promo code validity
      finalPrice = price * 0.9; // 10% off for demo
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    if (duration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const subscription = await HotelSubscription.findOneAndUpdate(
      { hotelId },
      {
        hotelId,
        tier: targetTier,
        status: finalPrice === 0 ? 'basic' : 'active',
        startDate,
        endDate,
        features: tierConfig.features,
        $push: {
          paymentHistory: {
            id: uuidv4(),
            amount: finalPrice,
            currency: 'INR',
            status: finalPrice === 0 ? 'free' : 'pending',
            paidAt: finalPrice === 0 ? new Date() : null,
          },
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        subscription,
        price: finalPrice,
        originalPrice: price,
        discount: price - finalPrice,
        tierConfig,
      },
    });
  } catch (error) { next(error); }
});

/** GET /api/sponsored - Get sponsored listings */
app.get('/api/sponsored', async (req: res, next) => {
  try {
    const { city, category, active = 'true' } = req.query;
    const query: any = { status: active === 'true' ? 'active' : { $ne: null } };

    if (city) query.sponsoredCities = city;
    if (category) query.sponsoredCategories = category;

    const listings = await SponsoredListing.find(query)
      .sort({ dailyBudget: -1, createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: { listings } });
  } catch (error) { next(error); }
});

/** POST /api/sponsored - Create sponsored listing */
app.post('/api/sponsored', async (req: res, next) => {
  try {
    const data = SponsorSchema.parse(req.body);

    const listing = await SponsoredListing.findOneAndUpdate(
      { hotelId: data.hotelId, status: 'active' },
      {
        hotelId: data.hotelId,
        tier: data.tier,
        sponsoredCategories: data.sponsoredCategories,
        sponsoredCities: data.sponsoredCities,
        sponsoredKeywords: data.sponsoredKeywords,
        dailyBudget: data.dailyBudget,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'active',
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { listing } });
  } catch (error) { next(error); }
});

/** GET /api/sponsored/analytics/:hotelId - Sponsored listing analytics */
app.get('/api/sponsored/analytics/:hotelId', async (req: res, next) => {
  try {
    const listing = await SponsoredListing.findOne({ hotelId: req.params.hotelId });
    if (!listing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const ctr = listing.impressions > 0 ? (listing.clicks / listing.impressions) * 100 : 0;
    const conversionRate = listing.clicks > 0 ? (listing.bookings / listing.clicks) * 100 : 0;
    const cpc = listing.clicks > 0 ? listing.totalSpent / listing.clicks : 0;

    res.json({
      success: true,
      data: {
        impressions: listing.impressions,
        clicks: listing.clicks,
        bookings: listing.bookings,
        revenue: listing.revenue,
        totalSpent: listing.totalSpent,
        ctr: ctr.toFixed(2) + '%',
        conversionRate: conversionRate.toFixed(2) + '%',
        cpc: '₹' + cpc.toFixed(2),
        roi: listing.revenue > 0 ? ((listing.revenue * 0.05 - listing.totalSpent) / listing.totalSpent * 100).toFixed(2) + '%' : '0%',
      },
    });
  } catch (error) { next(error); }
});

/** POST /api/sponsored/:hotelId/track - Track impression/click */
app.post('/api/sponsored/:hotelId/track', async (req: res, next) => {
  try {
    const { type, value = 1 } = req.body; // type: 'impression', 'click', 'booking', 'revenue'
    const update: any = {};

    if (type === 'impression') update.impressions = value;
    if (type === 'click') update.clicks = value;
    if (type === 'booking') update.bookings = value;
    if (type === 'revenue') {
      update.revenue = value;
      update.totalSpent = value * (SponsoredPricing.bookingCommission / 100);
    }

    await SponsoredListing.findOneAndUpdate(
      { hotelId: req.params.hotelId, status: 'active' },
      { $inc: update }
    );

    res.json({ success: true });
  } catch (error) { next(error); }
});

/** POST /api/commission/calculate - Calculate commission */
app.post('/api/commission/calculate', async (req: res, next) => {
  try {
    const { hotelId, bookingAmount } = req.body;

    const subscription = await HotelSubscription.findOne({ hotelId });
    const tier = subscription?.tier || 'basic';
    const tierConfig = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];

    const platformFee = bookingAmount * (tierConfig.commission / 100);
    const hotelEarnings = bookingAmount - platformFee;

    res.json({
      success: true,
      data: {
        bookingAmount,
        platformFee,
        platformFeePercent: tierConfig.commission,
        hotelEarnings,
        tier,
      },
    });
  } catch (error) { next(error); }
});

// ERROR HANDLER
app.use((err: any, _req: Request, res: Response, _next: any) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: err.errors } });
  }
  logger.error(err);
  res.status(500).json({ success: false, error: { code: 'ERROR', message: err.message } });
});

async function start() {
  await mongoose.connect(config.mongoUrl);

  // Initialize default pricing tiers
  for (const [tier, config] of Object.entries(PRICING_TIERS)) {
    await PricingTier.findOneAndUpdate(
      { tier },
      { tier, ...config as any, isActive: true },
      { upsert: true }
    );
  }

  logger.info('Connected to MongoDB');
  app.listen(config.port, () => {
    logger.info(`\n╔══════════════════════════════════════════╗
║  REZ Hotel Pricing Service - Port ${config.port}   ║
╠══════════════════════════════════════════╣
║  Basic: Free (15% commission)         ║
║  Pro: ₹999/mo (10% commission)       ║
║  Premium: ₹4999/mo (5% commission)   ║
╚══════════════════════════════════════════╝\n`);
  });
}

start().catch(console.error);
