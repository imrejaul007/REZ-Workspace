/**
 * Loyalty Gamification & Cross-Industry Service
 * Points, badges, challenges, and cross-industry redemption
 */

import mongoose, { Schema, Document } from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerLoyalty {
  customerId: string;
  merchantId: string;
  phone: string;
  email?: string;
  points: number;
  lifetimePoints: number;
  tier: LoyaltyTier;
  tierProgress: number; // Progress to next tier (0-100)
  badges: EarnedBadge[];
  challenges: ActiveChallenge[];
  streak: {
    current: number;
    best: number;
    lastActivityDate: Date;
  };
  crossIndustryPoints: number; // Points redeemable across industries
  crossIndustryTransactions: CrossIndustryTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface EarnedBadge {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: BadgeCriteria;
  pointsReward: number;
}

export interface BadgeCriteria {
  type: 'order_count' | 'spending' | 'referrals' | 'challenges' | 'streak' | 'custom';
  threshold: number;
  industry?: string; // For industry-specific badges
}

export interface ActiveChallenge {
  challengeId: string;
  name: string;
  description: string;
  type: 'order_count' | 'spending' | 'visits' | 'custom';
  target: number;
  progress: number;
  startDate: Date;
  endDate: Date;
  rewards: ChallengeReward;
  completed: boolean;
  completedAt?: Date;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'order_count' | 'spending' | 'visits' | 'custom';
  target: number;
  duration: number; // Days
  pointsReward: number;
  badgeReward?: string; // Badge ID
  industries: string[]; // Applicable industries
  minOrderValue?: number;
  isActive: boolean;
}

export interface ChallengeReward {
  points: number;
  badgeId?: string;
  discountPercent?: number;
  freeItem?: string;
}

export interface CrossIndustryTransaction {
  id: string;
  fromIndustry: string;
  toIndustry: string;
  points: number;
  convertedAt: Date;
  amountRedeemed: number;
  merchantId: string;
}

export interface TierConfig {
  name: LoyaltyTier;
  minPoints: number;
  maxPoints: number;
  pointsMultiplier: number; // Earn rate multiplier
  benefits: string[];
  icon: string;
  color: string;
}

// ── MongoDB Models ─────────────────────────────────────────────────────────────

const CustomerLoyaltySchema = new Schema({
  customerId: { type: String, required: true, unique: true, index: true },
  merchantId: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  email: String,
  points: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], default: 'bronze' },
  tierProgress: { type: Number, default: 0 },
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: Date,
    rarity: String,
  }],
  challenges: [{
    challengeId: String,
    name: String,
    description: String,
    type: String,
    target: Number,
    progress: Number,
    startDate: Date,
    endDate: Date,
    rewards: {
      points: Number,
      badgeId: String,
      discountPercent: Number,
      freeItem: String,
    },
    completed: Boolean,
    completedAt: Date,
  }],
  streak: {
    current: { type: Number, default: 0 },
    best: { type: Number, default: 0 },
    lastActivityDate: Date,
  },
  crossIndustryPoints: { type: Number, default: 0 },
  crossIndustryTransactions: [{
    id: String,
    fromIndustry: String,
    toIndustry: String,
    points: Number,
    convertedAt: Date,
    amountRedeemed: Number,
    merchantId: String,
  }],
}, { timestamps: true });

const BadgeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  icon: String,
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  criteria: {
    type: String,
    threshold: Number,
    industry: String,
  },
  pointsReward: { type: Number, default: 0 },
});

const ChallengeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['order_count', 'spending', 'visits', 'custom'], required: true },
  target: { type: Number, required: true },
  duration: { type: Number, required: true }, // Days
  pointsReward: { type: Number, default: 0 },
  badgeReward: String,
  industries: [String],
  minOrderValue: Number,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const TierConfigSchema = new Schema({
  name: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'], required: true },
  minPoints: Number,
  maxPoints: Number,
  pointsMultiplier: Number,
  benefits: [String],
  icon: String,
  color: String,
});

