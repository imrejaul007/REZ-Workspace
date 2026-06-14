import { Types } from 'mongoose';
import { ReferralCode, AmbassadorTierModel } from '../models';
import { AmbassadorTierDocument } from '../models/AmbassadorTier';
import { AmbassadorTier, AMBASSADOR_THRESHOLDS } from '../types/referral';
import { logger } from '../utils/logger';

export interface AmbassadorTierInfo {
  currentTier: AmbassadorTier;
  nextTier?: AmbassadorTier;
  referralsToNextTier: number;
  benefits: string[];
  bonusMultiplier: number;
  totalReferrals: number;
  qualifiedReferrals: number;
}

export class AmbassadorEngine {
  /**
   * Get ambassador info for a user
   */
  async getAmbassadorInfo(referrerId: string): Promise<AmbassadorTierInfo | null> {
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(referrerId),
    });

    if (!referralCode) {
      return null;
    }

    const qualifiedCount = referralCode.qualifiedReferrals;
    const currentTier = this.getTierForReferrals(qualifiedCount);
    const nextTier = this.getNextTier(currentTier);
    const referralsToNextTier = nextTier
      ? AMBASSADOR_THRESHOLDS[nextTier] - qualifiedCount
      : 0;

    // Get tier benefits
    const tierDoc = await AmbassadorTierModel.getTierBenefits(currentTier);
    const benefits = tierDoc?.benefits || [];
    const bonusMultiplier = tierDoc?.bonusMultiplier || 1.0;

    return {
      currentTier,
      nextTier,
      referralsToNextTier: Math.max(0, referralsToNextTier),
      benefits,
      bonusMultiplier,
      totalReferrals: referralCode.totalReferrals,
      qualifiedReferrals: qualifiedCount,
    };
  }

  /**
   * Get tier for referral count
   */
  private getTierForReferrals(count: number): AmbassadorTier {
    if (count >= AMBASSADOR_THRESHOLDS.diamond) return 'diamond';
    if (count >= AMBASSADOR_THRESHOLDS.platinum) return 'platinum';
    if (count >= AMBASSADOR_THRESHOLDS.gold) return 'gold';
    if (count >= AMBASSADOR_THRESHOLDS.silver) return 'silver';
    return 'bronze';
  }

  /**
   * Get next tier
   */
  private getNextTier(currentTier: AmbassadorTier): AmbassadorTier | undefined {
    const tierOrder: AmbassadorTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = tierOrder.indexOf(currentTier);
    if (currentIndex < tierOrder.length - 1) {
      return tierOrder[currentIndex + 1];
    }
    return undefined;
  }

  /**
   * Update ambassador tier
   */
  async updateTier(referrerId: string): Promise<{
    previousTier?: AmbassadorTier;
    newTier: AmbassadorTier;
    changed: boolean;
  }> {
    const referralCode = await ReferralCode.findOne({
      ownerId: new Types.ObjectId(referrerId),
    });

    if (!referralCode) {
      return { newTier: 'bronze', changed: false };
    }

    const qualifiedCount = referralCode.qualifiedReferrals;
    const previousTier = referralCode.tier as AmbassadorTier | undefined;
    const newTier = this.getTierForReferrals(qualifiedCount);

    if (previousTier !== newTier) {
      referralCode.tier = newTier;
      await referralCode.save();

      logger.info('[AmbassadorEngine] Tier changed:', {
        referrerId,
        previousTier,
        newTier,
      });

      return { previousTier, newTier, changed: true };
    }

    return { newTier, changed: false };
  }

  /**
   * Get all ambassador tiers
   */
  async getAllTiers(): Promise<AmbassadorTierDocument[]> {
    return AmbassadorTierModel.find({ isActive: true }).sort({ minReferrals: 1 });
  }

  /**
   * Get tier benefits
   */
  async getTierBenefits(tier: AmbassadorTier): Promise<{
    benefits: string[];
    bonusMultiplier: number;
    minReferrals: number;
    maxReferrals?: number;
  } | null> {
    const tierDoc = await AmbassadorTierModel.getTierBenefits(tier);
    if (!tierDoc) return null;

    return {
      benefits: tierDoc.benefits,
      bonusMultiplier: tierDoc.bonusMultiplier,
      minReferrals: tierDoc.minReferrals,
      maxReferrals: tierDoc.maxReferrals || undefined,
    };
  }

  /**
   * Get leaderboard by tier
   */
  async getTierLeaderboard(
    tier: AmbassadorTier,
    limit = 10
  ): Promise<unknown[]> {
    return ReferralCode.find({
      type: 'consumer',
      tier,
      isActive: true,
      isPublic: true,
    })
      .sort({ qualifiedReferrals: -1 })
      .limit(limit);
  }

  /**
   * Seed default tier configurations
   */
  async seedDefaultTiers(): Promise<void> {
    await AmbassadorTierModel.seedDefaults();
    logger.info('[AmbassadorEngine] Seeded default tiers');
  }
}

export const ambassadorEngine = new AmbassadorEngine();
