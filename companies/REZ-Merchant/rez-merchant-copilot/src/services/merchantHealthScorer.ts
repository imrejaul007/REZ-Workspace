import mongoose from 'mongoose';
import axios from 'axios';

const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4002';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';

export interface MerchantMetrics {
  orders: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
  revenue: {
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    lastMonth: number;
    target: number;
  };
  customers: {
    total: number;
    returning: number;
    new: number;
  };
  reviews: {
    avgRating: number;
    totalReviews: number;
    recentRating: number;
  };
  inventory: {
    stockoutRate: number;
    lowStockItems: number;
  };
}

export interface HealthScore {
  overall: number;
  breakdown: {
    orderHealth: number;
    revenueHealth: number;
    customerHealth: number;
    reviewHealth: number;
    inventoryHealth: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: Array<{
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

const WEIGHTS = {
  orderHealth: 0.25,
  revenueHealth: 0.30,
  customerHealth: 0.20,
  reviewHealth: 0.15,
  inventoryHealth: 0.10,
};

export class MerchantHealthScorer {
  async getMerchantMetrics(merchantId: string): Promise<MerchantMetrics> {
    try {
      // Fetch from merchant service
      const [merchantRes, ordersRes, reviewsRes] = await Promise.allSettled([
        axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}`),
        this.getOrderMetrics(merchantId),
        this.getReviewMetrics(merchantId)
      ]);

      const merchant = merchantRes.status === 'fulfilled' ? merchantRes.value.data : null;
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : this.getDefaultOrderMetrics();
      const reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value : this.getDefaultReviewMetrics();

      return {
        orders: orders,
        revenue: {
          thisWeek: merchant?.revenueThisWeek || 0,
          lastWeek: merchant?.revenueLastWeek || 0,
          thisMonth: merchant?.revenueThisMonth || 0,
          lastMonth: merchant?.revenueLastMonth || 0,
          target: merchant?.revenueTarget || 100000,
        },
        customers: {
          total: merchant?.totalCustomers || 0,
          returning: merchant?.returningCustomers || 0,
          new: merchant?.newCustomers || 0,
        },
        reviews: reviews,
        inventory: {
          stockoutRate: merchant?.stockoutRate || 0,
          lowStockItems: merchant?.lowStockItems || 0,
        },
      };
    } catch (error) {
      console.error('Failed to fetch merchant metrics', error);
      return this.getDefaultMetrics();
    }
  }

  private async getOrderMetrics(merchantId: string): Promise<MerchantMetrics['orders']> {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/analytics`, {
        params: {
          merchantId,
          thisWeekStart: oneWeekAgo.toISOString(),
          thisWeekEnd: now.toISOString(),
          lastWeekStart: twoWeeksAgo.toISOString(),
          lastWeekEnd: oneWeekAgo.toISOString(),
          thisMonthStart: oneMonthAgo.toISOString(),
          thisMonthEnd: now.toISOString(),
        },
      });

      return response.data;
    } catch {
      return this.getDefaultOrderMetrics();
    }
  }

  private async getReviewMetrics(merchantId: string): Promise<MerchantMetrics['reviews']> {
    try {
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/reviews`, {
        params: { limit: 100 },
      });

      const reviews = response.data.reviews || [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviews.length
        : 0;

      const recentReviews = reviews.slice(0, 10);
      const recentRating = recentReviews.length > 0
        ? recentReviews.reduce((sum: number, r) => sum + r.rating, 0) / recentReviews.length
        : avgRating;

      return {
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews.length,
        recentRating: Math.round(recentRating * 10) / 10,
      };
    } catch {
      return this.getDefaultReviewMetrics();
    }
  }

  async calculateHealthScore(merchantId: string): Promise<HealthScore> {
    const metrics = await this.getMerchantMetrics(merchantId);

    const scores = {
      orderHealth: this.scoreOrders(metrics.orders),
      revenueHealth: this.scoreRevenue(metrics.revenue),
      customerHealth: this.scoreCustomers(metrics.customers),
      reviewHealth: this.scoreReviews(metrics.reviews),
      inventoryHealth: this.scoreInventory(metrics.inventory),
    };

    const overall = Object.entries(scores).reduce(
      (sum, [key, score]) => sum + score * WEIGHTS[key as keyof typeof WEIGHTS],
      0
    );

    const trend = this.calculateTrend(scores);
    const riskLevel = this.calculateRiskLevel(overall, scores);
    const alerts = this.generateAlerts(scores, metrics);

    return {
      overall: Math.round(overall),
      breakdown: scores,
      trend,
      riskLevel,
      alerts,
    };
  }

  private scoreOrders(orders: MerchantMetrics['orders']): number {
    if (orders.lastWeek === 0) {
      return orders.thisWeek > 0 ? 70 : 50;
    }

    const change = (orders.thisWeek - orders.lastWeek) / orders.lastWeek;
    const base = 70;

    if (change > 0.2) return Math.min(100, base + 30);
    if (change > 0) return base + change * 100;
    if (change > -0.1) return base + change * 200;
    return Math.max(0, base + change * 300);
  }

  private scoreRevenue(revenue: MerchantMetrics['revenue']): number {
    if (revenue.target === 0) return 50;

    const achievement = revenue.thisWeek / revenue.target;
    const lastWeekAchievement = revenue.lastWeek / revenue.target;

    if (achievement >= 1) return Math.min(100, 80 + (achievement - 1) * 20);
    if (achievement >= 0.8) return 60 + (achievement - 0.8) * 100;
    return Math.max(0, achievement * 75);
  }

  private scoreCustomers(customers: MerchantMetrics['customers']): number {
    if (customers.total === 0) return 50;

    const retentionRate = customers.total > 0
      ? customers.returning / customers.total
      : 0;

    const newRate = customers.total > 0
      ? customers.new / customers.total
      : 0;

    // Balance between retention and new customer acquisition
    const retentionScore = retentionRate * 60;
    const acquisitionScore = Math.min(40, newRate * 40);

    return retentionScore + acquisitionScore;
  }

  private scoreReviews(reviews: MerchantMetrics['reviews']): number {
    const ratingScore = (reviews.avgRating / 5) * 60;
    const recentScore = reviews.recentRating > 0
      ? (reviews.recentRating / 5) * 30
      : 15;

    const volumeScore = Math.min(10, reviews.totalReviews / 10);

    return ratingScore + recentScore + volumeScore;
  }

  private scoreInventory(inventory: MerchantMetrics['inventory']): number {
    // Lower stockout rate = higher score
    const stockoutScore = Math.max(0, 100 - inventory.stockoutRate * 10);

    // Lower low stock items = higher score
    const lowStockScore = Math.max(0, 100 - inventory.lowStockItems * 5);

    return (stockoutScore + lowStockScore) / 2;
  }

  private calculateTrend(scores: HealthScore['breakdown']): 'improving' | 'stable' | 'declining' {
    // Simplified trend calculation
    // In production, compare with historical data
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / 5;

    if (avgScore > 75) return 'improving';
    if (avgScore < 50) return 'declining';
    return 'stable';
  }

  private calculateRiskLevel(
    overall: number,
    scores: HealthScore['breakdown']
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (overall >= 80) return 'low';
    if (overall >= 60) return 'medium';
    if (overall >= 40) return 'high';
    return 'critical';
  }

  private generateAlerts(
    scores: HealthScore['breakdown'],
    metrics: MerchantMetrics
  ): HealthScore['alerts'] {
    const alerts: HealthScore['alerts'] = [];

    if (scores.orderHealth < 50) {
      alerts.push({
        type: 'order_decline',
        message: `Order volume dropped ${Math.round((1 - metrics.orders.thisWeek / (metrics.orders.lastWeek || 1)) * 100)}% this week`,
        priority: 'high',
      });
    }

    if (scores.revenueHealth < 50) {
      alerts.push({
        type: 'revenue_below_target',
        message: `Revenue is ${Math.round((1 - metrics.revenue.thisWeek / (metrics.revenue.target || 1)) * 100)}% below target`,
        priority: 'high',
      });
    }

    if (scores.reviewHealth < 50) {
      alerts.push({
        type: 'rating_drop',
        message: 'Recent ratings have dropped below average',
        priority: 'medium',
      });
    }

    if (scores.inventoryHealth < 50) {
      alerts.push({
        type: 'inventory_issues',
        message: `${metrics.inventory.lowStockItems} items are running low`,
        priority: 'medium',
      });
    }

    if (metrics.inventory.stockoutRate > 10) {
      alerts.push({
        type: 'stockouts',
        message: 'High stockout rate affecting customer satisfaction',
        priority: 'high',
      });
    }

    return alerts;
  }

  private getDefaultMetrics(): MerchantMetrics {
    return {
      orders: this.getDefaultOrderMetrics(),
      revenue: this.getDefaultRevenueMetrics(),
      customers: { total: 0, returning: 0, new: 0 },
      reviews: this.getDefaultReviewMetrics(),
      inventory: { stockoutRate: 0, lowStockItems: 0 },
    };
  }

  private getDefaultOrderMetrics(): MerchantMetrics['orders'] {
    return {
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
    };
  }

  private getDefaultRevenueMetrics(): MerchantMetrics['revenue'] {
    return {
      thisWeek: 0,
      lastWeek: 0,
      thisMonth: 0,
      lastMonth: 0,
      target: 100000,
    };
  }

  private getDefaultReviewMetrics(): MerchantMetrics['reviews'] {
    return {
      avgRating: 0,
      totalReviews: 0,
      recentRating: 0,
    };
  }
}

export const merchantHealthScorer = new MerchantHealthScorer();