export const CustomerLoyaltyModel = mongoose.models.CustomerLoyalty || mongoose.model('CustomerLoyalty', CustomerLoyaltySchema);
export const BadgeModel = mongoose.models.Badge || mongoose.model('Badge', BadgeSchema);
export const ChallengeModel = mongoose.models.Challenge || mongoose.model('Challenge', ChallengeSchema);
export const TierConfigModel = mongoose.models.TierConfig || mongoose.model('TierConfig', TierConfigSchema);

// ── Tier Configurations ─────────────────────────────────────────────────────────

const DEFAULT_TIER_CONFIG: TierConfig[] = [
  {
    name: 'bronze',
    minPoints: 0,
    maxPoints: 999,
    pointsMultiplier: 1.0,
    benefits: ['Basic points earning', 'Birthday bonus 10%'],
    icon: '🥉',
    color: '#CD7F32',
  },
  {
    name: 'silver',
    minPoints: 1000,
    maxPoints: 4999,
    pointsMultiplier: 1.25,
    benefits: ['25% bonus points', 'Birthday bonus 15%', 'Early access to sales'],
    icon: '🥈',
    color: '#C0C0C0',
  },
  {
    name: 'gold',
    minPoints: 5000,
    maxPoints: 19999,
    pointsMultiplier: 1.5,
    benefits: ['50% bonus points', 'Birthday bonus 25%', 'Free delivery', 'Priority support'],
    icon: '🥇',
    color: '#FFD700',
  },
  {
    name: 'platinum',
    minPoints: 20000,
    maxPoints: 49999,
    pointsMultiplier: 2.0,
    benefits: ['2x bonus points', 'Birthday bonus 50%', 'Free delivery', 'VIP events access', 'Personal concierge'],
    icon: '💎',
    color: '#E5E4E2',
  },
  {
    name: 'diamond',
    minPoints: 50000,
    maxPoints: Infinity,
    pointsMultiplier: 3.0,
    benefits: ['3x bonus points', 'Unlimited birthday bonus', 'All platinum benefits', 'Annual luxury gift', 'Founders club access'],
    icon: '👑',
    color: '#B9F2FF',
  },
];

// ── Loyalty Service ─────────────────────────────────────────────────────────────

