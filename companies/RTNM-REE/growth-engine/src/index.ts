/**
 * REE - Growth Engine (Port 3002)
 *
 * User acquisition, referral tracking, and viral growth analytics
 * for the RTNM Digital ecosystem.
 *
 * Features:
 * - Referral tracking and management
 * - Viral coefficient calculation
 * - Growth metrics and analytics
 * - User acquisition funnels
 * - Campaign performance tracking
 * - Growth experiments
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = parseInt(process.env.PORT || '3002', 10);

// ============================================
// IN-MEMORY DATA STORES
// ============================================

interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  referralCode: string;
  campaignId?: string;
  status: 'pending' | 'converted' | 'expired' | 'cancelled';
  tier: number;
  rewardEarned: number;
  rewardPending: number;
  createdAt: Date;
  convertedAt?: Date;
  events: {
    timestamp: Date;
    type: string;
    metadata?: Record<string, any>;
  }[];
  metadata: Record<string, any>;
}

interface ReferralCode {
  code: string;
  userId: string;
  campaignId?: string;
  usageCount: number;
  maxUsage?: number;
  createdAt: Date;
  expiresAt?: Date;
  rewards: {
    perConversion: number;
    tierMultipliers: number[];
  };
  isActive: boolean;
}

interface GrowthCampaign {
  id: string;
  name: string;
  description: string;
  type: 'referral' | 'viral' | 'reward' | 'promotion';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  targetValue: number;
  budget: number;
  spent: number;
  rewards: {
    referrerReward: number;
    refereeReward: number;
    tierRewards?: number[];
  };
  rules: {
    maxReferralsPerUser?: number;
    minConversionValue?: number;
    expiryDays?: number;
    eligibilityCriteria?: Record<string, any>;
  };
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface GrowthMetric {
  id: string;
  metricType: 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral';
  entityId: string;
  entityType: 'user' | 'campaign' | 'feature';
  value: number;
  previousValue?: number;
  changePercent?: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  timestamp: Date;
  metadata: Record<string, any>;
}

interface AcquisitionFunnel {
  id: string;
  name: string;
  stages: {
    name: string;
    order: number;
    usersEntered: number;
    usersExited: number;
    conversionRate: number;
    avgTimeInStage: number;
  }[];
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalUsers: number;
  overallConversionRate: number;
}

interface GrowthExperiment {
  id: string;
  name: string;
  hypothesis: string;
  variant: 'A' | 'B' | 'C' | 'control';
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  targetMetric: string;
  sampleSize: number;
  currentSample: number;
  conversionRate: number;
  statisticalSignificance: number;
  startedAt?: Date;
  endedAt?: Date;
  results?: {
    control: number;
    treatment: number;
    uplift: number;
    pValue: number;
  };
  metadata: Record<string, any>;
}

// In-memory stores
const referrals: Map<string, Referral> = new Map();
const referralCodes: Map<string, ReferralCode> = new Map();
const campaigns: Map<string, GrowthCampaign> = new Map();
const metrics: Map<string, GrowthMetric> = new Map();
const funnels: Map<string, AcquisitionFunnel> = new Map();
const experiments: Map<string, GrowthExperiment> = new Map();

// Initialize sample data
initializeSampleData();

// ============================================
// HELPER FUNCTIONS
// ============================================

function initializeSampleData() {
  // Sample referral codes
  const sampleCodes: Omit<ReferralCode, 'code'>[] = [
    {
      userId: 'user-001',
      campaignId: 'campaign-summer',
      usageCount: 12,
      maxUsage: 50,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      rewards: {
        perConversion: 100,
        tierMultipliers: [1, 1.5, 2, 2.5, 3]
      },
      isActive: true
    },
    {
      userId: 'user-002',
      campaignId: 'campaign-summer',
      usageCount: 5,
      maxUsage: 100,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      rewards: {
        perConversion: 50,
        tierMultipliers: [1, 1.25, 1.5, 2]
      },
      isActive: true
    },
    {
      userId: 'user-003',
      campaignId: 'campaign-launch',
      usageCount: 0,
      maxUsage: undefined,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      rewards: {
        perConversion: 25,
        tierMultipliers: [1]
      },
      isActive: true
    }
  ];

  sampleCodes.forEach((codeData, idx) => {
    const code = `REF${String(idx + 1).padStart(4, '0')}${codeData.userId.slice(-3).toUpperCase()}`;
    referralCodes.set(code, { ...codeData, code });
  });

  // Sample campaigns
  const sampleCampaigns: Omit<GrowthCampaign, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: 'Summer Referral Bonanza',
      description: 'Get rewarded for every friend you bring!',
      type: 'referral',
      status: 'active',
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      targetMetric: 'conversions',
      targetValue: 5000,
      budget: 100000,
      spent: 45000,
      rewards: {
        referrerReward: 100,
        refereeReward: 50,
        tierRewards: [100, 150, 200, 250, 300]
      },
      rules: {
        maxReferralsPerUser: 50,
        minConversionValue: 500,
        expiryDays: 30
      },
      metrics: {
        impressions: 150000,
        clicks: 25000,
        conversions: 3250,
        revenue: 250000
      }
    },
    {
      name: 'Viral Loop Campaign',
      description: 'Share and earn - unlimited rewards',
      type: 'viral',
      status: 'active',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      targetMetric: 'viral_coefficient',
      targetValue: 1.5,
      budget: 50000,
      spent: 30000,
      rewards: {
        referrerReward: 75,
        refereeReward: 25
      },
      rules: {
        maxReferralsPerUser: 100
      },
      metrics: {
        impressions: 80000,
        clicks: 15000,
        conversions: 1800,
        revenue: 120000
      }
    },
    {
      name: 'Holiday Promotion',
      description: 'Holiday special - double rewards!',
      type: 'promotion',
      status: 'paused',
      startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      targetMetric: 'revenue',
      targetValue: 500000,
      budget: 150000,
      spent: 60000,
      rewards: {
        referrerReward: 200,
        refereeReward: 100
      },
      rules: {
        maxReferralsPerUser: 25
      },
      metrics: {
        impressions: 50000,
        clicks: 8000,
        conversions: 650,
        revenue: 85000
      }
    }
  ];

  sampleCampaigns.forEach((campaign, idx) => {
    const id = `campaign-${String(idx + 1).padStart(3, '0')}`;
    const now = new Date();
    campaigns.set(id, {
      ...campaign,
      id,
      createdAt: new Date(now.getTime() - (idx + 1) * 15 * 24 * 60 * 60 * 1000),
      updatedAt: now
    });
  });

  // Sample metrics
  const metricTypes: GrowthMetric['metricType'][] = ['acquisition', 'activation', 'retention', 'revenue', 'referral'];
  metricTypes.forEach((type, idx) => {
    const metric: GrowthMetric = {
      id: `metric-${type}`,
      metricType: type,
      entityId: 'overall',
      entityType: 'system',
      value: [2500, 1800, 0.75, 500000, 1.2][idx],
      previousValue: [2200, 1650, 0.72, 450000, 1.0][idx],
      changePercent: [13.6, 9.1, 4.2, 11.1, 20][idx],
      period: 'daily',
      timestamp: new Date(),
      metadata: {
        source: 'growth-engine',
        aggregation: 'sum'
      }
    };
    metrics.set(metric.id, metric);
  });

  // Sample acquisition funnel
  const sampleFunnel: AcquisitionFunnel = {
    id: 'funnel-main',
    name: 'User Acquisition Funnel',
    stages: [
      { name: 'Impressions', order: 1, usersEntered: 100000, usersExited: 25000, conversionRate: 75, avgTimeInStage: 2 },
      { name: 'Clicks', order: 2, usersEntered: 75000, usersExited: 15000, conversionRate: 80, avgTimeInStage: 15 },
      { name: 'Signups', order: 3, usersEntered: 60000, usersExited: 12000, conversionRate: 80, avgTimeInStage: 120 },
      { name: 'Activation', order: 4, usersEntered: 48000, usersExited: 4800, conversionRate: 90, avgTimeInStage: 1440 },
      { name: 'First Purchase', order: 5, usersEntered: 43200, usersExited: 4320, conversionRate: 90, avgTimeInStage: 10080 }
    ],
    period: 'weekly',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    totalUsers: 100000,
    overallConversionRate: 43.2
  };
  funnels.set('funnel-main', sampleFunnel);
}

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'REF';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function calculateViralCoefficient(campaignId: string): number {
  let totalInvites = 0;
  let totalConverted = 0;

  referrals.forEach(referral => {
    if (referral.campaignId === campaignId && referral.status === 'converted') {
      totalInvites++;
      if (referral.refereeId) {
        totalConverted++;
      }
    }
  });

  if (totalInvites === 0) return 0;
  return Number((totalConverted / totalInvites).toFixed(3));
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

// ============================================
// HEALTH ENDPOINT
// ============================================

app.get('/health', (req: Request, res: Response) => {
  const now = new Date();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let referralsLast7d = 0;
  let conversionsLast7d = 0;

  referrals.forEach(referral => {
    if (referral.createdAt >= last7d) {
      referralsLast7d++;
      if (referral.status === 'converted') conversionsLast7d++;
    }
  });

  const activeCampaigns = Array.from(campaigns.values()).filter(c => c.status === 'active').length;

  res.json({
    status: 'healthy',
    service: 'growth-engine',
    version: '1.0.0',
    port: PORT,
    timestamp: now.toISOString(),
    metrics: {
      totalReferrals: referrals.size,
      referralsLast7d,
      conversionsLast7d,
      activeCampaigns,
      activeCodes: Array.from(referralCodes.values()).filter(c => c.isActive).length,
      experiments: experiments.size
    }
  });
});

// ============================================
// REFERRAL MANAGEMENT
// ============================================

// Create referral
app.post('/api/referrals', (req: Request, res: Response) => {
  const {
    referrerId,
    refereeId,
    referralCode,
    campaignId,
    metadata = {}
  } = req.body;

  if (!referrerId || !referralCode) {
    res.status(400).json({ error: 'referrerId and referralCode are required' });
    return;
  }

  // Validate referral code
  const code = referralCodes.get(referralCode);
  if (!code) {
    res.status(404).json({ error: 'Invalid referral code' });
    return;
  }

  if (!code.isActive) {
    res.status(400).json({ error: 'Referral code is not active' });
    return;
  }

  if (code.maxUsage && code.usageCount >= code.maxUsage) {
    res.status(400).json({ error: 'Referral code has reached maximum usage' });
    return;
  }

  if (code.expiresAt && new Date() > code.expiresAt) {
    res.status(400).json({ error: 'Referral code has expired' });
    return;
  }

  const id = `ref-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  const referral: Referral = {
    id,
    referrerId,
    refereeId: refereeId || '',
    referralCode,
    campaignId: campaignId || code.campaignId,
    status: 'pending',
    tier: 1,
    rewardEarned: 0,
    rewardPending: code.rewards.perConversion,
    createdAt: now,
    events: [
      {
        timestamp: now,
        type: 'created',
        metadata: { source: 'api' }
      }
    ],
    metadata
  };

  referrals.set(id, referral);

  // Update code usage
  code.usageCount++;

  res.status(201).json({
    success: true,
    referral: {
      id: referral.id,
      referrerId: referral.referrerId,
      referralCode: referral.referralCode,
      status: referral.status
    }
  });
});

// List referrals
app.get('/api/referrals', (req: Request, res: Response) => {
  const { referrerId, refereeId, campaignId, status, limit = '50', offset = '0' } = req.query;

  let filtered = Array.from(referrals.values());

  if (referrerId) {
    filtered = filtered.filter(r => r.referrerId === referrerId);
  }
  if (refereeId) {
    filtered = filtered.filter(r => r.refereeId === refereeId);
  }
  if (campaignId) {
    filtered = filtered.filter(r => r.campaignId === campaignId);
  }
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }

  // Sort by created date descending
  filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const limitNum = parseInt(String(limit), 10);
  const offsetNum = parseInt(String(offset), 10);

  const paginated = filtered.slice(offsetNum, offsetNum + limitNum);

  res.json({
    total: filtered.length,
    limit: limitNum,
    offset: offsetNum,
    referrals: paginated
  });
});

// Get referral
app.get('/api/referrals/:id', (req: Request, res: Response) => {
  const referral = referrals.get(req.params.id);

  if (!referral) {
    res.status(404).json({ error: 'Referral not found' });
    return;
  }

  res.json({ referral });
});

// Convert referral
app.post('/api/referrals/:id/convert', (req: Request, res: Response) => {
  const referral = referrals.get(req.params.id);

  if (!referral) {
    res.status(404).json({ error: 'Referral not found' });
    return;
  }

  if (referral.status !== 'pending') {
    res.status(400).json({ error: 'Referral is not in pending status' });
    return;
  }

  const { refereeId, conversionValue, metadata = {} } = req.body;

  if (!refereeId) {
    res.status(400).json({ error: 'refereeId is required' });
    return;
  }

  const now = new Date();

  referral.refereeId = refereeId;
  referral.status = 'converted';
  referral.convertedAt = now;

  // Calculate tier and reward
  const code = referralCodes.get(referral.referralCode);
  if (code) {
    const tierIndex = Math.min(Math.floor(referral.tier - 1), code.rewards.tierMultipliers.length - 1);
    const multiplier = code.rewards.tierMultipliers[tierIndex] || 1;
    referral.rewardEarned = code.rewards.perConversion * multiplier;
    referral.rewardPending = 0;
  }

  referral.events.push({
    timestamp: now,
    type: 'converted',
    metadata: { conversionValue, ...metadata }
  });

  res.json({
    success: true,
    referral: {
      id: referral.id,
      status: referral.status,
      rewardEarned: referral.rewardEarned
    }
  });
});

// Update referral tier
app.patch('/api/referrals/:id/tier', (req: Request, res: Response) => {
  const referral = referrals.get(req.params.id);

  if (!referral) {
    res.status(404).json({ error: 'Referral not found' });
    return;
  }

  const { tier } = req.body;

  if (!tier || tier < 1) {
    res.status(400).json({ error: 'Valid tier is required' });
    return;
  }

  referral.tier = tier;
  referral.events.push({
    timestamp: new Date(),
    type: 'tier_upgraded',
    metadata: { newTier: tier }
  });

  res.json({ success: true, referral });
});

// ============================================
// REFERRAL CODES
// ============================================

// Create referral code
app.post('/api/codes', (req: Request, res: Response) => {
  const {
    userId,
    campaignId,
    maxUsage,
    expiresAt,
    perConversion = 50,
    tierMultipliers = [1]
  } = req.body;

  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }

  const code = generateReferralCode();

  const referralCode: ReferralCode = {
    code,
    userId,
    campaignId,
    usageCount: 0,
    maxUsage,
    createdAt: new Date(),
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    rewards: {
      perConversion,
      tierMultipliers
    },
    isActive: true
  };

  referralCodes.set(code, referralCode);

  res.status(201).json({
    success: true,
    code: referralCode
  });
});

// List referral codes
app.get('/api/codes', (req: Request, res: Response) => {
  const { userId, campaignId, isActive } = req.query;

  let filtered = Array.from(referralCodes.values());

  if (userId) {
    filtered = filtered.filter(c => c.userId === userId);
  }
  if (campaignId) {
    filtered = filtered.filter(c => c.campaignId === campaignId);
  }
  if (isActive !== undefined) {
    filtered = filtered.filter(c => c.isActive === (isActive === 'true'));
  }

  res.json({ codes: filtered });
});

// Validate code
app.get('/api/codes/:code/validate', (req: Request, res: Response) => {
  const code = referralCodes.get(req.params.code);

  if (!code) {
    res.status(404).json({ valid: false, error: 'Code not found' });
    return;
  }

  if (!code.isActive) {
    res.json({ valid: false, error: 'Code is not active' });
    return;
  }

  if (code.maxUsage && code.usageCount >= code.maxUsage) {
    res.json({ valid: false, error: 'Code has reached maximum usage' });
    return;
  }

  if (code.expiresAt && new Date() > code.expiresAt) {
    res.json({ valid: false, error: 'Code has expired' });
    return;
  }

  res.json({
    valid: true,
    code: {
      code: code.code,
      userId: code.userId,
      campaignId: code.campaignId,
      remainingUses: code.maxUsage ? code.maxUsage - code.usageCount : undefined,
      expiresAt: code.expiresAt
    }
  });
});

// ============================================
// CAMPAIGN MANAGEMENT
// ============================================

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const {
    name,
    description,
    type = 'referral',
    startDate,
    endDate,
    targetMetric,
    targetValue,
    budget,
    rewards,
    rules = {}
  } = req.body;

  if (!name || !targetMetric || !targetValue || !budget) {
    res.status(400).json({ error: 'name, targetMetric, targetValue, and budget are required' });
    return;
  }

  const id = `campaign-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  const campaign: GrowthCampaign = {
    id,
    name,
    description: description || '',
    type,
    status: 'draft',
    startDate: startDate ? new Date(startDate) : now,
    endDate: endDate ? new Date(endDate) : undefined,
    targetMetric,
    targetValue,
    budget,
    spent: 0,
    rewards: rewards || {
      referrerReward: 50,
      refereeReward: 25
    },
    rules,
    metrics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0
    },
    createdAt: now,
    updatedAt: now
  };

  campaigns.set(id, campaign);

  res.status(201).json({ success: true, campaign });
});

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, type } = req.query;

  let filtered = Array.from(campaigns.values());

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  if (type) {
    filtered = filtered.filter(c => c.type === type);
  }

  // Sort by start date descending
  filtered.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  res.json({ campaigns: filtered });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  // Calculate viral coefficient
  const viralCoefficient = calculateViralCoefficient(campaign.id);

  res.json({
    campaign,
    viralCoefficient,
    metrics: {
      ...campaign.metrics,
      ctr: campaign.metrics.impressions > 0
        ? (campaign.metrics.clicks / campaign.metrics.impressions * 100).toFixed(2)
        : 0,
      conversionRate: campaign.metrics.clicks > 0
        ? (campaign.metrics.conversions / campaign.metrics.clicks * 100).toFixed(2)
        : 0
    }
  });
});

// Update campaign
app.patch('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const allowedUpdates = [
    'name', 'description', 'status', 'endDate', 'targetValue',
    'budget', 'rewards', 'rules', 'metrics'
  ];

  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      (campaign as any)[field] = req.body[field];
    }
  });

  campaign.updatedAt = new Date();

  res.json({ success: true, campaign });
});

// Track campaign event
app.post('/api/campaigns/:id/events', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  const { eventType, value = 1, metadata = {} } = req.body;

  if (!eventType) {
    res.status(400).json({ error: 'eventType is required' });
    return;
  }

  switch (eventType) {
    case 'impression':
      campaign.metrics.impressions += value;
      break;
    case 'click':
      campaign.metrics.clicks += value;
      break;
    case 'conversion':
      campaign.metrics.conversions += value;
      break;
    case 'revenue':
      campaign.metrics.revenue += value;
      campaign.spent += value;
      break;
  }

  campaign.updatedAt = new Date();

  res.json({
    success: true,
    metrics: campaign.metrics
  });
});

// ============================================
// GROWTH METRICS
// ============================================

// Get growth metrics
app.get('/api/metrics', (req: Request, res: Response) => {
  const { metricType, entityId, period } = req.query;

  let filtered = Array.from(metrics.values());

  if (metricType) {
    filtered = filtered.filter(m => m.metricType === metricType);
  }
  if (entityId) {
    filtered = filtered.filter(m => m.entityId === entityId);
  }
  if (period) {
    filtered = filtered.filter(m => m.period === period);
  }

  res.json({ metrics: filtered });
});

// Record metric
app.post('/api/metrics', (req: Request, res: Response) => {
  const { metricType, entityId, entityType, value, period = 'daily', metadata = {} } = req.body;

  if (!metricType || !entityId || value === undefined) {
    res.status(400).json({ error: 'metricType, entityId, and value are required' });
    return;
  }

  const id = `metric-${uuidv4().slice(0, 8)}`;
  const now = new Date();

  // Find previous value for same entity
  let previousValue: number | undefined;
  metrics.forEach(m => {
    if (m.metricType === metricType && m.entityId === entityId && m.period === period) {
      previousValue = m.value;
    }
  });

  const metric: GrowthMetric = {
    id,
    metricType,
    entityId,
    entityType: entityType || 'user',
    value,
    previousValue,
    changePercent: previousValue ? calculateGrowthRate(value, previousValue) : undefined,
    period,
    timestamp: now,
    metadata
  };

  metrics.set(id, metric);

  res.status(201).json({ success: true, metric });
});

// Get viral coefficient
app.get('/api/viral/coefficient', (req: Request, res: Response) => {
  const { campaignId } = req.query;

  let totalInvites = 0;
  let totalConverted = 0;
  const byTier: Record<number, number> = {};

  referrals.forEach(referral => {
    if (campaignId && referral.campaignId !== campaignId) return;

    totalInvites++;
    if (referral.status === 'converted') {
      totalConverted++;
      byTier[referral.tier] = (byTier[referral.tier] || 0) + 1;
    }
  });

  const coefficient = totalInvites > 0 ? totalConverted / totalInvites : 0;

  res.json({
    coefficient: Number(coefficient.toFixed(3)),
    totalInvites,
    totalConverted,
    conversionRate: totalInvites > 0 ? (totalConverted / totalInvites * 100).toFixed(2) : 0,
    byTier,
    isViral: coefficient >= 1
  });
});

// ============================================
// ACQUISITION FUNNELS
// ============================================

// Get funnels
app.get('/api/funnels', (req: Request, res: Response) => {
  res.json({ funnels: Array.from(funnels.values()) });
});

// Get funnel
app.get('/api/funnels/:id', (req: Request, res: Response) => {
  const funnel = funnels.get(req.params.id);

  if (!funnel) {
    res.status(404).json({ error: 'Funnel not found' });
    return;
  }

  res.json({ funnel });
});

// Track funnel event
app.post('/api/funnels/:id/track', (req: Request, res: Response) => {
  const funnel = funnels.get(req.params.id);

  if (!funnel) {
    res.status(404).json({ error: 'Funnel not found' });
    return;
  }

  const { stageIndex, eventType } = req.body;

  if (stageIndex === undefined || stageIndex < 0 || stageIndex >= funnel.stages.length) {
    res.status(400).json({ error: 'Invalid stage index' });
    return;
  }

  const stage = funnel.stages[stageIndex];

  if (eventType === 'enter') {
    stage.usersEntered++;
  } else if (eventType === 'exit') {
    stage.usersExited++;
    // Move to next stage
    if (stageIndex < funnel.stages.length - 1) {
      funnel.stages[stageIndex + 1].usersEntered++;
    }
  }

  // Recalculate conversion rates
  let totalUsers = funnel.stages[0]?.usersEntered || 0;
  funnel.totalUsers = totalUsers;

  for (let i = 0; i < funnel.stages.length; i++) {
    const stage = funnel.stages[i];
    if (i === 0) {
      stage.conversionRate = 100;
    } else {
      const entered = funnel.stages[i - 1].usersEntered;
      stage.conversionRate = entered > 0 ? (stage.usersEntered / entered * 100) : 0;
    }
  }

  // Overall conversion
  const lastStage = funnel.stages[funnel.stages.length - 1];
  funnel.overallConversionRate = totalUsers > 0 ? (lastStage.usersEntered / totalUsers * 100) : 0;

  res.json({ success: true, funnel });
});

// ============================================
// GROWTH EXPERIMENTS
// ============================================

// Create experiment
app.post('/api/experiments', (req: Request, res: Response) => {
  const {
    name,
    hypothesis,
    variant = 'control',
    targetMetric,
    sampleSize,
    metadata = {}
  } = req.body;

  if (!name || !hypothesis || !targetMetric) {
    res.status(400).json({ error: 'name, hypothesis, and targetMetric are required' });
    return;
  }

  const id = `exp-${uuidv4().slice(0, 8)}`;

  const experiment: GrowthExperiment = {
    id,
    name,
    hypothesis,
    variant,
    status: 'draft',
    targetMetric,
    sampleSize: sampleSize || 1000,
    currentSample: 0,
    conversionRate: 0,
    statisticalSignificance: 0,
    metadata
  };

  experiments.set(id, experiment);

  res.status(201).json({ success: true, experiment });
});

// List experiments
app.get('/api/experiments', (req: Request, res: Response) => {
  const { status } = req.query;

  let filtered = Array.from(experiments.values());

  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }

  res.json({ experiments: filtered });
});

// Start experiment
app.post('/api/experiments/:id/start', (req: Request, res: Response) => {
  const experiment = experiments.get(req.params.id);

  if (!experiment) {
    res.status(404).json({ error: 'Experiment not found' });
    return;
  }

  experiment.status = 'running';
  experiment.startedAt = new Date();

  res.json({ success: true, experiment });
});

// Track experiment event
app.post('/api/experiments/:id/track', (req: Request, res: Response) => {
  const experiment = experiments.get(req.params.id);

  if (!experiment) {
    res.status(404).json({ error: 'Experiment not found' });
    return;
  }

  const { converted = false } = req.body;

  experiment.currentSample++;

  if (converted) {
    // Simple conversion rate calculation
    experiment.conversionRate = (experiment.conversionRate * (experiment.currentSample - 1) + 1) / experiment.currentSample;
  } else {
    experiment.conversionRate = experiment.conversionRate * (experiment.currentSample - 1) / experiment.currentSample;
  }

  // Calculate statistical significance (simplified)
  if (experiment.currentSample >= experiment.sampleSize * 0.5) {
    experiment.statisticalSignificance = Math.min(99, (experiment.currentSample / experiment.sampleSize) * 100);
  }

  // Auto-complete if sample size reached
  if (experiment.currentSample >= experiment.sampleSize) {
    experiment.status = 'completed';
    experiment.endedAt = new Date();
  }

  res.json({
    success: true,
    experiment: {
      currentSample: experiment.currentSample,
      conversionRate: experiment.conversionRate,
      statisticalSignificance: experiment.statisticalSignificance,
      status: experiment.status
    }
  });
});

// ============================================
// DASHBOARD METRICS
// ============================================

app.get('/api/dashboard/metrics', (req: Request, res: Response) => {
  const now = new Date();
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate metrics
  let referralsLast7d = 0;
  let referralsLast30d = 0;
  let conversionsLast7d = 0;
  let conversionsLast30d = 0;
  let totalRewardEarned = 0;

  referrals.forEach(referral => {
    if (referral.createdAt >= last7d) referralsLast7d++;
    if (referral.createdAt >= last30d) referralsLast30d++;
    if (referral.status === 'converted') {
      if (referral.convertedAt && referral.convertedAt >= last7d) conversionsLast7d++;
      if (referral.convertedAt && referral.convertedAt >= last30d) conversionsLast30d++;
      totalRewardEarned += referral.rewardEarned;
    }
  });

  // Campaign performance
  const campaignMetrics = {
    total: campaigns.size,
    active: 0,
    totalSpend: 0,
    totalConversions: 0,
    totalRevenue: 0
  };

  campaigns.forEach(c => {
    if (c.status === 'active') campaignMetrics.active++;
    campaignMetrics.totalSpend += c.spent;
    campaignMetrics.totalConversions += c.metrics.conversions;
    campaignMetrics.totalRevenue += c.metrics.revenue;
  });

  // Viral coefficient
  const viralCoefficient = calculateViralCoefficient('');

  res.json({
    timestamp: now.toISOString(),
    referrals: {
      total: referrals.size,
      last7d: referralsLast7d,
      last30d: referralsLast30d,
      conversions: {
        last7d: conversionsLast7d,
        last30d: conversionsLast30d,
        rate: referralsLast30d > 0 ? (conversionsLast30d / referralsLast30d * 100).toFixed(2) : 0
      }
    },
    rewards: {
      totalEarned: totalRewardEarned
    },
    viral: {
      coefficient: viralCoefficient,
      isViral: viralCoefficient >= 1
    },
    campaigns: campaignMetrics,
    experiments: {
      total: experiments.size,
      running: Array.from(experiments.values()).filter(e => e.status === 'running').length
    }
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Growth Engine Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`[growth-engine] Growth Engine running on port ${PORT}`);
  console.log(`[growth-engine] Health check: http://localhost:${PORT}/health`);
  console.log(`[growth-engine] Referrals: ${referrals.size}`);
  console.log(`[growth-engine] Campaigns: ${campaigns.size}`);
});

export default app;