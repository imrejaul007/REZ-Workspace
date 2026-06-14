import { logger } from './logger';
/**
 * RisnaEstate - AdsBazaar Integration Service
 *
 * Connects AdsBazaar campaigns to RisnaEstate leads.
 * Enables programmatic ad targeting and conversion tracking.
 */

import express, { Request, Response } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { EventEmitter } from 'events';

const app = express();
const PORT = process.env.PORT || 4115;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Event emitter
const adEvents = new EventEmitter();

// External APIs
const ADSBazaar_API = process.env.ADSBazaar_API_URL || 'https://adsbazaar.rez.app';
const ADSBazaar_API_KEY = process.env.ADSBazaar_API_KEY || '';
const ATTRIBUTION_HUB = process.env.ATTRIBUTION_HUB_URL || 'https://attribution-hub.rez.app';

// =============================================
// CAMPAIGN BRIDGE SCHEMA
// =============================================

interface ICampaignBridge {
  campaignId: string;
  adsbazaarCampaignId: string;
  risnaPropertyIds: string[];
  targeting: {
    segments: string[];
    minBudget?: number;
    countries: string[];
    cities?: string[];
  };
  status: 'active' | 'paused' | 'completed';
  stats: {
    impressions: number;
    clicks: number;
    leads: number;
    conversions: number;
    spend: number;
    cpl: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CampaignBridgeSchema = new Schema<ICampaignBridge & Document>('CampaignBridge', {
  campaignId: { type: String, unique: true, index: true },
  adsbazaarCampaignId: String,
  risnaPropertyIds: [String],
  targeting: {
    segments: [String],
    minBudget: Number,
    countries: [String],
    cities: [String]
  },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'active' },
  stats: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    leads: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    cpl: { type: Number, default: 0 }
  }
}, { timestamps: true });

const CampaignBridge = mongoose.model<ICampaignBridge & Document>('CampaignBridge', CampaignBridgeSchema);

// =============================================
// LEAD ATTRIBUTION SCHEMA
// =============================================

interface ILeadAttribution {
  leadId: string;
  source: 'adsbazaar' | 'organic' | 'referral' | 'corpperks';
  campaignId?: string;
  adId?: string;
  creativeId?: string;
  clickId?: string;
  attributionWindow: number; // days
  attributedTo: {
    type: 'campaign' | 'influencer' | 'broker';
    id: string;
    name: string;
  };
  conversionValue?: number;
  createdAt: Date;
}

const LeadAttributionSchema = new Schema<ILeadAttribution & Document>('LeadAttribution', {
  leadId: { type: String, index: true },
  source: { type: String, enum: ['adsbazaar', 'organic', 'referral', 'corpperks'], index: true },
  campaignId: String,
  adId: String,
  creativeId: String,
  clickId: String,
  attributionWindow: { type: Number, default: 30 },
  attributedTo: {
    type: String,
    id: String,
    name: String
  },
  conversionValue: Number
}, { timestamps: true });

const LeadAttribution = mongoose.model<ILeadAttribution & Document>('LeadAttribution', LeadAttributionSchema);

// =============================================
// ADSBazaar API HELPERS
// =============================================

