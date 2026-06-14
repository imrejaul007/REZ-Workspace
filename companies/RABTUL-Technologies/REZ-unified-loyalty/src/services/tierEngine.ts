import mongoose from 'mongoose';
import {
  TierLevel,
  TierLevelSchema,
  TIER_BENEFITS,
  TIER_THRESHOLDS,
  TierBenefits,
  TierStatus
} from '../types/index.js';
import { UserTier, IUserTier, Transaction } from '../models/index.js';
import { Errors } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

/**
 * Tier Engine Service
 * Manages tier calculation, upgrades, and benefits
 */
export class TierEngineService {
  private tierLevels = Object.values(TierLevel);

  /**
   * Get tier threshold for a given tier level
   */
  getTierThreshold(tier: TierLevel): number {
    return TIER_THRESHOLDS[tier.toLowerCase() as keyof typeof TIER_THRESHOLDS];
  }

  /**
   * Get next tier for a given tier level
   */
  getNextTier(tier: TierLevel): TierLevel | null {
    const tierOrder = [
      TierLevel.BRONZE,
      TierLevel.SILVER,
      TierLevel.GOLD,
      TierLevel.PLATINUM
    ];

    const currentIndex = tierOrder.indexOf(tier);
    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
      return null;
    }

    return tierOrder[currentIndex + 1];
  }

  /**
   * Calculate tier from lifetime coins
   */
  calculateTierFromCoins(lifetimeCoins: number): TierLevel {
    if (lifetimeCoins >= TIER_THRESHOLDS.platinum) {
      return TierLevel.PLATINUM;
    }
    if (lifetimeCoins >= TIER_THRESHOLDS.gold) {
      return TierLevel.GOLD;
    }
    if (lifetimeCoins >= TIER_THRESHOLDS.silver) {
      return TierLevel.SILVER;
    }
    return TierLevel.BRONZE;
  }

  /**
   * Calculate progress percentage to next tier
   */
  calculateTierProgress(lifetimeCoins: number): {
    progress: number;
    nextTier: TierLevel | null;
    coinsToNextTier: number;
  } {
    const currentTier = this.calculateTierFromCoins(lifetimeCoins);
    const nextTier = this.getNextTier(currentTier);

    if (!nextTier) {
      return {
        progress: 100,
        nextTier: null,
        coinsToNextTier: 0
      };
    }

    const currentThreshold = this.getTierThreshold(currentTier);
    const nextThreshold = this.getTierThreshold(nextTier);
    const range = nextThreshold - currentThreshold;
    const progressInRange = lifetimeCoins - currentThreshold;
    const progress = Math.min(100, Math.floor((progressInRange / range) * 100));

    return {
      progress,
      nextTier,
      coinsToNextTier: Math.max(0, nextThreshold - lifetimeCoins)
    };
  }

  /**
   * Get or create user tier record
   */
  async getOrCreateUserTier(userId: string): Promise<IUserTier> {
    let userTier = await UserTier.findOne({ userId });

    if (!userTier) {
      const initialTier = TierLevel.BRONZE;
      const tierValidUntil = new Date();
      tierValidUntil.setFullYear(tierValidUntil.getFullYear() + 1);

      userTier = await UserTier.create({
        userId,
        currentTier: initialTier,
        lifetimeCoins: 0,
        currentPeriodCoins: 0,
        previousTier: initialTier,
        tierProgress: 0,
        nextTier: this.getNextTier(initialTier),
        coinsToNextTier: TIER_THRESHOLDS.silver,
        tierBenefits: TIER_BENEFITS[initialTier],
        tierEnrolledAt: new Date(),
        tierValidUntil,
        lastTierCalculation: new Date(),
        tierHistory: [{
          tier: initialTier,
          startDate: new Date()
        }]
      });

      logger.info('Created new user tier', { userId, tier: initialTier });
    }

    return userTier;
  }

  /**
   * Get tier status for a user
   */
  async getTierStatus(userId: string): Promise<TierStatus> {
    const userTier = await this.getOrCreateUserTier(userId);
    const { progress, nextTier, coinsToNextTier } = this.calculateTierProgress(
      userTier.lifetimeCoins
    );

    return {
      userId,
      currentTier: userTier.currentTier as TierLevel,
      lifetimeCoins: userTier.lifetimeCoins,
      currentPeriodCoins: userTier.currentPeriodCoins,
      previousTier: userTier.previousTier as TierLevel,
      tierProgress: progress,
      nextTier: nextTier || undefined,
      coinsToNextTier,
      tierBenefits: userTier.tierBenefits as TierBenefits,
      tierEnrolledAt: userTier.tierEnrolledAt,
      tierValidUntil: userTier.tierValidUntil,
      lastTierCalculation: userTier.lastTierCalculation
    };
  }

  /**
   * Update tier based on earned coins
   */
  async updateTierOnEarn(userId: string, coinsEarned: number): Promise<{
    previousTier: TierLevel;
    newTier: TierLevel;
    upgraded: boolean;
    bonusAwarded: number;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userTier = await UserTier.findOne({ userId }).session(session);

      if (!userTier) {
        throw Errors.notFound('User tier');
      }

      const previousTier = userTier.currentTier as TierLevel;

      // Update coin counts
      userTier.lifetimeCoins += coinsEarned;
      userTier.currentPeriodCoins += coinsEarned;

      // Calculate new tier
      const newTier = this.calculateTierFromCoins(userTier.lifetimeCoins);

      // Check for tier upgrade
      let upgraded = false;
      let bonusAwarded = 0;

      if (this.isHigherTier(newTier, previousTier)) {
        upgraded = true;
        bonusAwarded = this.calculateUpgradeBonus(previousTier, newTier);

        // Update tier history
        const now = new Date();
        const currentTierHistoryIndex = userTier.tierHistory.findIndex(
          h => !h.endDate
        );

        if (currentTierHistoryIndex !== -1) {
          userTier.tierHistory[currentTierHistoryIndex].endDate = now;
        }

        userTier.tierHistory.push({
          tier: newTier,
          startDate: now
        });

        // Set new tier valid until (1 year from now)
        const tierValidUntil = new Date();
        tierValidUntil.setFullYear(tierValidUntil.getFullYear() + 1);

        userTier.previousTier = previousTier;
        userTier.currentTier = newTier;
        userTier.tierValidUntil = tierValidUntil;

        logger.info('Tier upgraded', {
          userId,
          fromTier: previousTier,
          toTier: newTier,
          bonusAwarded
        });
      }

      // Update progress
      const { progress, coinsToNextTier } = this.calculateTierProgress(
        userTier.lifetimeCoins
      );

      userTier.tierProgress = progress;
      userTier.nextTier = this.getNextTier(newTier) || undefined;
      userTier.coinsToNextTier = coinsToNextTier;
      userTier.lastTierCalculation = new Date();

      await userTier.save({ session });
      await session.commitTransaction();

      return {
        previousTier,
        newTier,
        upgraded,
        bonusAwarded
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if tier A is higher than tier B
   */
  isHigherTier(tierA: TierLevel, tierB: TierLevel): boolean {
    const tierOrder: TierLevel[] = [
      TierLevel.BRONZE,
      TierLevel.SILVER,
      TierLevel.GOLD,
      TierLevel.PLATINUM
    ];

    return tierOrder.indexOf(tierA) > tierOrder.indexOf(tierB);
  }

  /**
   * Calculate bonus for tier upgrade
   */
  calculateUpgradeBonus(fromTier: TierLevel, toTier: TierLevel): number {
    const tierOrder = [
      TierLevel.BRONZE,
      TierLevel.SILVER,
      TierLevel.GOLD,
      TierLevel.PLATINUM
    ];

    const fromIndex = tierOrder.indexOf(fromTier);
    const toIndex = tierOrder.indexOf(toTier);
    const tiersSkipped = toIndex - fromIndex;

    // Base bonus for each tier jumped
    const tierBonusMap: Record<TierLevel, number> = {
      [TierLevel.BRONZE]: 0,
      [TierLevel.SILVER]: 200,
      [TierLevel.GOLD]: 500,
      [TierLevel.PLATINUM]: 1000
    };

    let totalBonus = 0;
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      totalBonus += tierBonusMap[tierOrder[i]];
    }

    return totalBonus;
  }

  /**
   * Reset tier period (called yearly)
   */
  async resetTierPeriod(userId: string): Promise<{
    newTier: TierLevel;
    downgraded: boolean;
    previousTier: TierLevel;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const userTier = await UserTier.findOne({ userId }).session(session);

      if (!userTier) {
        throw Errors.notFound('User tier');
      }

      const previousTier = userTier.currentTier as TierLevel;

      // Calculate new tier based on lifetime coins (keeping lifetime total)
      const newTier = this.calculateTierFromCoins(userTier.lifetimeCoins);

      // Check for downgrade
      const downgraded = this.isHigherTier(previousTier, newTier);

      if (downgraded) {
        // Update tier history
        const now = new Date();
        const currentTierHistoryIndex = userTier.tierHistory.findIndex(
          h => !h.endDate
        );

        if (currentTierHistoryIndex !== -1) {
          userTier.tierHistory[currentTierHistoryIndex].endDate = now;
        }

        userTier.tierHistory.push({
          tier: newTier,
          startDate: now
        });

        logger.info('Tier downgraded', {
          userId,
          fromTier: previousTier,
          toTier: newTier
        });
      }

      // Reset period coins
      userTier.previousTier = previousTier;
      userTier.currentTier = newTier;
      userTier.currentPeriodCoins = 0;
      userTier.lastTierCalculation = new Date();

      // Update tier valid until
      const tierValidUntil = new Date();
      tierValidUntil.setFullYear(tierValidUntil.getFullYear() + 1);
      userTier.tierValidUntil = tierValidUntil;

      await userTier.save({ session });
      await session.commitTransaction();

      return {
        newTier,
        downgraded,
        previousTier
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get tier benefits for a specific tier
   */
  getTierBenefits(tier: TierLevel): TierBenefits {
    return TIER_BENEFITS[tier];
  }

  /**
   * Get all tier benefits
   */
  getAllTierBenefits(): Record<TierLevel, TierBenefits> {
    return { ...TIER_BENEFITS };
  }

  /**
   * Check if user qualifies for a specific tier
   */
  async qualifiesForTier(userId: string, targetTier: TierLevel): Promise<boolean> {
    const userTier = await this.getOrCreateUserTier(userId);
    return this.isHigherTier(targetTier, userTier.currentTier as TierLevel) ||
           userTier.currentTier === targetTier;
  }

  /**
   * Get tier leaderboard
   */
  async getTierLeaderboard(
    tier: TierLevel,
    limit: number = 10
  ): Promise<{ userId: string; lifetimeCoins: number }[]> {
    const results = await UserTier.find({ currentTier: tier })
      .sort({ lifetimeCoins: -1 })
      .limit(limit)
      .select('userId lifetimeCoins')
      .lean();

    return results.map(r => ({
      userId: r.userId,
      lifetimeCoins: r.lifetimeCoins
    }));
  }

  /**
   * Get all users approaching tier upgrade
   */
  async getUsersNearUpgrade(threshold: number = 100): Promise<{
    userId: string;
    currentTier: TierLevel;
    coinsToNextTier: number;
  }[]> {
    const results = await UserTier.find({
      coinsToNextTier: { $lte: threshold, $gt: 0 }
    })
      .sort({ coinsToNextTier: 1 })
      .limit(100)
      .select('userId currentTier coinsToNextTier')
      .lean();

    return results.map(r => ({
      userId: r.userId,
      currentTier: r.currentTier as TierLevel,
      coinsToNextTier: r.coinsToNextTier
    }));
  }
}

// Export singleton instance
export const tierEngine = new TierEngineService();
