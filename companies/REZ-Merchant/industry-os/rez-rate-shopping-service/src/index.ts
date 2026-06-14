/**
 * REZ Rate Shopping Service
 * Port: 4033
 *
 * Competitor Rate Monitoring & Yield Management
 * - Scrape competitor rates
 * - Price parity alerts
 * - Demand indicators
 * - AI-driven rate recommendations
 */

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: { code: 'RATE_LIMITED' } },
});
app.use('/api/', limiter);

const config = {
  port: parseInt(process.env.PORT || '4033'),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/rez_rate_shopping',
};

// ENUMS
const Channel = {
  BOOKING_COM: 'booking_com',
  MAKEMYTRIP: 'makemytrip',
  GOIBIBO: 'goibibo',
  OYO: 'oyo',
  FABHOTELS: 'fabhotels',
  TREEBO: 'treebo',
  AGODA: 'agoda',
} as const;

const RateStatus = {
  BELOW_MARKET: 'below_market',
  AT_MARKET: 'at_market',
  ABOVE_MARKET: 'above_market',
  NO_DATA: 'no_data',
} as const;

const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

// SCHEMAS
const CompetitorSchema = z.object({
  hotelId: z.string(),
  name: z.string(),
  channel: z.enum(Object.values(Channel)),
  url: z.string().url(),
  propertyId: z.string().optional(), // ID on that channel
  roomTypes: z.array(z.object({
    name: z.string(),
    competitorRoomId: z.string(),
    ourRoomTypeId: z.string().optional(),
  })).optional(),
  isActive: z.boolean().default(true),
  scrapeFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
});

const RateDataInputSchema = z.object({
  competitorId: z.string(),
  roomTypeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  rate: z.number(),
  currency: z.string().default('INR'),
  availability: z.number(),
  restrictions: z.object({
    minStay: z.number().optional(),
    closedToArrival: z.boolean().optional(),
    closedToDeparture: z.boolean().optional(),
  }).optional(),
  scrapedAt: z.date(),
});

const RecommendationInputSchema = z.object({
  hotelId: z.string(),
  roomTypeId: z.string(),
  date: z.string(),
  recommendedRate: z.number(),
  currentRate: z.number(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
  action: z.enum(['increase', 'decrease', 'maintain']),
  expectedImpact: z.object({
    occupancyChange: z.number(),
    revenueChange: z.number(),
  }),
});

// MODELS
const Competitor = mongoose.model('Competitor', new mongoose.Schema({
  hotelId: { type: String, index: true },
  name: String,
  channel: { type: String, enum: Object.values(Channel) },
  url: String,
  propertyId: String,
  roomTypes: [{
    name: String,
    competitorRoomId: String,
    ourRoomTypeId: String,
  }],
  isActive: { type: Boolean, default: true },
  scrapeFrequency: { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
  lastScrapedAt: Date,
  createdAt: { type: Date, default: Date.now },
}));

const RateDataSchema = new mongoose.Schema({
  competitorId: { type: String, index: true },
  hotelId: { type: String, index: true },
  roomTypeId: String,
  date: { type: String, index: true }, // YYYY-MM-DD
  rate: Number,
  currency: { type: String, default: 'INR' },
  availability: Number,
  restrictions: {
    minStay: Number,
    closedToArrival: Boolean,
    closedToDeparture: Boolean,
  },
  scrapedAt: Date,
}, { timestamps: true });

// Compound index for unique rate per competitor/room/date
RateDataSchema.index({ competitorId: 1, roomTypeId: 1, date: 1 }, { unique: true });

const RateData = mongoose.model('RateData', RateDataSchema);

const MarketAverage = mongoose.model('MarketAverage', new mongoose.Schema({
  hotelId: { type: String, index: true },
  roomTypeId: String,
  date: { type: String, index: true },
  avgRate: Number,
  minRate: Number,
  maxRate: Number,
  medianRate: Number,
  competitorCount: Number,
  currency: String,
  calculatedAt: Date,
}, { timestamps: true }));

const RateAlert = mongoose.model('RateAlert', new mongoose.Schema({
  hotelId: { type: String, index: true },
  roomTypeId: String,
  date: String,
  severity: { type: String, enum: Object.values(AlertSeverity) },
  type: { type: String, enum: ['parity', 'demand', 'competitor_change', 'price_war'] },
  title: String,
  message: String,
  currentRate: Number,
  marketRate: Number,
  difference: Number,
  differencePercent: Number,
  status: { type: String, enum: ['new', 'acknowledged', 'resolved'], default: 'new' },
  acknowledgedBy: String,
  acknowledgedAt: Date,
  createdAt: { type: Date, default: Date.now },
}));

const YieldRecommendation = mongoose.model('YieldRecommendation', new mongoose.Schema({
  hotelId: { type: String, index: true },
  roomTypeId: String,
  date: String,
  currentRate: Number,
  recommendedRate: Number,
  action: { type: String, enum: ['increase', 'decrease', 'maintain'] },
  confidence: Number,
  reason: String,
  expectedOccupancy: Number,
  expectedRevenue: Number,
  status: { type: String, enum: ['pending', 'applied', 'rejected', 'expired'], default: 'pending' },
  appliedAt: Date,
  appliedBy: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
}));

const ScrapingLog = mongoose.model('ScrapingLog', new mongoose.Schema({
  competitorId: String,
  hotelId: String,
  channel: String,
  status: { type: String, enum: ['success', 'partial', 'failed'] },
  ratesFound: Number,
  errorMessage: String,
  duration: Number, // ms
  scrapedAt: { type: Date, default: Date.now },
}));

// SCRAPING FUNCTIONS (Simulated for development)
async function scrapeBookingCom(url: string): Promise<any[]> {
  // In production: Use Booking.com API or proper scraping
  // For now: Return mock data
  const today = new Date();
  const rates = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    rates.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(2500 + Math.random() * 1500),
      availability: Math.floor(Math.random() * 5) + 1,
    });
  }

  return rates;
}