async function fetchAdsBazaarCampaigns(): Promise<any[]> {
  try {
    const response = await fetch(`${ADSBazaar_API}/api/campaigns`, {
      headers: { 'Authorization': `Bearer ${ADSBazaar_API_KEY}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.campaigns || [];
  } catch (error) {
    logger.error('AdsBazaar API error:', error);
    return [];
  }
}

async function getCampaignAnalytics(campaignId: string): Promise<any> {
  try {
    const response = await fetch(`${ADSBazaar_API}/api/campaigns/${campaignId}/analytics`, {
      headers: { 'Authorization': `Bearer ${ADSBazaar_API_KEY}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (error) {
    logger.error('Analytics error:', error);
    return null;
  }
}

async function createAdsBazaarCampaign(campaign: any): Promise<string | null> {
  try {
    const response = await fetch(`${ADSBazaar_API}/api/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADSBazaar_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaign)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.campaign?.id || null;
  } catch (error) {
    logger.error('Create campaign error:', error);
    return null;
  }
}

// =============================================
// TARGETING SEGMENTS
// =============================================

const TARGETING_SEGMENTS = {
  hni: {
    name: 'HNI Investors',
    criteria: { minIncome: 5000000, segments: ['hni', 'investor'] },
    adBudget: { min: 10000, currency: 'AED' }
  },
  nri: {
    name: 'NRI Professionals',
    criteria: { countries: ['AE', 'US', 'UK', 'SG'], segments: ['nri'] },
    adBudget: { min: 5000, currency: 'AED' }
  },
  corporate: {
    name: 'Corporate Employees',
    criteria: { source: 'corpperks', segments: ['corporate'] },
    adBudget: { min: 3000, currency: 'AED' }
  },
  firstTimeBuyer: {
    name: 'First Time Buyers',
    criteria: { firstTime: true, segments: ['buyer'] },
    adBudget: { min: 2000, currency: 'AED' }
  },
  investor: {
    name: 'Property Investors',
    criteria: { segments: ['investor', 'rental'] },
    adBudget: { min: 8000, currency: 'AED' }
  }
};

// =============================================
// CAMPAIGN CREATION
// =============================================

interface CreateCampaignInput {
  name: string;
  propertyIds: string[];
  segment: keyof typeof TARGETING_SEGMENTS;
  budget: number;
  startDate?: string;
  endDate?: string;
}

async function createPropertyCampaign(input: CreateCampaignInput) {
  const segment = TARGETING_SEGMENTS[input.segment];

  // Create campaign in AdsBazaar
  const adsbazaarCampaign = await createAdsBazaarCampaign({
    name: input.name,
    type: 'property',
    targeting: segment.criteria,
    budget: input.budget,
    startDate: input.startDate,
    endDate: input.endDate,
    properties: input.propertyIds,
    channel: 'facebook,instagram,google,whatsapp'
  });

  if (!adsbazaarCampaign) {
    throw new Error('Failed to create AdsBazaar campaign');
  }

  // Create bridge record
  const bridge = new CampaignBridge({
    campaignId: `campaign_${Date.now()}`,
    adsbazaarCampaignId: adsbazaarCampaign,
    risnaPropertyIds: input.propertyIds,
    targeting: {
      segments: [input.segment],
      minBudget: segment.adBudget.min,
      countries: segment.criteria.countries || []
    }
  });

  await bridge.save();

  return bridge;
}

// =============================================
// ATTRIBUTION TRACKING
// =============================================

interface AttributionData {
  leadId: string;
  clickId?: string;
  campaignId?: string;
  source: string;
  utmParams?: Record<string, string>;
}

async function trackAttribution(data: AttributionData) {
  const attribution = new LeadAttribution({
    leadId: data.leadId,
    source: data.source as any,
    campaignId: data.campaignId,
    clickId: data.clickId,
    attributedTo: data.campaignId ? {
      type: 'campaign',
      id: data.campaignId,
      name: 'Campaign'
    } : {
      type: 'organic',
      id: 'organic',
      name: 'Organic'
    }
  });

  await attribution.save();

  // Emit event for downstream processing
  adEvents.emit('lead:attributed', {
    leadId: data.leadId,
    source: data.source,
    campaignId: data.campaignId
  });

  return attribution;
}

// =============================================
// ROI CALCULATION
// =============================================

async function calculateCampaignROI(campaignId: string) {
  const bridge = await CampaignBridge.findOne({ campaignId });
  if (!bridge) return null;

  // Get fresh analytics from AdsBazaar
  const analytics = await getCampaignAnalytics(bridge.adsbazaarCampaignId);

  const { stats } = bridge;

  // Calculate ROI metrics
  const totalSpend = analytics?.spend || stats.spend;
  const conversions = analytics?.conversions || stats.conversions;

  // Assuming average property value
  const avgPropertyValue = 5000000; // 50L INR / 5M AED
  const totalRevenue = conversions * avgPropertyValue;
  const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;

  return {
    campaignId,
    spend: totalSpend,
    impressions: analytics?.impressions || stats.impressions,
    clicks: analytics?.clicks || stats.clicks,
    leads: analytics?.leads || stats.leads,
    conversions,
    cpl: analytics?.leads ? totalSpend / analytics.leads : 0,
    roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    estimatedROI: roi.toFixed(2) + '%',
    avgPropertyValue
  };
}

// =============================================
// API ROUTES
// =============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: 'risna-ads-integration',
    status: 'healthy',
    connectedToAdsBazaar: !!ADSBazaar_API_KEY
  });
});

/**
 * Create a new property campaign
 * POST /api/campaigns
 */
app.post('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const input: CreateCampaignInput = req.body;

    if (!input.name || !input.propertyIds?.length || !input.segment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const campaign = await createPropertyCampaign(input);

    adEvents.emit('campaign:created', {
      campaignId: campaign.campaignId,
      segment: input.segment,
      budget: input.budget
    });

    res.json({ success: true, campaign });
  } catch (error: any) {
    logger.error('Create campaign error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all campaigns
 * GET /api/campaigns
 */
app.get('/api/campaigns', async (req: Request, res: Response) => {
  try {
    const { status, segment } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (segment) query['targeting.segments'] = segment;

    const campaigns = await CampaignBridge.find(query)
      .sort({ createdAt: -1 });

    res.json({ campaigns, count: campaigns.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get campaign analytics
 * GET /api/campaigns/:id/analytics
 */
app.get('/api/campaigns/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roi = await calculateCampaignROI(id);

    if (!roi) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ analytics: roi });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Pause/Resume campaign
 * PATCH /api/campaigns/:id
 */
app.patch('/api/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const campaign = await CampaignBridge.findOneAndUpdate(
      { campaignId: id },
      { status },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track lead attribution
 * POST /api/attribution
 */
app.post('/api/attribution', async (req: Request, res: Response) => {
  try {
    const data: AttributionData = req.body;

    if (!data.leadId) {
      return res.status(400).json({ error: 'Lead ID required' });
    }

    const attribution = await trackAttribution(data);

    res.json({ success: true, attribution });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get attribution stats
 * GET /api/attribution/stats
 */
app.get('/api/attribution/stats', async (req: Request, res: Response) => {
  try {
    const stats = await LeadAttribution.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          avgValue: { $avg: '$conversionValue' }
        }
      }
    ]);

    const recentAttributions = await LeadAttribution.find()
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      bySource: stats,
      recent: recentAttributions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get targeting segments
 * GET /api/targeting/segments
 */
app.get('/api/targeting/segments', (req: Request, res: Response) => {
  res.json({
    segments: Object.entries(TARGETING_SEGMENTS).map(([key, value]) => ({
      id: key,
      ...value
    }))
  });
});

/**
 * Sync with AdsBazaar
 * POST /api/sync
 */
app.post('/api/sync', async (req: Request, res: Response) => {
  try {
    const campaigns = await fetchAdsBazaarCampaigns();

    // Update local records with AdsBazaar data
    for (const adCampaign of campaigns) {
      await CampaignBridge.findOneAndUpdate(
        { adsbazaarCampaignId: adCampaign.id },
        {
          'stats.impressions': adCampaign.impressions,
          'stats.clicks': adCampaign.clicks,
          'stats.spend': adCampaign.spend
        }
      );
    }

    res.json({ success: true, synced: campaigns.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =============================================
// START SERVER
// =============================================

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/risna-ads-integration');
    logger.info('✅ Connected to MongoDB');

    await CampaignBridge.createIndexes();
    await LeadAttribution.createIndexes();

    app.listen(PORT, () => {
      logger.info(`🚀 RisnaEstate Ads Integration running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start:', error);
    process.exit(1);
  }
}

start();

export default app;
