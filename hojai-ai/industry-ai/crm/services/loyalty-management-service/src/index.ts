/**
 * Loyalty Management Service
 * Points, tiers, rewards, and engagement for CRM
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3024;
const SERVICE_NAME = 'loyalty-management-service';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export type TierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type RewardType = 'discount' | 'free_product' | 'free_shipping' | 'cashback' | 'experience' | 'gift_card';
export type TransactionType = 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
export type EngagementActivity = 'purchase' | 'review' | 'referral' | 'social_share' | 'survey' | 'login' | 'birthday';

export interface LoyaltyTier {
  id: string;
  name: TierName;
  minPoints: number;
  maxPoints: number | null;
  pointsMultiplier: number;
  benefits: string[];
  perks: TierPerk[];
  color: string;
}

export interface TierPerk {
  name: string;
  description: string;
  value: number;
}

export interface LoyaltyMember {
  id: string;
  customerId: string;
  tier: TierName;
  currentPoints: number;
  lifetimePoints: number;
  tierPoints: number;
  enrolledAt: Date;
  tierAchievedAt?: Date;
  lastActivityAt: Date;
  birthday?: string;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  metadata: Record<string, any>;
}

export interface PointsTransaction {
  id: string;
  memberId: string;
  type: TransactionType;
  points: number;
  balance: number;
  description: string;
  referenceId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  pointsCost: number;
  value: number;
  currency?: string;
  quantity: number;
  redeemed: number;
  active: boolean;
  tierRequired?: TierName;
  validFrom?: Date;
  validUntil?: Date;
  createdAt: Date;
}

export interface RewardRedemption {
  id: string;
  memberId: string;
  rewardId: string;
  pointsSpent: number;
  value: number;
  status: 'pending' | 'approved' | 'fulfilled' | 'cancelled';
  redeemedAt: Date;
  fulfilledAt?: Date;
  code?: string;
}

export interface EngagementActivity_Log {
  id: string;
  memberId: string;
  activity: EngagementActivity;
  pointsEarned: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface TierThreshold {
  activityType: EngagementActivity;
  pointsPerUnit: number;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  defaultPointsPerDollar: number;
  pointsToMoneyRatio: number;
  pointsExpirationDays: number;
  tiers: LoyaltyTier[];
  tierThresholds: TierThreshold[];
  engagementActivities: Record<EngagementActivity, { enabled: boolean; points: number }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// In-Memory Data Stores
// ============================================================================

const members: Map<string, LoyaltyMember> = new Map();
const transactions: Map<string, PointsTransaction> = new Map();
const rewards: Map<string, Reward> = new Map();
const redemptions: Map<string, RewardRedemption> = new Map();
const engagementLogs: Map<string, EngagementActivity_Log> = new Map();
let loyaltyProgram: LoyaltyProgram;

// ============================================================================
// Initialize Default Program
// ============================================================================

function initializeDefaultProgram(): void {
  loyaltyProgram = {
    id: uuidv4(),
    name: 'ReZ Rewards',
    description: 'Default loyalty program for all customers',
    defaultPointsPerDollar: 10,
    pointsToMoneyRatio: 100,
    pointsExpirationDays: 365,
    tiers: [
      {
        id: uuidv4(),
        name: 'bronze',
        minPoints: 0,
        maxPoints: 999,
        pointsMultiplier: 1,
        benefits: ['Earn 1x points on purchases', 'Birthday bonus'],
        perks: [
          { name: 'Birthday Reward', description: '100 bonus points on birthday', value: 100 }
        ],
        color: '#cd7f32'
      },
      {
        id: uuidv4(),
        name: 'silver',
        minPoints: 1000,
        maxPoints: 4999,
        pointsMultiplier: 1.25,
        benefits: ['Earn 1.25x points', 'Early access to sales', 'Birthday bonus'],
        perks: [
          { name: 'Birthday Reward', description: '250 bonus points', value: 250 },
          { name: 'Early Access', description: 'Shop sales 2 days early', value: 0 }
        ],
        color: '#c0c0c0'
      },
      {
        id: uuidv4(),
        name: 'gold',
        minPoints: 5000,
        maxPoints: 14999,
        pointsMultiplier: 1.5,
        benefits: ['Earn 1.5x points', 'Free shipping over $50', 'Priority support'],
        perks: [
          { name: 'Birthday Reward', description: '500 bonus points', value: 500 },
          { name: 'Free Shipping', description: 'Free shipping on orders over $50', value: 7.99 },
          { name: 'Priority Support', description: 'Skip the queue', value: 0 }
        ],
        color: '#ffd700'
      },
      {
        id: uuidv4(),
        name: 'platinum',
        minPoints: 15000,
        maxPoints: 49999,
        pointsMultiplier: 2,
        benefits: ['Earn 2x points', 'Exclusive events', 'Personal shopper'],
        perks: [
          { name: 'Birthday Reward', description: '1000 bonus points', value: 1000 },
          { name: 'Free Shipping', description: 'Free shipping on all orders', value: 0 },
          { name: 'Exclusive Events', description: 'Access to member-only events', value: 0 },
          { name: 'Personal Shopper', description: 'Dedicated shopping assistant', value: 0 }
        ],
        color: '#e5e4e2'
      },
      {
        id: uuidv4(),
        name: 'diamond',
        minPoints: 50000,
        maxPoints: null,
        pointsMultiplier: 3,
        benefits: ['Earn 3x points', 'VIP treatment everywhere', 'Luxury gifts'],
        perks: [
          { name: 'Birthday Reward', description: '2500 bonus points + gift', value: 2500 },
          { name: 'VIP Events', description: 'Exclusive VIP events', value: 0 },
          { name: 'Luxury Gifts', description: 'Quarterly luxury gifts', value: 500 },
          { name: 'Concierge', description: '24/7 personal concierge', value: 0 }
        ],
        color: '#b9f2ff'
      }
    ],
    tierThresholds: [
      { activityType: 'purchase', pointsPerUnit: 10, dailyLimit: 10000, weeklyLimit: 50000, monthlyLimit: 200000 },
      { activityType: 'review', pointsPerUnit: 50, dailyLimit: 500, weeklyLimit: 2000, monthlyLimit: 5000 },
      { activityType: 'referral', pointsPerUnit: 500, dailyLimit: 5000, weeklyLimit: 20000, monthlyLimit: 50000 },
      { activityType: 'social_share', pointsPerUnit: 25, dailyLimit: 250, weeklyLimit: 1000, monthlyLimit: 2500 },
      { activityType: 'survey', pointsPerUnit: 100, dailyLimit: 500, weeklyLimit: 2000, monthlyLimit: 5000 },
      { activityType: 'login', pointsPerUnit: 5, dailyLimit: 50, weeklyLimit: 200, monthlyLimit: 500 },
      { activityType: 'birthday', pointsPerUnit: 0, dailyLimit: 1, weeklyLimit: 1, monthlyLimit: 12 }
    ],
    engagementActivities: {
      purchase: { enabled: true, points: 10 },
      review: { enabled: true, points: 50 },
      referral: { enabled: true, points: 500 },
      social_share: { enabled: true, points: 25 },
      survey: { enabled: true, points: 100 },
      login: { enabled: false, points: 5 },
      birthday: { enabled: true, points: 200 }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Initialize default rewards
  const defaultRewards: Omit<Reward, 'id' | 'createdAt'>[] = [
    {
      name: '$5 Off',
      description: 'Get $5 off your next purchase',
      type: 'discount',
      pointsCost: 500,
      value: 5,
      currency: 'USD',
      quantity: -1,
      redeemed: 0,
      active: true
    },
    {
      name: '$10 Off',
      description: 'Get $10 off your next purchase',
      type: 'discount',
      pointsCost: 900,
      value: 10,
      currency: 'USD',
      quantity: -1,
      redeemed: 0,
      active: true
    },
    {
      name: 'Free Shipping',
      description: 'Free shipping on your next order',
      type: 'free_shipping',
      pointsCost: 300,
      value: 7.99,
      quantity: -1,
      redeemed: 0,
      active: true
    },
    {
      name: '$25 Gift Card',
      description: 'Redeem for a $25 gift card',
      type: 'gift_card',
      pointsCost: 2500,
      value: 25,
      currency: 'USD',
      quantity: 100,
      redeemed: 0,
      active: true,
      tierRequired: 'gold'
    },
    {
      name: 'Free Product Sample',
      description: 'Choose a free product sample',
      type: 'free_product',
      pointsCost: 750,
      value: 15,
      quantity: 50,
      redeemed: 0,
      active: true
    }
  ];

  defaultRewards.forEach(r => {
    const id = uuidv4();
    rewards.set(id, { ...r, id, createdAt: new Date() });
  });
}

initializeDefaultProgram();

// ============================================================================
// Helper Functions
// ============================================================================

function calculateTier(points: number): TierName {
  const tiers = loyaltyProgram.tiers.sort((a, b) => b.minPoints - a.minPoints);
  for (const tier of tiers) {
    if (points >= tier.minPoints) {
      return tier.name;
    }
  }
  return 'bronze';
}

function getTierMultiplier(tier: TierName): number {
  const tierConfig = loyaltyProgram.tiers.find(t => t.name === tier);
  return tierConfig?.pointsMultiplier || 1;
}

function generateReferralCode(): string {
  return 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============================================================================
// Routes - Program
// ============================================================================

/**
 * Get loyalty program details
 */
