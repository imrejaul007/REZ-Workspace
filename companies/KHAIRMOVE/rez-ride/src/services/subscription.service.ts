/**
 * ReZ Ride Plus - Subscription Service
 *
 * Subscription tiers for predictable revenue:
 * - ReZ Ride Lite: ₹99/month
 * - ReZ Ride Plus: ₹199/month
 * - ReZ Ride Premium: ₹299/month
 */

import mongoose, { Schema, model } from 'mongoose';
import { Logger } from '@nestjs/common';

// Subscription Plans
export enum SubscriptionTier {
  LITE = 'lite',
  PLUS = 'plus',
  PREMIUM = 'premium',
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number; // monthly in INR
  features: string[];
  benefits: {
    surgeDiscount: number; // percentage
    priorityMatching: boolean;
    airportDiscount: number; // percentage
    freeCancellations: number; // per month
    extraCashback: number; // percentage
    supportPriority: 'standard' | 'priority' | 'dedicated';
    partnerOffers: boolean;
    loungeAccess: boolean;
  };
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  [SubscriptionTier.LITE]: {
    tier: SubscriptionTier.LITE,
    name: 'ReZ Ride Lite',
    price: 99,
    features: [
      '5% surge discount',
      '1 free cancellation/month',
      '2% extra cashback',
      'Priority support',
    ],
    benefits: {
      surgeDiscount: 5,
      priorityMatching: false,
      airportDiscount: 0,
      freeCancellations: 1,
      extraCashback: 2,
      supportPriority: 'priority',
      partnerOffers: false,
      loungeAccess: false,
    },
  },
  [SubscriptionTier.PLUS]: {
    tier: SubscriptionTier.PLUS,
    name: 'ReZ Ride Plus',
    price: 199,
    features: [
      '10% surge discount',
      '3 free cancellations/month',
      '5% extra cashback',
      'Priority matching',
      'Airport discounts',
      'Partner offers',
    ],
    benefits: {
      surgeDiscount: 10,
      priorityMatching: true,
      airportDiscount: 15,
      freeCancellations: 3,
      extraCashback: 5,
      supportPriority: 'priority',
      partnerOffers: true,
      loungeAccess: false,
    },
  },
  [SubscriptionTier.PREMIUM]: {
    tier: SubscriptionTier.PREMIUM,
    name: 'ReZ Ride Premium',
    price: 299,
    features: [
      '20% surge discount',
      '5 free cancellations/month',
      '10% extra cashback',
      'Dedicated matching',
      'Airport discounts',
      'All partner offers',
      'Airport lounge access',
      'Dedicated support',
    ],
    benefits: {
      surgeDiscount: 20,
      priorityMatching: true,
      airportDiscount: 25,
      freeCancellations: 5,
      extraCashback: 10,
      supportPriority: 'dedicated',
      partnerOffers: true,
      loungeAccess: true,
    },
  },
};

