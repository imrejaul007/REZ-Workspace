import axios from 'axios';
import { MerchantMetrics } from './merchantHealthScorer';

const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:4006';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:4002';
const AD_SERVICE_URL = process.env.AD_SERVICE_URL || 'http://localhost:4015';

export interface Recommendation {
  id: string;
  type: 'inventory' | 'pricing' | 'marketing' | 'operations' | 'customer';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{
    type: string;
    title: string;
    url?: string;
  }>;
  expectedImpact: string;
  confidence: number;
  data?;
}

export class RecommendationEngine {
  async generateRecommendations(
    merchantId: string,
    metrics: MerchantMetrics,
    healthScore: number
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Get merchant data
    const merchant = await this.getMerchantData(merchantId);
    const productPerformance = await this.getProductPerformance(merchantId);
    const customerSegmentation = await this.getCustomerSegmentation(merchantId);
    const marketTrends = await this.getMarketTrends(merchantId);
    const competitorData = await this.getCompetitorData(merchantId);

    // Order-based recommendations
    if (metrics.orders.thisWeek < metrics.orders.lastWeek) {
      const decline = Math.round((1 - metrics.orders.thisWeek / metrics.orders.lastWeek) * 100);
      recommendations.push({
        id: `rec_${Date.now()}_orders`,
        type: 'marketing',
        title: 'Boost Your Orders',
        description: `Order volume dropped ${decline}% this week compared to last week.`,
        priority: 'high',
        actions: [
          { type: 'run_promotion', title: 'Launch a discount promotion' },
          { type: 'boost_ads', title: 'Increase AdBazaar budget' },
          { type: 'notify_customers', title: 'Send push notification to customers' },
        ],
        expectedImpact: `+${Math.min(20, decline * 2)}% orders`,
        confidence: 0.85,
      });
    }

    // Revenue-based recommendations
    if (metrics.revenue.target > 0) {
      const achievement = (metrics.revenue.thisWeek / metrics.revenue.target) * 100;
      if (achievement < 80) {
        recommendations.push({
          id: `rec_${Date.now()}_revenue`,
          type: 'pricing',
          title: 'Revenue Target Alert',
          description: `You're at ${Math.round(achievement)}% of your weekly revenue target.`,
          priority: achievement < 50 ? 'critical' : 'high',
          actions: [
            { type: 'review_pricing', title: 'Review pricing strategy' },
            { type: 'upsell', title: 'Add upsell suggestions' },
          ],
          expectedImpact: `+${Math.round(80 - achievement)}% revenue`,
          confidence: 0.80,
        });
      }
    }

    // Inventory recommendations
    if (metrics.inventory.lowStockItems > 0) {
      recommendations.push({
        id: `rec_${Date.now()}_inventory`,
        type: 'inventory',
        title: 'Low Stock Alert',
        description: `${metrics.inventory.lowStockItems} items are running low.`,
        priority: 'medium',
        actions: [
          { type: 'view_low_stock', title: 'View low stock items' },
          { type: 'reorder', title: 'Create reorder list' },
        ],
        expectedImpact: 'Reduce stockouts by 80%',
        confidence: 0.92,
      });
    }

    if (metrics.inventory.stockoutRate > 5) {
      recommendations.push({
        id: `rec_${Date.now()}_stockout`,
        type: 'inventory',
        title: 'Stockout Issues Detected',
        description: `Your stockout rate is ${metrics.inventory.stockoutRate}%. This is affecting customer satisfaction.`,
        priority: 'high',
        actions: [
          { type: 'analyze_stockouts', title: 'Analyze stockout patterns' },
          { type: 'improve_forecasting', title: 'Improve demand forecasting' },
        ],
        expectedImpact: 'Reduce stockouts, improve ratings',
        confidence: 0.88,
      });
    }

    // Product-based recommendations
    if (productPerformance.topProducts.length > 0) {
      const topProduct = productPerformance.topProducts[0];
      recommendations.push({
        id: `rec_${Date.now()}_bundle`,
        type: 'marketing',
        title: 'Bundle Opportunity',
        description: `"${topProduct.name}" is your top seller. Consider bundling with complementary items.`,
        priority: 'low',
        actions: [
          { type: 'create_bundle', title: 'Create combo deal' },
          { type: 'view_analytics', title: 'View product analytics' },
        ],
        expectedImpact: '+5-10% AOV',
        confidence: 0.78,
      });
    }

    // Customer retention recommendations
    if (metrics.customers.total > 0) {
      const retentionRate = metrics.customers.returning / metrics.customers.total;
      if (retentionRate < 0.3) {
        recommendations.push({
          id: `rec_${Date.now()}_retention`,
          type: 'customer',
          title: 'Boost Customer Retention',
          description: `Only ${Math.round(retentionRate * 100)}% of customers are returning.`,
          priority: 'high',
          actions: [
            { type: 'loyalty_program', title: 'Start a loyalty program' },
            { type: 'winback_campaign', title: 'Create win-back campaign' },
          ],
          expectedImpact: '+15% returning customers',
          confidence: 0.75,
        });
      }
    }

    // Review-based recommendations
    if (metrics.reviews.avgRating < 4 && metrics.reviews.totalReviews > 5) {
      recommendations.push({
        id: `rec_${Date.now()}_reviews`,
        type: 'customer',
        title: 'Improve Customer Ratings',
        description: `Your average rating is ${metrics.reviews.avgRating}/5. Focus on service quality.`,
        priority: 'medium',
        actions: [
          { type: 'view_feedback', title: 'Read customer feedback' },
          { type: 'staff_training', title: 'Consider staff training' },
        ],
        expectedImpact: '+0.2 rating points',
        confidence: 0.70,
      });
    }

    // Competitor-based recommendations
    if (competitorData) {
      const priceGap = competitorData.priceGap;
      if (priceGap > 10) {
        recommendations.push({
          id: `rec_${Date.now()}_pricing`,
          type: 'pricing',
          title: 'Price Positioning Alert',
          description: `Your prices are ${Math.round(priceGap)}% higher than similar merchants.`,
          priority: 'medium',
          actions: [
            { type: 'review_pricing', title: 'Review pricing' },
            { type: 'add_value', title: 'Add value to justify price' },
          ],
          expectedImpact: 'Improve competitiveness',
          confidence: 0.82,
        });
      }
    }

    // Market trend recommendations
    if (marketTrends.demandIncrease.length > 0) {
      const trendingCategory = marketTrends.demandIncrease[0];
      recommendations.push({
        id: `rec_${Date.now()}_trend`,
        type: 'marketing',
        title: 'Trending Category Opportunity',
        description: `Demand for ${trendingCategory} is increasing in your area.`,
        priority: 'medium',
        actions: [
          { type: 'add_items', title: 'Add ${trendingCategory} items' },
          { type: 'promote', title: 'Feature trending items' },
        ],
        expectedImpact: '+20% orders',
        confidence: 0.80,
      });
    }

    // Sort by priority and confidence
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.confidence - a.confidence;
    });
  }

  async getMerchantData(merchantId: string): Promise<unknown> {
    try {
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getProductPerformance(merchantId: string): Promise<{
    topProducts: Array<{ id: string; name: string; orders: number; revenue: number }>;
    underperformers: Array<{ id: string; name: string }>;
  }> {
    try {
      const response = await axios.get(`${CATALOG_SERVICE_URL}/api/products/analytics`, {
        params: { merchantId, period: '30d' },
      });
      return response.data;
    } catch {
      return { topProducts: [], underperformers: [] };
    }
  }

  async getCustomerSegmentation(merchantId: string): Promise<{
    segments: Array<{ type: string; count: number; value: number }>;
  }> {
    try {
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/segments`);
      return response.data;
    } catch {
      return { segments: [] };
    }
  }

  async getMarketTrends(merchantId: string): Promise<{
    demandIncrease: string[];
    demandDecrease: string[];
    popularCategories: string[];
  }> {
    try {
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/trends/local`, {
        params: { merchantId },
      });
      return response.data;
    } catch {
      return { demandIncrease: [], demandDecrease: [], popularCategories: [] };
    }
  }

  async getCompetitorData(merchantId: string): Promise<{
    priceGap: number;
    avgCompetitorPrice: number;
    ourAvgPrice: number;
  } | null> {
    try {
      const response = await axios.get(`${MERCHANT_SERVICE_URL}/api/merchants/${merchantId}/competitors`);
      return response.data;
    } catch {
      return null;
    }
  }

  async getAdPerformance(merchantId: string): Promise<{
    totalSpend: number;
    conversions: number;
    roas: number;
    recommendations: string[];
  }> {
    try {
      const response = await axios.get(`${AD_SERVICE_URL}/api/ads/merchant/${merchantId}/analytics`);
      return response.data;
    } catch {
      return { totalSpend: 0, conversions: 0, roas: 0, recommendations: [] };
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