app.get('/api/program', (req: Request, res: Response) => {
  res.json(loyaltyProgram);
});

/**
 * Update loyalty program settings
 */
app.put('/api/program', (req: Request, res: Response) => {
  const updates = req.body;
  Object.assign(loyaltyProgram, updates, { updatedAt: new Date() });
  res.json(loyaltyProgram);
});

// ============================================================================
// Routes - Members
// ============================================================================

/**
 * Enroll a new member
 */
app.post('/api/members', (req: Request, res: Response) => {
  const { customerId, birthday, referredBy } = req.body;

  if (!customerId) {
    res.status(400).json({ error: 'Customer ID is required' });
    return;
  }

  const existing = Array.from(members.values()).find(m => m.customerId === customerId);
  if (existing) {
    res.status(409).json({ error: 'Customer is already enrolled' });
    return;
  }

  const member: LoyaltyMember = {
    id: uuidv4(),
    customerId,
    tier: 'bronze',
    currentPoints: 0,
    lifetimePoints: 0,
    tierPoints: 0,
    enrolledAt: new Date(),
    lastActivityAt: new Date(),
    birthday,
    referralCode: generateReferralCode(),
    referredBy,
    referralCount: 0,
    metadata: {}
  };

  members.set(member.id, member);

  // Add welcome bonus
  addPoints(member.id, 'bonus', 100, 'Welcome bonus points');

  logger.info(`Member enrolled: ${member.id}`);
  res.status(201).json(member);
});

