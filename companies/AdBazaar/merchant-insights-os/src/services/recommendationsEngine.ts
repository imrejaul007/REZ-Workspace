import { v4 as uuidv4 } from 'uuid';
import { Recommendation, Merchant, RevenueRecord, ProductPerformance, Customer } from '../models/index.js';
import type { RecommendationsResponse, Recommendation as RecommendationType } from '../types/index.js';
import logger from '../config/logger.js';
import { subDays, format, addDays } from 'date-fns';
import revenueAnalysisService from './revenueAnalysis.js';
import marginAnalysisService from './marginAnalysis.js';
import productAnalysisService from './productAnalysis.js';
import customerAnalysisService from './customerAnalysis.js';
import demandForecastingService from './demandForecasting.js';
import competitorAnalysisService from './competitorAnalysis.js';

export class RecommendationsEngineService {
  /**
   * Generate comprehensive recommendations for a merchant
   */
  async getRecommendations(
    merchantId: string,
    category?: 'all' | 'revenue' | 'marketing' | 'inventory' | 'pricing' | 'customer',
    priority?: 'all' | 'critical' | 'high' | 'medium' | 'low'
  ): Promise<RecommendationsResponse> {
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error(`Merchant not found: ${merchantId}`);
    }

    // Get all analysis data
    const [revenueAnalysis, marginAnalysis, productAnalysis, customerAnalysis, demandAnalysis, competitorAnalysis] =
      await Promise.all([
        this.safeGet(() => revenueAnalysisService.getRevenueAnalysis(merchantId, 'month')),
        this.safeGet(() => marginAnalysisService.getMarginAnalysis(merchantId, 'month')),
        this.safeGet(() => productAnalysisService.getProductAnalysis(merchantId, 'month')),
        this.safeGet(() => customerAnalysisService.getCustomerCohortAnalysis(merchantId, 'month')),
        this.safeGet(() => demandForecastingService.getDemandAnalysis(merchantId, 'month')),
        this.safeGet(() => competitorAnalysisService.getCompetitorAnalysis(merchantId)),
      ]);

    // Generate recommendations from each analysis
    const recommendations: RecommendationType[] = [];

    // Revenue recommendations
    if (!category || category === 'all' || category === 'revenue') {
      recommendations.push(...this.getRevenueRecommendations(revenueAnalysis));
    }

    // Marketing recommendations
    if (!category || category === 'all' || category === 'marketing') {
      recommendations.push(...this.getMarketingRecommendations(revenueAnalysis, marginAnalysis));
    }

    // Inventory recommendations
    if (!category || category === 'all' || category === 'inventory') {
      recommendations.push(...this.getInventoryRecommendations(productAnalysis, demandAnalysis));
    }

    // Pricing recommendations
    if (!category || category === 'all' || category === 'pricing') {
      recommendations.push(...this.getPricingRecommendations(marginAnalysis, competitorAnalysis));
    }

    // Customer recommendations
    if (!category || category === 'all' || category === 'customer') {
      recommendations.push(...this.getCustomerRecommendations(customerAnalysis));
    }

    // Filter by priority if specified
    let filteredRecommendations = recommendations;
    if (priority && priority !== 'all') {
      filteredRecommendations = recommendations.filter(r => r.priority === priority);
    }

    // Sort by priority
    filteredRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Calculate priority score
    const priorityScore = this.calculatePriorityScore(filteredRecommendations);

    // Categorize recommendations by timeframe
    const summary = this.categorizeByTimeframe(filteredRecommendations);

    // Store recommendations in database
    await this.storeRecommendations(merchantId, filteredRecommendations);

