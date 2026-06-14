/**
 * Loyalty System
 * Port: 3818
 *
 * Points, tiers, rewards, referral tracking
 * "Guest stays → earns points → unlocks rewards → stays more"
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from 'redis';
import amqp from 'amqplib';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3818;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()]
});

let redis: ReturnType<typeof createClient>;
let rabbit: amqp.Connection;

// ============ MODELS ============

interface LoyaltyMember {
  id: string;
  guestId: string;
  hotelId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  lifetimePoints: number;
  checkIns: number;
  stays: number;
  totalSpent: number;
  joinedAt: Date;
  tierUpdatedAt: Date;
  referralCode: string;
  referredBy?: string;
}

interface Transaction {
  id: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'bonus' | 'expire';
  points: number;
  description: string;
  bookingId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  category: 'discount' | 'upgrade' | 'service' | 'experience';
  pointsCost: number;
  tierRequired: 'bronze' | 'silver' | 'gold' | 'platinum';
  available: boolean;
  stock?: number;
}

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: { points: 0, discount: 0 },
  silver: { points: 5000, discount: 5 },
  gold: { points: 15000, discount: 10 },
  platinum: { points: 50000, discount: 15 }
};

// Demo rewards
const rewards: Reward[] = [
  { id: 'r1', name: '10% Room Discount', description: 'Get 10% off your next booking', category: 'discount', pointsCost: 1000, tierRequired: 'bronze', available: true },
  { id: 'r2', name: 'Free Breakfast', description: 'Complimentary breakfast for two', category: 'service', pointsCost: 2000, tierRequired: 'silver', available: true },
  { id: 'r3', name: 'Room Upgrade', description: 'Upgrade to next room category', category: 'upgrade', pointsCost: 3000, tierRequired: 'silver', available: true },
  { id: 'r4', name: 'Late Checkout', description: 'Checkout at 4 PM', category: 'service', pointsCost: 1500, tierRequired: 'bronze', available: true },
  { id: 'r5', name: 'Spa Treatment', description: '60-minute massage', category: 'experience', pointsCost: 5000, tierRequired: 'gold', available: true },
  { id: 'r6', name: 'Airport Transfer', description: 'Free airport pickup/drop', category: 'experience', pointsCost: 4000, tierRequired: 'gold', available: true },
  { id: 'r7', name: 'Platinum Suite Access', description: 'Access to executive lounge', category: 'experience', pointsCost: 0, tierRequired: 'platinum', available: true },
];

const members: Map<string, LoyaltyMember> = new Map();
const transactions: Map<string, Transaction> = new Map();

// ============ REST API ============

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'loyalty-system', port: PORT });
});

// Get member profile
app.get('/members/:memberId', (req, res) => {
  // Try memberId first, then fall back to guestId lookup
  let member = members.get(req.params.memberId);
  if (!member) {
    member = Array.from(members.values()).find(m => m.guestId === req.params.memberId);
  }
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const tierProgress = getTierProgress(member);

  res.json({ member, tierProgress, nextTier: getNextTier(member.tier) });
});

// Get member by guest ID
app.get('/guests/:guestId/member', (req, res) => {
  const member = Array.from(members.values()).find(m => m.guestId === req.params.guestId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json({ member });
});

// Create/join loyalty program
app.post('/members', async (req: Request, res: Response) => {
  const { guestId, hotelId, referredBy } = req.body;

  // Check if already member
  const existing = Array.from(members.values()).find(m => m.guestId === guestId);
  if (existing) {
    return res.json({ member: existing, message: 'Already a member' });
  }

  const member: LoyaltyMember = {
    id: uuidv4(),
    guestId,
    hotelId,
    tier: 'bronze',
    points: 0,
    lifetimePoints: 0,
    checkIns: 0,
    stays: 0,
    totalSpent: 0,
    joinedAt: new Date(),
    tierUpdatedAt: new Date(),
    referralCode: generateReferralCode(),
    referredBy
  };

  members.set(member.id, member);

  // Bonus for joining
  if (referredBy) {
    await addPoints(member.id, 500, 'Welcome bonus - referred by friend', 'bonus');
  }

  res.json({ member });
});

// Earn points
app.post('/members/:memberId/earn', async (req: Request, res) => {
  const { points, description, bookingId } = req.body;

  // Try memberId first, then fall back to guestId lookup
  let member = members.get(req.params.memberId);
  if (!member) {
    member = Array.from(members.values()).find(m => m.guestId === req.params.memberId);
  }
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const transaction = await addPoints(member.id, points, description, 'earn', bookingId);

  res.json({ transaction, member });
});

// Redeem points
app.post('/members/:memberId/redeem', async (req: Request, res) => {
  const { rewardId, bookingId } = req.body;

  const member = members.get(req.params.memberId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const reward = rewards.find(r => r.id === rewardId);
  if (!reward) {
    return res.status(404).json({ error: 'Reward not found' });
  }

  if (!reward.available) {
    return res.status(400).json({ error: 'Reward not available' });
  }

  if (member.points < reward.pointsCost) {
    return res.status(400).json({ error: 'Insufficient points' });
  }

  if (getTierLevel(member.tier) < getTierLevel(reward.tierRequired)) {
    return res.status(400).json({ error: `Requires ${reward.tierRequired} tier` });
  }

  // Redeem
  const transaction = await addPoints(member.id, -reward.pointsCost, `Redeemed: ${reward.name}`, 'redeem', bookingId);

  res.json({ transaction, member, reward });
});

// Get transaction history
app.get('/members/:memberId/transactions', (req, res) => {
  const memberTransactions = Array.from(transactions.values())
    .filter(t => t.memberId === req.params.memberId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({ transactions: memberTransactions });
});

// Get available rewards
app.get('/rewards', (req, res) => {
  const { tier } = req.query;
  const filtered = tier
    ? rewards.filter(r => getTierLevel(r.tierRequired) <= getTierLevel(tier as string))
    : rewards;

  res.json({ rewards: filtered.filter(r => r.available) });
});

// Get tier benefits
app.get('/tiers', (req, res) => {
  res.json({
    tiers: Object.entries(TIER_THRESHOLDS).map(([name, data]) => ({
      name,
      minPoints: data.points,
      discount: data.discount,
      benefits: getTierBenefits(name as LoyaltyMember['tier'])
    }))
  });
});

// ============ HELPERS ============

function getTierLevel(tier: string): number {
  const levels = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
  return levels[tier as keyof typeof levels] || 0;
}

function getTierProgress(member: LoyaltyMember): { current: number; next: number; percentage: number } {
  const currentTier = member.tier;
  const currentThreshold = TIER_THRESHOLDS[currentTier as keyof typeof TIER_THRESHOLDS].points;
  const tiers = Object.entries(TIER_THRESHOLDS);
  const currentIndex = tiers.findIndex(([name]) => name === currentTier);

  if (currentIndex === tiers.length - 1) {
    return { current: member.lifetimePoints, next: currentThreshold, percentage: 100 };
  }

  const nextTier = tiers[currentIndex + 1][0];
  const nextThreshold = TIER_THRESHOLDS[nextTier as keyof typeof TIER_THRESHOLDS].points;
  const progress = ((member.lifetimePoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;

  return {
    current: member.lifetimePoints,
    next: nextThreshold,
    percentage: Math.min(100, Math.max(0, progress))
  };
}

function getNextTier(currentTier: string): string | null {
  const tiers = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex < tiers.length - 1) {
    return tiers[currentIndex + 1];
  }
  return null;
}

function getTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ['Earn 10 points per ₹100 spent', 'Birthday bonus points', 'Member-only offers'],
    silver: ['Earn 12 points per ₹100 spent', 'Priority late checkout', 'Welcome drink'],
    gold: ['Earn 15 points per ₹100 spent', 'Room upgrades when available', 'Free breakfast'],
    platinum: ['Earn 20 points per ₹100 spent', 'Guaranteed upgrades', 'Lounge access', 'Airport transfers']
  };
  return benefits[tier] || [];
}

function generateReferralCode(): string {
  return 'REZ' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function addPoints(memberId: string, points: number, description: string, type: Transaction['type'], bookingId?: string): Promise<Transaction> {
  const member = members.get(memberId)!;

  const transaction: Transaction = {
    id: uuidv4(),
    memberId,
    type,
    points,
    description,
    bookingId,
    createdAt: new Date()
  };

  // Update member
  member.points += points;
  if (points > 0) {
    member.lifetimePoints += points;
    member.totalSpent += Math.abs(points); // Approximate
  }

  // Check tier upgrade
  for (const [tier, threshold] of Object.entries(TIER_THRESHOLDS)) {
    if (member.lifetimePoints >= threshold.points && getTierLevel(tier) > getTierLevel(member.tier)) {
      member.tier = tier as LoyaltyMember['tier'];
      member.tierUpdatedAt = new Date();
    }
  }

  transactions.set(transaction.id, transaction);

  // Publish event
  try {
    const channel = await rabbit.createChannel();
    channel.sendToQueue('loyalty.points.' + type, Buffer.from(JSON.stringify(transaction)));
  } catch (e) { /* Rabbit optional */ }

  return transaction;
}

async function init() {
  try {
    redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redis.on('error', () => {});
    await redis.connect();
  } catch (e) {
    logger.warn('Redis not available');
  }

  try {
    rabbit = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  } catch (e) {
    logger.warn('RabbitMQ not available');
  }

  logger.info('Loyalty System initialized');
}

init().then(() => {
  app.listen(PORT, () => {
    logger.info(`Loyalty System running on port ${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to initialize', err);
  process.exit(1);
});

export { app };