/**
 * Get all members
 */
app.get('/api/members', (req: Request, res: Response) => {
  const { tier, minPoints, maxPoints } = req.query;

  let filtered = Array.from(members.values());

  if (tier) {
    filtered = filtered.filter(m => m.tier === tier);
  }
  if (minPoints) {
    filtered = filtered.filter(m => m.currentPoints >= parseInt(minPoints as string));
  }
  if (maxPoints) {
    filtered = filtered.filter(m => m.currentPoints <= parseInt(maxPoints as string));
  }

  res.json(filtered.sort((a, b) => b.currentPoints - a.currentPoints));
});

/**
 * Get member by ID
 */
app.get('/api/members/:id', (req: Request, res: Response) => {
  const member = members.get(req.params.id);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  const memberTransactions = Array.from(transactions.values())
    .filter(t => t.memberId === member.id)
    .slice(0, 50);

  const tierInfo = loyaltyProgram.tiers.find(t => t.name === member.tier);

  res.json({
    ...member,
    tierInfo,
    recentTransactions: memberTransactions
  });
});

/**
 * Get member by customer ID
 */
app.get('/api/members/customer/:customerId', (req: Request, res: Response) => {
  const member = Array.from(members.values()).find(m => m.customerId === req.params.customerId);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }
  res.json(member);
});

