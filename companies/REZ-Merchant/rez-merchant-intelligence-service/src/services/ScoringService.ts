import { MerchantProfileDocument } from '../models';
import {
  HealthScore,
  GrowthScore,
  EngagementScore,
  RiskIndicator,
  MerchantScores,
  MerchantProfile,
} from '../types';
import config from '../config';

interface ScoreComponents {
  revenue: number;
  orders: number;
  customers: number;
  inventory: number;
  feedback: number;
  engagement: number;
}

interface GrowthComponents {
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
  marketExpansion: number;
}

interface EngagementComponents {
  customerEngagement: number;
  repeatPurchaseRate: number;
  responseRate: number;
  updateFrequency: number;
}

export class ScoringService {
  private weights = config.scoring.weights.health;

  /**
   * Calculate comprehensive merchant scores
   */
  async calculateMerchantScores(profile: MerchantProfileDocument | MerchantProfile): Promise<MerchantScores> {
    const healthScore = this.calculateHealthScore(profile);
    const growthScore = this.calculateGrowthScore(profile);
    const engagementScore = this.calculateEngagementScore(profile);
    const riskIndicators = this.identifyRiskIndicators(profile, healthScore, growthScore);

    // Composite score: weighted average of all scores
    const compositeScore = Math.round(
      (healthScore.score * 0.4) +
      (growthScore.score * 0.3) +
      (engagementScore.score * 0.3)
    );

    return {
      merchantId: profile.merchantId,
      healthScore,
      growthScore,
      engagementScore,
      riskIndicators,
      compositeScore,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate Health Score (0-100)
   * Based on: revenue, orders, customers, inventory, feedback, engagement
   */
  calculateHealthScore(profile: MerchantProfileDocument | MerchantProfile): HealthScore {
    const components = this.calculateHealthComponents(profile);
    const weights = this.weights;

    const weightedScore = (
      components.revenue * weights.revenue +
      components.orders * weights.orders +
      components.customers * weights.customers +
      components.inventory * weights.inventory +
      components.feedback * weights.feedback +
      components.engagement * weights.engagement
    );

    const score = Math.round(weightedScore * 100);

    return {
      score,
      grade: this.scoreToGrade(score),
      components,
      factors: this.getHealthFactors(components),
    };
  }

  /**
   * Calculate individual health components
   */
  private calculateHealthComponents(profile: MerchantProfileDocument | MerchantProfile): ScoreComponents {
    const revenuePatterns = profile.revenuePatterns || {};
    const orderVolume = profile.orderVolume || {};
    const customerDemographics = profile.customerDemographics || {};
    const inventoryPatterns = profile.inventoryPatterns || {};
    const healthSignals = profile.healthSignals || {};

    return {
      // Revenue component: based on average order value and growth
      revenue: this.normalizeRevenueScore(revenuePatterns.averageOrderValue || 0, revenuePatterns.revenueGrowth?.mom || 0),

      // Orders component: completion rate and volume
      orders: this.normalizeOrderScore(
        orderVolume.completed || 0,
        orderVolume.total || 0,
        orderVolume.averagePerDay || 0
      ),

      // Customers component: retention rate and growth
      customers: this.normalizeCustomerScore(
        customerDemographics.retentionRate || 0,
        customerDemographics.totalCustomers || 0,
        customerDemographics.newCustomers || 0
      ),

      // Inventory component: stock health
      inventory: this.normalizeInventoryScore(
        inventoryPatterns.totalProducts || 0,
        inventoryPatterns.outOfStock || 0,
        inventoryPatterns.lowStock || 0,
        inventoryPatterns.turnoverRate || 0
      ),

      // Feedback component: based on alerts and ratings
      feedback: this.normalizeFeedbackScore(
        healthSignals.alerts?.filter(a => a.type.includes('feedback')).length || 0,
        healthSignals.alerts?.length || 0
      ),

      // Engagement component: activity and updates
      engagement: this.normalizeEngagementScore(profile),
    };
  }

  /**
   * Normalize revenue score based on AOV and growth
   */
  private normalizeRevenueScore(aov: number, growth: number): number {
    // Base score on AOV (assuming $0-500 range)
    const aovScore = Math.min(aov / 200, 1) * 0.6;

    // Growth bonus/penalty
    const growthBonus = Math.min(Math.max(growth, -0.3), 0.5) * 0.4;

    return Math.max(0, Math.min(1, aovScore + growthBonus + 0.2));
  }

  /**
   * Normalize order score based on completion rate and volume
   */
  private normalizeOrderScore(completed: number, total: number, avgPerDay: number): number {
    const completionRate = total > 0 ? completed / total : 0;
    const volumeScore = Math.min(avgPerDay / 50, 1); // Assuming 50 orders/day is excellent

    return (completionRate * 0.6) + (volumeScore * 0.4);
  }

  /**
   * Normalize customer score based on retention and new customer ratio
   */
  private normalizeCustomerScore(retentionRate: number, total: number, newCustomers: number): number {
    const retentionScore = retentionRate;
    const newCustomerRatio = total > 0 ? newCustomers / total : 0;

    return (retentionScore * 0.7) + (newCustomerRatio * 0.3);
  }

  /**
   * Normalize inventory score (lower out-of-stock = better)
   */
  private normalizeInventoryScore(total: number, outOfStock: number, lowStock: number, turnover: number): number {
    if (total === 0) return 0.5;

    const availabilityScore = 1 - ((outOfStock + lowStock) / total);
    const turnoverScore = Math.min(turnover / 12, 1); // Assuming 12x/year is excellent turnover

    return (availabilityScore * 0.6) + (turnoverScore * 0.4);
  }

  /**
   * Normalize feedback score based on alert counts
   */
  private normalizeFeedbackScore(feedbackAlerts: number, totalAlerts: number): number {
    if (totalAlerts === 0) return 1;

    const feedbackRatio = 1 - (feedbackAlerts / totalAlerts);
    return Math.max(0, Math.min(1, feedbackRatio));
  }

  /**
   * Normalize engagement score based on activity
   */
  private normalizeEngagementScore(profile: MerchantProfileDocument | MerchantProfile): number {
    const lastSynced = profile.lastSyncedAt ? new Date(profile.lastSyncedAt).getTime() : 0;
    const now = Date.now();
    const hoursSinceSync = (now - lastSynced) / (1000 * 60 * 60);

    // Recency score: syncing within 24 hours is best
    const recencyScore = Math.max(0, 1 - (hoursSinceSync / 168)); // Decay over 1 week
    const baseScore = 0.5;

    return (recencyScore * 0.5) + (baseScore * 0.5);
  }

  /**
   * Get health factors contributing to score
   */
  private getHealthFactors(components: ScoreComponents): { name: string; impact: number }[] {
    return [
      { name: 'Revenue Performance', impact: Math.round(components.revenue * 100) },
      { name: 'Order Fulfillment', impact: Math.round(components.orders * 100) },
      { name: 'Customer Base', impact: Math.round(components.customers * 100) },
      { name: 'Inventory Health', impact: Math.round(components.inventory * 100) },
      { name: 'Customer Feedback', impact: Math.round(components.feedback * 100) },
      { name: 'Activity Level', impact: Math.round(components.engagement * 100) },
    ];
  }

  /**
   * Calculate Growth Score (0-100)
   */
  calculateGrowthScore(profile: MerchantProfileDocument | MerchantProfile): GrowthScore {
    const components = this.calculateGrowthComponents(profile);
    const weights = { revenueGrowth: 0.3, orderGrowth: 0.3, customerGrowth: 0.25, marketExpansion: 0.15 };

    const weightedScore = (
      components.revenueGrowth * weights.revenueGrowth +
      components.orderGrowth * weights.orderGrowth +
      components.customerGrowth * weights.customerGrowth +
      components.marketExpansion * weights.marketExpansion
    );

    const score = Math.round(weightedScore * 100);

    return {
      score,
      grade: this.scoreToGrade(score),
      components,
      momentum: this.determineMomentum(profile),
    };
  }

  /**
   * Calculate growth components
   */
  private calculateGrowthComponents(profile: MerchantProfileDocument | MerchantProfile): GrowthComponents {
    const growthMetrics = profile.growthMetrics || {};
    const revenuePatterns = profile.revenuePatterns || {};
    const orderVolume = profile.orderVolume || {};

    return {
      revenueGrowth: this.normalizeGrowthMetric(growthMetrics.revenue?.percentageChange || revenuePatterns.revenueGrowth?.mom || 0),
      orderGrowth: this.normalizeGrowthMetric(growthMetrics.orders?.percentageChange || 0),
      customerGrowth: this.normalizeGrowthMetric(growthMetrics.customers?.percentageChange || 0),
      marketExpansion: this.normalizeMarketExpansion(profile),
    };
  }

  /**
   * Normalize growth metric (-1 to 1 range)
   */
  private normalizeGrowthMetric(percentageChange: number): number {
    // Map percentage change to 0-1 (expecting -100% to +100% range)
    return Math.max(-1, Math.min(1, percentageChange / 100)) * 0.5 + 0.5;
  }

  /**
   * Calculate market expansion score
   */
  private normalizeMarketExpansion(profile: MerchantProfileDocument | MerchantProfile): number {
    const customerDemographics = profile.customerDemographics || {};
    const locations = customerDemographics.demographics?.locations || [];

    // More locations = higher market expansion
    const locationCount = locations.length;
    return Math.min(locationCount / 10, 1);
  }

  /**
   * Determine growth momentum
   */
  private determineMomentum(profile: MerchantProfileDocument | MerchantProfile): 'accelerating' | 'stable' | 'decelerating' {
    const growthMetrics = profile.growthMetrics?.revenue;
    if (!growthMetrics) return 'stable';

    const current = growthMetrics.percentageChange;
    const previous = growthMetrics.previous > 0 ? ((growthMetrics.current - growthMetrics.previous) / growthMetrics.previous) * 100 : 0;

    if (current > previous * 1.1) return 'accelerating';
    if (current < previous * 0.9) return 'decelerating';
    return 'stable';
  }

  /**
   * Calculate Engagement Score (0-100)
   */
  calculateEngagementScore(profile: MerchantProfileDocument | MerchantProfile): EngagementScore {
    const components = this.calculateEngagementComponents(profile);
    const weights = { customerEngagement: 0.35, repeatPurchaseRate: 0.35, responseRate: 0.2, updateFrequency: 0.1 };

    const weightedScore = (
      components.customerEngagement * weights.customerEngagement +
      components.repeatPurchaseRate * weights.repeatPurchaseRate +
      components.responseRate * weights.responseRate +
      components.updateFrequency * weights.updateFrequency
    );

    const score = Math.round(weightedScore * 100);

    return {
      score,
      grade: this.scoreToGrade(score),
      components,
    };
  }

  /**
   * Calculate engagement components
   */
  private calculateEngagementComponents(profile: MerchantProfileDocument | MerchantProfile): EngagementComponents {
    const customerDemographics = profile.customerDemographics || {};
    const orderVolume = profile.orderVolume || {};
    const topCustomers = customerDemographics.topCustomers || [];
    const totalCustomers = customerDemographics.totalCustomers || 1;

    // Customer engagement: ratio of active customers
    const activeCustomerRatio = topCustomers.filter(c => {
      const lastOrderDays = c.lastOrderDate ? (Date.now() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24) : Infinity;
      return lastOrderDays < 30;
    }).length / totalCustomers;

    // Repeat purchase rate: returning customers / total
    const repeatRate = customerDemographics.retentionRate || 0;

    // Response rate: mock for now (would come from feedback system)
    const responseRate = 0.85;

    // Update frequency: based on last sync
    const lastSynced = profile.lastSyncedAt ? new Date(profile.lastSyncedAt).getTime() : 0;
    const daysSinceSync = (Date.now() - lastSynced) / (1000 * 60 * 60 * 24);
    const updateFrequency = Math.max(0, 1 - (daysSinceSync / 7));

    return {
      customerEngagement: Math.min(activeCustomerRatio, 1),
      repeatPurchaseRate: repeatRate,
      responseRate: responseRate,
      updateFrequency: updateFrequency,
    };
  }

  /**
   * Identify risk indicators based on profile data
   */
  identifyRiskIndicators(
    profile: MerchantProfileDocument | MerchantProfile,
    healthScore: HealthScore,
    growthScore: GrowthScore
  ): RiskIndicator[] {
    const risks: RiskIndicator[] = [];
    const healthSignals = profile.healthSignals || {};
    const growthMetrics = profile.growthMetrics || {};

    // Declining revenue risk
    if ((growthMetrics.revenue?.percentageChange || 0) < -10) {
      risks.push({
        type: 'declining_revenue',
        severity: 'high',
        probability: 0.7,
        impact: 0.8,
        description: 'Revenue has declined by more than 10% compared to previous period',
        mitigation: 'Analyze factors affecting revenue and implement corrective measures',
      });
    }

    // Customer churn risk
    if ((growthMetrics.customerRetention?.percentageChange || 0) < -5) {
      risks.push({
        type: 'customer_churn',
        severity: 'medium',
        probability: 0.6,
        impact: 0.7,
        description: 'Customer retention is declining',
        mitigation: 'Implement customer retention programs and gather feedback',
      });
    }

    // Inventory risk
    const inventoryPatterns = profile.inventoryPatterns || {};
    if (inventoryPatterns.outOfStock && inventoryPatterns.totalProducts) {
      const outOfStockRatio = inventoryPatterns.outOfStock / inventoryPatterns.totalProducts;
      if (outOfStockRatio > 0.2) {
        risks.push({
          type: 'inventory_stockout',
          severity: 'high',
          probability: 0.8,
          impact: 0.9,
          description: 'High percentage of products out of stock',
          mitigation: 'Improve inventory management and restock processes',
        });
      }
    }

    // Low health score risk
    if (healthScore.score < 50) {
      risks.push({
        type: 'poor_health',
        severity: 'critical',
        probability: 0.9,
        impact: 1.0,
        description: 'Overall merchant health score is below 50',
        mitigation: 'Comprehensive review and improvement plan needed',
      });
    }

    // Negative growth momentum
    if (growthScore.momentum === 'decelerating') {
      risks.push({
        type: 'decelerating_growth',
        severity: 'medium',
        probability: 0.65,
        impact: 0.6,
        description: 'Growth momentum is slowing down',
        mitigation: 'Review growth strategies and identify new opportunities',
      });
    }

    // Active alerts risk
    const activeAlerts = healthSignals.alerts?.filter(a => !a.acknowledged).length || 0;
    if (activeAlerts > 3) {
      risks.push({
        type: 'multiple_alerts',
        severity: 'high',
        probability: 0.8,
        impact: 0.7,
        description: `${activeAlerts} unacknowledged alerts require attention`,
        mitigation: 'Review and address all pending alerts',
      });
    }

    return risks;
  }

  /**
   * Convert score to letter grade
   */
  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}

export const scoringService = new ScoringService();
export default scoringService;
