import { UnifiedAccount } from '../models';
import { LoyaltyTierModel } from '../models';
import { LoyaltyTierName } from '../types';
import { logger } from '../utils/logger';

export class TierService {
  /**
   * Get all tiers
   */
  async getAllTiers(): Promise<any[]> {
    try {
      return await LoyaltyTierModel.find().sort({ minPoints: 1 });
    } catch (error) {
      logger.error('Error fetching all tiers:', error);
      throw error;
    }
  }

  /**
   * Get a specific tier by name
   */
  async getTierByName(tierName: string): Promise<any | null> {
    try {
      return await LoyaltyTierModel.findOne({ name: tierName });
    } catch (error) {
      logger.error(`Error fetching tier ${tierName}:`, error);
      throw error;
    }
  }

  /**
   * Get the appropriate tier for given points
   */
  async getUserTier(totalPoints: number): Promise<any | null> {
    try {
      // Find the tier where minPoints <= totalPoints and maxPoints >= totalPoints
      const tier = await LoyaltyTierModel.findOne({
        minPoints: { $lte: totalPoints },
        $or: [
          { maxPoints: { $gte: totalPoints } },
          { maxPoints: -1 } // -1 represents infinity
        ]
      }).sort({ minPoints: -1 });

      return tier;
    } catch (error) {
      logger.error('Error calculating user tier:', error);
      throw error;
    }
  }

  /**
   * Upgrade account to a new tier
   */
  async upgradeTier(accountId: string, newTier: LoyaltyTierName): Promise<any | null> {
    try {
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      // Validate the tier exists
      const tier = await LoyaltyTierModel.findOne({ name: newTier });
      if (!tier) {
        throw new Error(`Tier ${newTier} does not exist`);
      }

      // Check if user qualifies for the tier
      if (account.totalPoints < tier.minPoints) {
        throw new Error(`Account does not qualify for ${newTier} tier. Minimum ${tier.minPoints} points required.`);
      }

      const previousTier = account.tier;
      account.tier = newTier;
      await account.save();

      logger.info(`Account ${accountId} upgraded from ${previousTier} to ${newTier}`);

      return account;
    } catch (error) {
      logger.error('Error upgrading tier:', error);
      throw error;
    }
  }

  /**
   * Get benefits for a specific tier
   */
  async getTierBenefits(tierName: string): Promise<string[]> {
    try {
      const tier = await LoyaltyTierModel.findOne({ name: tierName });
      if (!tier) {
        return [];
      }

      return tier.benefits;
    } catch (error) {
      logger.error(`Error fetching benefits for tier ${tierName}:`, error);
      throw error;
    }
  }

  /**
   * Get tier progression info (next tier, points needed)
   */
  async getTierProgression(totalPoints: number): Promise<any> {
    try {
      const currentTier = await this.getUserTier(totalPoints);

      // Get the next tier
      const nextTier = await LoyaltyTierModel.findOne({
        minPoints: { $gt: currentTier?.minPoints || 0 }
      }).sort({ minPoints: 1 });

      return {
        current: currentTier,
        next: nextTier,
        pointsToNextTier: nextTier
          ? Math.max(0, nextTier.minPoints - totalPoints)
          : 0,
        hasNextTier: !!nextTier
      };
    } catch (error) {
      logger.error('Error getting tier progression:', error);
      throw error;
    }
  }

  /**
   * Calculate bonus points for a tier upgrade
   */
  async calculateUpgradeBonus(accountId: string, newTier: LoyaltyTierName): Promise<number> {
    try {
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      const newTierData = await LoyaltyTierModel.findOne({ name: newTier });
      if (!newTierData) {
        throw new Error(`Tier ${newTier} does not exist`);
      }

      // Calculate tier upgrade bonuses based on tier differences
      const bonusTable: Record<LoyaltyTierName, number> = {
        bronze: 0,
        silver: 100,
        gold: 500,
        platinum: 2000,
        diamond: 5000
      };

      return bonusTable[newTier] || 0;
    } catch (error) {
      logger.error('Error calculating upgrade bonus:', error);
      throw error;
    }
  }

  /**
   * Review and update tier based on current points
   */
  async reviewAndUpdateTier(accountId: string): Promise<{ account: any; tierChanged: boolean }> {
    try {
      const account = await UnifiedAccount.findOne({ accountId });
      if (!account) {
        throw new Error('Account not found');
      }

      const newTier = await this.getUserTier(account.totalPoints);

      if (newTier && newTier.name !== account.tier) {
        const previousTier = account.tier;
        account.tier = newTier.name;
        await account.save();

        logger.info(`Account ${accountId} tier reviewed: ${previousTier} -> ${newTier.name}`);

        return { account, tierChanged: true };
      }

      return { account, tierChanged: false };
    } catch (error) {
      logger.error('Error reviewing tier:', error);
      throw error;
    }
  }

  /**
   * Initialize default tiers in database
   */
  async initializeDefaultTiers(): Promise<void> {
    try {
      await LoyaltyTierModel.seedDefaultTiers();
    } catch (error) {
      logger.error('Error initializing default tiers:', error);
      throw error;
    }
  }
}

export const tierService = new TierService();

export default tierService;