/**
 * Update member
 */
app.put('/api/members/:id', (req: Request, res: Response) => {
  const member = members.get(req.params.id);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  const { birthday, metadata } = req.body;
  if (birthday !== undefined) member.birthday = birthday;
  if (metadata) Object.assign(member.metadata, metadata);

  res.json(member);
});

// ============================================================================
// Routes - Points
// ============================================================================

/**
 * Add points to member
 */
function addPoints(memberId: string, type: TransactionType, points: number, description: string, referenceId?: string): PointsTransaction | null {
  const member = members.get(memberId);
  if (!member) return null;

  const tierMultiplier = getTierMultiplier(member.tier);
  const actualPoints = Math.floor(points * tierMultiplier);

  member.currentPoints += actualPoints;
  member.lifetimePoints += actualPoints;
  member.tierPoints += actualPoints;
  member.lastActivityAt = new Date();

  const newTier = calculateTier(member.lifetimePoints);
  if (newTier !== member.tier) {
    member.tier = newTier;
    member.tierAchievedAt = new Date();
  }

  const transaction: PointsTransaction = {
    id: uuidv4(),
    memberId,
    type,
    points: actualPoints,
    balance: member.currentPoints,
    description,
    referenceId,
    createdAt: new Date()
  };

  transactions.set(transaction.id, transaction);
  return transaction;
}

app.post('/api/members/:id/points', (req: Request, res: Response) => {
  const { type, points, description, referenceId } = req.body;
  const member = members.get(req.params.id);

  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  if (!type || points === undefined || !description) {
    res.status(400).json({ error: 'Type, points, and description are required' });
    return;
  }

  const transaction = addPoints(member.id, type, points, description, referenceId);
  logger.info(`Points added: ${transaction?.id}`);
  res.status(201).json(transaction);
});

/**
 * Redeem points
 */
app.post('/api/members/:id/redeem', (req: Request, res: Response) => {
  const { rewardId, points } = req.body;
  const member = members.get(req.params.id);

  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  const reward = rewards.get(rewardId);
  if (!reward || !reward.active) {
    res.status(404).json({ error: 'Reward not found or inactive' });
    return;
  }

  const pointsToRedeem = points || reward.pointsCost;

  if (member.currentPoints < pointsToRedeem) {
    res.status(400).json({ error: 'Insufficient points' });
    return;
  }

  if (reward.tierRequired) {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const memberTierIndex = tierOrder.indexOf(member.tier);
    const requiredTierIndex = tierOrder.indexOf(reward.tierRequired);

    if (memberTierIndex < requiredTierIndex) {
      res.status(400).json({ error: `Requires ${reward.tierRequired} tier or higher` });
      return;
    }
  }

  member.currentPoints -= pointsToRedeem;
  member.lastActivityAt = new Date();

  const transaction: PointsTransaction = {
    id: uuidv4(),
    memberId: member.id,
    type: 'redeem',
    points: -pointsToRedeem,
    balance: member.currentPoints,
    description: `Redeemed: ${reward.name}`,
    referenceId: rewardId,
    createdAt: new Date()
  };

  transactions.set(transaction.id, transaction);

  const redemption: RewardRedemption = {
    id: uuidv4(),
    memberId: member.id,
    rewardId,
    pointsSpent: pointsToRedeem,
    value: reward.value,
    status: 'approved',
    redeemedAt: new Date(),
    code: 'RWD' + Math.random().toString(36).substring(2, 10).toUpperCase()
  };

  redemptions.set(redemption.id, redemption);
  reward.redeemed++;

  logger.info(`Points redeemed: ${member.id} for ${reward.name}`);
  res.status(201).json({ transaction, redemption });
});

