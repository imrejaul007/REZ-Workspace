/**
 * AdBazaar Analytics Service
 * Campaign analytics and performance dashboard
 */

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

// ============== SCHEMAS ==============

const campaignMetricsSchema = new mongoose.Schema({
  campaignId: { type: String, required: true, index: true },
  merchantId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },

  // Impressions & Reach
  impressions: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  uniqueReach: { type: Number, default: 0 },

  // Engagement
  clicks: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },

  // Conversions
  conversions: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  addToCart: { type: Number, default: 0 },
  checkout: { type: Number, default: 0 },
  purchase: { type: Number, default: 0 },

  // Revenue
  revenue: { type: Number, default: 0 },
  roas: { type: Number, default: 0 },
  cpa: { type: Number, default: 0 },
  cpm: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },

  // Spend
  spend: { type: Number, default: 0 },
  budget: { type: Number, default: 0 },
  budgetUsed: { type: Number, default: 0 },

  // Channel breakdown
  channels: {
    instagram: { impressions: Number, clicks: Number, conversions: Number, spend: Number },
    facebook: { impressions: Number, clicks: Number, conversions: Number, spend: Number },
    google: { impressions: Number, clicks: Number, conversions: Number, spend: Number },
    whatsapp: { impressions: Number, clicks: Number, conversions: Number, spend: Number },
    sms: { impressions: Number, clicks: Number, conversions: Number, spend: Number },
    email: { impressions: Number, clicks: Number, conversions: Number, spend: Number }
  },

  // Demographics
  demographics: {
    age: mongoose.Schema.Types.Mixed,
    gender: mongoose.Schema.Types.Mixed,
    location: mongoose.Schema.Types.Mixed
  },

  createdAt: { type: Date, default: Date.now }
});