// MongoDB Schema
const subscriptionSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  tier: { type: String, enum: Object.values(SubscriptionTier), required: true },
  status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: true },
  paymentMethod: { type: String, default: 'wallet' },
  transactions: [{
    date: Date,
    amount: Number,
    type: String, // 'charge' | 'refund' | 'bonus'
    paymentId: String,
  }],
  usageStats: {
    surgeDiscountsUsed: { type: Number, default: 0 },
    freeCancellationsUsed: { type: Number, default: 0 },
    cashbackEarned: { type: Number, default: 0 },
    airportRides: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Subscription = model('Subscription', subscriptionSchema);

export class SubscriptionService {
  private readonly logger = new Logger('SubscriptionService');

  /**
   * Get available subscription plans
   */
  getPlans(): SubscriptionPlan[] {
    return Object.values(SUBSCRIPTION_PLANS);
  }

  /**
   * Get plan by tier
   */
  getPlan(tier: SubscriptionTier): SubscriptionPlan | undefined {
    return SUBSCRIPTION_PLANS[tier];
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<SubscriptionPlan | null> {
    try {
      const sub = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() },
      });

      if (!sub) return null;

      return SUBSCRIPTION_PLANS[sub.tier as SubscriptionTier] || null;
    } catch (error) {
      this.logger.error(`Error checking subscription: ${error}`);
      return null;
    }
  }

  /**
   * Subscribe user to a plan
   */
  async subscribe(userId: string, tier: SubscriptionTier, paymentMethod: string = 'wallet'): Promise<{
    success: boolean;
    subscription?: any;
    error?: string;
  }> {
    try {
      // Check if already subscribed
      const existing = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() },
      });

      if (existing) {
        return { success: false, error: 'Already subscribed' };
      }

      const plan = SUBSCRIPTION_PLANS[tier];
      if (!plan) {
        return { success: false, error: 'Invalid plan' };
      }

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);

      const subscription = new Subscription({
        userId,
        tier,
        status: 'active',
        startDate: now,
        endDate,
        autoRenew: true,
        paymentMethod,
        transactions: [{
          date: now,
          amount: plan.price,
          type: 'charge',
          paymentId: `SUB_${Date.now()}`,
        }],
        usageStats: {
          surgeDiscountsUsed: 0,
          freeCancellationsUsed: 0,
          cashbackEarned: 0,
          airportRides: 0,
        },
      });

      await subscription.save();

      this.logger.log(`User ${userId} subscribed to ${plan.name}`);

      return { success: true, subscription };
    } catch (error) {
      this.logger.error(`Subscription error: ${error}`);
      return { success: false, error: 'Subscription failed' };
    }
  }

  /**
   * Cancel subscription
   */
  async cancel(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const sub = await Subscription.findOneAndUpdate(
        { userId, status: 'active' },
        { status: 'cancelled', autoRenew: false, updatedAt: new Date() },
        { new: true }
      );

      if (!sub) {
        return { success: false, error: 'No active subscription' };
      }

      this.logger.log(`User ${userId} cancelled subscription`);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Cancellation failed' };
    }
  }

  /**
   * Get subscription benefits for user
   */
  async getBenefits(userId: string): Promise<SubscriptionPlan['benefits'] | null> {
    const plan = await this.hasActiveSubscription(userId);
    return plan?.benefits || null;
  }

  /**
   * Calculate surge discount for subscriber
   */
  async getSurgeDiscount(userId: string, baseSurge: number): Promise<number> {
    const plan = await this.hasActiveSubscription(userId);
    if (!plan) return baseSurge;

    const discount = plan.benefits.surgeDiscount;
    return Math.max(1, baseSurge - (baseSurge * discount / 100));
  }

  /**
   * Calculate extra cashback for subscriber
   */
  async getExtraCashback(userId: string, baseCashback: number): Promise<number> {
    const plan = await this.hasActiveSubscription(userId);
    if (!plan) return baseCashback;

    const extra = plan.benefits.extraCashback;
    return baseCashback + (baseCashback * extra / 100);
  }

  /**
   * Check and use free cancellation
   */
  async useFreeCancellation(userId: string): Promise<boolean> {
    try {
      const sub = await Subscription.findOne({
        userId,
        status: 'active',
        endDate: { $gt: new Date() },
      });

      if (!sub) return false;

      if (!sub.usageStats) {
        sub.usageStats = { surgeDiscountsUsed: 0, freeCancellationsUsed: 0, cashbackEarned: 0, airportRides: 0 };
      }
      const maxCancellations = SUBSCRIPTION_PLANS[sub.tier as SubscriptionTier]?.benefits.freeCancellations ?? 0;
      if (sub.usageStats.freeCancellationsUsed < maxCancellations) {
        sub.usageStats.freeCancellationsUsed += 1;
        await sub.save();
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get subscription stats
   */
  async getStats(): Promise<{
    totalSubscribers: number;
    byTier: Record<SubscriptionTier, number>;
    mrr: number; // monthly recurring revenue
  }> {
    try {
      const subs = await Subscription.find({ status: 'active', endDate: { $gt: new Date() } });

      const byTier: Record<string, number> = {};
      let mrr = 0;

      for (const sub of subs) {
        byTier[sub.tier] = (byTier[sub.tier] || 0) + 1;
        const plan = SUBSCRIPTION_PLANS[sub.tier as SubscriptionTier];
        if (plan) mrr += plan.price;
      }

      return {
        totalSubscribers: subs.length,
        byTier: byTier as Record<SubscriptionTier, number>,
        mrr,
      };
    } catch (error) {
      return { totalSubscribers: 0, byTier: {} as Record<SubscriptionTier, number>, mrr: 0 };
    }
  }
}

export const subscriptionService = new SubscriptionService();