/**
 * Get member transactions
 */
app.get('/api/members/:id/transactions', (req: Request, res: Response) => {
  const { type, limit } = req.query;
  const member = members.get(req.params.id);

  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  let filtered = Array.from(transactions.values())
    .filter(t => t.memberId === member.id);

  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }

  const limitNum = limit ? parseInt(limit as string) : 50;
  res.json(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limitNum));
});

// ============================================================================
// Routes - Rewards
// ============================================================================

/**
 * Get all rewards
 */
app.get('/api/rewards', (req: Request, res: Response) => {
  const { type, tier, active } = req.query;

  let filtered = Array.from(rewards.values());

  if (type) {
    filtered = filtered.filter(r => r.type === type);
  }
  if (tier) {
    filtered = filtered.filter(r => !r.tierRequired || r.tierRequired === tier);
  }
  if (active !== undefined) {
    filtered = filtered.filter(r => r.active === (active === 'true'));
  }

  res.json(filtered);
});

/**
 * Get reward by ID
 */
app.get('/api/rewards/:id', (req: Request, res: Response) => {
  const reward = rewards.get(req.params.id);
  if (!reward) {
    res.status(404).json({ error: 'Reward not found' });
    return;
  }
  res.json(reward);
});

/**
 * Create reward
 */
app.post('/api/rewards', (req: Request, res: Response) => {
  const { name, description, type, pointsCost, value, quantity, tierRequired } = req.body;

  if (!name || !type || pointsCost === undefined || value === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const reward: Reward = {
    id: uuidv4(),
    name,
    description: description || '',
    type,
    pointsCost,
    value,
    quantity: quantity ?? -1,
    redeemed: 0,
    active: true,
    tierRequired,
    createdAt: new Date()
  };

  rewards.set(reward.id, reward);
  res.status(201).json(reward);
});

/**
 * Update reward
 */
app.put('/api/rewards/:id', (req: Request, res: Response) => {
  const reward = rewards.get(req.params.id);
  if (!reward) {
    res.status(404).json({ error: 'Reward not found' });
    return;
  }

  Object.assign(reward, req.body);
  res.json(reward);
});

// ============================================================================
// Routes - Engagement
// ============================================================================

/**
 * Log engagement activity
 */
app.post('/api/engage', (req: Request, res: Response) => {
  const { memberId, activity, metadata } = req.body;

  if (!memberId || !activity) {
    res.status(400).json({ error: 'Member ID and activity are required' });
    return;
  }

  const member = members.get(memberId);
  if (!member) {
    res.status(404).json({ error: 'Member not found' });
    return;
  }

  const activityConfig = loyaltyProgram.engagementActivities[activity];
  if (!activityConfig || !activityConfig.enabled) {
    res.status(400).json({ error: 'Activity not enabled' });
    return;
  }

  let points = activityConfig.points;

  // Special handling for purchase amount
  if (activity === 'purchase' && metadata?.amount) {
    points = Math.floor(metadata.amount * loyaltyProgram.defaultPointsPerDollar / 100);
  }

  const log: EngagementActivity_Log = {
    id: uuidv4(),
    memberId,
    activity,
    pointsEarned: points,
    metadata: metadata || {},
    createdAt: new Date()
  };

  engagementLogs.set(log.id, log);

  const transaction = addPoints(memberId, 'earn', points, `${activity} activity`);
  if (!transaction) {
    res.status(500).json({ error: 'Failed to add points' });
    return;
  }

  logger.info(`Engagement logged: ${activity} for member ${memberId}`);
  res.status(201).json({ log, transaction });
});

/**
 * Get engagement logs
 */
app.get('/api/engage', (req: Request, res: Response) => {
  const { memberId, activity, limit } = req.query;

  let filtered = Array.from(engagementLogs.values());

  if (memberId) {
    filtered = filtered.filter(l => l.memberId === memberId);
  }
  if (activity) {
    filtered = filtered.filter(l => l.activity === activity);
  }

  const limitNum = limit ? parseInt(limit as string) : 50;
  res.json(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limitNum));
});

