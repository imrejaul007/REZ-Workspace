import { Customer, Sale, ICustomer } from '../models';
import { logger } from '../utils/logger';

export interface LoyaltyPointsInfo {
  customerId: string;
  currentPoints: number;
  tier: string;
  tierProgress: {
    currentTier: string;
    nextTier: string | null;
    pointsNeeded: number;
    progressPercentage: number;
  };
  lifetimePoints: number;
  availableRewards: number;
  pointsValue: number; // in dollars
  memberSince: Date;
  benefits: string[];
}

export interface PointsTransaction {
  type: 'earn' | 'redeem' | 'adjust' | 'expire';
  points: number;
  balance: number;
  description: string;
  timestamp: Date;
}

export interface TierBenefits {
  tier: string;
  pointsMultiplier: number;
  discountPercentage: number;
  freeShippingThreshold: number;
  birthdayBonus: number;
  exclusiveAccess: boolean;
}

const TIER_CONFIG: Record<string, TierBenefits> = {
  bronze: {
    tier: 'bronze',
    pointsMultiplier: 1,
    discountPercentage: 0,
    freeShippingThreshold: 100,
    birthdayBonus: 50,
    exclusiveAccess: false,
  },
  silver: {
    tier: 'silver',
    pointsMultiplier: 1.25,
    discountPercentage: 5,
    freeShippingThreshold: 75,
    birthdayBonus: 100,
    exclusiveAccess: false,
  },
  gold: {
    tier: 'gold',
    pointsMultiplier: 1.5,
    discountPercentage: 10,
    freeShippingThreshold: 50,
    birthdayBonus: 200,
    exclusiveAccess: true,
  },
  platinum: {
    tier: 'platinum',
    pointsMultiplier: 2,
    discountPercentage: 15,
    freeShippingThreshold: 0, // free shipping always
    birthdayBonus: 500,
    exclusiveAccess: true,
  },
};

const TIER_THRESHOLDS: Record<string, number> = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 15000,
};

export class LoyaltyAgent {
  async getLoyaltyInfo(
    customerIdOrPhone: string
  ): Promise<LoyaltyPointsInfo | null> {
    try {
      const customer = await this.findCustomer(customerIdOrPhone);
      if (!customer) return null;

      const tierConfig = TIER_CONFIG[customer.tier];
      const nextTier = this.getNextTier(customer.tier);
      const pointsNeeded = nextTier
        ? TIER_THRESHOLDS[nextTier] - customer.loyaltyPoints
        : 0;
      const progressPercentage =
        nextTier && TIER_THRESHOLDS[nextTier] > 0
          ? Math.min(
              100,
              (customer.loyaltyPoints / TIER_THRESHOLDS[nextTier]) * 100
            )
          : 100;

      const pointsValue = customer.loyaltyPoints * 0.01; // 1 point = $0.01

      const benefits = this.getTierBenefits(customer.tier);

      logger.info('Loyalty info retrieved', {
        customerId: customer._id,
        tier: customer.tier,
        points: customer.loyaltyPoints,
      });

      return {
        customerId: customer._id.toString(),
        currentPoints: customer.loyaltyPoints,
        tier: customer.tier,
        tierProgress: {
          currentTier: customer.tier,
          nextTier,
          pointsNeeded: Math.max(0, pointsNeeded),
          progressPercentage: Math.round(progressPercentage),
        },
        lifetimePoints: customer.totalSpent, // In real scenario, track separately
        availableRewards: Math.floor(customer.loyaltyPoints / 100),
        pointsValue: Math.round(pointsValue * 100) / 100,
        memberSince: customer.createdAt,
        benefits,
      };
    } catch (error) {
      logger.error('Get loyalty info failed', { error });
      throw error;
    }
  }

