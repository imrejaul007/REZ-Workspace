/**
 * REZ Ads API Service
 * Port: 4950
 *
 * Ad Campaign Management & Serving
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '4950');

// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

const campaigns: any[] = [
  {
    id: 'camp_001',
    name: 'Summer Sale 2026',
    advertiserId: 'adv_001',
    status: 'active',
    budget: 100000,
    spent: 45200,
    impressions: 1250000,
    clicks: 12500,
    ctr: 1.0,
    cpc: 3.62,
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    targeting: { age: '25-45', locations: ['Mumbai', 'Delhi'], interests: ['shopping'] },
  },
  {
    id: 'camp_002',
    name: 'Hotel Booking Promo',
    advertiserId: 'adv_002',
    status: 'paused',
    budget: 50000,
    spent: 12000,
    impressions: 450000,
    clicks: 4500,
    ctr: 1.0,
    cpc: 2.67,
    startDate: '2026-06-15',
    endDate: '2026-07-15',
    targeting: { age: '18-65', locations: ['all'], interests: ['travel'] },
  },
];

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rez-ads-api', port: PORT });
});

// Get all campaigns
app.get('/api/campaigns', (req, res) => {
  const { status, advertiserId } = req.query;
  let filtered = campaigns;

  if (status) filtered = filtered.filter(c => c.status === status);
  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);

  res.json({ success: true, data: { campaigns: filtered, total: filtered.length } });
});

// Get campaign by ID
app.get('/api/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

// Create campaign
app.post('/api/campaigns', (req, res) => {
  const campaign = {
    id: `camp_${Date.now()}`,
    ...req.body,
    status: 'draft',
    spent: 0,
    impressions: 0,
    clicks: 0,
    ctr: 0,
    cpc: 0,
    createdAt: new Date().toISOString(),
  };
  campaigns.push(campaign);
  res.status(201).json({ success: true, data: campaign });
});

// Update campaign
app.patch('/api/campaigns/:id', (req, res) => {
  const idx = campaigns.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Campaign not found' });

  campaigns[idx] = { ...campaigns[idx], ...req.body };
  res.json({ success: true, data: campaigns[idx] });
});

// Ad serving - select best ad for impression
app.post('/api/serve', (req, res) => {
  const { placementId, userId, context } = req.body;

  // Simple CPM-based selection
  const activeCampaigns = campaigns.filter(c => c.status === 'active' && c.spent < c.budget);
  if (activeCampaigns.length === 0) {
    return res.json({ success: true, data: { ad: null, reason: 'No campaigns available' } });
  }

  // Select highest bidder
  const selected = activeCampaigns.reduce((best, c) =>
    (c.budget - c.spent) > (best.budget - best.spent) ? c : best
  );

  const ad = {
    campaignId: selected.id,
    campaignName: selected.name,
    creativeId: `cre_${selected.id}`,
    headline: `${selected.name} - Limited Time!`,
    cta: 'Book Now',
    destination: `https://rez.co/promo/${selected.id}`,
    cpc: selected.cpc,
  };

  res.json({ success: true, data: { ad, target: selected.targeting } });
});

// Analytics
app.get('/api/analytics/campaigns/:id', (req, res) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

  res.json({
    success: true,
    data: {
      campaignId: campaign.id,
      metrics: {
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        spent: campaign.spent,
        budget: campaign.budget,
        budgetUsed: `${((campaign.spent / campaign.budget) * 100).toFixed(1)}%`,
      },
      daily: generateDailyMetrics(campaign),
    },
  });
});

function generateDailyMetrics(campaign: any) {
  const days = Math.min(30, Math.floor((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    impressions: Math.floor(campaign.impressions / days * (0.8 + Math.random() * 0.4)),
    clicks: Math.floor(campaign.clicks / days * (0.8 + Math.random() * 0.4)),
    spent: Math.floor(campaign.spent / days * (0.8 + Math.random() * 0.4)),
  }));
}

// Start server
app.listen(PORT, () => {
  logger.info(`\n📢 REZ Ads API Service`);
  logger.info(`   Port: ${PORT}`);
  logger.info(`   Campaigns: ${campaigns.length}`);
  logger.info(`   Active: ${campaigns.filter(c => c.status === 'active').length}\n`);
});

export default app;
