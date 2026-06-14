/**
 * Creator Commerce Network Service
 *
 * Influencer attribution and monetization for AdBazaar.
 * Connects creators to commerce outcomes.
 *
 * Features:
 * - Creator profiles and metrics
 * - Creator-commerce attribution
 * - Creator wallet integration
 * - Creator coins/earnings
 * - Analytics dashboard
 *
 * Port: 4630
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface Creator {
  id: string;
  name: string;
  handle: string;
  platform: 'instagram' | 'youtube' | 'twitter' | 'whatsapp' | 'tiktok';
  followers: number;
  engagement: number;
  category: string;
  niche: string[];
  verified: boolean;
  walletBalance: number;
  coinsEarned: number;
  createdAt: Date;
}

interface CreatorCampaign {
  id: string;
  creatorId: string;
  advertiserId: string;
  merchantId?: string;
  name: string;
  type: 'affiliate' | 'sponsored' | 'commission' | 'coins';
  commission: {
    type: 'percentage' | 'fixed' | 'coins';
    value: number;
  };
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  stats: CreatorCampaignStats;
}

interface CreatorCampaignStats {
  impressions: number;
  clicks: number;
  scans: number;
  visits: number;
  conversions: number;
  revenue: number;
  creatorEarnings: number;
}

interface CreatorEarning {
  id: string;
  creatorId: string;
  campaignId: string;
  type: 'commission' | 'coins' | 'bonus';
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: Date;
}

interface AttributionLink {
  id: string;
  creatorId: string;
  campaignId: string;
  code: string;
  url: string;
  clicks: number;
  conversions: number;
  revenue: number;
  active: boolean;
}

interface CreatorAnalytics {
  creatorId: string;
  period: { start: Date; end: Date };
  metrics: {
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    totalEarnings: number;
    conversionRate: number;
    ctr: number;
    cpc: number;
    cpm: number;
  };
  topCampaigns: Array<{
    campaignId: string;
    name: string;
    revenue: number;
    conversions: number;
  }>;
  dailyTrend: Array<{
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  }>;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const creators: Creator[] = [
  {
    id: 'cr_001',
    name: 'Priya Sharma',
    handle: '@priyaeats',
    platform: 'instagram',
    followers: 250000,
    engagement: 4.5,
    category: 'food',
    niche: ['restaurants', 'delivery', 'street food'],
    verified: true,
    walletBalance: 12500,
    coinsEarned: 5000,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: 'cr_002',
    name: 'Rahul Mehta',
    handle: '@techwithrahul',
    platform: 'youtube',
    followers: 500000,
    engagement: 6.2,
    category: 'tech',
    niche: ['gadgets', 'reviews', 'deals'],
    verified: true,
    walletBalance: 45000,
    coinsEarned: 12000,
    createdAt: new Date('2023-06-20'),
  },
  {
    id: 'cr_003',
    name: 'Ananya Singh',
    handle: '@fashionista_ananya',
    platform: 'instagram',
    followers: 180000,
    engagement: 5.8,
    category: 'fashion',
    niche: ['trends', 'budget fashion', 'styling'],
    verified: false,
    walletBalance: 8500,
    coinsEarned: 3500,
    createdAt: new Date('2024-03-10'),
  },
];

const campaigns: CreatorCampaign[] = [
  {
    id: 'cc_001',
    creatorId: 'cr_001',
    advertiserId: 'adv_001',
    merchantId: 'merch_001',
    name: 'Pizza Palace Launch',
    type: 'affiliate',
    commission: { type: 'percentage', value: 15 },
    budget: 50000,
    spent: 12500,
    status: 'active',
    startDate: new Date('2026-05-20'),
    endDate: new Date('2026-06-20'),
    stats: {
      impressions: 85000,
      clicks: 3400,
      scans: 850,
      visits: 280,
      conversions: 42,
      revenue: 21000,
      creatorEarnings: 3150,
    },
  },
  {
    id: 'cc_002',
    creatorId: 'cr_002',
    advertiserId: 'adv_002',
    name: 'Gadget Review Series',
    type: 'sponsored',
    commission: { type: 'fixed', value: 25000 },
    budget: 100000,
    spent: 100000,
    status: 'completed',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-04-30'),
    stats: {
      impressions: 250000,
      clicks: 12500,
      scans: 0,
      visits: 3500,
      conversions: 180,
      revenue: 90000,
      creatorEarnings: 25000,
    },
  },
];

const attributionLinks: AttributionLink[] = [
  { id: 'link_001', creatorId: 'cr_001', campaignId: 'cc_001', code: 'PRIYAFOOD15', url: 'https://rez.now/pizza-palace?ref=priyaeats', clicks: 1200, conversions: 15, revenue: 7500, active: true },
  { id: 'link_002', creatorId: 'cr_002', campaignId: 'cc_002', code: 'TECHRAHUL', url: 'https://rez.now/gadget-store?ref=techwithrahul', clicks: 5000, conversions: 85, revenue: 42500, active: true },
];

const earnings: CreatorEarning[] = [
  { id: 'earn_001', creatorId: 'cr_001', campaignId: 'cc_001', type: 'commission', amount: 3150, status: 'approved', createdAt: new Date('2026-05-25') },
  { id: 'earn_002', creatorId: 'cr_002', campaignId: 'cc_002', type: 'commission', amount: 25000, status: 'paid', createdAt: new Date('2026-05-01') },
  { id: 'earn_003', creatorId: 'cr_001', campaignId: 'cc_001', type: 'bonus', amount: 500, status: 'pending', createdAt: new Date('2026-05-27') },
];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4630', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================================
// ROUTES
// ============================================================================

// Health
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'creator-commerce',
    version: '1.0.0',
    creators: creators.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
  });
});

// ============================================================================
// CREATOR MANAGEMENT
// ============================================================================

// List creators
app.get('/api/creators', (req: Request, res: Response) => {
  const { platform, category, verified, minFollowers } = req.query;

  let filtered = [...creators];

  if (platform) filtered = filtered.filter(c => c.platform === platform);
  if (category) filtered = filtered.filter(c => c.category === category);
  if (verified !== undefined) filtered = filtered.filter(c => c.verified === (verified === 'true'));
  if (minFollowers) filtered = filtered.filter(c => c.followers >= Number(minFollowers));

  // Sort by engagement
  filtered.sort((a, b) => b.engagement - a.engagement);

  res.json({
    success: true,
    data: {
      creators: filtered,
      summary: {
        total: filtered.length,
        totalFollowers: filtered.reduce((sum, c) => sum + c.followers, 0),
        avgEngagement: filtered.reduce((sum, c) => sum + c.engagement, 0) / filtered.length,
      },
    },
  });
});

// Get creator
app.get('/api/creators/:id', (req: Request, res: Response) => {
  const creator = creators.find(c => c.id === req.params.id);

  if (!creator) {
    return res.status(404).json({ success: false, error: 'Creator not found' });
  }

  res.json({ success: true, data: creator });
});

// Create creator profile
app.post('/api/creators', (req: Request, res: Response) => {
  const { name, handle, platform, followers, category, niche } = req.body;

  if (!name || !handle || !platform) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const creator: Creator = {
    id: `cr_${Date.now()}`,
    name,
    handle,
    platform,
    followers: followers || 0,
    engagement: 0,
    category: category || 'general',
    niche: niche || [],
    verified: false,
    walletBalance: 0,
    coinsEarned: 0,
    createdAt: new Date(),
  };

  creators.push(creator);

  res.json({ success: true, data: creator });
});

// Update creator
app.patch('/api/creators/:id', (req: Request, res: Response) => {
  const creator = creators.find(c => c.id === req.params.id);

  if (!creator) {
    return res.status(404).json({ success: false, error: 'Creator not found' });
  }

  Object.assign(creator, req.body);

  res.json({ success: true, data: creator });
});

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, creatorId, advertiserId } = req.query;

  let filtered = [...campaigns];

  if (status) filtered = filtered.filter(c => c.status === status);
  if (creatorId) filtered = filtered.filter(c => c.creatorId === creatorId);
  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);

  res.json({
    success: true,
    data: {
      campaigns: filtered,
      summary: {
        total: filtered.length,
        active: filtered.filter(c => c.status === 'active').length,
        totalBudget: filtered.reduce((sum, c) => sum + c.budget, 0),
        totalSpent: filtered.reduce((sum, c) => sum + c.spent, 0),
      },
    },
  });
});

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { creatorId, advertiserId, merchantId, name, type, commission, budget, startDate, endDate } = req.body;

  if (!creatorId || !advertiserId || !name || !budget) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign: CreatorCampaign = {
    id: `cc_${Date.now()}`,
    creatorId,
    advertiserId,
    merchantId,
    name,
    type: type || 'affiliate',
    commission: commission || { type: 'percentage', value: 10 },
    budget,
    spent: 0,
    status: 'draft',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    stats: {
      impressions: 0, clicks: 0, scans: 0, visits: 0, conversions: 0, revenue: 0, creatorEarnings: 0,
    },
  };

  campaigns.push(campaign);

  res.json({ success: true, data: campaign });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  res.json({ success: true, data: campaign });
});

// Update campaign status
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  campaign.status = req.body.status;

  res.json({ success: true, data: campaign });
});

// ============================================================================
// ATTRIBUTION LINKS
// ============================================================================

// Create attribution link
app.post('/api/links', (req: Request, res: Response) => {
  const { creatorId, campaignId, code } = req.body;

  if (!creatorId || !campaignId) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const link: AttributionLink = {
    id: `link_${Date.now()}`,
    creatorId,
    campaignId,
    code: code || `REF${Math.random().toString(36).substring(7).toUpperCase()}`,
    url: `https://rez.now/merchant?ref=${creatorId}`,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    active: true,
  };

  attributionLinks.push(link);

  res.json({ success: true, data: link });
});

// Track click
app.post('/api/links/:id/click', (req: Request, res: Response) => {
  const { userId } = req.body;

  const link = attributionLinks.find(l => l.id === req.params.id);

  if (!link) {
    return res.status(404).json({ success: false, error: 'Link not found' });
  }

  link.clicks++;

  res.json({ success: true, data: { linkId: link.id, clicks: link.clicks } });
});

// Track conversion
app.post('/api/links/:id/conversion', (req: Request, res: Response) => {
  const { userId, orderId, revenue } = req.body;

  const link = attributionLinks.find(l => l.id === req.params.id);

  if (!link) {
    return res.status(404).json({ success: false, error: 'Link not found' });
  }

  link.conversions++;
  link.revenue += revenue || 0;

  // Update campaign
  const campaign = campaigns.find(c => c.id === link.campaignId);
  if (campaign) {
    campaign.stats.conversions++;
    campaign.stats.revenue += revenue || 0;

    // Calculate creator earnings
    if (campaign.commission.type === 'percentage') {
      campaign.stats.creatorEarnings += (revenue || 0) * (campaign.commission.value / 100);
    } else if (campaign.commission.type === 'fixed') {
      campaign.stats.creatorEarnings += campaign.commission.value;
    }
  }

  // Record earning
  const earning: CreatorEarning = {
    id: `earn_${Date.now()}`,
    creatorId: link.creatorId,
    campaignId: link.campaignId,
    type: 'commission',
    amount: campaign?.commission.type === 'percentage'
      ? (revenue || 0) * ((campaign?.commission.value || 0) / 100)
      : campaign?.commission.value || 0,
    status: 'pending',
    createdAt: new Date(),
  };

  earnings.push(earning);

  // Update creator wallet
  const creator = creators.find(c => c.id === link.creatorId);
  if (creator) {
    creator.walletBalance += earning.amount;
  }

  res.json({ success: true, data: { conversionId: earning.id, amount: earning.amount } });
});

// ============================================================================
// WALLET & EARNINGS
// ============================================================================

// Get creator wallet
app.get('/api/wallet/:creatorId', (req: Request, res: Response) => {
  const creator = creators.find(c => c.id === req.params.creatorId);

  if (!creator) {
    return res.status(404).json({ success: false, error: 'Creator not found' });
  }

  const creatorEarnings = earnings.filter(e => e.creatorId === creator.id);

  res.json({
    success: true,
    data: {
      creatorId: creator.id,
      balance: creator.walletBalance,
      coinsBalance: creator.coinsEarned,
      earnings: creatorEarnings,
      summary: {
        totalEarned: creatorEarnings.reduce((sum, e) => sum + e.amount, 0),
        pending: creatorEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        approved: creatorEarnings.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
        paid: creatorEarnings.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0),
      },
    },
  });
});

// Request payout
app.post('/api/wallet/:creatorId/payout', (req: Request, res: Response) => {
  const { amount, method } = req.body;

  const creator = creators.find(c => c.id === req.params.creatorId);

  if (!creator) {
    return res.status(404).json({ success: false, error: 'Creator not found' });
  }

  if (creator.walletBalance < amount) {
    return res.status(400).json({ success: false, error: 'Insufficient balance' });
  }

  creator.walletBalance -= amount;

  // Mark earnings as paid
  const pending = earnings.filter(e => e.creatorId === creator.id && e.status === 'approved');
  let remaining = amount;
  for (const earn of pending) {
    if (remaining >= earn.amount) {
      earn.status = 'paid';
      remaining -= earn.amount;
    }
  }

  res.json({
    success: true,
    data: {
      payoutId: `payout_${Date.now()}`,
      amount,
      method,
      remainingBalance: creator.walletBalance,
    },
  });
});

// ============================================================================
// ANALYTICS
// ============================================================================

// Get creator analytics
app.get('/api/analytics/creators/:id', (req: Request, res: Response) => {
  const creator = creators.find(c => c.id === req.params.id);

  if (!creator) {
    return res.status(404).json({ success: false, error: 'Creator not found' });
  }

  const creatorCampaigns = campaigns.filter(c => c.creatorId === creator.id);

  // Generate daily trend
  const dailyTrend = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dailyTrend.push({
      date: date.toISOString().split('T')[0],
      impressions: Math.round(1000 + Math.random() * 5000),
      clicks: Math.round(50 + Math.random() * 200),
      conversions: Math.round(5 + Math.random() * 20),
      revenue: Math.round(500 + Math.random() * 2000),
    });
  }

  const analytics: CreatorAnalytics = {
    creatorId: creator.id,
    period: { start: new Date(Date.now() - 30 * 86400000), end: new Date() },
    metrics: {
      totalImpressions: creatorCampaigns.reduce((sum, c) => sum + c.stats.impressions, 0),
      totalClicks: creatorCampaigns.reduce((sum, c) => sum + c.stats.clicks, 0),
      totalConversions: creatorCampaigns.reduce((sum, c) => sum + c.stats.conversions, 0),
      totalRevenue: creatorCampaigns.reduce((sum, c) => sum + c.stats.revenue, 0),
      totalEarnings: creator.walletBalance + creator.coinsEarned,
      conversionRate: 0,
      ctr: 0,
      cpm: 0,
      cpc: 0,
    },
    topCampaigns: creatorCampaigns
      .sort((a, b) => b.stats.revenue - a.stats.revenue)
      .slice(0, 5)
      .map(c => ({
        campaignId: c.id,
        name: c.name,
        revenue: c.stats.revenue,
        conversions: c.stats.conversions,
      })),
    dailyTrend,
  };

  // Calculate rates
  if (analytics.metrics.totalImpressions > 0) {
    analytics.metrics.ctr = analytics.metrics.totalClicks / analytics.metrics.totalImpressions;
    analytics.metrics.cpm = (analytics.metrics.totalRevenue / analytics.metrics.totalImpressions) * 1000;
  }
  if (analytics.metrics.totalClicks > 0) {
    analytics.metrics.cpc = analytics.metrics.totalRevenue / analytics.metrics.totalClicks;
  }
  if (analytics.metrics.totalClicks > 0) {
    analytics.metrics.conversionRate = analytics.metrics.totalConversions / analytics.metrics.totalClicks;
  }

  res.json({ success: true, data: analytics });
});

// Get campaign analytics
app.get('/api/analytics/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  res.json({
    success: true,
    data: {
      campaign,
      metrics: {
        ctr: campaign.stats.clicks / campaign.stats.impressions,
        conversionRate: campaign.stats.conversions / campaign.stats.clicks,
        cpa: campaign.stats.creatorEarnings / campaign.stats.conversions,
        roas: campaign.stats.revenue / campaign.spent,
      },
    },
  });
});

// ============================================================================
// DISCOVERY
// ============================================================================

// Find creators for campaign
app.post('/api/discover', (req: Request, res: Response) => {
  const { category, niche, minFollowers, platform, budget } = req.body;

  let filtered = creators.filter(c => c.followers >= (minFollowers || 1000));

  if (category) filtered = filtered.filter(c => c.category === category);
  if (niche?.length) filtered = filtered.filter(c => c.niche.some(n => niche.includes(n)));
  if (platform) filtered = filtered.filter(c => c.platform === platform);

  // Sort by engagement
  filtered.sort((a, b) => b.engagement - a.engagement);

  res.json({
    success: true,
    data: {
      creators: filtered.slice(0, 20),
      count: filtered.length,
      estimatedCost: filtered.slice(0, 5).reduce((sum, c) => sum + c.followers * 0.01, 0),
    },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║         CREATOR COMMERCE NETWORK v1.0.0             ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Creators: ${creators.length}                                            ║
║  Campaigns: ${campaigns.length}                                           ║
║  Active:   ${campaigns.filter(c => c.status === 'active').length}                                             ║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                              ║
║  ✓ Creator Profiles      ✓ Campaign Attribution            ║
║  ✓ Wallet Integration  ✓ Commission Tracking             ║
║  ✓ Analytics Dashboard  ✓ Discovery Engine                ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