class LoyaltyGamificationService {
  /**
   * Initialize tier configs
   */
  async initializeTiers(): Promise<void> {
    for (const tier of DEFAULT_TIER_CONFIG) {
      await TierConfigModel.findOneAndUpdate(
        { name: tier.name },
        tier,
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Get or create customer loyalty profile
   */
  async getOrCreateProfile(params: {
    customerId: string;
    merchantId: string;
    phone: string;
    email?: string;
  }): Promise<CustomerLoyalty> {
    let profile = await CustomerLoyaltyModel.findOne({ customerId: params.customerId });

    if (!profile) {
      profile = new CustomerLoyaltyModel({
        customerId: params.customerId,
        merchantId: params.merchantId,
        phone: params.phone,
        email: params.email,
        points: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        tierProgress: 0,
        badges: [],
        challenges: [],
        streak: {
          current: 0,
          best: 0,
          lastActivityDate: new Date(),
        },
        crossIndustryPoints: 0,
        crossIndustryTransactions: [],
      });
      await profile.save();
    }

    return profile;
  }

  /**
   * Award points for a transaction
   */
  async awardPoints(params: {
    customerId: string;
    merchantId: string;
    industry: string;
    orderId: string;
    orderAmount: number;
    basePoints?: number; // Override default calculation
  }): Promise<{
    pointsAwarded: number;
    newBalance: number;
    tier: LoyaltyTier;
    badgesEarned: EarnedBadge[];
    challengesUpdated: ActiveChallenge[];
  }> {
    const profile = await this.getOrCreateProfile({
      customerId: params.customerId,
      merchantId: params.merchantId,
      phone: '', // Would come from profile
    });

    // Calculate points based on tier multiplier
    const tierConfig = DEFAULT_TIER_CONFIG.find(t => t.name === profile.tier) || DEFAULT_TIER_CONFIG[0];
    const basePoints = params.basePoints || Math.floor(params.orderAmount);
    const pointsAwarded = Math.floor(basePoints * tierConfig.pointsMultiplier);

    // Update profile
    profile.points += pointsAwarded;
    profile.lifetimePoints += pointsAwarded;

    // Update streak
    this.updateStreak(profile);

    // Check for tier upgrade
    const tierResult = await this.checkTierUpgrade(profile);

    // Check for badge unlocks
    const badgesEarned = await this.checkBadgeUnlocks(profile);

    // Update challenges
    const challengesUpdated = await this.updateChallenges(profile, params);

    await profile.save();

    return {
      pointsAwarded,
      newBalance: profile.points,
      tier: profile.tier,
      badgesEarned,
      challengesUpdated,
    };
  }

  /**
   * Update streak tracking
   */
  private updateStreak(profile: CustomerLoyalty): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActivity = new Date(profile.streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // Consecutive day
      profile.streak.current++;
      if (profile.streak.current > profile.streak.best) {
        profile.streak.best = profile.streak.current;
      }
    } else if (daysDiff > 1) {
      // Streak broken
      profile.streak.current = 1;
    }
    // daysDiff === 0 means same day, no change

    profile.streak.lastActivityDate = today;
  }

  /**
   * Check for tier upgrade
   */
  private async checkTierUpgrade(profile: CustomerLoyalty): Promise<{
    upgraded: boolean;
    newTier?: LoyaltyTier;
  }> {
    const currentTierIndex = DEFAULT_TIER_CONFIG.findIndex(t => t.name === profile.tier);

    for (let i = DEFAULT_TIER_CONFIG.length - 1; i > currentTierIndex; i--) {
      const nextTier = DEFAULT_TIER_CONFIG[i];
      if (profile.lifetimePoints >= nextTier.minPoints) {
        profile.tier = nextTier.name;
        profile.tierProgress = this.calculateTierProgress(profile.lifetimePoints, nextTier);
        return { upgraded: true, newTier: nextTier.name };
      }
    }

    // Update progress for current tier
    const currentTier = DEFAULT_TIER_CONFIG[currentTierIndex];
    profile.tierProgress = this.calculateTierProgress(profile.lifetimePoints, currentTier);

    return { upgraded: false };
  }

  /**
   * Calculate progress within current tier
   */
  private calculateTierProgress(points: number, tier: TierConfig): number {
    const range = tier.maxPoints - tier.minPoints;
    const progress = points - tier.minPoints;
    return Math.min(100, Math.floor((progress / range) * 100));
  }

  /**
   * Check for badge unlocks
   */
  private async checkBadgeUnlocks(profile: CustomerLoyalty): Promise<EarnedBadge[]> {
    const badges = await BadgeModel.find({}).lean();
    const earnedBadgeIds = profile.badges.map(b => b.badgeId);
    const newlyEarned: EarnedBadge[] = [];

    for (const badge of badges) {
      if (earnedBadgeIds.includes(badge.id)) continue;

      let qualifies = false;

      switch (badge.criteria.type) {
        case 'order_count':
          // Would query order count
          qualifies = profile.lifetimePoints >= badge.criteria.threshold;
          break;
        case 'spending':
          // Would query total spending
          qualifies = profile.lifetimePoints >= badge.criteria.threshold;
          break;
        case 'streak':
          qualifies = profile.streak.best >= badge.criteria.threshold;
          break;
        case 'challenges':
          const completedChallenges = profile.challenges.filter(c => c.completed).length;
          qualifies = completedChallenges >= badge.criteria.threshold;
          break;
      }

      if (qualifies) {
        const earnedBadge: EarnedBadge = {
          badgeId: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          earnedAt: new Date(),
          rarity: badge.rarity as 'common' | 'rare' | 'epic' | 'legendary',
        };

        profile.badges.push(earnedBadge);
        profile.points += badge.pointsReward;
        newlyEarned.push(earnedBadge);
      }
    }

    return newlyEarned;
  }

  /**
   * Update active challenges
   */
  private async updateChallenges(
    profile: CustomerLoyalty,
    params: { orderId: string; orderAmount: number }
  ): Promise<ActiveChallenge[]> {
    const now = new Date();
    const activeChallenges = profile.challenges.filter(
      c => !c.completed && new Date(c.endDate) > now
    );

    const updatedChallenges: ActiveChallenge[] = [];

    for (const challenge of activeChallenges) {
      // Increment progress based on type
      if (challenge.type === 'order_count') {
        challenge.progress++;
      } else if (challenge.type === 'spending') {
        challenge.progress += params.orderAmount;
      }

      // Check if completed
      if (challenge.progress >= challenge.target) {
        challenge.completed = true;
        challenge.completedAt = now;

        // Award rewards
        profile.points += challenge.rewards.points;

        if (challenge.rewards.badgeId) {
          const badge = await BadgeModel.findOne({ id: challenge.rewards.badgeId });
          if (badge) {
            profile.badges.push({
              badgeId: badge.id,
              name: badge.name,
              description: badge.description,
              icon: badge.icon,
              earnedAt: now,
              rarity: badge.rarity as any,
            });
          }
        }
      }

      updatedChallenges.push(challenge);
    }

    return updatedChallenges;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REDEMPTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Redeem points
   */
  async redeemPoints(params: {
    customerId: string;
    points: number;
    rewardType: 'voucher' | 'discount' | 'product' | 'cross_industry';
    rewardDetails?: {
      industry?: string;
      merchantId?: string;
      discountPercent?: number;
      productId?: string;
    };
  }): Promise<{
    success: boolean;
    remainingPoints: number;
    voucherCode?: string;
    discountValue?: number;
    error?: string;
  }> {
    const profile = await CustomerLoyaltyModel.findOne({ customerId: params.customerId });

    if (!profile) {
      return { success: false, remainingPoints: 0, error: 'Customer not found' };
    }

    // Check cross-industry vs regular points
    const availablePoints = params.rewardType === 'cross_industry'
      ? profile.crossIndustryPoints
      : profile.points;

    if (availablePoints < params.points) {
      return {
        success: false,
        remainingPoints: availablePoints,
        error: 'Insufficient points',
      };
    }

    // Deduct points
    if (params.rewardType === 'cross_industry') {
      profile.crossIndustryPoints -= params.points;
    } else {
      profile.points -= params.points;
    }

    // Generate voucher if applicable
    let voucherCode: string | undefined;
    let discountValue: number | undefined;

    if (params.rewardType === 'voucher' || params.rewardType === 'discount') {
      voucherCode = this.generateVoucherCode();
      // Discount value is typically 1 point = ₹0.25 or similar
      discountValue = params.points * 0.25;
    }

    if (params.rewardType === 'cross_industry') {
      // Record cross-industry transaction
      profile.crossIndustryTransactions.push({
        id: `CIT_${Date.now()}`,
        fromIndustry: 'universal',
        toIndustry: params.rewardDetails?.industry || 'unknown',
        points: params.points,
        convertedAt: new Date(),
        amountRedeemed: discountValue || 0,
        merchantId: params.rewardDetails?.merchantId || '',
      });
    }

    await profile.save();

    return {
      success: true,
      remainingPoints: params.rewardType === 'cross_industry'
        ? profile.crossIndustryPoints
        : profile.points,
      voucherCode,
      discountValue,
    };
  }

  /**
   * Generate unique voucher code
   */
  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'REZ';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CHALLENGES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Assign challenges to customer
   */
  async assignChallenges(customerId: string): Promise<ActiveChallenge[]> {
    const profile = await CustomerLoyaltyModel.findOne({ customerId });
    if (!profile) return [];

    const now = new Date();
    const activeChallenges = await ChallengeModel.find({ isActive: true });
    const assigned: ActiveChallenge[] = [];

    for (const challenge of activeChallenges) {
      // Check if already assigned
      const alreadyAssigned = profile.challenges.some(c => c.challengeId === challenge.id);
      if (alreadyAssigned) continue;

      const activeChallenge: ActiveChallenge = {
        challengeId: challenge.id,
        name: challenge.name,
        description: challenge.description,
        type: challenge.type as any,
        target: challenge.target,
        progress: 0,
        startDate: now,
        endDate: new Date(now.getTime() + challenge.duration * 24 * 60 * 60 * 1000),
        rewards: challenge.pointsReward ? { points: challenge.pointsReward } : { points: 0 },
        completed: false,
      };

      profile.challenges.push(activeChallenge);
      assigned.push(activeChallenge);
    }

    await profile.save();
    return assigned;
  }

  /**
   * Create a new challenge
   */
  async createChallenge(challenge: Omit<Challenge, 'id'>): Promise<Challenge> {
    const newChallenge = new ChallengeModel({
      id: `CH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...challenge,
    });
    await newChallenge.save();
    return newChallenge;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-INDUSTRY LOYALTY
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Convert industry points to universal cross-industry points
   */
  async convertToCrossIndustry(params: {
    customerId: string;
    points: number;
    fromIndustry: string;
  }): Promise<{
    success: boolean;
    crossIndustryPointsAdded: number;
    error?: string;
  }> {
    const profile = await CustomerLoyaltyModel.findOne({ customerId: params.customerId });

    if (!profile) {
      return { success: false, crossIndustryPointsAdded: 0, error: 'Customer not found' };
    }

    if (profile.points < params.points) {
      return {
        success: false,
        crossIndustryPointsAdded: 0,
        error: 'Insufficient points',
      };
    }

    // Conversion rate: 10 industry points = 1 cross-industry point
    const crossIndustryPoints = Math.floor(params.points / 10);

    profile.points -= params.points;
    profile.crossIndustryPoints += crossIndustryPoints;

    await profile.save();

    return {
      success: true,
      crossIndustryPointsAdded: crossIndustryPoints,
    };
  }

  /**
   * Get customer loyalty summary
   */
  async getSummary(customerId: string): Promise<{
    points: number;
    tier: LoyaltyTier;
    tierProgress: number;
    lifetimePoints: number;
    badgeCount: number;
    streak: { current: number; best: number };
    crossIndustryPoints: number;
    availableRewards: number;
  }> {
    const profile = await CustomerLoyaltyModel.findOne({ customerId });
    if (!profile) {
      return {
        points: 0,
        tier: 'bronze',
        tierProgress: 0,
        lifetimePoints: 0,
        badgeCount: 0,
        streak: { current: 0, best: 0 },
        crossIndustryPoints: 0,
        availableRewards: 0,
      };
    }

    return {
      points: profile.points,
      tier: profile.tier,
      tierProgress: profile.tierProgress,
      lifetimePoints: profile.lifetimePoints,
      badgeCount: profile.badges.length,
      streak: profile.streak,
      crossIndustryPoints: profile.crossIndustryPoints,
      availableRewards: profile.points + profile.crossIndustryPoints,
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(params: {
    merchantId: string;
    limit?: number;
    period?: 'all_time' | 'monthly' | 'weekly';
  }): Promise<Array<{
    rank: number;
    customerId: string;
    customerName?: string;
    tier: LoyaltyTier;
    points: number;
  }>> {
    const limit = params.limit || 10;

    const customers = await CustomerLoyaltyModel
      .find({ merchantId: params.merchantId })
      .sort({ lifetimePoints: -1 })
      .limit(limit)
      .lean();

    return customers.map((c, index) => ({
      rank: index + 1,
      customerId: c.customerId,
      tier: c.tier as LoyaltyTier,
      points: c.lifetimePoints,
    }));
  }
}

export const loyaltyGamificationService = new LoyaltyGamificationService();
export default loyaltyGamificationService;
