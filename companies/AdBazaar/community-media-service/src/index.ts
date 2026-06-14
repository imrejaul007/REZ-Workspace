/**
 * Community Media Network Service
 *
 * Neighborhood-level targeting for AdBazaar.
 * Connect advertisers to local communities.
 *
 * Features:
 * - Community profiles
 * - Neighborhood targeting
 * - Local group targeting
 * - Community events
 *
 * Port: 4650
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface Community {
  id: string;
  name: string;
  type: 'residential' | 'commercial' | 'mixed' | 'industrial';
  city: string;
  zone: string;
  area: string;
  pincode: string;
  demographics: {
    population: number;
    avgIncome: 'low' | 'medium' | 'high';
    ageDistribution: Record<string, number>;
    dominantOccupation: string[];
  };
  venues: CommunityVenue[];
  activeGroups: string[];
  events: CommunityEvent[];
  createdAt: Date;
}

interface CommunityVenue {
  id: string;
  communityId: string;
  name: string;
  type: 'gym' | 'pool' | 'clubhouse' | 'garden' | 'playground' | 'temple' | 'market';
  capacity: number;
  available: boolean;
  rates: {
    hourly: number;
    daily: number;
  };
}

interface CommunityEvent {
  id: string;
  communityId: string;
  name: string;
  type: 'festival' | 'market' | 'sports' | 'cultural' | 'religious' | 'social';
  date: Date;
  expectedAttendees: number;
  advertiser: string;
}

interface NeighborhoodGroup {
  id: string;
  communityId: string;
  name: string;
  type: 'whatsapp' | 'telegram' | 'facebook' | 'local';
  members: number;
  interests: string[];
  active: boolean;
}

interface CommunityCampaign {
  id: string;
  advertiserId: string;
  communityId: string;
  name: string;
  type: 'venue' | 'event' | 'group' | 'digital';
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats: CommunityCampaignStats;
}

interface CommunityCampaignStats {
  impressions: number;
  engagement: number;
  conversions: number;
  revenue: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const communities: Community[] = [
  {
    id: 'comm_001',
    name: 'Koramangala Layout',
    type: 'residential',
    city: 'Bangalore',
    zone: 'Koramangala',
    area: 'Koramangala',
    pincode: '560034',
    demographics: {
      population: 50000,
      avgIncome: 'high',
      ageDistribution: { '18-25': 0.2, '25-35': 0.4, '35-50': 0.3, '50+': 0.1 },
      dominantOccupation: ['IT', 'Business', 'Healthcare'],
    },
    venues: [
      { id: 'ven_001', communityId: 'comm_001', name: 'Club House A', type: 'clubhouse', capacity: 100, available: true, rates: { hourly: 2000, daily: 15000 } },
      { id: 'ven_002', communityId: 'comm_001', name: 'Swimming Pool', type: 'pool', capacity: 50, available: true, rates: { hourly: 3000, daily: 20000 } },
      { id: 'ven_003', communityId: 'comm_001', name: 'Garden Area', type: 'garden', capacity: 500, available: true, rates: { hourly: 5000, daily: 30000 } },
    ],
    activeGroups: ['grp_001', 'grp_002'],
    events: [],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'comm_002',
    name: 'Whitefield Hub',
    type: 'commercial',
    city: 'Bangalore',
    zone: 'Whitefield',
    area: 'ITPL Road',
    pincode: '560066',
    demographics: {
      population: 80000,
      avgIncome: 'medium',
      ageDistribution: { '18-25': 0.35, '25-35': 0.45, '35-50': 0.15, '50+': 0.05 },
      dominantOccupation: ['IT', 'Finance', 'Retail'],
    },
    venues: [
      { id: 'ven_004', communityId: 'comm_002', name: 'Community Hall', type: 'clubhouse', capacity: 200, available: true, rates: { hourly: 3000, daily: 20000 } },
    ],
    activeGroups: ['grp_003'],
    events: [],
    createdAt: new Date('2024-02-15'),
  },
];

const groups: NeighborhoodGroup[] = [
  { id: 'grp_001', communityId: 'comm_001', name: 'Koramangala Parents', type: 'whatsapp', members: 450, interests: ['parenting', 'education', 'events'], active: true },
  { id: 'grp_002', communityId: 'comm_001', name: 'Koramangala Foodies', type: 'whatsapp', members: 800, interests: ['food', 'restaurants', 'delivery'], active: true },
  { id: 'grp_003', communityId: 'comm_002', name: 'Whitefield Tech', type: 'telegram', members: 1200, interests: ['tech', 'startups', 'networking'], active: true },
];

const campaigns: CommunityCampaign[] = [
  {
    id: 'ccm_001',
    advertiserId: 'adv_001',
    communityId: 'comm_001',
    name: 'Summer Camp for Kids',
    type: 'venue',
    budget: 50000,
    spent: 15000,
    status: 'active',
    stats: { impressions: 15000, engagement: 1200, conversions: 85, revenue: 42500 },
  },
];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4650', 10);

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
    service: 'community-media',
    version: '1.0.0',
    communities: communities.length,
    groups: groups.length,
  });
});

// ============================================================================
// COMMUNITY MANAGEMENT
// ============================================================================

// List communities
app.get('/api/communities', (req: Request, res: Response) => {
  const { city, zone, type, income } = req.query;

  let filtered = [...communities];

  if (city) filtered = filtered.filter(c => c.city === city);
  if (zone) filtered = filtered.filter(c => c.zone === zone);
  if (type) filtered = filtered.filter(c => c.type === type);
  if (income) filtered = filtered.filter(c => c.demographics.avgIncome === income);

  res.json({
    success: true,
    data: {
      communities: filtered.map(c => ({
        id: c.id,
        name: c.name,
        city: c.city,
        zone: c.zone,
        type: c.type,
        population: c.demographics.population,
        avgIncome: c.demographics.avgIncome,
        venueCount: c.venues.length,
        groupCount: c.activeGroups.length,
      })),
      total: filtered.length,
    },
  });
});

// Get community details
app.get('/api/communities/:id', (req: Request, res: Response) => {
  const community = communities.find(c => c.id === req.params.id);

  if (!community) {
    return res.status(404).json({ success: false, error: 'Community not found' });
  }

  res.json({ success: true, data: community });
});

// Get community venues
app.get('/api/communities/:id/venues', (req: Request, res: Response) => {
  const community = communities.find(c => c.id === req.params.id);

  if (!community) {
    return res.status(404).json({ success: false, error: 'Community not found' });
  }

  res.json({
    success: true,
    data: {
      venues: community.venues,
      summary: {
        total: community.venues.length,
        available: community.venues.filter(v => v.available).length,
      },
    },
  });
});

// ============================================================================
// NEIGHBORHOOD GROUPS
// ============================================================================

// List groups
app.get('/api/groups', (req: Request, res: Response) => {
  const { communityId, type, active } = req.query;

  let filtered = [...groups];

  if (communityId) filtered = filtered.filter(g => g.communityId === communityId);
  if (type) filtered = filtered.filter(g => g.type === type);
  if (active !== undefined) filtered = filtered.filter(g => g.active === (active === 'true'));

  // Sort by members
  filtered.sort((a, b) => b.members - a.members);

  res.json({
    success: true,
    data: {
      groups: filtered,
      total: filtered.length,
      totalMembers: filtered.reduce((sum, g) => sum + g.members, 0),
    },
  });
});

// Get group details
app.get('/api/groups/:id', (req: Request, res: Response) => {
  const group = groups.find(g => g.id === req.params.id);

  if (!group) {
    return res.status(404).json({ success: false, error: 'Group not found' });
  }

  res.json({ success: true, data: group });
});

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { communityId, status, advertiserId } = req.query;

  let filtered = [...campaigns];

  if (communityId) filtered = filtered.filter(c => c.communityId === communityId);
  if (status) filtered = filtered.filter(c => c.status === status);
  if (advertiserId) filtered = filtered.filter(c => c.advertiserId === advertiserId);

  res.json({
    success: true,
    data: {
      campaigns: filtered,
      summary: {
        total: filtered.length,
        active: filtered.filter(c => c.status === 'active').length,
        totalBudget: filtered.reduce((sum, c) => sum + c.budget, 0),
      },
    },
  });
});

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { advertiserId, communityId, name, type, budget } = req.body;

  if (!advertiserId || !communityId || !name) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign: CommunityCampaign = {
    id: `ccm_${Date.now()}`,
    advertiserId,
    communityId,
    name,
    type: type || 'digital',
    budget,
    spent: 0,
    status: 'draft',
    stats: { impressions: 0, engagement: 0, conversions: 0, revenue: 0 },
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

// Update status
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  campaign.status = req.body.status;

  res.json({ success: true, data: campaign });
});

// ============================================================================
// TARGETING
// ============================================================================

// Find communities by criteria
app.post('/api/targeting/communities', (req: Request, res: Response) => {
  const { cities, zones, income, population, occupation } = req.body;

  let filtered = [...communities];

  if (cities?.length) filtered = filtered.filter(c => cities.includes(c.city));
  if (zones?.length) filtered = filtered.filter(c => zones.includes(c.zone));
  if (income?.length) filtered = filtered.filter(c => income.includes(c.demographics.avgIncome));
  if (population) filtered = filtered.filter(c => c.demographics.population >= population);
  if (occupation?.length) {
    filtered = filtered.filter(c =>
      c.demographics.dominantOccupation.some(o => occupation.includes(o))
    );
  }

  res.json({
    success: true,
    data: {
      communities: filtered.map(c => ({
        id: c.id,
        name: c.name,
        city: c.city,
        zone: c.zone,
        population: c.demographics.population,
        avgIncome: c.demographics.avgIncome,
        reach: c.demographics.population,
      })),
      stats: {
        totalCommunities: filtered.length,
        totalPopulation: filtered.reduce((sum, c) => sum + c.demographics.population, 0),
        totalVenues: filtered.reduce((sum, c) => sum + c.venues.length, 0),
        totalGroups: filtered.reduce((sum, c) => sum + c.activeGroups.length, 0),
      },
    },
  });
});

// Estimate reach
app.post('/api/targeting/estimate', (req: Request, res: Response) => {
  const { communityIds, groupIds, budget } = req.body;

  const selectedCommunities = communities.filter(c =>
    communityIds?.includes(c.id)
  );

  const selectedGroups = groups.filter(g =>
    groupIds?.includes(g.id)
  );

  const reach = selectedCommunities.reduce((sum, c) => sum + c.demographics.population, 0);
  const groupMembers = selectedGroups.reduce((sum, g) => sum + g.members, 0);

  res.json({
    success: true,
    data: {
      reach,
      groupReach: groupMembers,
      totalReach: reach + groupMembers,
      estimatedImpressions: (reach + groupMembers) * 3,
      estimatedCost: budget || Math.round(reach * 0.5),
      cpm: 50,
    },
  });
});

// ============================================================================
// ANALYTICS
// ============================================================================

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
        cpm: campaign.stats.impressions > 0 ? (campaign.stats.revenue / campaign.stats.impressions) * 1000 : 0,
        engagementRate: campaign.stats.impressions > 0 ? (campaign.stats.engagement / campaign.stats.impressions) * 100 : 0,
        conversionRate: campaign.stats.engagement > 0 ? (campaign.stats.conversions / campaign.stats.engagement) * 100 : 0,
        roi: campaign.spent > 0 ? (campaign.stats.revenue - campaign.spent) / campaign.spent * 100 : 0,
      },
    },
  });
});

// Get community analytics
app.get('/api/analytics/communities/:id', (req: Request, res: Response) => {
  const community = communities.find(c => c.id === req.params.id);

  if (!community) {
    return res.status(404).json({ success: false, error: 'Community not found' });
  }

  const communityCampaigns = campaigns.filter(c => c.communityId === community.id);

  res.json({
    success: true,
    data: {
      community: {
        id: community.id,
        name: community.name,
        population: community.demographics.population,
      },
      campaigns: communityCampaigns,
      summary: {
        totalCampaigns: communityCampaigns.length,
        activeCampaigns: communityCampaigns.filter(c => c.status === 'active').length,
        totalRevenue: communityCampaigns.reduce((sum, c) => sum + c.stats.revenue, 0),
        avgEngagement: communityCampaigns.length > 0
          ? communityCampaigns.reduce((sum, c) => sum + c.stats.engagement, 0) / communityCampaigns.length
          : 0,
      },
    },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║         COMMUNITY MEDIA NETWORK v1.0.0             ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Communities: ${communities.length}                                        ║
║  Groups:     ${groups.length}                                             ║
║  Campaigns: ${campaigns.length}                                           ║
╠══════════════════════════════════════════════════════════════╣
║  FEATURES:                                              ║
║  ✓ Community Profiles    ✓ Neighborhood Targeting          ║
║  ✓ Venue Advertising   ✓ Group Targeting               ║
║  ✓ Event Marketing     ✓ Demographics Targeting         ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