    return {
      merchantId,
      generatedAt: new Date().toISOString(),
      priorityScore,
      recommendations: filteredRecommendations,
      summary,
    };
  }

  private async safeGet<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      logger.error('Error getting analysis data', { error });
      return null;
    }
  }

  private getRevenueRecommendations(revenueAnalysis: any): RecommendationType[] {
    const recommendations: RecommendationType[] = [];

    if (!revenueAnalysis) return recommendations;

    // Revenue growth recommendations
    if (revenueAnalysis.revenueGrowth < 0) {
      recommendations.push({
        id: uuidv4(),
        category: 'revenue',
        priority: 'critical',
        title: 'Revenue Decline Detected',
        description: `Your revenue has declined by ${Math.abs(revenueAnalysis.revenueGrowth).toFixed(1)}% compared to the previous period.`,
        action: 'Review recent changes in pricing, marketing, or customer acquisition strategies. Consider running a promotional campaign to boost sales.',
        expectedImpact: { metric: 'revenue', value: 10, unit: '%' },
        effort: 'medium',
        timeframe: 'this week',
        enabled: true,
      });
    }

    // Benchmark comparison
    if (revenueAnalysis.benchmarkComparison) {
      const { percentile } = revenueAnalysis.benchmarkComparison;
      if (percentile < 40) {
        recommendations.push({
          id: uuidv4(),
          category: 'revenue',
          priority: 'high',
          title: 'Below Industry Average',
          description: `Your revenue is in the bottom ${100 - percentile}% compared to similar businesses.`,
          action: 'Analyze top performers in your category to identify best practices. Consider差异化 your offering or improving customer experience.',
          expectedImpact: { metric: 'revenue', value: 15, unit: '%' },
          effort: 'high',
          timeframe: 'this month',
          enabled: true,
        });
      }
    }

    // Average order value
    if (revenueAnalysis.averageOrderValue < 500) {
      recommendations.push({
        id: uuidv4(),
        category: 'revenue',
        priority: 'medium',
        title: 'Increase Average Order Value',
        description: `Your average order value is ${revenueAnalysis.averageOrderValue.toFixed(0)}. Industry best is often 2-3x higher.`,
        action: 'Implement cross-selling and upselling strategies. Offer bundle deals or minimum order discounts.',
        expectedImpact: { metric: 'averageOrderValue', value: 20, unit: '%' },
        effort: 'low',
        timeframe: 'this week',
        enabled: true,
      });
    }

    return recommendations;
  }

  private getMarketingRecommendations(revenueAnalysis: any, marginAnalysis: any): RecommendationType[] {
    const recommendations: RecommendationType[] = [];

    if (!revenueAnalysis && !marginAnalysis) return recommendations;

    // Marketing spend efficiency
    if (marginAnalysis?.costBreakdown?.marketing) {
      const marketingPercent = (marginAnalysis.costBreakdown.marketing / (revenueAnalysis?.totalRevenue || 1)) * 100;

      if (marketingPercent > 30) {
        recommendations.push({
          id: uuidv4(),
          category: 'marketing',
          priority: 'high',
          title: 'High Marketing Spend',
          description: `Marketing costs are ${marketingPercent.toFixed(1)}% of revenue, above the recommended 15-20%.`,
          action: 'Review marketing channel efficiency. Focus on high-converting channels and reduce spend on underperforming ones.',
          expectedImpact: { metric: 'netMargin', value: 5, unit: '%' },
          effort: 'medium',
          timeframe: 'this week',
          enabled: true,
        });
      } else if (marketingPercent < 10 && revenueAnalysis?.trend === 'stable') {
        recommendations.push({
          id: uuidv4(),
          category: 'marketing',
          priority: 'medium',
          title: 'Low Marketing Investment',
          description: 'Marketing spend is below average. Consider increasing investment to drive growth.',
          action: 'Test additional marketing channels. Increase budget by 20% for 2 weeks and measure impact.',
          expectedImpact: { metric: 'revenue', value: 8, unit: '%' },
          effort: 'low',
          timeframe: 'this week',
          enabled: true,
        });
      }
    }

    // Don't spend on ads recommendation
    if (revenueAnalysis?.trend === 'down') {
      recommendations.push({
        id: uuidv4(),
        category: 'marketing',
        priority: 'critical',
        title: 'Pause Ad Spend',
        description: 'Revenue is declining. Additional ad spend may not be effective without addressing root causes.',
        action: "Don't spend on ads this week. Focus on product quality, pricing, and customer service instead.",
        expectedImpact: { metric: 'waste', value: 30, unit: '%' },
        effort: 'low',
        timeframe: 'immediate',
        enabled: true,
      });
    }

    return recommendations;
  }

  private getInventoryRecommendations(productAnalysis: any, demandAnalysis: any): RecommendationType[] {
    const recommendations: RecommendationType[] = [];

    if (!productAnalysis && !demandAnalysis) return recommendations;

    // Stock recommendations from demand forecasting
    if (demandAnalysis?.recommendations) {
      for (const rec of demandAnalysis.recommendations) {
        if (rec.productId !== 'all' && rec.urgency === 'high') {
          recommendations.push({
            id: uuidv4(),
            category: 'inventory',
            priority: rec.urgency === 'high' ? 'high' : 'medium',
            title: rec.action.split(' - ')[0],
            description: rec.reason,
            action: rec.action,
            expectedImpact: { metric: 'sales', value: 15, unit: '%' },
            effort: 'low',
            timeframe: 'this week',
            enabled: true,
          });
        }
      }
    }

    // Top performers inventory
    if (productAnalysis?.topProducts?.length > 0) {
      const topProduct = productAnalysis.topProducts[0];
      recommendations.push({
        id: uuidv4(),
        category: 'inventory',
        priority: 'high',
        title: `Increase Inventory for ${topProduct.name}`,
        description: `${topProduct.name} is your top performer with ${topProduct.unitsSold} units sold.`,
        action: `Increase inventory for Product A (${topProduct.name}). Run a targeted campaign to maximize sales during peak demand.`,
        expectedImpact: { metric: 'revenue', value: 12, unit: '%' },
        effort: 'low',
        timeframe: 'this week',
        enabled: true,
      });
    }

    // Underperformers
    if (productAnalysis?.underperformers?.length > 0) {
      recommendations.push({
        id: uuidv4(),
        category: 'inventory',
        priority: 'medium',
        title: 'Review Underperforming Products',
        description: `${productAnalysis.underperformers.length} products are underperforming.`,
        action: 'Review pricing and marketing for underperforming products. Consider discontinuing if trends continue.',
        expectedImpact: { metric: 'inventory', value: 10, unit: '%' },
        effort: 'medium',
        timeframe: 'this month',
        enabled: true,
      });
    }

    return recommendations;
  }

  private getPricingRecommendations(marginAnalysis: any, competitorAnalysis: any): RecommendationType[] {
    const recommendations: RecommendationType[] = [];

    if (!marginAnalysis && !competitorAnalysis) return recommendations;

    // Margin improvement
    if (marginAnalysis?.marginOpportunities?.length > 0) {
      const topOpportunity = marginAnalysis.marginOpportunities[0];
      recommendations.push({
        id: uuidv4(),
        category: 'pricing',
        priority: 'high',
        title: `Optimize ${topOpportunity.category} Costs`,
        description: topOpportunity.action,
        action: topOpportunity.action,
        expectedImpact: { metric: 'netMargin', value: topOpportunity.potentialSavings, unit: 'INR' },
        effort: 'medium',
        timeframe: 'this month',
        enabled: true,
      });
    }

    // Competitor pricing
    if (competitorAnalysis?.positioning) {
      const { relativeToMarket } = competitorAnalysis.positioning;

      if (relativeToMarket === 'follower' || relativeToMarket === 'niche') {
        recommendations.push({
          id: uuidv4(),
          category: 'pricing',
          priority: 'medium',
          title: 'Consider Premium Positioning',
          description: 'You are currently positioned as a follower. Consider differentiating with premium offerings.',
          action: 'Add premium products or services to differentiate from competitors and improve margins.',
          expectedImpact: { metric: 'averageOrderValue', value: 25, unit: '%' },
          effort: 'high',
          timeframe: 'this quarter',
          enabled: true,
        });
      }
    }

    // Net margin optimization
    if (marginAnalysis?.netMargin < 10) {
      recommendations.push({
        id: uuidv4(),
        category: 'pricing',
        priority: 'critical',
        title: 'Improve Net Margin',
        description: `Your net margin is ${marginAnalysis.netMargin.toFixed(1)}%, below healthy levels.`,
        action: 'Review all costs and consider a 5-10% price increase. Focus on reducing operational costs.',
        expectedImpact: { metric: 'netMargin', value: 3, unit: '%' },
        effort: 'medium',
        timeframe: 'this week',
        enabled: true,
      });
    }

    return recommendations;
  }

  private getCustomerRecommendations(customerAnalysis: any): RecommendationType[] {
    const recommendations: RecommendationType[] = [];

    if (!customerAnalysis) return recommendations;

    // Retention rate
    if (customerAnalysis.retentionRate < 70) {
      recommendations.push({
        id: uuidv4(),
        category: 'customer',
        priority: 'high',
        title: 'Improve Customer Retention',
        description: `Your retention rate is ${customerAnalysis.retentionRate.toFixed(1)}%, which can be improved.`,
        action: 'Implement a loyalty program and personalized follow-ups. Focus on customer experience improvements.',
        expectedImpact: { metric: 'retentionRate', value: 10, unit: '%' },
        effort: 'medium',
        timeframe: 'this month',
        enabled: true,
      });
    }

    // At-risk customers
    const atRiskSegment = customerAnalysis.segments?.find(s => s.segmentId === 'at-risk');
    if (atRiskSegment && atRiskSegment.count > 10) {
      recommendations.push({
        id: uuidv4(),
        category: 'customer',
        priority: 'high',
        title: 'Win Back At-Risk Customers',
        description: `${atRiskSegment.count} customers are at risk of churning.`,
        action: 'Launch a win-back campaign with special offers. Personal outreach to high-value at-risk customers.',
        expectedImpact: { metric: 'churnRate', value: 15, unit: '%' },
        effort: 'medium',
        timeframe: 'this week',
        enabled: true,
      });
    }

    // VIP customers
    const vipSegment = customerAnalysis.segments?.find(s => s.segmentId === 'vip');
    if (vipSegment) {
      recommendations.push({
        id: uuidv4(),
        category: 'customer',
        priority: 'medium',
        title: 'VIP Customer Engagement',
        description: `You have ${vipSegment.count} VIP customers with high lifetime value.`,
        action: 'Create exclusive benefits for VIP customers. Personal thank-you notes and early access to new products.',
        expectedImpact: { metric: 'customerLifetimeValue', value: 10, unit: '%' },
        effort: 'low',
        timeframe: 'this week',
        enabled: true,
      });
    }

    // New customers
    if (customerAnalysis.newCustomers > 50) {
      recommendations.push({
        id: uuidv4(),
        category: 'customer',
        priority: 'medium',
        title: 'Convert New Customers to Regulars',
        description: `${customerAnalysis.newCustomers} new customers acquired. Focus on conversion to repeat buyers.`,
        action: 'Send welcome discounts and educational content. Implement post-purchase follow-up sequence.',
        expectedImpact: { metric: 'repeatPurchaseRate', value: 20, unit: '%' },
        effort: 'low',
        timeframe: 'this week',
        enabled: true,
      });
    }

    return recommendations;
  }

  private calculatePriorityScore(recommendations: RecommendationType[]): number {
    if (recommendations.length === 0) return 0;

    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalWeight = recommendations.reduce((sum, r) => sum + weights[r.priority], 0);
    const maxWeight = recommendations.length * 4;

    return Math.round((totalWeight / maxWeight) * 100);
  }

  private categorizeByTimeframe(recommendations: RecommendationType[]): {
    immediate: string[];
    thisWeek: string[];
    thisMonth: string[];
  } {
    const immediate: string[] = [];
    const thisWeek: string[] = [];
    const thisMonth: string[] = [];

    for (const rec of recommendations) {
      if (rec.timeframe === 'immediate') {
        immediate.push(rec.title);
      } else if (rec.timeframe.includes('week')) {
        thisWeek.push(rec.title);
      } else {
        thisMonth.push(rec.title);
      }
    }

    return { immediate, thisWeek, thisMonth };
  }

  private async storeRecommendations(
    merchantId: string,
    recommendations: RecommendationType[]
  ): Promise<void> {
    try {
      // Delete old recommendations
      await Recommendation.deleteMany({
        merchantId,
        expiresAt: { $gt: new Date() },
      });

      // Insert new recommendations
      const docs = recommendations.map(rec => ({
        merchantId,
        recommendationId: rec.id,
        category: rec.category,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        action: rec.action,
        expectedImpact: rec.expectedImpact,
        effort: rec.effort,
        timeframe: rec.timeframe,
        enabled: rec.enabled,
        generatedAt: new Date(),
        expiresAt: addDays(new Date(), 7),
      }));

      await Recommendation.insertMany(docs);
    } catch (error) {
      logger.error('Error storing recommendations', { error, merchantId });
    }
  }
}

export default new RecommendationsEngineService();