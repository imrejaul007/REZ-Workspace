import { v4 as uuidv4 } from 'uuid';
import {
  CustomerPoints,
} from '../models/CustomerPoints';
import { Redemption, IReward, IRedemption } from '../models/Redemption';
import { PointsTransaction } from '../models/PointsTransaction';
import { LoyaltyProgram } from '../models/LoyaltyProgram';
import { TierService, TIER_BENEFITS } from './TierService';
import {
  TRANSACTION_TYPES,
  STATUS,
  REDEMPTION_RATIO,
  REDIS_KEYS,
  REDIS_TTL,
} from '../config/constants';
import type { TierName } from '../config/constants';
import type Redis from 'ioredis';

export interface RedeemPointsInput {
  customerId: string;
  programId: string;
  restaurantId: string;
  points: number;
  rewardType: IReward['rewardType'];
  orderId?: string;
}

export interface RedeemPointsResult {
  success: boolean;
  redemptionId: string;
  pointsUsed: number;
  monetaryValue: number;
  reward: IReward;
  newBalance: number;
  expiresAt: Date;
}

export interface RewardDefinition {
  type: IReward['rewardType'];
  name: string;
  description: string;
  pointsCost: number;
  monetaryValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
}

export class RedemptionService {
  private tierService: TierService;

  constructor(private redis: Redis) {
    this.tierService = new TierService();
  }

  /**
   * Get available rewards for a customer based on their tier
   */
  async getAvailableRewards(
    customerId: string,
    programId: string,
    restaurantId: string
  ): Promise<RewardDefinition[]> {
    const [customerPoints, program] = await Promise.all([
      CustomerPoints.findOne({ customerId, programId }),
      LoyaltyProgram.findOne({ programId }),
    ]);

    if (!customerPoints || !program) {
      return [];
    }

    const tier = customerPoints.tier as TierName;
    const tierBenefits = TIER_BENEFITS[tier];
    const balance = customerPoints.currentPoints;

    const rewards: RewardDefinition[] = [];

    // Free Dish reward
    const freeDishCost = 500;
    if (balance >= freeDishCost) {
      rewards.push({
        type: 'FREE_DISH',
        name: 'Free Dish',
        description: 'Get a complimentary dish from select menu items',
        pointsCost: freeDishCost,
        monetaryValue: freeDishCost / REDEMPTION_RATIO,
        minOrderValue: 300,
      });
    }

    // Discount rewards based on tier
    const discountRewards = [
      { points: 100, discount: 10, name: '10% Off' },
      { points: 250, discount: 25, name: '25% Off (up to ₹100)' },
      { points: 500, discount: 50, name: '50% Off (up to ₹250)' },
      { points: 1000, discount: 100, name: '100% Off (up to ₹500)' },
    ];

    for (const reward of discountRewards) {
      if (balance >= reward.points) {
        rewards.push({
          type: 'DISCOUNT',
          name: reward.name,
          description: `Get ${reward.name} on your order`,
          pointsCost: reward.points,
          monetaryValue: reward.discount,
          minOrderValue: reward.discount * 2,
          maxDiscount: reward.discount,
        });
      }
    }

    // Cashback reward
    const cashbackCost = 200;
    if (balance >= cashbackCost) {
      rewards.push({
        type: 'CASHBACK',
        name: '₹2 Cashback',
        description: 'Get ₹2 cashback as wallet credit',
        pointsCost: cashbackCost,
        monetaryValue: 2,
      });
    }

    // VIP Access for Gold/Platinum
    if (tier === 'GOLD' || tier === 'PLATINUM') {
      const vipCost = 1000;
      if (balance >= vipCost) {
        rewards.push({
          type: 'VIP_ACCESS',
          name: 'VIP Experience',
          description: 'Priority seating and exclusive chef specials',
          pointsCost: vipCost,
          monetaryValue: 500,
          minOrderValue: 1000,
        });
      }
    }

    return rewards;
  }