async function scrapeMakeMyTrip(url: string): Promise<any[]> {
  const today = new Date();
  const rates = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    rates.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(2400 + Math.random() * 1600),
      availability: Math.floor(Math.random() * 8) + 1,
    });
  }

  return rates;
}

async function scrapeGoibibo(url: string): Promise<any[]> {
  const today = new Date();
  const rates = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    rates.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(2600 + Math.random() * 1400),
      availability: Math.floor(Math.random() * 6) + 1,
    });
  }

  return rates;
}

async function scrapeOYO(url: string): Promise<any[]> {
  const today = new Date();
  const rates = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    rates.push({
      date: date.toISOString().split('T')[0],
      rate: Math.round(1800 + Math.random() * 1200),
      availability: Math.floor(Math.random() * 10) + 1,
    });
  }

  return rates;
}

const scrapers: Record<string, (url: string) => Promise<any[]>> = {
  booking_com: scrapeBookingCom,
  makemytrip: scrapeMakeMyTrip,
  goibibo: scrapeGoibibo,
  oyo: scrapeOYO,
};

// ENDPOINTS
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rate-shopping-service', port: config.port });
});

/** GET /api/info - Service info */
app.get('/api/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'REZ Rate Shopping Service',
      version: '1.0.0',
      channels: Object.keys(Channel),
      features: ['competitor_monitoring', 'price_parity', 'yield_recommendations', 'demand_indicators'],
    },
  });
});

/** GET /api/competitors/:hotelId - List competitors */
app.get('/api/competitors/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { activeOnly } = req.query;
    const query: any = { hotelId: req.params.hotelId };
    if (activeOnly === 'true') query.isActive = true;

    const competitors = await Competitor.find(query);
    res.json({ success: true, data: { competitors } });
  } catch (error) {
    next(error);
  }
});