  async earnPoints(
    customerIdOrPhone: string,
    purchaseAmount: number
  ): Promise<{
    success: boolean;
    pointsEarned: number;
    newBalance: number;
    tierUpgraded: boolean;
    newTier?: string;
    message: string;
  }> {
    try {
      const customer = await this.findCustomer(customerIdOrPhone);
      if (!customer) {
        return {
          success: false,
          pointsEarned: 0,
          newBalance: 0,
          tierUpgraded: false,
          message: 'Customer not found',
        };
      }

      const tierConfig = TIER_CONFIG[customer.tier];
      const basePoints = Math.floor(purchaseAmount); // 1 point per $1
      const pointsEarned = Math.floor(basePoints * tierConfig.pointsMultiplier);
      const previousTier = customer.tier;

      customer.loyaltyPoints += pointsEarned;
      await customer.save();

      const tierUpgraded = customer.tier !== previousTier;

      logger.info('Points earned', {
        customerId: customer._id,
        pointsEarned,
        purchaseAmount,
        tierUpgraded,
      });

      return {
        success: true,
        pointsEarned,
        newBalance: customer.loyaltyPoints,
        tierUpgraded,
        newTier: tierUpgraded ? customer.tier : undefined,
        message: tierUpgraded
          ? `Congratulations! You've been upgraded to ${customer.tier} tier! You earned ${pointsEarned} points.`
          : `You earned ${pointsEarned} points!`,
      };
    } catch (error) {
      logger.error('Earn points failed', { error });
      throw error;
    }
  }

  async redeemPoints(
    customerIdOrPhone: string,
    pointsToRedeem: number
  ): Promise<{
    success: boolean;
    pointsRedeemed: number;
    newBalance: number;
    discountAmount: number;
    message: string;
  }> {
    try {
      const customer = await this.findCustomer(customerIdOrPhone);
      if (!customer) {
        return {
          success: false,
          pointsRedeemed: 0,
          newBalance: 0,
          discountAmount: 0,
          message: 'Customer not found',
        };
      }

      if (customer.loyaltyPoints < pointsToRedeem) {
        return {
          success: false,
          pointsRedeemed: 0,
          newBalance: customer.loyaltyPoints,
          discountAmount: 0,
          message: `Insufficient points. You have ${customer.loyaltyPoints} points.`,
        };
      }

      const discountAmount = pointsToRedeem * 0.01; // 100 points = $1
      const minRedeem = 100;

      if (pointsToRedeem < minRedeem) {
        return {
          success: false,
          pointsRedeemed: 0,
          newBalance: customer.loyaltyPoints,
          discountAmount: 0,
          message: `Minimum redemption is ${minRedeem} points.`,
        };
      }

      customer.loyaltyPoints -= pointsToRedeem;
      await customer.save();

      logger.info('Points redeemed', {
        customerId: customer._id,
        pointsRedeemed: pointsToRedeem,
        discountAmount,
      });

      return {
        success: true,
        pointsRedeemed: pointsToRedeem,
        newBalance: customer.loyaltyPoints,
        discountAmount: Math.round(discountAmount * 100) / 100,
        message: `Successfully redeemed ${pointsToRedeem} points for $${discountAmount.toFixed(2)} discount.`,
      };
    } catch (error) {
      logger.error('Redeem points failed', { error });
      throw error;
    }
  }

  async adjustPoints(
    customerIdOrPhone: string,
    points: number,
    operation: 'add' | 'subtract' | 'set'
  ): Promise<{
    success: boolean;
    previousBalance: number;
    newBalance: number;
    message: string;
  }> {
    try {
      const customer = await this.findCustomer(customerIdOrPhone);
      if (!customer) {
        return {
          success: false,
          previousBalance: 0,
          newBalance: 0,
          message: 'Customer not found',
        };
      }

      const previousBalance = customer.loyaltyPoints;

      switch (operation) {
        case 'add':
          customer.loyaltyPoints += points;
          break;
        case 'subtract':
          customer.loyaltyPoints = Math.max(0, customer.loyaltyPoints - points);
          break;
        case 'set':
          customer.loyaltyPoints = Math.max(0, points);
          break;
      }

      await customer.save();

      logger.info('Points adjusted', {
        customerId: customer._id,
        operation,
        points,
        previousBalance,
        newBalance: customer.loyaltyPoints,
      });

      return {
        success: true,
        previousBalance,
        newBalance: customer.loyaltyPoints,
        message: `Points ${operation === 'add' ? 'added' : operation === 'subtract' ? 'subtracted' : 'set'} successfully.`,
      };
    } catch (error) {
      logger.error('Adjust points failed', { error });
      throw error;
    }
  }