const merchantAnalyticsSchema = new mongoose.Schema({
  merchantId: { type: String, required: true, unique: true, index: true },
  period: { start: Date, end: Date },

  // Aggregates
  totalCampaigns: { type: Number, default: 0 },
  activeCampaigns: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  totalConversions: { type: Number, default: 0 },

  // Averages
  avgRoas: { type: Number, default: 0 },
  avgCtr: { type: Number, default: 0 },
  avgConversionRate: { type: Number, default: 0 },

  // Trends
  trends: {
    revenue: [Number],
    conversions: [Number],
    roas: [Number]
  },

  // Top performers
  topChannels: [String],
  topCampaigns: [{
    campaignId: String,
    name: String,
    roas: Number
  }],

  updatedAt: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  reportId: { type: String, required: true, unique: true },
  merchantId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'], required: true },
  period: {
    start: Date,
    end: Date
  },
  metrics: [String],
  filters: mongoose.Schema.Types.Mixed,
  data: mongoose.Schema.Types.Mixed,
  schedule: {
    enabled: Boolean,
    frequency: String,
    recipients: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

// Models
const CampaignMetrics = mongoose.model('CampaignMetrics', campaignMetricsSchema);
const MerchantAnalytics = mongoose.model('MerchantAnalytics', merchantAnalyticsSchema);
const Report = mongoose.model('Report', reportSchema);

// ============== SERVICE ==============

class AdBazaarAnalyticsService {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Health
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'healthy', service: 'adbazaar-analytics' });
    });

    // ========== CAMPAIGN METRICS ==========

    // Record metrics
    this.app.post('/api/metrics', async (req: Request, res: Response) => {
      try {
        const metrics = new CampaignMetrics(req.body);
        await metrics.save();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to record metrics' });
      }
    });

    // Get campaign metrics
    this.app.get('/api/metrics/:campaignId', async (req: Request, res: Response) => {
      try {
        const { startDate, endDate } = req.query;
        const query: any = { campaignId: req.params.campaignId };

        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate as string);
          if (endDate) query.date.$lte = new Date(endDate as string);
        }

        const metrics = await CampaignMetrics.find(query)
          .sort({ date: -1 })
          .lean();
        res.json(metrics);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
      }
    });

    // ========== AGGREGATE METRICS ==========

    // Get aggregate metrics
    this.app.get('/api/aggregate/:merchantId', async (req: Request, res: Response) => {
      try {
        const { startDate, endDate, period } = req.query;
        const match: any = { merchantId: req.params.merchantId };

        if (startDate || endDate) {
          match.date = {};
          if (startDate) match.date.$gte = new Date(startDate as string);
          if (endDate) match.date.$lte = new Date(endDate as string);
        }

        const aggregate = await CampaignMetrics.aggregate([
          { $match: match },
          {
            $group: {
              _id: period === 'day' ? { $dateToString: { format: '%Y-%m-%d', date: '$date' } } : '$_id',
              totalImpressions: { $sum: '$impressions' },
              totalClicks: { $sum: '$clicks' },
              totalConversions: { $sum: '$conversions' },
              totalRevenue: { $sum: '$revenue' },
              totalSpend: { $sum: '$spend' },
              avgRoas: { $avg: '$roas' },
              avgCtr: { $avg: '$ctr' }
            }
          },
          { $sort: { _id: -1 } },
          { $limit: 30 }
        ]);

        res.json(aggregate);
      } catch (error) {
        res.status(500).json({ error: 'Failed to aggregate metrics' });
      }
    });

    // ========== MERCHANT ANALYTICS ==========

    // Get merchant dashboard
    this.app.get('/api/dashboard/:merchantId', async (req: Request, res: Response) => {
      try {
        const { days } = req.query;
        const startDate = new Date(Date.now() - (Number(days) || 30) * 24 * 60 * 60 * 1000);

        const metrics = await CampaignMetrics.find({
          merchantId: req.params.merchantId,
          date: { $gte: startDate }
        }).lean();

        // Calculate aggregates
        const totals = metrics.reduce((acc, m) => ({
          impressions: acc.impressions + m.impressions,
          clicks: acc.clicks + m.clicks,
          conversions: acc.conversions + m.conversions,
          revenue: acc.revenue + m.revenue,
          spend: acc.spend + m.spend
        }), { impressions: 0, clicks: 0, conversions: 0, revenue: 0, spend: 0 });

        res.json({
          merchantId: req.params.merchantId,
          period: `${days || 30} days`,
          totals,
          performance: {
            ctr: totals.clicks / totals.impressions * 100,
            conversionRate: totals.conversions / totals.clicks * 100,
            roas: totals.revenue / totals.spend,
            cpa: totals.spend / totals.conversions
          },
          activeCampaigns: new Set(metrics.map(m => m.campaignId)).size
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to get dashboard' });
      }
    });

    // ========== CHANNEL PERFORMANCE ==========

    // Get channel breakdown
    this.app.get('/api/channels/:merchantId', async (req: Request, res: Response) => {
      try {
        const { days } = req.query;
        const startDate = new Date(Date.now() - (Number(days) || 30) * 24 * 60 * 60 * 1000);

        const metrics = await CampaignMetrics.find({
          merchantId: req.params.merchantId,
          date: { $gte: startDate }
        }).lean();

        // Aggregate by channel
        const channels: any = {};

        for (const metric of metrics) {
          if (metric.channels) {
            for (const [channel, data] of Object.entries(metric.channels)) {
              if (!channels[channel]) {
                channels[channel] = { impressions: 0, clicks: 0, conversions: 0, spend: 0 };
              }
              const ch = data as any;
              channels[channel].impressions += ch.impressions || 0;
              channels[channel].clicks += ch.clicks || 0;
              channels[channel].conversions += ch.conversions || 0;
              channels[channel].spend += ch.spend || 0;
            }
          }
        }

        res.json(channels);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get channel breakdown' });
      }
    });

    // ========== REPORTS ==========

    // Create report
    this.app.post('/api/reports', async (req: Request, res: Response) => {
      try {
        const report = new Report({
          ...req.body,
          reportId: `report_${Date.now()}`
        });
        await report.save();
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create report' });
      }
    });

    // Get reports
    this.app.get('/api/reports/:merchantId', async (req: Request, res: Response) => {
      try {
        const reports = await Report.find({ merchantId: req.params.merchantId })
          .sort({ createdAt: -1 })
          .lean();
        res.json(reports);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
      }
    });

    // ========== COMPARISON ==========

    // Compare campaigns
    this.app.get('/api/compare/:merchantId', async (req: Request, res: Response) => {
      try {
        const { campaignIds, metric } = req.query;
        const ids = (campaignIds as string).split(',');

        const metrics = await CampaignMetrics.find({
          campaignId: { $in: ids }
        }).lean();

        // Group by campaign
        const comparison: any = {};
        for (const id of ids) {
          const campaignMetrics = metrics.filter(m => m.campaignId === id);
          const totals = campaignMetrics.reduce((acc: any, m: any) => {
            const metricKey = metric as string || 'revenue';
            return acc + (m[metricKey] || 0);
          }, 0);

          comparison[id] = totals;
        }

        res.json(comparison);
      } catch (error) {
        res.status(500).json({ error: 'Failed to compare campaigns' });
      }
    });

    // ========== TRENDS ==========

    // Get trend data
    this.app.get('/api/trends/:merchantId', async (req: Request, res: Response) => {
      try {
        const { days, metric } = req.query;
        const startDate = new Date(Date.now() - (Number(days) || 30) * 24 * 60 * 60 * 1000);
        const metricKey = metric as string || 'revenue';

        const metrics = await CampaignMetrics.find({
          merchantId: req.params.merchantId,
          date: { $gte: startDate }
        }).sort({ date: 1 }).lean();

        // Group by date
        const trends = new Map<string, number>();
        for (const m of metrics) {
          const dateKey = m.date.toISOString().split('T')[0];
          const current = trends.get(dateKey) || 0;
          trends.set(dateKey, current + ((m as any)[metricKey] || 0));
        }

        res.json(Array.from(trends.entries()).map(([date, value]) => ({ date, value })));
      } catch (error) {
        res.status(500).json({ error: 'Failed to get trends' });
      }
    });
  }

  async start(port: number = 4217): Promise<void> {
    try {
      await mongoose.connect(
        process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazaar_analytics'
      );
      logger.info('[AdBazaarAnalytics] Connected to MongoDB');

      this.app.listen(port, () => {
        logger.info(`[AdBazaarAnalytics] Service running on port ${port}`);
      });
    } catch (error) {
      logger.error('[AdBazaarAnalytics] Failed to start:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}

const service = new AdBazaarAnalyticsService();
service.start(4217);

export default service;