// ============================================================================
// Routes - Referrals
// ============================================================================

/**
 * Process referral
 */
app.post('/api/referrals', (req: Request, res: Response) => {
  const { referrerCode, referredCustomerId } = req.body;

  if (!referrerCode || !referredCustomerId) {
    res.status(400).json({ error: 'Referral code and customer ID are required' });
    return;
  }

  const referrer = Array.from(members.values()).find(m => m.referralCode === referrerCode);
  if (!referrer) {
    res.status(404).json({ error: 'Invalid referral code' });
    return;
  }

  const existingMember = Array.from(members.values()).find(m => m.customerId === referredCustomerId);
  if (existingMember) {
    res.status(409).json({ error: 'Customer already enrolled' });
    return;
  }

  // Create new member with referral
  const newMember: LoyaltyMember = {
    id: uuidv4(),
    customerId: referredCustomerId,
    tier: 'bronze',
    currentPoints: 0,
    lifetimePoints: 0,
    tierPoints: 0,
    enrolledAt: new Date(),
    lastActivityAt: new Date(),
    referralCode: generateReferralCode(),
    referredBy: referrer.id,
    referralCount: 0,
    metadata: {}
  };

  members.set(newMember.id, newMember);
  referrer.referralCount++;

  // Award points to both parties
  addPoints(referrer.id, 'bonus', 500, 'Referral bonus - you referred a friend!');
  addPoints(newMember.id, 'bonus', 100, 'Welcome bonus points from referral');

  logger.info(`Referral completed: ${referrer.id} -> ${newMember.id}`);
  res.status(201).json({ referrer, newMember });
});

// ============================================================================
// Routes - Analytics
// ============================================================================

/**
 * Get program analytics
 */
app.get('/api/analytics', (req: Request, res: Response) => {
  const allMembers = Array.from(members.values());
  const allTransactions = Array.from(transactions.values());
  const allRedemptions = Array.from(redemptions.values());

  const tierDistribution: Record<TierName, number> = {
    bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0
  };

  allMembers.forEach(m => tierDistribution[m.tier]++);

  const pointsIssued = allTransactions
    .filter(t => t.type === 'earn' || t.type === 'bonus')
    .reduce((sum, t) => sum + t.points, 0);

  const pointsRedeemed = allTransactions
    .filter(t => t.type === 'redeem')
    .reduce((sum, t) => sum + Math.abs(t.points), 0);

  res.json({
    totalMembers: allMembers.length,
    tierDistribution,
    totalPointsIssued: pointsIssued,
    totalPointsRedeemed: pointsRedeemed,
    totalRewardsRedeemed: allRedemptions.length,
    averagePointsBalance: allMembers.length > 0
      ? allMembers.reduce((sum, m) => sum + m.currentPoints, 0) / allMembers.length
      : 0,
    totalReferrals: allMembers.reduce((sum, m) => sum + m.referralCount, 0)
  });
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    stats: {
      members: members.size,
      transactions: transactions.size,
      rewards: rewards.size,
      redemptions: redemptions.size
    }
  });
});

// ============================================================================
// Error Handler
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// Server Start
// ============================================================================

app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
  console.log(`${SERVICE_NAME} running on port ${PORT}`);
});

export default app;
