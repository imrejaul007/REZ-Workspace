import { v4 as uuidv4 } from 'uuid';

export interface LoyaltyReward {
  rewardId: string;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'upgrade' | 'service' | 'experience';
  value: number; // percentage or fixed amount
  validDays: number; // Days until expiry after claim
}

export interface LoyaltyTier {
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  minPoints: number;
  maxPoints: number;
  benefits: string[];
  earningMultiplier: number;
  anniversaryBonus: number; // percentage extra points on anniversary
}

export class LoyaltyService {
  private readonly tiers: LoyaltyTier[] = [
    {
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 9999,
      benefits: ['Welcome discount 5%', 'Earn 1 point per ₹10'],
      earningMultiplier: 1,
      anniversaryBonus: 0,
    },
    {
      name: 'Silver',
      minPoints: 10000,
      maxPoints: 49999,
      benefits: ['Welcome discount 10%', 'Early check-in', 'Earn 1.5 points per ₹10'],
      earningMultiplier: 1.5,
      anniversaryBonus: 100,
    },
    {
      name: 'Gold',
      minPoints: 50000,
      maxPoints: 199999,
      benefits: ['Welcome discount 15%', 'Room upgrade on availability', 'Late check-out', 'Earn 2 points per ₹10'],
      earningMultiplier: 2,
      anniversaryBonus: 500,
    },
    {
      name: 'Platinum',
      minPoints: 200000,
      maxPoints: Infinity,
      benefits: ['Welcome discount 20%', 'Suite upgrade on availability', 'Free breakfast', 'Airport transfer', 'Earn 3 points per ₹10', 'Dedicated concierge'],
      earningMultiplier: 3,
      anniversaryBonus: 2000,
    },
  ];

  private readonly rewards: LoyaltyReward[] = [
    // Bronze rewards
    { rewardId: 'BR-100', tier: 'Bronze', name: '₹100 Off', description: '₹100 discount on your next booking', pointsCost: 500, category: 'discount', value: 100, validDays: 30 },
    { rewardId: 'BR-BF', tier: 'Bronze', name: 'Free Breakfast', description: 'Complimentary breakfast for 2', pointsCost: 1000, category: 'service', value: 1, validDays: 30 },
    // Silver rewards
    { rewardId: 'SR-500', tier: 'Silver', name: '₹500 Off', description: '₹500 discount on your next booking', pointsCost: 2000, category: 'discount', value: 500, validDays: 60 },
    { rewardId: 'SR-UPG', tier: 'Silver', name: 'Room Upgrade', description: 'Upgrade to next room category', pointsCost: 3000, category: 'upgrade', value: 1, validDays: 30 },
    // Gold rewards
    { rewardId: 'GR-1000', tier: 'Gold', name: '₹1000 Off', description: '₹1000 discount on your next booking', pointsCost: 4000, category: 'discount', value: 1000, validDays: 90 },
    { rewardId: 'GR-SPA', tier: 'Gold', name: 'Spa Treatment', description: '60-minute spa massage', pointsCost: 5000, category: 'experience', value: 1, validDays: 60 },
    // Platinum rewards
    { rewardId: 'PR-Suite', tier: 'Platinum', name: 'Suite Upgrade', description: 'Upgrade to suite category', pointsCost: 8000, category: 'upgrade', value: 1, validDays: 30 },
    { rewardId: 'PR-DINNER', tier: 'Platinum', name: 'Fine Dining', description: 'Complimentary dinner for 2 at restaurant', pointsCost: 6000, category: 'experience', value: 1, validDays: 60 },
    { rewardId: 'PR-PARK', tier: 'Platinum', name: 'Free Parking', description: 'Free valet parking for stay', pointsCost: 2000, category: 'service', value: 1, validDays: 30 },
  ];

