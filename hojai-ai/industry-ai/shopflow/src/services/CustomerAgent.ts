import { Customer, Sale, Product, ICustomer } from '../models';
import { logger } from '../utils/logger';
import Decimal from 'decimal.js';

export interface Customer360Profile {
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    tier: string;
    memberSince: Date;
    daysAsMember: number;
  };
  purchaseHistory: {
    totalPurchases: number;
    totalSpent: number;
    averageOrderValue: number;
    lastPurchaseDate: Date | null;
    favoriteCategories: string[];
    favoriteProducts: Array<{ productId: string; name: string; purchaseCount: number }>;
  };
  loyalty: {
    points: number;
    pointsValue: number;
    tierProgress: number;
    nextTier: string | null;
    lifetimePoints: number;
  };
  behavior: {
    purchaseFrequency: 'daily' | 'weekly' | 'monthly' | 'rare' | 'inactive';
    preferredPaymentMethod: string | null;
    peakShoppingHours: number[];
    daysSinceLastPurchase: number;
    predictedLifetimeValue: number;
  };
  recommendations: Array<{
    type: 'product' | 'category' | 'promotion';
    priority: number;
    message: string;
    itemId?: string;
  }>;
  alerts: Array<{
    type: 'win_back' | 'tier_risk' | 'high_value' | 'inactive';
    severity: 'high' | 'medium' | 'low';
    message: string;
  }>;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  avgSpent: number;
  description: string;
  marketingStrategy: string;
}

