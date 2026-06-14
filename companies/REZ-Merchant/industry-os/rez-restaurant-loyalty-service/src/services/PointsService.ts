import { v4 as uuidv4 } from 'uuid';
import {
  CustomerPoints,
  ICustomerPoints,
} from '../models/CustomerPoints';
import { PointsTransaction } from '../models/PointsTransaction';
import { LoyaltyProgram, ILoyaltyProgram } from '../models/LoyaltyProgram';
import { Referral } from '../models/Referral';
import {
  POINTS_PER_RUPEE,
  TIER_THRESHOLDS,
  TIER_NAMES,
  TRANSACTION_TYPES,
  MINIMUM_SPEND_FOR_POINTS,
  MAX_POINTS_PER_TRANSACTION,
  REDIS_KEYS,
  REDIS_TTL,
} from '../config/constants';
import type { TierName } from '../config/constants';
import type Redis from 'ioredis';

export interface EarnPointsInput {
  customerId: string;
  programId: string;
  orderId: string;
  restaurantId: string;
  orderAmount: number; // in rupees
  orderDate?: Date;
}

export interface EarnPointsResult {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  tier: TierName;
  transactionId: string;
  bonusApplied?: string;
}

export class PointsService {
  constructor(private redis: Redis) {}

  /**
   * Calculate points based on order amount with tier multiplier
   */
  calculatePoints(
    orderAmount: number,
    tierMultiplier: number,
    pointsPerRupee: number = POINTS_PER_RUPEE
  ): number {
    if (orderAmount < MINIMUM_SPEND_FOR_POINTS) {
      return 0;
    }
    const rawPoints = Math.floor(orderAmount * pointsPerRupee * tierMultiplier);
    return Math.min(rawPoints, MAX_POINTS_PER_TRANSACTION);
  }

  /**
   * Determine tier based on lifetime points
   */
  calculateTier(lifetimePoints: number): {
    tier: TierName;
    nextTier: TierName | null;
    pointsToNextTier: number;
    tierProgress: number;
  } {
    const tiers = [...TIER_NAMES].reverse(); // Start from highest
    let currentTier: TierName = 'BRONZE';
    let nextTier: TierName | null = null;
    let pointsToNextTier = TIER_THRESHOLDS.SILVER;
    let tierProgress = 0;

    for (const tier of tiers) {
      if (lifetimePoints >= TIER_THRESHOLDS[tier]) {
        currentTier = tier;
        const currentIndex = TIER_NAMES.indexOf(tier);

        if (currentIndex < TIER_NAMES.length - 1) {
          nextTier = TIER_NAMES[currentIndex + 1];
          const nextThreshold = TIER_THRESHOLDS[nextTier];
          const currentThreshold = TIER_THRESHOLDS[tier];
          const pointsInTier = lifetimePoints - currentThreshold;
          const tierRange = nextThreshold - currentThreshold;
          tierProgress = Math.round((pointsInTier / tierRange) * 100);
          pointsToNextTier = nextThreshold - lifetimePoints;
        } else {
          nextTier = null;
          pointsToNextTier = 0;
          tierProgress = 100;
        }
        break;
      }
    }

    return { tier: currentTier, nextTier, pointsToNextTier, tierProgress };
  }