  /**
   * Redeem points for a reward
   */
  async redeemPoints(input: RedeemPointsInput): Promise<RedeemPointsResult> {
    const { customerId, programId, restaurantId, points, rewardType, orderId } = input;

    // Validate customer has enough points
    const customerPoints = await CustomerPoints.findOne({ customerId, programId });
    if (!customerPoints) {
      throw new Error('Customer points record not found');
    }

    if (customerPoints.currentPoints < points) {
      throw new Error('Insufficient points for redemption');
    }

    // Check daily redemption limit
    const today = new Date().toISOString().split('T')[0];
    const dailyKey = REDIS_KEYS.DAILY_REDEMPTION(customerId, today);
    const dailyCount = await this.redis.get(dailyKey);
    if (dailyCount && parseInt(dailyCount, 10) >= 3) {
      throw new Error('Daily redemption limit reached');
    }

    // Calculate monetary value
    const tier = customerPoints.tier as TierName;
    const tierBenefits = TIER_BENEFITS[tier];
    const baseValue = points / REDEMPTION_RATIO;
    const monetaryValue = Math.round(baseValue * (tierBenefits.redemptionPercentage / 100) * 100) / 100;

    // Build reward object
    const reward = this.buildReward(rewardType, monetaryValue);

    // Validate reward requirements
    if (reward.minOrderValue && monetaryValue * 2 < reward.minOrderValue) {
      throw new Error(`Minimum order value of ₹${reward.minOrderValue} required`);
    }

    const session = await CustomerPoints.startSession();
    session.startTransaction();

    try {
      // Deduct points
      customerPoints.currentPoints -= points;
      await customerPoints.save({ session });

      // Create redemption record
      const redemptionId = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Rewards expire in 30 days

      const redemption = await Redemption.create(
        [
          {
            redemptionId,
            customerId,
            programId,
            reward,
            pointsUsed: points,
            monetaryValue,
            orderId,
            restaurantId,
            status: 'ACTIVE',
            expiresAt,
          },
        ],
        { session }
      );

      // Create transaction record
      const transactionId = uuidv4();
      await PointsTransaction.create(
        [
          {
            transactionId,
            customerId,
            programId,
            type: TRANSACTION_TYPES.REDEEM,
            points: -points,
            balanceAfter: customerPoints.currentPoints,
            orderId,
            restaurantId,
            description: `Redeemed ${points} points for ${reward.name}`,
            status: 'ACTIVE',
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Update Redis
      await this.redis.incr(dailyKey);
      await this.redis.expire(dailyKey, REDIS_TTL.DAILY_REDEMPTION);
      await this.redis.setex(
        REDIS_KEYS.POINTS_BALANCE(customerId),
        REDIS_TTL.POINTS_CACHE,
        customerPoints.currentPoints.toString()
      );

      return {
        success: true,
        redemptionId,
        pointsUsed: points,
        monetaryValue,
        reward,
        newBalance: customerPoints.currentPoints,
        expiresAt,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Build reward object based on type
   */
  private buildReward(type: IReward['rewardType'], monetaryValue: number): IReward {
    switch (type) {
      case 'FREE_DISH':
        return {
          rewardType: 'FREE_DISH',
          minOrderValue: 300,
        };
      case 'DISCOUNT':
        return {
          rewardType: 'DISCOUNT',
          discountAmount: monetaryValue,
          maxDiscount: monetaryValue,
        };
      case 'CASHBACK':
        return {
          rewardType: 'CASHBACK',
          cashbackAmount: monetaryValue,
        };
      case 'VIP_ACCESS':
        return {
          rewardType: 'VIP_ACCESS',
        };
      default:
        throw new Error('Invalid reward type');
    }
  }

  /**
   * Get customer's redemption history
   */
  async getRedemptionHistory(
    customerId: string,
    programId: string,
    options: { limit?: number; offset?: number; status?: STATUS } = {}
  ): Promise<{ redemptions: IRedemption[]; total: number }> {
    const { limit = 20, offset = 0, status } = options;

    const query: Record<string, unknown> = { customerId, programId };
    if (status) {
      query.status = status;
    }

    const [redemptions, total] = await Promise.all([
      Redemption.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Redemption.countDocuments(query),
    ]);

    return { redemptions, total };
  }

  /**
   * Get active, unused redemptions for a customer
   */
  async getActiveRedemptions(customerId: string, restaurantId?: string): Promise<IRedemption[]> {
    const query: Record<string, unknown> = {
      customerId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    };

    if (restaurantId) {
      query.restaurantId = restaurantId;
    }

    return Redemption.find(query).sort({ expiresAt: 1 }).lean();
  }

  /**
   * Use a redemption (mark as redeemed)
   */
  async useRedemption(redemptionId: string, orderId: string): Promise<IRedemption> {
    const redemption = await Redemption.findOne({ redemptionId });

    if (!redemption) {
      throw new Error('Redemption not found');
    }

    if (redemption.status !== 'ACTIVE') {
      throw new Error('Redemption is not active');
    }

    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      throw new Error('Redemption has expired');
    }

    redemption.status = 'ACTIVE';
    redemption.redeemedAt = new Date();
    redemption.orderId = orderId;

    await redemption.save();

    return redemption;
  }

  /**
   * Cancel an unused redemption
   */
  async cancelRedemption(redemptionId: string): Promise<{ pointsRefunded: number }> {
    const session = await Redemption.startSession();
    session.startTransaction();

    try {
      const redemption = await Redemption.findOne({ redemptionId }).session(session);

      if (!redemption) {
        throw new Error('Redemption not found');
      }

      if (redemption.status !== 'ACTIVE') {
        throw new Error('Redemption is not active');
      }

      // Refund points
      const customerPoints = await CustomerPoints.findOne({
        customerId: redemption.customerId,
        programId: redemption.programId,
      }).session(session);

      if (customerPoints) {
        customerPoints.currentPoints += redemption.pointsUsed;
        await customerPoints.save({ session });

        // Create refund transaction
        await PointsTransaction.create(
          [
            {
              transactionId: uuidv4(),
              customerId: redemption.customerId,
              programId: redemption.programId,
              type: 'ADJUST',
              points: redemption.pointsUsed,
              balanceAfter: customerPoints.currentPoints,
              description: `Refunded ${redemption.pointsUsed} points for cancelled redemption`,
              status: 'ACTIVE',
            },
          ],
          { session }
        );
      }

      // Cancel redemption
      redemption.status = 'CANCELLED';
      await redemption.save({ session });

      await session.commitTransaction();

      return { pointsRefunded: redemption.pointsUsed };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
