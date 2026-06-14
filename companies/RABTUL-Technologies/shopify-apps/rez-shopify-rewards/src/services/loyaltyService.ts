/**
 * ReZ Rewards - Loyalty Service
 */

import crypto from 'crypto';
import { CustomerLoyalty, ICustomerLoyalty } from '../models/Loyalty';
import { Reward, IReward } from '../models/Reward';

export class LoyaltyService {
  /**
   * Get or create customer loyalty account
   */
  static async getOrCreateCustomer(data: {
    customerId: string;
    shop: string;
    tenantId: string;
    brandId: string;
    email: string;
    phone?: string;
  }): Promise<ICustomerLoyalty> {
    let customer = await CustomerLoyalty.findOne({
      shop: data.shop.toLowerCase(),
      customerId: data.customerId,
    });

    if (!customer) {
      const referralCode = this.generateReferralCode();
      customer = await CustomerLoyalty.create({
        ...data,
        shop: data.shop.toLowerCase(),
        referralCode,
        points: 0,
        tier: 'bronze',
      });
    }

    return customer;
  }

  /**
   * Calculate and add points for order
   */
  static async addPointsForOrder(data: {
    customerId: string;
    shop: string;
    tenantId: string;
    brandId: string;
    email: string;
    phone?: string;
    orderValue: number;
    orderId: string;
  }): Promise<ICustomerLoyalty> {
    // Get customer
    const customer = await this.getOrCreateCustomer(data);

    // Calculate points (10 points per ₹100 spent)
    const points = Math.floor(data.orderValue / 10);

    // Add tier bonus
    const tierMultipliers = { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 };
    const multiplier = tierMultipliers[customer.tier];
    const totalPoints = Math.floor(points * multiplier);

    // Add points
    await customer.addPoints(totalPoints);

    // Update stats
    customer.totalOrders += 1;
    customer.totalSpent += data.orderValue;
    await customer.save();

    return customer;
  }

  /**
   * Redeem reward
   */
  static async redeemReward(data: {
    customerId: string;
    shop: string;
    rewardId: string;
  }): Promise<{ success: boolean; code?: string; error?: string }> {
    const [customer, reward] = await Promise.all([
      CustomerLoyalty.findOne({ shop: data.shop.toLowerCase(), customerId: data.customerId }),
      Reward.findById(data.rewardId),
    ]);

    if (!customer) {
      return { success: false, error: 'Customer not found' };
    }

    if (!reward) {
      return { success: false, error: 'Reward not found' };
    }

    if (!reward.active) {
      return { success: false, error: 'Reward is not active' };
    }

    if (customer.points < reward.pointsCost) {
      return { success: false, error: 'Insufficient points' };
    }

    // Check usage limit
    if (reward.maxUses && reward.usedCount >= reward.maxUses) {
      return { success: false, error: 'Reward fully redeemed' };
    }

    // Redeem - FIX: Use crypto for secure discount codes
    const discountCode = `REWARD-${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 4).toUpperCase()}`;
    await customer.redeemPoints(reward.pointsCost);
    reward.usedCount += 1;
    await reward.save();

    return { success: true, code: discountCode };
  }

  /**
   * Get customer loyalty info
   */
  static async getCustomerInfo(data: {
    customerId: string;
    shop: string;
  }): Promise<ICustomerLoyalty | null> {
    return CustomerLoyalty.findOne({
      shop: data.shop.toLowerCase(),
      customerId: data.customerId,
    });
  }

  /**
   * Get available rewards for shop
   */
  static async getAvailableRewards(shop: string): Promise<IReward[]> {
    return Reward.find({
      shop: shop.toLowerCase(),
      active: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gte: new Date() } },
      ],
    });
  }

  /**
   * Get loyalty stats for shop
   */
  static async getStats(shop: string): Promise<{
    totalMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    tierDistribution: Record<string, number>;
    topCustomers: Array<{ email: string; points: number; tier: string }>;
  }> {
    const customers = await CustomerLoyalty.find({ shop: shop.toLowerCase() });

    const tierDistribution: Record<string, number> = {};
    let totalPointsIssued = 0;
    let totalPointsRedeemed = 0;

    customers.forEach(c => {
      tierDistribution[c.tier] = (tierDistribution[c.tier] || 0) + 1;
      totalPointsIssued += c.lifetimePoints;
      totalPointsRedeemed += c.rewardsRedeemed;
    });

    const topCustomers = customers
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map(c => ({ email: c.email, points: c.points, tier: c.tier }));

    return {
      totalMembers: customers.length,
      totalPointsIssued,
      totalPointsRedeemed,
      tierDistribution,
      topCustomers,
    };
  }

  /**
   * Generate unique referral code
   */
  private static generateReferralCode(): string {
    // FIX: Use crypto for secure referral code generation
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const randomBytes = crypto.randomBytes(8);
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(randomBytes[i] % chars.length);
    }
    return code;
  }
}