  /**
   * Earn points from a purchase
   */
  async earnPoints(input: EarnPointsInput): Promise<EarnPointsResult> {
    const { customerId, programId, orderId, restaurantId, orderAmount, orderDate = new Date() } = input;

    // Get or create customer points record
    let customerPoints = await CustomerPoints.findOne({ customerId, programId });
    const program = await LoyaltyProgram.findOne({ programId });

    if (!program) {
      throw new Error('Loyalty program not found');
    }

    const session = await CustomerPoints.startSession();
    session.startTransaction();

    try {
      // Create or update customer points
      if (!customerPoints) {
        customerPoints = new CustomerPoints({
          customerId,
          programId,
          currentPoints: 0,
          lifetimePoints: 0,
        });
      }

      // Calculate tier and points
      const { tier } = this.calculateTier(customerPoints.lifetimePoints);
      const tierMultiplier = program.tierMultipliers[tier];
      const pointsEarned = this.calculatePoints(orderAmount, tierMultiplier, program.pointsPerRupee);

      // Update customer points
      customerPoints.currentPoints += pointsEarned;
      customerPoints.lifetimePoints += pointsEarned;
      customerPoints.lastActivityDate = orderDate;

      // Update tier info
      const tierInfo = this.calculateTier(customerPoints.lifetimePoints);
      customerPoints.tier = tierInfo.tier;
      customerPoints.tierProgress = tierInfo.tierProgress;
      customerPoints.nextTier = tierInfo.nextTier;
      customerPoints.pointsToNextTier = tierInfo.pointsToNextTier;

      // Update restaurant-specific pooled points
      const restaurantPoints = customerPoints.restaurantPoints.get(restaurantId) || 0;
      customerPoints.restaurantPoints.set(restaurantId, restaurantPoints + pointsEarned);

      await customerPoints.save({ session });

      // Create transaction record
      const transactionId = uuidv4();
      await PointsTransaction.create(
        [
          {
            transactionId,
            customerId,
            programId,
            type: TRANSACTION_TYPES.EARN,
            points: pointsEarned,
            balanceAfter: customerPoints.currentPoints,
            orderId,
            restaurantId,
            description: `Earned ${pointsEarned} points for ₹${orderAmount} order`,
            status: 'ACTIVE',
            expiresAt: new Date(orderDate.getTime() + program.pointsExpiryMonths * 30 * 24 * 60 * 60 * 1000),
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Update Redis cache
      await this.redis.setex(
        REDIS_KEYS.POINTS_BALANCE(customerId),
        REDIS_TTL.POINTS_CACHE,
        customerPoints.currentPoints.toString()
      );

      return {
        success: true,
        pointsEarned,
        newBalance: customerPoints.currentPoints,
        tier: customerPoints.tier,
        transactionId,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get customer points summary
   */
  async getPointsSummary(customerId: string, programId: string): Promise<Partial<ICustomerPoints> | null> {
    // Try cache first
    const cachedBalance = await this.redis.get(REDIS_KEYS.POINTS_BALANCE(customerId));

    const customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      return null;
    }

    // Calculate points expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringTransactions = await PointsTransaction.find({
      customerId,
      expiresAt: { $lte: thirtyDaysFromNow, $gt: new Date() },
      status: 'ACTIVE',
    });

    const expiringPointsSoon = expiringTransactions.reduce((sum, tx) => sum + Math.abs(tx.points), 0);

    return {
      ...customerPoints.toObject(),
      currentPoints: cachedBalance ? parseInt(cachedBalance, 10) : customerPoints.currentPoints,
      expiringPointsSoon,
    };
  }

  /**
   * Get points transaction history
   */
  async getTransactionHistory(
    customerId: string,
    programId: string,
    options: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<{ transactions: typeof PointsTransaction[]; total: number }> {
    const { limit = 20, offset = 0, type } = options;

    const query: Record<string, unknown> = { customerId, programId };
    if (type) {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      PointsTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      PointsTransaction.countDocuments(query),
    ]);

    return { transactions, total };
  }

  /**
   * Get progress to next tier
   */
  async getTierProgress(customerId: string, programId: string): Promise<{
    currentTier: TierName;
    nextTier: TierName | null;
    progress: number;
    pointsToNextTier: number;
    lifetimePoints: number;
  } | null> {
    const customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      return null;
    }

    return {
      currentTier: customerPoints.tier as TierName,
      nextTier: customerPoints.nextTier as TierName | null,
      progress: customerPoints.tierProgress,
      pointsToNextTier: customerPoints.pointsToNextTier,
      lifetimePoints: customerPoints.lifetimePoints,
    };
  }

  /**
   * Get restaurant-specific pooled points
   */
  async getRestaurantPooledPoints(
    customerId: string,
    programId: string
  ): Promise<Map<string, number> | null> {
    const customerPoints = await CustomerPoints.findOne({ customerId, programId });

    if (!customerPoints) {
      return null;
    }

    return customerPoints.restaurantPoints;
  }
}