/** POST /api/competitors - Add competitor */
app.post('/api/competitors', async (req: res, next: NextFunction) => {
  try {
    const data = CompetitorSchema.parse(req.body);

    const competitor = await Competitor.create(data);
    res.json({ success: true, data: { competitor } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', details: error.errors } });
    }
    next(error);
  }
});

/** PUT /api/competitors/:competitorId - Update competitor */
app.put('/api/competitors/:competitorId', async (req: res, next: NextFunction) => {
  try {
    const competitor = await Competitor.findByIdAndUpdate(
      req.params.competitorId,
      req.body,
      { new: true }
    );

    if (!competitor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: { competitor } });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/competitors/:competitorId - Remove competitor */
app.delete('/api/competitors/:competitorId', async (req: res, next: NextFunction) => {
  try {
    const competitor = await Competitor.findByIdAndDelete(req.params.competitorId);
    if (!competitor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, message: 'Competitor removed' });
  } catch (error) {
    next(error);
  }
});

/** POST /api/scrape/:competitorId - Scrape single competitor */
app.post('/api/scrape/:competitorId', async (req: res, next: NextFunction) => {
  try {
    const competitor = await Competitor.findById(req.params.competitorId);
    if (!competitor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    const startTime = Date.now();
    const scraper = scrapers[competitor.channel];

    if (!scraper) {
      return res.status(400).json({ success: false, error: { code: 'NO_SCRAPER' } });
    }

    try {
      const rates = await scraper(competitor.url);

      // Save rate data
      for (const rate of rates) {
        await RateData.findOneAndUpdate(
          {
            competitorId: competitor._id,
            hotelId: competitor.hotelId,
            roomTypeId: 'default',
            date: rate.date,
          },
          {
            rate: rate.rate,
            availability: rate.availability,
            currency: 'INR',
            scrapedAt: new Date(),
          },
          { upsert: true, new: true }
        );
      }

      competitor.lastScrapedAt = new Date();
      await competitor.save();

      await ScrapingLog.create({
        competitorId: competitor._id,
        hotelId: competitor.hotelId,
        channel: competitor.channel,
        status: 'success',
        ratesFound: rates.length,
        duration: Date.now() - startTime,
      });

      res.json({
        success: true,
        data: {
          competitorId: competitor._id,
          ratesScraped: rates.length,
          duration: Date.now() - startTime,
        },
      });
    } catch (scrapeError: any) {
      await ScrapingLog.create({
        competitorId: competitor._id,
        hotelId: competitor.hotelId,
        channel: competitor.channel,
        status: 'failed',
        errorMessage: scrapeError.message,
        duration: Date.now() - startTime,
      });

      throw scrapeError;
    }
  } catch (error) {
    next(error);
  }
});

/** POST /api/scrape/hotel/:hotelId - Scrape all competitors */
app.post('/api/scrape/hotel/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const competitors = await Competitor.find({
      hotelId: req.params.hotelId,
      isActive: true,
    });

    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const competitor of competitors) {
      const scraper = scrapers[competitor.channel];
      if (!scraper) continue;

      const startTime = Date.now();
      try {
        const rates = await scraper(competitor.url);

        for (const rate of rates) {
          await RateData.findOneAndUpdate(
            {
              competitorId: competitor._id,
              hotelId: competitor.hotelId,
              roomTypeId: 'default',
              date: rate.date,
            },
            {
              rate: rate.rate,
              availability: rate.availability,
              scrapedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        }

        competitor.lastScrapedAt = new Date();
        await competitor.save();

        results.push({ competitorId: competitor._id, status: 'success', rates: rates.length });
        successCount++;
      } catch (error: any) {
        results.push({ competitorId: competitor._id, status: 'failed', error: error.message });
        failCount++;
      }
    }

    res.json({
      success: true,
      data: {
        total: competitors.length,
        success: successCount,
        failed: failCount,
        results,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /api/rates/:hotelId - Get rate data */
app.get('/api/rates/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { roomTypeId, startDate, endDate, competitorId } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (competitorId) query.competitorId = competitorId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const rates = await RateData.find(query)
      .populate('competitorId', 'name channel')
      .sort({ date: 1, rate: 1 });

    res.json({ success: true, data: { rates, count: rates.length } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/market-average/:hotelId - Get market averages */
app.get('/api/market-average/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { roomTypeId, startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];

    const query: any = { hotelId: req.params.hotelId, date: { $gte: today } };
    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;

    // Get all rate data
    const rateData = await RateData.find(query);

    // Group by date and calculate averages
    const byDate: Record<string, number[]> = {};
    rateData.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r.rate);
    });

    const averages = Object.entries(byDate).map(([date, rates]) => {
      const sorted = [...rates].sort((a, b) => a - b);
      const median = rates.length % 2 === 0
        ? (sorted[rates.length / 2 - 1] + sorted[rates.length / 2]) / 2
        : sorted[Math.floor(rates.length / 2)];

      return {
        date,
        avgRate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
        minRate: Math.min(...rates),
        maxRate: Math.max(...rates),
        medianRate: Math.round(median),
        competitorCount: rates.length,
      };
    });

    res.json({ success: true, data: { averages } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/compare/:hotelId - Compare our rates vs market */
app.get('/api/compare/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { roomTypeId, startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // Get our rate (from market average)
    const marketAverages = await MarketAverage.find({
      hotelId: req.params.hotelId,
      date: { $gte: today },
      ...(roomTypeId && { roomTypeId }),
    });

    // Get competitor rates
    const competitorRates = await RateData.find({
      hotelId: req.params.hotelId,
      date: { $gte: today },
      ...(roomTypeId && { roomTypeId }),
    });

    // Group by date
    const comparison = {};
    const allDates = new Set([
      ...marketAverages.map(m => m.date),
      ...competitorRates.map(r => r.date),
    ]);

    for (const date of allDates) {
      const marketData = marketAverages.filter(m => m.date === date);
      const competitorData = competitorRates.filter(r => r.date === date);

      if (marketData.length > 0 || competitorData.length > 0) {
        const rates = competitorData.map(r => r.rate);
        const avgMarketRate = rates.length > 0
          ? rates.reduce((a, b) => a + b, 0) / rates.length
          : 0;

        comparison[date] = {
          marketAvg: avgMarketRate > 0 ? Math.round(avgMarketRate) : null,
          minCompetitor: rates.length > 0 ? Math.min(...rates) : null,
          maxCompetitor: rates.length > 0 ? Math.max(...rates) : null,
          competitorCount: competitorData.length,
          ourRate: marketData[0]?.avgRate || null,
          status: marketData.length > 0
            ? (marketData[0].avgRate < avgMarketRate * 0.9 ? 'below_market'
               : marketData[0].avgRate > avgMarketRate * 1.1 ? 'above_market'
               : 'at_market')
            : 'no_data',
        };
      }
    }

    res.json({ success: true, data: { comparison } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/alerts/:hotelId - Get rate alerts */
app.get('/api/alerts/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { status, severity, limit = 50 } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await RateAlert.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: { alerts, count: alerts.length } });
  } catch (error) {
    next(error);
  }
});

/** POST /api/alerts/:alertId/acknowledge - Acknowledge alert */
app.post('/api/alerts/:alertId/acknowledge', async (req: res, next: NextFunction) => {
  try {
    const { acknowledgedBy } = req.body;

    const alert = await RateAlert.findByIdAndUpdate(
      req.params.alertId,
      {
        status: 'acknowledged',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    res.json({ success: true, data: { alert } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/recommendations/:hotelId - Get yield recommendations */
app.get('/api/recommendations/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { roomTypeId, status, startDate } = req.query;
    const query: any = { hotelId: req.params.hotelId };

    if (roomTypeId) query.roomTypeId = roomTypeId;
    if (status) query.status = status;
    if (startDate) query.date = { $gte: startDate };
    query.status = 'pending';
    query.expiresAt = { $gt: new Date() };

    const recommendations = await YieldRecommendation.find(query)
      .sort({ date: 1, confidence: -1 });

    res.json({ success: true, data: { recommendations } });
  } catch (error) {
    next(error);
  }
});

/** POST /api/recommendations/generate - Generate yield recommendations */
app.post('/api/recommendations/generate', async (req: res, next: NextFunction) => {
  try {
    const { hotelId, roomTypeId } = req.body;
    const today = new Date();
    const recommendations = [];

    // Get competitor data for next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Get market rates
      const marketRates = await RateData.find({
        hotelId,
        roomTypeId: roomTypeId || 'default',
        date: dateStr,
      });

      if (marketRates.length === 0) continue;

      const avgRate = marketRates.reduce((sum, r) => sum + r.rate, 0) / marketRates.length;
      const availability = marketRates.reduce((sum, r) => sum + r.availability, 0);

      // Simple yield logic
      let recommendedRate = avgRate;
      let action = 'maintain';
      let reason = 'Market average rate';

      if (availability < 3) {
        // Low availability = demand is high
        recommendedRate = avgRate * 1.15;
        action = 'increase';
        reason = 'Low availability - high demand';
      } else if (availability > 8) {
        // High availability = demand is low
        recommendedRate = avgRate * 0.95;
        action = 'decrease';
        reason = 'High availability - increase occupancy';
      }

      // Check day of week
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        recommendedRate *= 1.1;
        reason += ' (weekend premium)';
      }

      recommendedRate = Math.round(recommendedRate);

      recommendations.push({
        hotelId,
        roomTypeId: roomTypeId || 'default',
        date: dateStr,
        currentRate: avgRate,
        recommendedRate,
        action,
        confidence: 0.75,
        reason,
        expectedOccupancy: availability < 5 ? 85 : availability < 8 ? 70 : 55,
        expectedRevenue: recommendedRate * (availability < 5 ? 0.85 : availability < 8 ? 0.70 : 0.55),
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    }

    if (recommendations.length > 0) {
      await YieldRecommendation.insertMany(recommendations);
    }

    res.json({
      success: true,
      data: {
        generated: recommendations.length,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** POST /api/recommendations/:recommendationId/apply - Apply recommendation */
app.post('/api/recommendations/:recommendationId/apply', async (req: res, next: NextFunction) => {
  try {
    const { appliedBy } = req.body;

    const recommendation = await YieldRecommendation.findByIdAndUpdate(
      req.params.recommendationId,
      {
        status: 'applied',
        appliedAt: new Date(),
        appliedBy,
      },
      { new: true }
    );

    if (!recommendation) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } });
    }

    // In production: Update rate in inventory service
    // await updateRate(recommendation.hotelId, recommendation.roomTypeId, recommendation.date, recommendation.recommendedRate);

    res.json({ success: true, data: { recommendation } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/demand/:hotelId - Get demand indicators */
app.get('/api/demand/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date().toISOString().split('T')[0];

    // Get availability trends
    const rates = await RateData.find({
      hotelId: req.params.hotelId,
      date: { $gte: startDate || today, $lte: endDate || today },
    });

    // Group by date
    const byDate: Record<string, number[]> = {};
    rates.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r.availability);
    });

    const trends = Object.entries(byDate).map(([date, availabilities]) => {
      const avg = availabilities.reduce((a, b) => a + b, 0) / availabilities.length;
      return {
        date,
        avgAvailability: Math.round(avg * 10) / 10,
        demand: avg < 3 ? 'high' : avg < 6 ? 'medium' : 'low',
      };
    });

    res.json({ success: true, data: { trends } });
  } catch (error) {
    next(error);
  }
});

/** GET /api/stats/:hotelId - Rate shopping stats */
app.get('/api/stats/:hotelId', async (req: res, next: NextFunction) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();

    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);

    const competitors = await Competitor.countDocuments({ hotelId: req.params.hotelId, isActive: true });

    const scrapingLogs = await ScrapingLog.aggregate([
      { $match: { hotelId: req.params.hotelId, scrapedAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
        },
      },
    ]);

    const rateCount = await RateData.countDocuments({
      hotelId: req.params.hotelId,
      scrapedAt: { $gte: startDate },
    });

    const alertCount = await RateAlert.countDocuments({
      hotelId: req.params.hotelId,
      status: 'new',
    });

    res.json({
      success: true,
      data: {
        period,
        competitors: {
          total: competitors,
        },
        scraping: {
          totalScrapes: scrapingLogs.reduce((sum, l) => sum + l.count, 0),
          successRate: scrapingLogs.length > 0
            ? ((scrapingLogs.find(l => l._id === 'success')?.count || 0) / scrapingLogs.reduce((sum, l) => sum + l.count, 0) * 100).toFixed(1) + '%'
            : '0%',
          avgDuration: Math.round(scrapingLogs.reduce((sum, l) => sum + l.avgDuration * l.count, 0) / scrapingLogs.reduce((sum, l) => sum + l.count, 0)) + 'ms',
        },
        rateData: {
          totalRates: rateCount,
        },
        alerts: {
          new: alertCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// CRON JOBS

// Scrape all competitors daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const competitors = await Competitor.find({ isActive: true, scrapeFrequency: 'daily' });
    console.log(`[Cron] Rate Shopping: Scraping ${competitors.length} competitors`);

    for (const competitor of competitors) {
      const scraper = scrapers[competitor.channel];
      if (!scraper) continue;

      try {
        const rates = await scraper(competitor.url);

        for (const rate of rates) {
          await RateData.findOneAndUpdate(
            {
              competitorId: competitor._id,
              hotelId: competitor.hotelId,
              roomTypeId: 'default',
              date: rate.date,
            },
            {
              rate: rate.rate,
              availability: rate.availability,
              scrapedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        }

        competitor.lastScrapedAt = new Date();
        await competitor.save();
      } catch (error) {
        console.error(`[Cron] Failed to scrape ${competitor.name}:`, error);
      }
    }
  } catch (error) {
    console.error('[Cron] Rate shopping error:', error);
  }
});

// Generate alerts for price parity issues
cron.schedule('0 6 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all rate data from last 24 hours
    const recentRates = await RateData.find({
      scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    // Group by hotel and date
    const byHotelDate: Record<string, any[]> = {};
    recentRates.forEach(r => {
      const key = `${r.hotelId}:${r.date}`;
      if (!byHotelDate[key]) byHotelDate[key] = [];
      byHotelDate[key].push(r);
    });

    for (const [key, rates] of Object.entries(byHotelDate)) {
      const [hotelId, date] = key.split(':');
      const avgRate = rates.reduce((sum, r) => sum + r.rate, 0) / rates.length;
      const minRate = Math.min(...rates.map(r => r.rate));

      // Alert if min rate is significantly below average (potential price war)
      if (minRate < avgRate * 0.8) {
        const competitor = rates.find(r => r.rate === minRate);

        await RateAlert.create({
          hotelId,
          roomTypeId: 'default',
          date,
          severity: 'warning',
          type: 'price_war',
          title: 'Price Parity Alert',
          message: `Minimum competitor rate is ${Math.round((1 - minRate / avgRate) * 100)}% below market average`,
          currentRate: avgRate,
          marketRate: minRate,
          difference: avgRate - minRate,
          differencePercent: Math.round((1 - minRate / avgRate) * 100),
        });
      }
    }
  } catch (error) {
    console.error('[Cron] Alert generation error:', error);
  }
});

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[RateShopping Error]', err);

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', details: err.errors },
    });
  }

  res.status(500).json({
    success: false,
    error: { code: 'ERROR', message: err.message },
  });
});

async function start() {
  try {
    await mongoose.connect(config.mongoUrl);
    console.log(`\n📊 REZ Rate Shopping Service - Port ${config.port}`);
    console.log(`   MongoDB: ${config.mongoUrl}`);
    console.log(`   Channels: ${Object.keys(Channel).join(', ')}\n`);

    app.listen(config.port, () => {
      console.log(`✅ Rate Shopping Service running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start:', error);
    process.exit(1);
  }
}

start().catch(console.error);
