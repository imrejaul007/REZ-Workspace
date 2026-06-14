/**
 * Incentive-Driven Advertising Service
 *
 * Ads with cashback, coins, streaks, and loyalty rewards.
 * Unique to AdBazaar - Taboola has nothing like this.
 *
 * Port: 4610
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface IncentiveCampaign {
  id: string;
  advertiserId: string;
  name: string;
  incentiveType: 'coins' | 'cashback' | 'streak' | 'tier' | 'referral';
  incentiveConfig: IncentiveConfig;
  targetCriteria: TargetCriteria;
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate: Date;
  stats: IncentiveStats;
}

interface IncentiveConfig {
  // Coins
  coinsPerView?: number;
  coinsPerScan?: number;
  coinsPerVisit?: number;
  coinsPerOrder?: number;

  // Cashback
  cashbackPercent?: number;
  cashbackMax?: number;
  cashbackMinOrder?: number;

  // Streak
  streakDays?: number;
  streakBonus?: number;

  // Tier
  tierUpgrade?: 'silver' | 'gold' | 'platinum';

  // Referral
  referralBonus?: number;
  referralCoins?: number;
}

interface TargetCriteria {
  cities?: string[];
  zones?: string[];
  loyaltyTiers?: ('bronze' | 'silver' | 'gold' | 'platinum')[];
  minOrders?: number;
  lastOrderDays?: number;
}

interface IncentiveStats {
  views: number;
  scans: number;
  visits: number;
  conversions: number;
  coinsEarned: number;
  cashbackEarned: number;
  streaksStarted: number;
  streaksCompleted: number;
  referrals: number;
  coinsCost: number;
  cashbackCost: number;
}

interface UserIncentive {
  id: string;
  campaignId: string;
  userId: string;
  type: 'coins' | 'cashback' | 'streak' | 'tier' | 'referral';
  earned: number;
  status: 'earned' | 'pending' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

interface Streak {
  id: string;
  userId: string;
  campaignId: string;
  currentDay: number;
  targetDays: number;
  startedAt: Date;
  lastActivityAt: Date;
  completed: boolean;
  bonusEarned: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const campaigns: IncentiveCampaign[] = [
  {
    id: 'inc_001',
    advertiserId: 'adv_001',
    name: 'Pizza Friday Coins',
    incentiveType: 'coins',
    incentiveConfig: {
      coinsPerView: 1,
      coinsPerScan: 5,
      coinsPerVisit: 10,
      coinsPerOrder: 50,
    },
    targetCriteria: {
      cities: ['Bangalore', 'Mumbai'],
      loyaltyTiers: ['bronze', 'silver'],
    },
    budget: 100000,
    spent: 25000,
    status: 'active',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-06-30'),
    stats: {
      views: 45000,
      scans: 1200,
      visits: 380,
      conversions: 95,
      coinsEarned: 4750,
      cashbackEarned: 0,
      streaksStarted: 0,
      streaksCompleted: 0,
      referrals: 0,
      coinsCost: 4750,
      cashbackCost: 0,
    },
  },
  {
    id: 'inc_002',
    advertiserId: 'adv_002',
    name: '10% Cashback Weekend',
    incentiveType: 'cashback',
    incentiveConfig: {
      cashbackPercent: 10,
      cashbackMax: 100,
      cashbackMinOrder: 200,
    },
    targetCriteria: {
      cities: ['Bangalore'],
      loyaltyTiers: ['silver', 'gold', 'platinum'],
    },
    budget: 50000,
    spent: 12000,
    status: 'active',
    startDate: new Date('2026-05-15'),
    endDate: new Date('2026-06-15'),
    stats: {
      views: 28000,
      scans: 800,
      visits: 240,
      conversions: 120,
      coinsEarned: 0,
      cashbackEarned: 12000,
      streaksStarted: 0,
      streaksCompleted: 0,
      referrals: 0,
      coinsCost: 0,
      cashbackCost: 12000,
    },
  },
  {
    id: 'inc_003',
    advertiserId: 'adv_003',
    name: '7-Day Streak Challenge',
    incentiveType: 'streak',
    incentiveConfig: {
      streakDays: 7,
      streakBonus: 500,
    },
    targetCriteria: {
      cities: ['Mumbai'],
    },
    budget: 75000,
    spent: 15000,
    status: 'active',
    startDate: new Date('2026-05-20'),
    endDate: new Date('2026-07-20'),
    stats: {
      views: 35000,
      scans: 950,
      visits: 290,
      conversions: 72,
      coinsEarned: 0,
      cashbackEarned: 0,
      streaksStarted: 150,
      streaksCompleted: 45,
      referrals: 0,
      coinsCost: 0,
      cashbackCost: 0,
    },
  },
];

const userIncentives: UserIncentive[] = [];
const streaks: Streak[] = [];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4610', 10);

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
    service: 'incentive-ads',
    version: '1.0.0',
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalEarned: userIncentives.reduce((sum, u) => sum + u.earned, 0),
  });
});

// ============================================================================
// CAMPAIGN MANAGEMENT
// ============================================================================

// List incentive campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, type, advertiserId } = req.query;

  let filtered = [...campaigns];

  if (status) filtered = filtered.filter(c => c.status === status);
  if (type) filtered = filtered.filter(c => c.incentiveType === type);
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

// Create incentive campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { name, advertiserId, incentiveType, incentiveConfig, targetCriteria, budget, startDate, endDate } = req.body;

  if (!name || !advertiserId || !incentiveType || !budget) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  const campaign: IncentiveCampaign = {
    id: `inc_${Date.now()}`,
    advertiserId,
    name,
    incentiveType,
    incentiveConfig: incentiveConfig || {},
    targetCriteria: targetCriteria || {},
    budget,
    spent: 0,
    status: 'draft',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    stats: {
      views: 0, scans: 0, visits: 0, conversions: 0,
      coinsEarned: 0, cashbackEarned: 0,
      streaksStarted: 0, streaksCompleted: 0, referrals: 0,
      coinsCost: 0, cashbackCost: 0,
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

  const { status } = req.body;
  campaign.status = status;

  res.json({ success: true, data: campaign });
});

// ============================================================================
// INCENTIVE TRACKING
// ============================================================================

// Record view and earn coins
app.post('/api/earn/view', (req: Request, res: Response) => {
  const { userId, campaignId, context } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  let earned = 0;

  if (campaign.incentiveType === 'coins') {
    earned = campaign.incentiveConfig.coinsPerView || 1;
    campaign.stats.coinsEarned += earned;
    campaign.stats.coinsCost += earned;
  }

  campaign.stats.views++;

  const incentive: UserIncentive = {
    id: `ui_${Date.now()}`,
    campaignId,
    userId,
    type: 'coins',
    earned,
    status: 'earned',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };

  userIncentives.push(incentive);

  res.json({
    success: true,
    data: {
      earned,
      totalEarned: incentive.earned,
      expiresAt: incentive.expiresAt,
    },
  });
});

// Record scan and earn
app.post('/api/earn/scan', (req: Request, res: Response) => {
  const { userId, campaignId, qrId } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  let earned = 0;

  if (campaign.incentiveType === 'coins') {
    earned = campaign.incentiveConfig.coinsPerScan || 5;
    campaign.stats.coinsEarned += earned;
    campaign.stats.coinsCost += earned;
  }

  campaign.stats.scans++;

  res.json({
    success: true,
    data: { earned, type: campaign.incentiveType },
  });
});

// Record visit and earn
app.post('/api/earn/visit', (req: Request, res: Response) => {
  const { userId, campaignId, merchantId } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  let earned = 0;

  if (campaign.incentiveType === 'coins') {
    earned = campaign.incentiveConfig.coinsPerVisit || 10;
    campaign.stats.coinsEarned += earned;
    campaign.stats.coinsCost += earned;
  }

  campaign.stats.visits++;

  res.json({
    success: true,
    data: { earned, type: campaign.incentiveType },
  });
});

// Record order and earn cashback
app.post('/api/earn/order', (req: Request, res: Response) => {
  const { userId, campaignId, orderId, orderValue } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  let earned = 0;
  let type: string = campaign.incentiveType;

  if (campaign.incentiveType === 'coins') {
    earned = campaign.incentiveConfig.coinsPerOrder || 50;
    campaign.stats.coinsEarned += earned;
    campaign.stats.coinsCost += earned;
  } else if (campaign.incentiveType === 'cashback') {
    const percent = campaign.incentiveConfig.cashbackPercent || 10;
    const maxCashback = campaign.incentiveConfig.cashbackMax || 100;
    const minOrder = campaign.incentiveConfig.cashbackMinOrder || 0;

    if (orderValue >= minOrder) {
      earned = Math.min((orderValue * percent) / 100, maxCashback);
      campaign.stats.cashbackEarned += earned;
      campaign.stats.cashbackCost += earned;
    }
  }

  campaign.stats.conversions++;
  campaign.spent += earned;

  res.json({
    success: true,
    data: {
      earned: Math.round(earned * 100) / 100,
      type,
      orderId,
    },
  });
});

// ============================================================================
// STREAK MANAGEMENT
// ============================================================================

// Start streak
app.post('/api/streaks/start', (req: Request, res: Response) => {
  const { userId, campaignId } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign || campaign.incentiveType !== 'streak') {
    return res.status(404).json({ success: false, error: 'Streak campaign not found' });
  }

  const existing = streaks.find(s => s.userId === userId && s.campaignId === campaignId && !s.completed);
  if (existing) {
    return res.json({ success: true, data: existing, message: 'Streak already active' });
  }

  const streak: Streak = {
    id: `str_${Date.now()}`,
    userId,
    campaignId,
    currentDay: 1,
    targetDays: campaign.incentiveConfig.streakDays || 7,
    startedAt: new Date(),
    lastActivityAt: new Date(),
    completed: false,
    bonusEarned: 0,
  };

  streaks.push(streak);
  campaign.stats.streaksStarted++;

  res.json({ success: true, data: streak });
});

// Check-in to streak
app.post('/api/streaks/checkin', (req: Request, res: Response) => {
  const { userId, campaignId } = req.body;

  const streak = streaks.find(s => s.userId === userId && s.campaignId === campaignId && !s.completed);
  if (!streak) {
    return res.status(404).json({ success: false, error: 'No active streak found' });
  }

  // Check if last activity was today
  const lastDate = new Date(streak.lastActivityAt).toDateString();
  const today = new Date().toDateString();

  if (lastDate === today) {
    return res.json({ success: true, data: streak, message: 'Already checked in today' });
  }

  // Check if gap is more than 1 day
  const daysSince = Math.floor((Date.now() - streak.lastActivityAt) / (24 * 60 * 60 * 1000));
  if (daysSince > 1) {
    streak.completed = true;
    return res.json({ success: true, data: streak, message: 'Streak broken' });
  }

  // Progress streak
  streak.currentDay++;
  streak.lastActivityAt = new Date();

  // Check completion
  if (streak.currentDay >= streak.targetDays) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      streak.completed = true;
      streak.bonusEarned = campaign.incentiveConfig.streakBonus || 500;
      campaign.stats.streaksCompleted++;
      campaign.stats.coinsEarned += streak.bonusEarned;
      campaign.stats.coinsCost += streak.bonusEarned;
    }
  }

  res.json({ success: true, data: streak });
});

// Get user streaks
app.get('/api/streaks/user/:userId', (req: Request, res: Response) => {
  const userStreaks = streaks.filter(s => s.userId === req.params.userId);

  res.json({
    success: true,
    data: {
      streaks: userStreaks,
      active: userStreaks.filter(s => !s.completed).length,
      completed: userStreaks.filter(s => s.completed).length,
      totalBonus: userStreaks.reduce((sum, s) => sum + s.bonusEarned, 0),
    },
  });
});

// ============================================================================
// REFERRAL TRACKING
// ============================================================================

// Track referral
app.post('/api/referral/track', (req: Request, res: Response) => {
  const { referrerId, refereeId, campaignId, incentiveType } = req.body;

  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    return res.status(404).json({ success: false, error: 'Campaign not found' });
  }

  const bonus = campaign.incentiveConfig.referralBonus || 100;
  const coins = campaign.incentiveConfig.referralCoins || 50;

  // Credit referrer
  const referrerIncentive: UserIncentive = {
    id: `ui_${Date.now()}_r`,
    campaignId,
    userId: referrerId,
    type: 'referral',
    earned: bonus,
    status: 'earned',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  // Credit referee
  const refereeIncentive: UserIncentive = {
    id: `ui_${Date.now()}_e`,
    campaignId,
    userId: refereeId,
    type: 'referral',
    earned: coins,
    status: 'earned',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  userIncentives.push(referrerIncentive, refereeIncentive);
  campaign.stats.referrals++;
  campaign.stats.coinsEarned += bonus + coins;
  campaign.stats.coinsCost += bonus + coins;

  res.json({
    success: true,
    data: {
      referrerEarned: bonus,
      refereeEarned: coins,
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
      campaign: campaign,
      metrics: {
        cpi: campaign.stats.views > 0 ? (campaign.stats.coinsCost / campaign.stats.views) : 0,
        cps: campaign.stats.scans > 0 ? (campaign.stats.coinsCost / campaign.stats.scans) : 0,
        cpv: campaign.stats.visits > 0 ? (campaign.stats.coinsCost / campaign.stats.visits) : 0,
        cpa: campaign.stats.conversions > 0 ? (campaign.stats.coinsCost / campaign.stats.conversions) : 0,
        conversionRate: campaign.stats.visits > 0 ? (campaign.stats.conversions / campaign.stats.visits) : 0,
        roi: campaign.spent > 0 ? (campaign.stats.conversions * 100 / campaign.spent) : 0,
      },
    },
  });
});

// Get user incentive history
app.get('/api/incentives/user/:userId', (req: Request, res: Response) => {
  const userIncs = userIncentives.filter(u => u.userId === req.params.userId);

  res.json({
    success: true,
    data: {
      incentives: userIncs,
      totalCoins: userIncs.filter(u => u.type === 'coins' || u.type === 'referral').reduce((sum, u) => sum + u.earned, 0),
      totalCashback: userIncs.filter(u => u.type === 'cashback').reduce((sum, u) => sum + u.earned, 0),
    },
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  logger.info(`
╔══════════════════════════════════════════════════════════════╗
║       INCENTIVE-DRIVEN ADVERTISING v1.0.0            ║
╠══════════════════════════════════════════════════════════════╣
║  Port:     ${PORT}                                             ║
║  Active:   ${campaigns.filter(c => c.status === 'active').length} campaigns                                       ║
║  Earned:   ₹${userIncentives.reduce((sum, u) => sum + u.earned, 0).toLocaleString()} total incentives                          ║
╠══════════════════════════════════════════════════════════════╣
║  INCENTIVE TYPES:                                        ║
║  • Coins         • Cashback     • Streaks                 ║
║  • Tier Upgrade  • Referrals                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