  async getPointsHistory(
    customerIdOrPhone: string,
    limit: number = 10
  ): Promise<{
    customerId: string;
    transactions: PointsTransaction[];
    currentBalance: number;
  } | null> {
    try {
      const customer = await this.findCustomer(customerIdOrPhone);
      if (!customer) return null;

      // Get recent sales as transaction history
      const sales = await Sale.find({ customerId: customer._id })
        .sort({ createdAt: -1 })
        .limit(limit);

      const transactions: PointsTransaction[] = sales.map((sale) => ({
        type: 'earn' as const,
        points: Math.floor(sale.total),
        balance: customer.loyaltyPoints,
        description: `Purchase #${sale._id.toString().slice(-6)} - $${sale.total.toFixed(2)}`,
        timestamp: sale.createdAt,
      }));

      return {
        customerId: customer._id.toString(),
        transactions,
        currentBalance: customer.loyaltyPoints,
      };
    } catch (error) {
      logger.error('Get points history failed', { error });
      throw error;
    }
  }

  private async findCustomer(
    customerIdOrPhone: string
  ): Promise<ICustomer | null> {
    // Try to find by ID first
    let customer = await Customer.findById(customerIdOrPhone);
    if (customer) return customer;

    // Try by phone
    customer = await Customer.findOne({ phone: customerIdOrPhone });
    if (customer) return customer;

    // Try by email
    customer = await Customer.findOne({ email: customerIdOrPhone });
    return customer;
  }

  private getNextTier(currentTier: string): string | null {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    if (currentIndex === -1 || currentIndex === tiers.length - 1) return null;
    return tiers[currentIndex + 1];
  }

  private getTierBenefits(tier: string): string[] {
    const tierConfig = TIER_CONFIG[tier];
    const benefits: string[] = [];

    if (tierConfig.pointsMultiplier > 1) {
      benefits.push(`${tierConfig.pointsMultiplier}x points on every purchase`);
    }
    if (tierConfig.discountPercentage > 0) {
      benefits.push(`${tierConfig.discountPercentage}% discount on all purchases`);
    }
    if (tierConfig.freeShippingThreshold > 0) {
      benefits.push(`Free shipping on orders over $${tierConfig.freeShippingThreshold}`);
    } else {
      benefits.push('Free shipping on all orders');
    }
    if (tierConfig.birthdayBonus > 0) {
      benefits.push(`${tierConfig.birthdayBonus} bonus points on your birthday`);
    }
    if (tierConfig.exclusiveAccess) {
      benefits.push('Access to exclusive promotions and early sales');
    }

    return benefits;
  }

  async getAllTierStats(): Promise<
    Array<{
      tier: string;
      memberCount: number;
      totalPoints: number;
      avgPoints: number;
      benefits: TierBenefits;
    }>
  > {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const stats = [];

    for (const tier of tiers) {
      const customers = await Customer.find({ tier });
      const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);

      stats.push({
        tier,
        memberCount: customers.length,
        totalPoints,
        avgPoints: customers.length > 0 ? Math.round(totalPoints / customers.length) : 0,
        benefits: TIER_CONFIG[tier],
      });
    }

    return stats;
  }
}

export const loyaltyAgent = new LoyaltyAgent();
export default loyaltyAgent;