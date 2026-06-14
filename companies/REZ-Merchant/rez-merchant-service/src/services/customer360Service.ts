/**
 * Customer 360 Service
 * Aggregates customer data from multiple sources into a unified view.
 */
import mongoose from 'mongoose';
import { CustomerMeta } from '../models/CustomerMeta';
import { StorePayment } from '../models/StorePayment';
import { Store } from '../models/Store';
import { Order } from '../models/Order';
import { LoyaltyTier } from '../models/LoyaltyTier';
import { CoinTransaction } from '../models/CoinTransaction';
import { logger } from '../config/logger';

// ── Type Definitions ─────────────────────────────────────────────────────────

interface CustomerMetaData {
  createdAt?: Date;
  updatedAt?: Date;
  emailSubscribed?: boolean;
  pushNotificationsEnabled?: boolean;
  preferredChannel?: string;
  marketingOptIn?: boolean;
  fraudFlag?: boolean;
  name?: string;
  tierConfig?: { name?: string };
}

export interface CustomerProfile {
  userId: string;
  notes: string;
  internalTags: string[];
  healthProfile: {
    allergies: string;
    medicalConditions: string;
    medicalNotes: string;
    dietaryPreferences: string;
    preferredProducts: string;
    skinHairType: string;
    freeTextNotes: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransactionSummary {
  totalSpent: number;
  visitCount: number;
  averageOrderValue: number;
  lastVisit: Date | null;
  firstVisit: Date | null;
  recentTransactions: Array<{
    id: string;
    amount: number;
    storeId: string;
    createdAt: Date;
  }>;
}

export interface LoyaltySummary {
  tierName: string;
  pointsBalance: number;
  coinsBalance: number;
  lifetimePoints: number;
  memberSince: Date | null;
  tierProgress: number;
  nextTier: string | null;
}

export interface EngagementMetrics {
  emailSubscribed: boolean;
  pushNotificationsEnabled: boolean;
  preferredChannel: string;
  lastEngaged: Date | null;
  engagementScore: number;
  marketingOptIn: boolean;
}

export interface RiskMetrics {
  churnRisk: 'low' | 'medium' | 'high';
  churnScore: number;
  isFraudFlag: boolean;
  accountStatus: 'active' | 'inactive' | 'blocked';
  daysSinceLastVisit: number | null;
  inactivityFlag: boolean;
}

export interface Customer360 {
  customerId: string;
  profile: CustomerProfile;
  transactions: TransactionSummary;
  loyalty: LoyaltySummary;
  engagement: EngagementMetrics;
  risk: RiskMetrics;
  recommendations: string[];
}

// ── Service Class ─────────────────────────────────────────────────────────────

export class Customer360Service {
  /**
   * Get complete 360 view of a customer
   */
  async getCustomer360(customerId: string, merchantId: string): Promise<Customer360> {
    const [profile, transactions, loyalty, engagement] = await Promise.all([
      this.getProfile(customerId, merchantId),
      this.getTransactions(customerId, merchantId),
      this.getLoyalty(customerId, merchantId),
      this.getEngagement(customerId, merchantId),
    ]);

    const risk = await this.getRiskMetrics(customerId, merchantId, transactions);
    const recommendations = await this.getRecommendations(customerId, merchantId, {
      profile,
      transactions,
      loyalty,
      engagement,
      risk,
    });

    return {
      customerId,
      profile,
      transactions,
      loyalty,
      engagement,
      risk,
      recommendations,
    };
  }

  /**
   * Get customer profile (notes, tags, health profile)
   */
  async getProfile(customerId: string, merchantId: string): Promise<CustomerProfile> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    if (!meta) {
      return {
        userId: customerId,
        notes: '',
        internalTags: [],
        healthProfile: {
          allergies: '',
          medicalConditions: '',
          medicalNotes: '',
          dietaryPreferences: '',
          preferredProducts: '',
          skinHairType: '',
          freeTextNotes: '',
        },
      };
    }

    return {
      userId: customerId,
      notes: meta.notes || '',
      internalTags: meta.internalTags || [],
      healthProfile: meta.healthProfile || {
        allergies: '',
        medicalConditions: '',
        medicalNotes: '',
        dietaryPreferences: '',
        preferredProducts: '',
        skinHairType: '',
        freeTextNotes: '',
      },
      createdAt: (meta as unknown).createdAt,
      updatedAt: (meta as unknown).updatedAt,
    };
  }

  /**
   * Get transaction summary for a customer
   */
  async getTransactions(customerId: string, merchantId: string): Promise<TransactionSummary> {
    const mid = new mongoose.Types.ObjectId(merchantId);
    const stores = await Store.find({ merchantId: mid }).select('_id').lean();
    const storeIds = stores.map((s) => s._id);

    const [paymentStats, recentPayments] = await Promise.all([
      StorePayment.aggregate([
        { $match: { storeId: { $in: storeIds }, userId: customerId } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: { $ifNull: ['$amount', 0] } },
            visitCount: { $sum: 1 },
            firstVisit: { $min: '$createdAt' },
            lastVisit: { $max: '$createdAt' },
          },
        },
      ]),
      StorePayment.find({ storeId: { $in: storeIds }, userId: customerId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('_id amount storeId createdAt')
        .lean(),
    ]);

    const stats = paymentStats[0] || { totalSpent: 0, visitCount: 0, firstVisit: null, lastVisit: null };

    return {
      totalSpent: stats.totalSpent || 0,
      visitCount: stats.visitCount || 0,
      averageOrderValue: stats.visitCount > 0 ? (stats.totalSpent || 0) / stats.visitCount : 0,
      lastVisit: stats.lastVisit || null,
      firstVisit: stats.firstVisit || null,
      recentTransactions: recentPayments.map((p) => ({
        id: p._id.toString(),
        amount: p.amount || 0,
        storeId: String(p.storeId),
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Get loyalty program status
   */
  async getLoyalty(customerId: string, merchantId: string): Promise<LoyaltySummary> {
    const mid = new mongoose.Types.ObjectId(merchantId);

    // Get loyalty tier configuration
    const tierConfig = await LoyaltyTier.findOne({ merchantId: mid }).lean();

    // Get coin transactions for points balance
    const coinSummary = await CoinTransaction.aggregate([
      { $match: { userId: customerId, merchantId: mid } },
      {
        $group: {
          _id: null,
          coinsBalance: {
            $sum: { $cond: [{ $eq: ['$type', 'earn'] }, '$amount', { $negate: '$amount' }] },
          },
          lifetimeEarned: {
            $sum: { $cond: [{ $eq: ['$type', 'earn'] }, '$amount', 0] },
          },
          firstActivity: { $min: '$createdAt' },
        },
      },
    ]);

    const coins = coinSummary[0] || { coinsBalance: 0, lifetimeEarned: 0, firstActivity: null };

    // Calculate tier based on lifetime points (example logic)
    let tierName = 'Bronze';
    let nextTier = 'Silver';
    let tierProgress = 0;

    if (tierConfig) {
      tierName = (tierConfig as unknown).name || 'Bronze';
    }

    // Simple tier logic based on lifetime coins
    if (coins.lifetimeEarned >= 10000) {
      tierName = 'Platinum';
      nextTier = null;
      tierProgress = 100;
    } else if (coins.lifetimeEarned >= 5000) {
      tierName = 'Gold';
      nextTier = 'Platinum';
      tierProgress = Math.min(100, ((coins.lifetimeEarned - 5000) / 5000) * 100);
    } else if (coins.lifetimeEarned >= 2000) {
      tierName = 'Silver';
      nextTier = 'Gold';
      tierProgress = Math.min(100, ((coins.lifetimeEarned - 2000) / 3000) * 100);
    } else {
      tierName = 'Bronze';
      nextTier = 'Silver';
      tierProgress = Math.min(100, (coins.lifetimeEarned / 2000) * 100);
    }

    return {
      tierName,
      pointsBalance: coins.coinsBalance || 0,
      coinsBalance: coins.coinsBalance || 0,
      lifetimePoints: coins.lifetimeEarned || 0,
      memberSince: coins.firstActivity,
      tierProgress: Math.round(tierProgress),
      nextTier,
    };
  }

  /**
   * Get engagement metrics
   */
  async getEngagement(customerId: string, merchantId: string): Promise<EngagementMetrics> {
    const mid = new mongoose.Types.ObjectId(merchantId);

    // Get meta for engagement preferences
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();

    // Get last engagement from orders
    const lastOrder = await Order.findOne({ merchantId: mid, userId: customerId })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();

    // Calculate engagement score (0-100) based on recency and frequency
    let engagementScore = 50;
    const lastEngaged = lastOrder ? (lastOrder as unknown).createdAt : null;

    if (lastEngaged) {
      const daysSinceLastEngagement = Math.floor(
        (Date.now() - new Date(lastEngaged).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Recency factor (up to 40 points)
      if (daysSinceLastEngagement <= 7) engagementScore += 40;
      else if (daysSinceLastEngagement <= 30) engagementScore += 20;
      else if (daysSinceLastEngagement <= 90) engagementScore += 10;

      // Frequency factor (up to 10 points based on order count)
      const orderCount = await Order.countDocuments({
        merchantId: mid,
        userId: customerId,
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      });

      if (orderCount >= 10) engagementScore += 10;
      else if (orderCount >= 5) engagementScore += 5;
    }

    return {
      emailSubscribed: (meta as unknown)?.emailSubscribed ?? true,
      pushNotificationsEnabled: (meta as unknown)?.pushNotificationsEnabled ?? false,
      preferredChannel: (meta as unknown)?.preferredChannel || 'app',
      lastEngaged,
      engagementScore: Math.min(100, Math.max(0, engagementScore)),
      marketingOptIn: (meta as unknown)?.marketingOptIn ?? false,
    };
  }

  /**
   * Calculate risk metrics
   */
  async getRiskMetrics(
    customerId: string,
    merchantId: string,
    transactions: TransactionSummary
  ): Promise<RiskMetrics> {
    const mid = new mongoose.Types.ObjectId(merchantId);

    // Calculate days since last visit
    let daysSinceLastVisit: number | null = null;
    if (transactions.lastVisit) {
      daysSinceLastVisit = Math.floor(
        (Date.now() - new Date(transactions.lastVisit).getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Inactivity flag: no activity in 90+ days
    const inactivityFlag = daysSinceLastVisit !== null && daysSinceLastVisit > 90;

    // Churn risk calculation
    let churnScore = 0;
    let churnRisk: 'low' | 'medium' | 'high' = 'low';

    if (daysSinceLastVisit !== null) {
      if (daysSinceLastVisit > 90) churnScore = 80;
      else if (daysSinceLastVisit > 60) churnScore = 50;
      else if (daysSinceLastVisit > 30) churnScore = 30;
      else if (daysSinceLastVisit > 14) churnScore = 10;
    }

    // Decrease churn risk for high-value customers
    if (transactions.totalSpent > 10000 && churnScore > 0) {
      churnScore = Math.max(0, churnScore - 20);
    }

    if (churnScore >= 60) churnRisk = 'high';
    else if (churnScore >= 30) churnRisk = 'medium';

    // Check for fraud flags in meta
    const meta = await CustomerMeta.findOne({ merchantId: mid, userId: customerId }).lean();
    const isFraudFlag = (meta as unknown)?.fraudFlag === true;

    // Account status based on activity
    let accountStatus: 'active' | 'inactive' | 'blocked' = 'active';
    if (isFraudFlag) accountStatus = 'blocked';
    else if (daysSinceLastVisit !== null && daysSinceLastVisit > 180) accountStatus = 'inactive';

    return {
      churnRisk,
      churnScore,
      isFraudFlag,
      accountStatus,
      daysSinceLastVisit,
      inactivityFlag,
    };
  }

  /**
   * Generate personalized recommendations
   */
  async getRecommendations(
    customerId: string,
    merchantId: string,
    data: {
      profile: CustomerProfile;
      transactions: TransactionSummary;
      loyalty: LoyaltySummary;
      engagement: EngagementMetrics;
      risk: RiskMetrics;
    }
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // High churn risk recommendations
    if (data.risk.churnRisk === 'high') {
      recommendations.push('Send win-back offer with exclusive discount');
      recommendations.push('Reach out via preferred communication channel');
    }

    // Low engagement recommendations
    if (data.engagement.engagementScore < 40) {
      recommendations.push('Enable push notifications for exclusive deals');
      if (!data.engagement.marketingOptIn) {
        recommendations.push('Invite to opt-in for personalized offers');
      }
    }

    // Loyalty tier upgrade incentives
    if (data.loyalty.tierProgress >= 70 && data.loyalty.nextTier) {
      recommendations.push(
        `Earn ${Math.ceil((100 - data.loyalty.tierProgress) * (data.loyalty.lifetimePoints / 100))} more points to reach ${data.loyalty.nextTier}`
      );
    }

    // High-value customer appreciation
    if (data.transactions.totalSpent > 5000 && data.transactions.visitCount > 20) {
      recommendations.push('Invite to VIP membership program');
    }

    // Inactive customer re-engagement
    if (data.risk.inactivityFlag) {
      recommendations.push('Send re-engagement campaign with special offer');
    }

    // First-time visitor nurture
    if (data.transactions.visitCount === 1) {
      recommendations.push('Send welcome series with product recommendations');
    }

    // Tag-based recommendations
    if (data.profile.internalTags.includes('vip')) {
      recommendations.push('Priority customer service enabled');
    }

    // Limit to top 5 recommendations
    return recommendations.slice(0, 5);
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────────

export const customer360Service = new Customer360Service();
