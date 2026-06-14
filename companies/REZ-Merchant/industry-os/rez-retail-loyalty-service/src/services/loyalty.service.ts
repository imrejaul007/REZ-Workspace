import { LoyaltyProgram, ILoyaltyProgram } from '../models/LoyaltyProgram';
import { Reward, IReward } from '../models/Reward';
import { CustomerLoyalty, PointsTransaction } from '../models/CustomerLoyalty';
import { RewardType, PointsTransaction as PointsTransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { redisClient } from '../config/redis';

export class LoyaltyService {
  private readonly CACHE_TTL = 3600; // 1 hour

  // Default tier configuration
  private readonly defaultTiers = [
    { tier: 'bronze', name: 'Bronze', minPoints: 0, pointsMultiplier: 1, discountPercent: 0, birthdayBonus: 50, anniversaryBonus: 0, perks: [] },
    { tier: 'silver', name: 'Silver', minPoints: 5000, pointsMultiplier: 1.25, discountPercent: 2, birthdayBonus: 100, anniversaryBonus: 50, perks: ['Free delivery on orders above 500'] },
    { tier: 'gold', name: 'Gold', minPoints: 20000, pointsMultiplier: 1.5, discountPercent: 5, birthdayBonus: 200, anniversaryBonus: 100, perks: ['Free delivery on orders above 300', 'Early access to sales'] },
    { tier: 'platinum', name: 'Platinum', minPoints: 50000, pointsMultiplier: 2, discountPercent: 8, birthdayBonus: 500, anniversaryBonus: 250, perks: ['Free delivery always', 'Priority support', 'Exclusive events'] },
    { tier: 'diamond', name: 'Diamond', minPoints: 100000, pointsMultiplier: 3, discountPercent: 12, birthdayBonus: 1000, anniversaryBonus: 500, perks: ['Everything in Platinum', 'Personal shopping assistant', 'VIP events'] },
  ];

  /**
   * Create or get default loyalty program
   */
  async getOrCreateDefaultProgram(): Promise<ILoyaltyProgram> {
    const cacheKey = 'loyalty:program:default';

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      let program = await LoyaltyProgram.findOne({ isActive: true });
      if (!program) {
        program = new LoyaltyProgram({
          id: uuidv4(),
          name: 'REZ Retail Loyalty Program',
          description: 'Earn points on every purchase and unlock exclusive rewards',
          pointsPerRupee: 1,
          rupeesPerPoint: 0.25,
          minRedemptionPoints: 100,
          welcomePoints: 100,
          referralPoints: 250,
          tiers: this.defaultTiers,
          isActive: true,
        });
        await program.save();
      }

      const result = program.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Error getting default program:', error);
      const program = await LoyaltyProgram.findOne({ isActive: true });
      if (!program) {
        throw new Error('No loyalty program found');
      }
      return program.toJSON();
    }
  }

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(customerId: string): Promise<ICustomerLoyaltyDocument | null> {
    try {
      const program = await this.getOrCreateDefaultProgram();

      let loyalty = await CustomerLoyalty.findOne({ customerId });
      if (loyalty) {
        return loyalty;
      }

      loyalty = new CustomerLoyalty({
        id: uuidv4(),
        customerId,
        programId: program.id,
        currentTier: 'bronze',
        totalPoints: program.welcomePoints,
        availablePoints: program.welcomePoints,
        lifetimePoints: program.welcomePoints,
        pointsEarned: program.welcomePoints,
        nextTier: 'silver',
        pointsToNextTier: this.defaultTiers[1].minPoints - program.welcomePoints,
      });

      await loyalty.save();

      // Record welcome bonus transaction
      await this.recordTransaction(customerId, 'bonus', program.welcomePoints, program.welcomePoints, 'Welcome bonus points');

      logger.info(`Customer ${customerId} enrolled in loyalty program`);
      return loyalty;
    } catch (error) {
      logger.error('Error enrolling customer:', error);
      throw error;
    }
  }

  /**
   * Get customer loyalty info
   */
  async getCustomerLoyalty(customerId: string): Promise<ICustomerLoyaltyDocument | null> {
    const cacheKey = `loyalty:customer:${customerId}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const loyalty = await CustomerLoyalty.findOne({ customerId });
      if (!loyalty) return null;

      // Refresh tier progress
      await this.updateTierProgress(loyalty);

      const result = loyalty.toJSON();
      await redisClient.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error) {
      logger.error('Error fetching customer loyalty:', error);
      return await CustomerLoyalty.findOne({ customerId });
    }
  }

  /**
   * Earn points for purchase
   */
  async earnPoints(customerId: string, amount: number, orderId?: string): Promise<ICustomerLoyaltyDocument | null> {
    try {
      const program = await this.getOrCreateDefaultProgram();
      let loyalty = await CustomerLoyalty.findOne({ customerId });

      if (!loyalty) {
        loyalty = (await this.enrollCustomer(customerId)) as ICustomerLoyaltyDocument;
      }

      // Get tier multiplier
      const tierConfig = this.defaultTiers.find(t => t.tier === loyalty!.currentTier);
      const multiplier = tierConfig?.pointsMultiplier || 1;

      // Calculate points
      const pointsEarned = Math.floor(amount * program.pointsPerRupee * multiplier);

      // Update loyalty
      loyalty.totalPoints += pointsEarned;
      loyalty.availablePoints += pointsEarned;
      loyalty.lifetimePoints += pointsEarned;
      loyalty.pointsEarned += pointsEarned;
      loyalty.lastActivityDate = new Date();

      // Check tier upgrade
      await this.checkTierUpgrade(loyalty);

      await loyalty.save();

      // Record transaction
      await this.recordTransaction(customerId, 'earned', pointsEarned, loyalty.availablePoints, `Purchase points for order ${orderId}`, orderId);

      // Expire old points if configured
      if (program.pointsExpirationDays) {
        await this.expireOldPoints(customerId, program.pointsExpirationDays);
      }

      await this.invalidateCache(customerId);
      logger.info(`Points earned for customer ${customerId}: ${pointsEarned}`);

      return loyalty;
    } catch (error) {
      logger.error('Error earning points:', error);
      throw error;
    }
  }

  /**
   * Redeem points for reward
   */
  async redeemPoints(customerId: string, rewardId: string, orderId?: string): Promise<{ success: boolean; message: string; loyalty?: ICustomerLoyaltyDocument }> {
    try {
      const reward = await Reward.findOne({ id: rewardId, isActive: true });
      if (!reward) {
        return { success: false, message: 'Reward not found or inactive' };
      }

      let loyalty = await CustomerLoyalty.findOne({ customerId });
      if (!loyalty) {
        return { success: false, message: 'Customer not enrolled in loyalty program' };
      }

      if (loyalty.availablePoints < reward.pointsCost) {
        return { success: false, message: 'Insufficient points' };
      }

      if (reward.usageLimit && reward.usageCount >= reward.usageLimit) {
        return { success: false, message: 'Reward usage limit reached' };
      }

      // Deduct points
      loyalty.availablePoints -= reward.pointsCost;
      loyalty.pointsRedeemed += reward.pointsCost;
      loyalty.lastActivityDate = new Date();

      // Update reward usage
      reward.usageCount += 1;
      await reward.save();

      await loyalty.save();

      // Record transaction
      await this.recordTransaction(customerId, 'redeemed', -reward.pointsCost, loyalty.availablePoints, `Redeemed ${reward.name}`, rewardId);

      await this.invalidateCache(customerId);
      logger.info(`Points redeemed by customer ${customerId} for reward ${rewardId}`);

      return { success: true, message: 'Points redeemed successfully', loyalty };
    } catch (error) {
      logger.error('Error redeeming points:', error);
      throw error;
    }
  }

  /**
   * Calculate points value
   */
  async calculatePointsValue(points: number): Promise<number> {
    const program = await this.getOrCreateDefaultProgram();
    return points * program.rupeesPerPoint;
  }

  /**
   * Get available rewards
   */
  async getAvailableRewards(customerId?: string): Promise<IReward[]> {
    const cacheKey = `loyalty:rewards:available`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const now = new Date();
      const rewards = await Reward.find({
        isActive: true,
        $or: [
          { validFrom: { $exists: false } },
          { validFrom: { $lte: now } },
        ],
        $and: [
          {
            $or: [
              { validUntil: { $exists: false } },
              { validUntil: { $gte: now } },
            ],
          },
        ],
      });

      const result = rewards.map(r => r.toJSON());
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result)); // 5 min cache
      return result;
    } catch (error) {
      logger.error('Error fetching rewards:', error);
      return await Reward.find({ isActive: true }).then(r => r.map(reward => reward.toJSON()));
    }
  }

  /**
   * Claim birthday bonus
   */
  async claimBirthdayBonus(customerId: string): Promise<ICustomerLoyaltyDocument | null> {
    try {
      const loyalty = await CustomerLoyalty.findOne({ customerId });
      if (!loyalty) return null;

      if (loyalty.birthdayPointsClaimed) {
        throw new Error('Birthday bonus already claimed this year');
      }

      const tierConfig = this.defaultTiers.find(t => t.tier === loyalty.currentTier);
      const bonusPoints = tierConfig?.birthdayBonus || 50;

      loyalty.totalPoints += bonusPoints;
      loyalty.availablePoints += bonusPoints;
      loyalty.lifetimePoints += bonusPoints;
      loyalty.pointsEarned += bonusPoints;
      loyalty.birthdayPointsClaimed = true;
      loyalty.lastActivityDate = new Date();

      await loyalty.save();
      await this.recordTransaction(customerId, 'bonus', bonusPoints, loyalty.availablePoints, 'Birthday bonus');

      await this.invalidateCache(customerId);
      return loyalty;
    } catch (error) {
      logger.error('Error claiming birthday bonus:', error);
      throw error;
    }
  }

  /**
   * Get points history
   */
  async getPointsHistory(customerId: string, limit = 50): Promise<PointsTransactionType[]> {
    const transactions = await PointsTransaction.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return transactions.map(t => t.toJSON());
  }

  /**
   * Update tier progress
   */
  private async updateTierProgress(loyalty: ICustomerLoyaltyDocument): Promise<void> {
    const currentTierIndex = this.defaultTiers.findIndex(t => t.tier === loyalty.currentTier);
    const nextTier = this.defaultTiers[currentTierIndex + 1];

    if (nextTier) {
      const currentTierMin = this.defaultTiers[currentTierIndex].minPoints;
      const nextTierMin = nextTier.minPoints;
      const progress = ((loyalty.lifetimePoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
      loyalty.tierProgress = Math.min(100, Math.max(0, progress));
      loyalty.pointsToNextTier = Math.max(0, nextTierMin - loyalty.lifetimePoints);
      loyalty.nextTier = nextTier.tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    } else {
      loyalty.tierProgress = 100;
      loyalty.pointsToNextTier = 0;
      loyalty.nextTier = null;
    }
  }

  /**
   * Check and apply tier upgrade
   */
  private async checkTierUpgrade(loyalty: ICustomerLoyaltyDocument): Promise<void> {
    for (let i = this.defaultTiers.length - 1; i >= 0; i--) {
      const tier = this.defaultTiers[i];
      if (loyalty.lifetimePoints >= tier.minPoints && loyalty.currentTier !== tier.tier) {
        const oldTier = loyalty.currentTier;
        loyalty.currentTier = tier.tier as 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
        logger.info(`Customer ${loyalty.customerId} tier upgraded: ${oldTier} -> ${loyalty.currentTier}`);
        break;
      }
    }
  }

  /**
   * Record points transaction
   */
  private async recordTransaction(
    customerId: string,
    type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus',
    points: number,
    balance: number,
    description: string,
    rewardId?: string
  ): Promise<void> {
    const transaction = new PointsTransaction({
      id: uuidv4(),
      customerId,
      type,
      points,
      balance,
      description,
      rewardId,
    });
    await transaction.save();
  }

  /**
   * Expire old points
   */
  private async expireOldPoints(customerId: string, expirationDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - expirationDays);

    const expiredTransactions = await PointsTransaction.find({
      customerId,
      type: 'earned',
      isExpired: false,
      createdAt: { $lt: cutoffDate },
    });

    for (const tx of expiredTransactions) {
      tx.isExpired = true;
      await tx.save();
    }
  }

  /**
   * Invalidate cache
   */
  private async invalidateCache(customerId?: string): Promise<void> {
    try {
      if (customerId) {
        await redisClient.del(`loyalty:customer:${customerId}`);
      }
      await redisClient.del('loyalty:program:default');
      await redisClient.del('loyalty:rewards:available');
    } catch (error) {
      logger.warn('Cache invalidation failed:', error);
    }
  }
}

export const loyaltyService = new LoyaltyService();
export default loyaltyService;