  async getStatus(guestId: string): Promise<{
    tier: string;
    points: number;
    lifetimePoints: number;
    tierProgress: { current: number; next: number; percentage: number };
    nextTier: { name: string; pointsNeeded: number } | null;
    benefits: string[];
  }> {
    // Mock data - in production, fetch from GuestProfile
    const lifetimePoints = 35000 + Math.floor(Math.random() * 50000);
    const currentTier = this.getTier(lifetimePoints);
    const nextTierInfo = this.getNextTier(currentTier.name);

    const tierInfo = this.tiers.find(t => t.name === currentTier.name)!;
    const progress = nextTierInfo
      ? {
          current: lifetimePoints - tierInfo.minPoints,
          next: nextTierInfo.minPoints - tierInfo.minPoints,
          percentage: Math.round(((lifetimePoints - tierInfo.minPoints) / (nextTierInfo.minPoints - tierInfo.minPoints)) * 100),
        }
      : { current: 100, next: 100, percentage: 100 };

    return {
      tier: currentTier.name,
      points: Math.floor(lifetimePoints * 0.1), // Redeemable points (10% of lifetime)
      lifetimePoints,
      tierProgress: progress,
      nextTier: nextTierInfo
        ? { name: nextTierInfo.name, pointsNeeded: nextTierInfo.minPoints - lifetimePoints }
        : null,
      benefits: currentTier.benefits,
    };
  }

  async getAvailableRewards(guestId: string): Promise<{
    available: LoyaltyReward[];
    tierRewards: LoyaltyReward[];
    allRewards: LoyaltyReward[];
  }> {
    const status = await this.getStatus(guestId);
    const currentTierIndex = this.tiers.findIndex(t => t.name === status.tier);

    const tierRewards = this.rewards.filter(r => {
      const rewardTierIndex = this.tiers.findIndex(t => t.name === r.tier);
      return rewardTierIndex <= currentTierIndex;
    });

    const available = tierRewards.filter(r => r.pointsCost <= status.points);

    return {
      available,
      tierRewards,
      allRewards: this.rewards,
    };
  }

  async redeemReward(guestId: string, rewardId: string): Promise<{
    success: boolean;
    reward: LoyaltyReward;
    pointsRedeemed: number;
    voucherCode: string;
    expiresAt: Date;
  }> {
    const status = await this.getStatus(guestId);
    const reward = this.rewards.find(r => r.rewardId === rewardId);

    if (!reward) {
      throw new Error('Reward not found');
    }

    if (reward.pointsCost > status.points) {
      throw new Error(`Insufficient points. You have ${status.points} points, need ${reward.pointsCost}`);
    }

    const voucherCode = `REZ${rewardId}${Date.now().toString(36).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + reward.validDays * 24 * 60 * 60 * 1000);

    return {
      success: true,
      reward,
      pointsRedeemed: reward.pointsCost,
      voucherCode,
      expiresAt,
    };
  }

  async calculateEarning(guestId: string, amount: number): Promise<{
    pointsEarned: number;
    bonusPoints: number;
    totalPoints: number;
    newTierProgress: number;
  }> {
    const status = await this.getStatus(guestId);
    const tierInfo = this.tiers.find(t => t.name === status.tier)!;

    // Base earning: 1 point per ₹10
    let points = Math.floor(amount / 10);

    // Apply tier multiplier
    points = Math.floor(points * tierInfo.earningMultiplier);

    // Bonus points (anniversary, promotions, etc.)
    const bonusPoints = Math.floor(points * 0.1);

    return {
      pointsEarned: points,
      bonusPoints,
      totalPoints: points + bonusPoints,
      newTierProgress: status.lifetimePoints + points + bonusPoints,
    };
  }

  async getTierBenefits(tierName: string): Promise<LoyaltyTier | null> {
    return this.tiers.find(t => t.name === tierName) || null;
  }

  async getAllTiers(): Promise<LoyaltyTier[]> {
    return this.tiers;
  }

  private getTier(points: number): LoyaltyTier {
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (points >= this.tiers[i].minPoints) {
        return this.tiers[i];
      }
    }
    return this.tiers[0];
  }

  private getNextTier(currentTierName: string): LoyaltyTier | null {
    const currentIndex = this.tiers.findIndex(t => t.name === currentTierName);
    if (currentIndex < this.tiers.length - 1) {
      return this.tiers[currentIndex + 1];
    }
    return null;
  }
}
