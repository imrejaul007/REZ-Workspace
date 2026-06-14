/**
 * Cross-App Orchestration Service
 *
 * Run ONE campaign across ALL REZ apps from ONE dashboard.
 *
 * Apps:
 * - ReZ App (consumer shopping)
 * - ReZ Ride (mobility)
 * - Airzy (travel)
 * - BuzzLocal (community)
 * - WhatsApp Commerce
 * - DOOH screens
 * - QR codes
 *
 * Port: 4870
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

interface App {
  id: string;
  name: string;
  icon: string;
  inventory: number;
  activeCampaigns: number;
  enabled: boolean;
}

interface ChannelConfig {
  id: string;
  appId: string;
  type: 'push' | 'in-app' | 'notification' | 'display' | 'qr' | 'email' | 'sms' | 'whatsapp';
  enabled: boolean;
  reach: number;
  cost: number;
  ctr: number;
}

interface UnifiedCampaign {
  id: string;
  name: string;
  advertiserId: string;
  goal: string;
  budget: number;
  channels: ChannelConfig[];
  targeting: TargetingConfig;
  creative: CreativeConfig;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed';
  schedule: { startDate: Date; endDate: Date };
  results: CampaignResults;
  createdAt: Date;
  updatedAt: Date;
}

interface TargetingConfig {
  demographics?: { ageMin?: number; ageMax?: number; gender?: string };
  location?: { cities?: string[]; zones?: string[] };
  behavior?: { interests?: string[]; segments?: string[] };
}

interface CreativeConfig {
  headline: string;
  description: string;
  imageUrl?: string;
  cta: string;
  variants?: CreativeConfig[];
}

interface CampaignResults {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  byChannel: Record<string, { impressions: number; clicks: number; conversions: number }>;
}

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
const PORT = parseInt(process.env.PORT || '4870', 10);

// Apps in REZ ecosystem
const apps: App[] = [
  { id: 'rez-app', name: 'ReZ App', icon: '🛒', inventory: 5000000, activeCampaigns: 12, enabled: true },
  { id: 'rez-ride', name: 'ReZ Ride', icon: '🚗', inventory: 2000000, activeCampaigns: 8, enabled: true },
  { id: 'airzy', name: 'Airzy', icon: '✈️', inventory: 500000, activeCampaigns: 4, enabled: true },
  { id: 'buzzlocal', name: 'BuzzLocal', icon: '📍', inventory: 1000000, activeCampaigns: 6, enabled: true },
  { id: 'stayown', name: 'StayOwn', icon: '🏨', inventory: 300000, activeCampaigns: 3, enabled: true },
  { id: 'corpperks', name: 'CorpPerks', icon: '💼', inventory: 800000, activeCampaigns: 5, enabled: true },
  { id: 'karma', name: 'Karma', icon: '🌱', inventory: 1200000, activeCampaigns: 7, enabled: true },
  { id: 'whatsapp', name: 'WhatsApp Commerce', icon: '💬', inventory: 3000000, activeCampaigns: 15, enabled: true },
];

const campaigns: UnifiedCampaign[] = [
  {
    id: 'uc_001',
    name: 'Pizza Palace Launch - Cross-App',
    advertiserId: 'adv_001',
    goal: 'Get 500 orders in 7 days',
    budget: 50000,
    channels: [
      { id: 'ch_001', appId: 'rez-app', type: 'push', enabled: true, reach: 5000000, cost: 15000, ctr: 4.5 },
      { id: 'ch_002', appId: 'rez-ride', type: 'in-app', enabled: true, reach: 2000000, cost: 8000, ctr: 3.2 },
      { id: 'ch_003', appId: 'whatsapp', type: 'whatsapp', enabled: true, reach: 3000000, cost: 12000, ctr: 8.5 },
      { id: 'ch_004', appId: 'buzzlocal', type: 'notification', enabled: true, reach: 1000000, cost: 5000, ctr: 5.1 },
      { id: 'ch_005', appId: 'rez-app', type: 'display', enabled: true, reach: 5000000, cost: 10000, ctr: 2.8 },
    ],
    targeting: {
      demographics: { ageMin: 18, ageMax: 45 },
      location: { cities: ['Bangalore', 'Mumbai', 'Delhi'] },
      behavior: { interests: ['food', 'restaurants', 'delivery'] },
    },
    creative: {
      headline: '🍕 Fresh Pizza, Delivered Fast!',
      description: 'Get 20% off your first order. Limited time only!',
      cta: 'Order Now',
    },
    status: 'running',
    schedule: { startDate: new Date(), endDate: new Date(Date.now() + 7 * 86400000) },
    results: {
      impressions: 850000,
      clicks: 42500,
      conversions: 425,
      revenue: 85000,
      roas: 1.7,
      byChannel: {
        'rez-app': { impressions: 350000, clicks: 17500, conversions: 175 },
        'rez-ride': { impressions: 150000, clicks: 4800, conversions: 48 },
        'whatsapp': { impressions: 250000, clicks: 21250, conversions: 212 },
        'buzzlocal': { impressions: 100000, clicks: 5100, conversions: 51 },
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'cross-app-orchestration', apps: apps.length }));

// List apps
app.get('/api/apps', (_, res) => {
  const enabled = apps.filter(a => a.enabled);
  res.json({
    success: true,
    data: {
      apps,
      totalInventory: enabled.reduce((sum, a) => sum + a.inventory, 0),
      totalReach: enabled.reduce((sum, a) => sum + a.inventory, 0),
    },
  });
});

// Get app
app.get('/api/apps/:id', (req, res) => {
  const app = apps.find(a => a.id === req.params.id);
  if (!app) return res.status(404).json({ success: false });
  res.json({ success: true, data: app });
});

// List campaigns
app.get('/api/campaigns', (req, res) => {
  const { status, advertiserId } = req.query;
  let filtered = [...campaigns];
  if (status) filtered = filtered.filter(c => c.status === status);
  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);
  res.json({ success: true, data: filtered });
});

// Create campaign
app.post('/api/campaigns', (req, res) => {
  const { name, advertiserId, goal, budget, channels, targeting, creative, schedule } = req.body;

  const campaign: UnifiedCampaign = {
    id: `uc_${Date.now()}`,
    name,
    advertiserId,
    goal,
    budget,
    channels: channels || [],
    targeting: targeting || {},
    creative: creative || { headline: '', description: '', cta: '' },
    status: 'draft',
    schedule: schedule ? { startDate: new Date(schedule.startDate), endDate: new Date(schedule.endDate) } : { startDate: new Date(), endDate: new Date() },
    results: { impressions: 0, clicks: 0, conversions: 0, revenue: 0, roas: 0, byChannel: {} },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  campaigns.push(campaign);

  res.json({ success: true, data: campaign });
});

// Get campaign
app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });
  res.json({ success: true, data: campaign });
});

// Update campaign
app.patch('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });
  Object.assign(campaign, req.body, { updatedAt: new Date() });
  res.json({ success: true, data: campaign });
});

// Update status
app.patch('/api/campaigns/:id/status', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });
  campaign.status = req.body.status;
  campaign.updatedAt = new Date();
  res.json({ success: true, data: campaign });
});

// Add channel to campaign
app.post('/api/campaigns/:id/channels', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });

  const { appId, type, enabled } = req.body;
  const app = apps.find(a => a.id === appId);
  if (!app) return res.status(400).json({ success: false, error: 'App not found' });

  const channel: ChannelConfig = {
    id: `ch_${Date.now()}`,
    appId,
    type,
    enabled: enabled ?? true,
    reach: app.inventory,
    cost: 0,
    ctr: 0,
  };

  campaign.channels.push(channel);
  campaign.updatedAt = new Date();

  res.json({ success: true, data: channel });
});

// Remove channel
app.delete('/api/campaigns/:id/channels/:channelId', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });

  const index = campaign.channels.findIndex(ch => ch.id === req.params.channelId);
  if (index === -1) return res.status(404).json({ success: false });

  campaign.channels.splice(index, 1);
  campaign.updatedAt = new Date();

  res.json({ success: true });
});

// Toggle channel
app.patch('/api/campaigns/:id/channels/:channelId/toggle', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });

  const channel = campaign.channels.find(ch => ch.id === req.params.channelId);
  if (!channel) return res.status(404).json({ success: false });

  channel.enabled = !channel.enabled;
  campaign.updatedAt = new Date();

  res.json({ success: true, data: channel });
});

// Analytics
app.get('/api/campaigns/:id/analytics', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });

  // Calculate totals
  const totalImpressions = campaign.channels.reduce((sum, ch) => {
    if (ch.enabled) sum += ch.reach;
    return sum;
  }, 0);

  const totalBudget = campaign.channels.reduce((sum, ch) => {
    if (ch.enabled) sum += ch.cost;
    return sum;
  }, 0);

  res.json({
    success: true,
    data: {
      campaign: { id: campaign.id, name: campaign.name, status: campaign.status },
      summary: {
        channels: campaign.channels.filter(ch => ch.enabled).length,
        totalReach: totalImpressions,
        totalBudget,
        spent: campaign.results.impressions > 0 ? (campaign.results.impressions / totalImpressions) * totalBudget : 0,
      },
      results: campaign.results,
      byApp: campaign.channels.reduce((acc, ch) => {
        if (ch.enabled) {
          acc[ch.appId] = {
            name: apps.find(a => a.id === ch.appId)?.name || ch.appId,
            type: ch.type,
            reach: ch.reach,
            ctr: ch.ctr,
          };
        }
        return acc;
      }, {} as Record<string, any>),
    },
  });
});

// Cross-app optimization
app.post('/api/campaigns/:id/optimize', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false });

  const recommendations = [];

  // Find best performing channel
  const bestChannel = campaign.channels.reduce((best, ch) => {
    if (ch.enabled && ch.ctr > (best?.ctr || 0)) return ch;
    return best;
  }, campaign.channels[0]);

  if (bestChannel) {
    recommendations.push({
      type: 'increase_budget',
      channelId: bestChannel.id,
      reason: `Channel ${bestChannel.appId} has highest CTR (${bestChannel.ctr}%)`,
      impact: 'high',
    });
  }

  // Find underperforming
  const lowCTR = campaign.channels.filter(ch => ch.enabled && ch.ctr < 2);
  for (const ch of lowCTR) {
    recommendations.push({
      type: 'consider_disable',
      channelId: ch.id,
      reason: `Channel ${ch.appId} has low CTR (${ch.ctr}%)`,
      impact: 'medium',
    });
  }

  res.json({
    success: true,
    data: {
      recommendations,
      currentBudget: campaign.budget,
      suggestedChanges: recommendations.filter(r => r.type === 'increase_budget').length,
    },
  });
});

// Estimate reach
app.post('/api/campaigns/estimate', (req, res) => {
  const { channelIds, targeting } = req.body;

  const selectedChannels = channelIds?.length
    ? apps.filter(a => channelIds.includes(a.id))
    : apps.filter(a => a.enabled);

  const totalReach = selectedChannels.reduce((sum, a) => sum + a.inventory, 0);

  res.json({
    success: true,
    data: {
      selectedApps: selectedChannels.map(a => a.name),
      totalReach,
      estimatedImpressions: totalReach * 3, // 3 views per user
      estimatedClicks: totalReach * 3 * 0.04, // 4% CTR
      estimatedConversions: totalReach * 3 * 0.04 * 0.05, // 5% conversion
      costEstimate: selectedChannels.length * 5000,
    },
  });
});

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════════════╗
║           CROSS-APP ORCHESTRATION v1.0.0               ║
╠══════════════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                               ║
║  Apps:      ${apps.length}                                                ║
║  Campaigns: ${campaigns.length}                                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  APPS:                                                     ║
║  • ReZ App (5M)    • ReZ Ride (2M)    • Airzy (500K)     ║
║  • BuzzLocal (1M)  • StayOwn (300K)   • WhatsApp (3M)     ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