export class CustomerAgent {
  async getCustomer360(
    customerIdOrPhone: string
  ): Promise<Customer360Profile | null> {
    try {
      const customer = await this.findCustomer(customerIdOrPhone);
      if (!customer) return null;

      const sales = await Sale.find({ customerId: customer._id }).sort({
        createdAt: -1,
      });

      // Calculate purchase history
      const totalPurchases = sales.length;
      const totalSpent = customer.totalSpent;
      const averageOrderValue =
        totalPurchases > 0 ? totalSpent / totalPurchases : 0;
      const lastPurchaseDate =
        sales.length > 0 ? sales[0].createdAt : null;

      // Calculate favorite categories and products
      const categoryCount: Record<string, number> = {};
      const productCount: Record<string, { name: string; count: number }> = {};

      for (const sale of sales) {
        for (const item of sale.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            categoryCount[product.category] =
              (categoryCount[product.category] || 0) + item.quantity;
            productCount[item.productId.toString()] = {
              name: product.name,
              count:
                (productCount[item.productId.toString()]?.count || 0) +
                item.quantity,
            };
          }
        }
      }

      const favoriteCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat]) => cat);

      const favoriteProducts = Object.entries(productCount)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id, data]) => ({
          productId: id,
          name: data.name,
          purchaseCount: data.count,
        }));

      // Behavior analysis
      const daysSinceLastPurchase = lastPurchaseDate
        ? Math.floor(
            (Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 999;

      let purchaseFrequency: 'daily' | 'weekly' | 'monthly' | 'rare' | 'inactive' =
        'inactive';
      if (daysSinceLastPurchase <= 1) purchaseFrequency = 'daily';
      else if (daysSinceLastPurchase <= 7) purchaseFrequency = 'weekly';
      else if (daysSinceLastPurchase <= 30) purchaseFrequency = 'monthly';
      else if (daysSinceLastPurchase <= 90) purchaseFrequency = 'rare';
      else purchaseFrequency = 'inactive';

      // Peak shopping hours
      const hourCount: Record<number, number> = {};
      sales.forEach((sale) => {
        const hour = sale.createdAt.getHours();
        hourCount[hour] = (hourCount[hour] || 0) + 1;
      });
      const peakShoppingHours = Object.entries(hourCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([h]) => parseInt(h));

      // Preferred payment method
      const paymentCounts: Record<string, number> = {};
      sales.forEach((sale) => {
        paymentCounts[sale.paymentMethod] =
          (paymentCounts[sale.paymentMethod] || 0) + 1;
      });
      const preferredPaymentMethod = Object.entries(paymentCounts).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0];

      // Tier progress
      const tierThresholds: Record<string, number> = {
        bronze: 0,
        silver: 1000,
        gold: 5000,
        platinum: 15000,
      };
      const tiers = ['bronze', 'silver', 'gold', 'platinum'];
      const currentTierIndex = tiers.indexOf(customer.tier);
      const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
      const tierProgress = nextTier
        ? Math.min(
            100,
            (customer.loyaltyPoints / tierThresholds[nextTier]) * 100
          )
        : 100;

      // Predicted lifetime value
      const predictedLifetimeValue = this.predictLifetimeValue(
        customer.totalSpent,
        totalPurchases,
        daysSinceLastPurchase
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        customer,
        favoriteCategories,
        favoriteProducts,
        purchaseFrequency
      );

      // Generate alerts
      const alerts = this.generateAlerts(
        customer,
        daysSinceLastPurchase,
        purchaseFrequency,
        totalPurchases
      );

      logger.info('Customer 360 profile generated', {
        customerId: customer._id,
        totalPurchases,
        totalSpent,
      });

      const memberSince = customer.createdAt;
      const daysAsMember = Math.floor(
        (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        customer: {
          id: customer._id.toString(),
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          tier: customer.tier,
          memberSince,
          daysAsMember,
        },
        purchaseHistory: {
          totalPurchases,
          totalSpent: Math.round(totalSpent * 100) / 100,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          lastPurchaseDate,
          favoriteCategories,
          favoriteProducts,
        },
        loyalty: {
          points: customer.loyaltyPoints,
          pointsValue: Math.round(customer.loyaltyPoints * 0.01 * 100) / 100,
          tierProgress: Math.round(tierProgress),
          nextTier,
          lifetimePoints: Math.round(customer.totalSpent),
        },
        behavior: {
          purchaseFrequency,
          preferredPaymentMethod,
          peakShoppingHours,
          daysSinceLastPurchase,
          predictedLifetimeValue: Math.round(predictedLifetimeValue * 100) / 100,
        },
        recommendations,
        alerts,
      };
    } catch (error) {
      logger.error('Get customer 360 failed', { error });
      throw error;
    }
  }

  async getCustomerSegments(): Promise<CustomerSegment[]> {
    const customers = await Customer.find({});

    const segments: Record<string, { count: number; totalSpent: number }> = {
      vip: { count: 0, totalSpent: 0 },
      regular: { count: 0, totalSpent: 0 },
      new: { count: 0, totalSpent: 0 },
      at_risk: { count: 0, totalSpent: 0 },
      inactive: { count: 0, totalSpent: 0 },
    };

    for (const customer of customers) {
      const daysSinceLastPurchase = customer.purchaseCount > 0
        ? Math.floor((Date.now() - customer.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let segment: string;
      if (customer.totalSpent >= 5000 || customer.tier === 'platinum') {
        segment = 'vip';
      } else if (customer.purchaseCount === 0 || daysSinceLastPurchase > 180) {
        segment = 'inactive';
      } else if (daysSinceLastPurchase > 60) {
        segment = 'at_risk';
      } else if (customer.purchaseCount <= 2) {
        segment = 'new';
      } else {
        segment = 'regular';
      }

      segments[segment].count++;
      segments[segment].totalSpent += customer.totalSpent;
    }

    const segmentConfigs: Record<string, { description: string; strategy: string }> = {
      vip: {
        description: 'High-value customers with significant spending',
        strategy: 'Exclusive offers, early access to new products, personal concierge',
      },
      regular: {
        description: 'Consistent buyers with stable engagement',
        strategy: 'Loyalty rewards, referral programs, category recommendations',
      },
      new: {
        description: 'Recently acquired customers',
        strategy: 'Onboarding sequence, first-purchase incentives, engagement campaigns',
      },
      at_risk: {
        description: 'Customers showing declining engagement',
        strategy: 'Re-engagement offers, personalized outreach, satisfaction surveys',
      },
      inactive: {
        description: 'Customers with no recent activity',
        strategy: 'Win-back campaigns, special incentives, feedback collection',
      },
    };

    return Object.entries(segments).map(([name, data]) => ({
      segment: name,
      count: data.count,
      avgSpent: data.count > 0 ? Math.round((data.totalSpent / data.count) * 100) / 100 : 0,
      description: segmentConfigs[name].description,
      marketingStrategy: segmentConfigs[name].strategy,
    }));
  }

  async predictChurnRisk(customerIdOrPhone: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral' }>;
    recommendations: string[];
  }> {
    const customer = await this.findCustomer(customerIdOrPhone);
    if (!customer) {
      return {
        riskLevel: 'high',
        score: 100,
        factors: [],
        recommendations: ['Customer not found'],
      };
    }

    const factors: Array<{ factor: string; impact: 'positive' | 'negative' | 'neutral' }> = [];
    let score = 50; // Base score

    // Days since last purchase
    const daysSinceLast = Math.floor(
      (Date.now() - customer.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLast > 90) {
      score += 30;
      factors.push({ factor: 'No purchase in over 90 days', impact: 'negative' });
    } else if (daysSinceLast > 60) {
      score += 20;
      factors.push({ factor: 'No purchase in 60+ days', impact: 'negative' });
    } else if (daysSinceLast <= 14) {
      score -= 10;
      factors.push({ factor: 'Recent purchase', impact: 'positive' });
    }

    // Purchase frequency
    if (customer.purchaseCount === 0) {
      score += 20;
      factors.push({ factor: 'Never made a purchase', impact: 'negative' });
    } else if (customer.purchaseCount >= 10) {
      score -= 15;
      factors.push({ factor: 'Frequent buyer', impact: 'positive' });
    }

    // Tier
    if (customer.tier === 'platinum' || customer.tier === 'gold') {
      score -= 10;
      factors.push({ factor: 'High-tier customer', impact: 'positive' });
    }

    // Spending trend
    if (customer.totalSpent >= 1000) {
      score -= 10;
      factors.push({ factor: 'High lifetime value', impact: 'positive' });
    }

    // Cap score between 0-100
    score = Math.max(0, Math.min(100, score));

    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (score < 20) riskLevel = 'low';
    else if (score < 50) riskLevel = 'medium';
    else if (score < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    const recommendations: string[] = [];
    if (riskLevel === 'high' || riskLevel === 'critical') {
      recommendations.push('Send personalized re-engagement email');
      recommendations.push('Offer exclusive discount');
      if (customer.email) {
        recommendations.push('Consider phone outreach');
      }
    }
    if (customer.tier === 'bronze') {
      recommendations.push('Upgrade opportunity - offer premium benefits trial');
    }
    if (score > 50) {
      recommendations.push('Review recent customer service interactions');
    }

    return {
      riskLevel,
      score,
      factors,
      recommendations,
    };
  }

  private async findCustomer(customerIdOrPhone: string): Promise<ICustomer | null> {
    let customer = await Customer.findById(customerIdOrPhone);
    if (customer) return customer;

    customer = await Customer.findOne({ phone: customerIdOrPhone });
    if (customer) return customer;

    customer = await Customer.findOne({ email: customerIdOrPhone });
    return customer;
  }

  private predictLifetimeValue(
    totalSpent: number,
    purchaseCount: number,
    daysSinceLastPurchase: number
  ): number {
    if (purchaseCount === 0) return 0;

    const avgPurchaseValue = totalSpent / purchaseCount;
    const avgDaysBetweenPurchases = 30; // Simplified assumption
    const expectedRemainingPurchases = Math.max(0, 365 - daysSinceLastPurchase) / avgDaysBetweenPurchases;

    return avgPurchaseValue * expectedRemainingPurchases * 0.7; // 0.7 is retention factor
  }

  private generateRecommendations(
    customer: ICustomer,
    favoriteCategories: string[],
    favoriteProducts: Array<{ productId: string; name: string; purchaseCount: number }>
  ): Customer360Profile['recommendations'] {
    const recommendations: Customer360Profile['recommendations'] = [];

    // Category recommendation
    if (favoriteCategories.length > 0) {
      recommendations.push({
        type: 'category',
        priority: 1,
        message: `Explore more products in ${favoriteCategories[0]}`,
        itemId: favoriteCategories[0],
      });
    }

    // Tier upgrade
    if (customer.tier !== 'platinum') {
      const tierThresholds: Record<string, number> = {
        bronze: 1000,
        silver: 5000,
        gold: 15000,
      };
      const pointsNeeded = tierThresholds[customer.tier] - customer.loyaltyPoints;
      recommendations.push({
        type: 'promotion',
        priority: 2,
        message: `Earn ${pointsNeeded} more points to reach ${customer.tier === 'bronze' ? 'Silver' : customer.tier === 'silver' ? 'Gold' : 'Platinum'} tier!`,
      });
    }

    // Product recommendation based on favorites
    if (favoriteProducts.length > 0) {
      recommendations.push({
        type: 'product',
        priority: 3,
        message: 'Complete your collection - check related products',
        itemId: favoriteProducts[0].productId,
      });
    }

    return recommendations;
  }

  private generateAlerts(
    customer: ICustomer,
    daysSinceLastPurchase: number,
    purchaseFrequency: string,
    totalPurchases: number
  ): Customer360Profile['alerts'] {
    const alerts: Customer360Profile['alerts'] = [];

    // Win-back alert
    if (daysSinceLastPurchase > 60) {
      alerts.push({
        type: 'win_back',
        severity: daysSinceLastPurchase > 90 ? 'high' : 'medium',
        message: `Customer hasn't purchased in ${daysSinceLastPurchase} days`,
      });
    }

    // Tier risk
    if (customer.tier === 'gold' || customer.tier === 'silver') {
      const tierThresholds: Record<string, number> = {
        silver: 1000,
        gold: 5000,
        platinum: 15000,
      };
      const nextTier = customer.tier === 'silver' ? 'gold' : 'platinum';
      const pointsNeeded = tierThresholds[nextTier] - customer.loyaltyPoints;

      if (pointsNeeded > 0 && pointsNeeded <= 500) {
        alerts.push({
          type: 'tier_risk',
          severity: 'low',
          message: `Customer may lose ${customer.tier} tier status - ${pointsNeeded} points below threshold`,
        });
      }
    }

    // High-value alert
    if (customer.totalSpent >= 5000) {
      alerts.push({
        type: 'high_value',
        severity: 'low',
        message: 'High-value customer - prioritize service quality',
      });
    }

    // Inactive alert
    if (purchaseFrequency === 'inactive' && totalPurchases === 0) {
      alerts.push({
        type: 'inactive',
        severity: 'medium',
        message: 'New customer who never completed a purchase',
      });
    }

    return alerts;
  }
}

export const customerAgent = new CustomerAgent();
export default customerAgent;