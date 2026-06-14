/**
 * REZ Unified Attribution Service - Express Entry Point
 * Port: 4061
 *
 * Cross-channel attribution tracking and LTV calculation
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 4061;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ============================================
// Types
// ============================================

type AttributionModel = 'last-click' | 'first-click' | 'linear' | 'time-decay' | 'position-based';
type Channel = 'organic' | 'paid_search' | 'paid_social' | 'email' | 'affiliate' | 'referral' | 'direct' | 'social' | 'display' | 'video';

interface Conversion {
  id: string;
  userId: string;
  value: number;
  currency: string;
  timestamp: string;
  channel: Channel;
  campaignId?: string;
  touchpoints: Touchpoint[];
  attributedChannel: Channel;
  attributedPercentage: Record<Channel, number>;
}

interface Touchpoint {
  channel: Channel;
  campaignId?: string;
  timestamp: string;
  interactionType: string;
}

interface AttributionRecord {
  id: string;
  userId: string;
  conversions: Conversion[];
  firstTouchChannel: Channel;
  lastTouchChannel: Channel;
  touchpointCount: number;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

interface LTVRecord {
  userId: string;
  channel: Channel;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  firstPurchaseDate: string;
  lastPurchaseDate: string;
  ltvScore: number;
  projections: {
    ltv3m: number;
    ltv6m: number;
    ltv12m: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  spend: number;
  startDate: string;
  endDate?: string;
}

// ============================================
// In-Memory Store
// ============================================

const conversions = new Map<string, Conversion>();
const userAttributions = new Map<string, AttributionRecord>();
const userLTV = new Map<string, LTVRecord>();
const campaigns = new Map<string, Campaign>();

// ============================================
// Attribution Logic
// ============================================

function calculateAttribution(touchpoints: Touchpoint[], model: AttributionModel): { channel: Channel; percentages: Record<Channel, number> } {
  const channels = touchpoints.map(t => t.channel);

  switch (model) {
    case 'last-click':
      return {
        channel: channels[channels.length - 1] || 'direct',
        percentages: { [channels[channels.length - 1] || 'direct']: 100 }
      };

    case 'first-click':
      return {
        channel: channels[0] || 'direct',
        percentages: { [channels[0] || 'direct']: 100 }
      };

    case 'linear':
      const equalShare = 100 / channels.length;
      const linearPercentages: Record<string, number> = {};
      channels.forEach(ch => {
        linearPercentages[ch] = equalShare;
      });
      return { channel: channels[0], percentages: linearPercentages as Record<Channel, number> };

    case 'time-decay':
      const decayPercentages: Record<string, number> = {};
      let totalWeight = 0;
      channels.forEach((ch, i) => {
        const weight = Math.pow(2, i);
        totalWeight += weight;
        decayPercentages[ch] = (decayPercentages[ch] || 0) + weight;
      });
      Object.keys(decayPercentages).forEach(ch => {
        decayPercentages[ch] = (decayPercentages[ch] / totalWeight) * 100;
      });
      return { channel: channels[0], percentages: decayPercentages as Record<Channel, number> };

    case 'position-based':
      const firstWeight = 40;
      const lastWeight = 40;
      const middleWeight = 20 / Math.max(channels.length - 2, 1);
      const posPercentages: Record<string, number> = {};
      channels.forEach((ch, i) => {
        if (i === 0) {
          posPercentages[ch] = firstWeight;
        } else if (i === channels.length - 1) {
          posPercentages[ch] = lastWeight;
        } else {
          posPercentages[ch] = (posPercentages[ch] || 0) + middleWeight;
        }
      });
      return { channel: channels[0], percentages: posPercentages as Record<Channel, number> };

    default:
      return { channel: 'direct', percentages: { direct: 100 } };
  }
}

function calculateLTV(userId: string): LTVRecord {
  const userConversions = Array.from(conversions.values()).filter(c => c.userId === userId);

  if (userConversions.length === 0) {
    return {
      userId,
      channel: 'direct',
      totalRevenue: 0,
      orderCount: 0,
      avgOrderValue: 0,
      firstPurchaseDate: '',
      lastPurchaseDate: '',
      ltvScore: 0,
      projections: { ltv3m: 0, ltv6m: 0, ltv12m: 0 }
    };
  }

  const totalRevenue = userConversions.reduce((sum, c) => sum + c.value, 0);
  const orderCount = userConversions.length;
  const avgOrderValue = totalRevenue / orderCount;

  const dates = userConversions.map(c => new Date(c.timestamp)).sort((a, b) => a.getTime() - b.getTime());
  const firstPurchaseDate = dates[0].toISOString();
  const lastPurchaseDate = dates[dates.length - 1].toISOString();

  // Simple LTV calculation based on purchase frequency
  const daysSinceFirst = Math.max(1, (Date.now() - dates[0].getTime()) / (1000 * 60 * 60 * 24));
  const avgPurchaseInterval = daysSinceFirst / orderCount;

  const ltvScore = avgOrderValue * (365 / avgPurchaseInterval);

  return {
    userId,
    channel: userConversions[0].channel,
    totalRevenue,
    orderCount,
    avgOrderValue,
    firstPurchaseDate,
    lastPurchaseDate,
    ltvScore,
    projections: {
      ltv3m: ltvScore * 0.25,
      ltv6m: ltvScore * 0.5,
      ltv12m: ltvScore
    }
  };
}

// ============================================
// Health Check
// ============================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'unified-attribution',
    timestamp: new Date().toISOString(),
    stats: {
      conversions: conversions.size,
      users: userAttributions.size,
      campaigns: campaigns.size
    }
  });
});

// ============================================
// Attribution Routes
// ============================================

// Track conversion
app.post('/track', async (req: Request, res: Response) => {
  try {
    const { userId, value, currency, touchpoints } = req.body;

    if (!userId || !value) {
      return res.status(400).json({ success: false, error: 'userId and value are required' });
    }

    const model: AttributionModel = req.body.model || 'last-click';
    const attribution = calculateAttribution(touchpoints || [], model);

    const id = `conv_${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = new Date().toISOString();

    const conversion: Conversion = {
      id,
      userId,
      value,
      currency: currency || 'INR',
      timestamp,
      channel: touchpoints?.[0]?.channel || 'direct',
      campaignId: touchpoints?.[0]?.campaignId,
      touchpoints: touchpoints || [],
      attributedChannel: attribution.channel,
      attributedPercentage: attribution.percentages
    };

    conversions.set(id, conversion);

    // Update user attribution
    let userAttr = userAttributions.get(userId);
    if (!userAttr) {
      userAttr = {
        id: `attr_${userId}`,
        userId,
        conversions: [],
        firstTouchChannel: attribution.channel,
        lastTouchChannel: attribution.channel,
        touchpointCount: 0,
        totalValue: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
    }

    userAttr.conversions.push(conversion);
    userAttr.lastTouchChannel = attribution.channel;
    userAttr.touchpointCount += touchpoints?.length || 0;
    userAttr.totalValue += value;
    userAttr.updatedAt = timestamp;
    userAttributions.set(userId, userAttr);

    // Update LTV
    const ltv = calculateLTV(userId);
    userLTV.set(userId, ltv);

    // Update campaign stats
    if (conversion.campaignId && campaigns.has(conversion.campaignId)) {
      const campaign = campaigns.get(conversion.campaignId)!;
      campaign.conversions++;
      campaign.revenue += value;
    }

    res.status(201).json({
      success: true,
      data: {
        conversion,
        attribution: {
          channel: attribution.channel,
          percentages: attribution.percentages
        }
      }
    });
  } catch (error) {
    console.error('Error tracking conversion:', error);
    res.status(500).json({ success: false, error: 'Failed to track conversion' });
  }
});

// Get user attribution
app.get('/attribution/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const attribution = userAttributions.get(userId);

    if (!attribution) {
      return res.status(404).json({ success: false, error: 'Attribution not found' });
    }

    res.json({ success: true, data: attribution });
  } catch (error) {
    console.error('Error getting attribution:', error);
    res.status(500).json({ success: false, error: 'Failed to get attribution' });
  }
});

// Get campaign attribution
app.get('/attribution/campaign/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = campaigns.get(campaignId);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const campaignConversions = Array.from(conversions.values()).filter(c => c.campaignId === campaignId);

    res.json({
      success: true,
      data: {
        campaign,
        conversions: campaignConversions.length,
        totalValue: campaignConversions.reduce((sum, c) => sum + c.value, 0)
      }
    });
  } catch (error) {
    console.error('Error getting campaign attribution:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaign attribution' });
  }
});

// ============================================
// LTV Routes
// ============================================

// Get user LTV
app.get('/ltv/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    let ltv = userLTV.get(userId);

    if (!ltv) {
      ltv = calculateLTV(userId);
      userLTV.set(userId, ltv);
    }

    res.json({ success: true, data: ltv });
  } catch (error) {
    console.error('Error getting LTV:', error);
    res.status(500).json({ success: false, error: 'Failed to get LTV' });
  }
});

// Get LTV by channel
app.get('/ltv/channel/:channel', async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const channelUsers = Array.from(userLTV.values()).filter(ltv => ltv.channel === channel);

    const summary = {
      channel,
      userCount: channelUsers.length,
      totalRevenue: channelUsers.reduce((sum, u) => sum + u.totalRevenue, 0),
      avgLTV: channelUsers.length > 0 ? channelUsers.reduce((sum, u) => sum + u.ltvScore, 0) / channelUsers.length : 0,
      avgOrderValue: channelUsers.length > 0 ? channelUsers.reduce((sum, u) => sum + u.avgOrderValue, 0) / channelUsers.length : 0
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting LTV by channel:', error);
    res.status(500).json({ success: false, error: 'Failed to get LTV by channel' });
  }
});

// ============================================
// Campaign Routes
// ============================================

// Create/update campaign
app.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const { id, name, channel, spend, startDate, endDate } = req.body;

    if (!id || !name || !channel) {
      return res.status(400).json({ success: false, error: 'id, name, and channel are required' });
    }

    const campaign: Campaign = {
      id,
      name,
      channel,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      spend: spend || 0,
      startDate: startDate || new Date().toISOString(),
      endDate
    };

    campaigns.set(id, campaign);

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// Get campaign
app.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const campaign = campaigns.get(req.params.id);

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to get campaign' });
  }
});

// List campaigns
app.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const allCampaigns = Array.from(campaigns.values());
    res.json({ success: true, data: allCampaigns });
  } catch (error) {
    console.error('Error listing campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to list campaigns' });
  }
});

// ============================================
// Report Routes
// ============================================

// Attribution summary
app.get('/reports/summary', async (req: Request, res: Response) => {
  try {
    const allConversions = Array.from(conversions.values());

    const summary = {
      totalConversions: allConversions.length,
      totalRevenue: allConversions.reduce((sum, c) => sum + c.value, 0),
      avgOrderValue: allConversions.length > 0 ? allConversions.reduce((sum, c) => sum + c.value, 0) / allConversions.length : 0,
      byChannel: {} as Record<Channel, { count: number; value: number }>
    };

    Object.keys(summary.byChannel).forEach(ch => {
      summary.byChannel[ch] = { count: 0, value: 0 };
    });

    allConversions.forEach(c => {
      if (!summary.byChannel[c.attributedChannel]) {
        summary.byChannel[c.attributedChannel] = { count: 0, value: 0 };
      }
      summary.byChannel[c.attributedChannel].count++;
      summary.byChannel[c.attributedChannel].value += c.value;
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ success: false, error: 'Failed to get summary' });
  }
});

// Channel performance
app.get('/reports/channel', async (req: Request, res: Response) => {
  try {
    const allConversions = Array.from(conversions.values());
    const channelStats: Record<Channel, { conversions: number; revenue: number; users: Set<string> }> = {} as any;

    allConversions.forEach(c => {
      if (!channelStats[c.attributedChannel]) {
        channelStats[c.attributedChannel] = { conversions: 0, revenue: 0, users: new Set() };
      }
      channelStats[c.attributedChannel].conversions++;
      channelStats[c.attributedChannel].revenue += c.value;
      channelStats[c.attributedChannel].users.add(c.userId);
    });

    const result: Record<string, any> = {};
    Object.entries(channelStats).forEach(([ch, stats]) => {
      result[ch] = {
        conversions: stats.conversions,
        revenue: stats.revenue,
        uniqueUsers: stats.users.size,
        avgOrderValue: stats.revenue / stats.conversions
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting channel performance:', error);
    res.status(500).json({ success: false, error: 'Failed to get channel performance' });
  }
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] REZ Unified Attribution Service started on port ${PORT}`);
});

export default app;
