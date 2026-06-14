// Merchant Health Score Service
// Real-time health tracking and insights for merchant performance
// Enhanced with error types and validation

import {
  MerchantHealthScore,
  HealthInsight,
  MerchantStats,
  Order,
  OrderStats,
  RevenueStats,
  ReviewStats,
  QRCode,
} from '../services/merchant.service';

// ─── Error Types ────────────────────────────────────────────────────────────────

export class HealthCalculationError extends Error {
  constructor(
    message: string,
    public code: string = 'HEALTH_CALC_ERROR'
  ) {
    super(message);
    this.name = 'HealthCalculationError';
  }
}

export class InvalidStatsError extends HealthCalculationError {
  constructor(message: string) {
    super(message, 'INVALID_STATS');
    this.name = 'InvalidStatsError';
  }
}

export class InvalidComponentError extends HealthCalculationError {
  constructor(componentName: string) {
    super(`Invalid health component: ${componentName}`, 'INVALID_COMPONENT');
    this.name = 'InvalidComponentError';
  }
}

// ─── Validation Helpers ─────────────────────────────────────────────────────────

function validateMerchantStats(stats: MerchantStats | null | undefined): asserts stats is MerchantStats {
  if (!stats) {
    throw new InvalidStatsError('Merchant stats are required for health calculation');
  }
  if (typeof stats.dailyRevenue !== 'number' || stats.dailyRevenue < 0) {
    throw new InvalidStatsError('Invalid daily revenue value');
  }
  if (typeof stats.totalOrders !== 'number' || stats.totalOrders < 0) {
    throw new InvalidStatsError('Invalid total orders value');
  }
}

function validateComponentConfig(config: HealthComponentConfig): void {
  if (!config.name || typeof config.name !== 'string') {
    throw new InvalidComponentError(config.name || 'unknown');
  }
  if (typeof config.weight !== 'number' || config.weight < 0 || config.weight > 100) {
    throw new HealthCalculationError(`Invalid weight for component ${config.name}`, 'INVALID_WEIGHT');
  }
  if (!Array.isArray(config.metrics) || config.metrics.length === 0) {
    throw new HealthCalculationError(`Component ${config.name} must have at least one metric`, 'MISSING_METRICS');
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface HealthComponentConfig {
  name: string;
  weight: number;
  metrics: HealthMetric[];
}

export interface HealthMetric {
  key: string;
  label: string;
  getValue: (stats: MerchantStats, orders: Order[]) => number;
  thresholds: {
    excellent: number;
    good: number;
    fair: number;
  };
}

export interface HealthTrendData {
  date: string;
  score: number;
  components: Record<string, number>;
}

// ─── Loading State ──────────────────────────────────────────────────────────────

export interface HealthLoadingState {
  healthScore: MerchantHealthScore | null;
  loading: boolean;
  error: HealthCalculationError | null;
  lastCalculated: Date | null;
}

// ─── Health component definitions
export const HEALTH_COMPONENTS: HealthComponentConfig[] = [
  {
    name: 'revenue',
    weight: 30,
    metrics: [
      {
        key: 'dailyRevenue',
        label: 'Daily Revenue',
        getValue: (stats) => stats.dailyRevenue,
        thresholds: { excellent: 5000, good: 2000, fair: 500 },
      },
      {
        key: 'growthRate',
        label: 'Growth Rate',
        getValue: (stats) => stats.growthRate,
        thresholds: { excellent: 20, good: 10, fair: 0 },
      },
    ],
  },
  {
    name: 'orders',
    weight: 25,
    metrics: [
      {
        key: 'totalOrders',
        label: 'Order Volume',
        getValue: (stats) => stats.totalOrders,
        thresholds: { excellent: 100, good: 50, fair: 10 },
      },
      {
        key: 'avgOrderValue',
        label: 'Avg Order Value',
        getValue: (stats) => stats.avgOrderValue,
        thresholds: { excellent: 500, good: 200, fair: 50 },
      },
    ],
  },
  {
    name: 'customerSatisfaction',
    weight: 20,
    metrics: [
      {
        key: 'retention',
        label: 'Customer Retention',
        getValue: (stats) => stats.customerRetention,
        thresholds: { excellent: 80, good: 60, fair: 40 },
      },
    ],
  },
  {
    name: 'engagement',
    weight: 15,
    metrics: [
      {
        key: 'qrScans',
        label: 'QR Scans',
        getValue: (stats) => stats.qrScans,
        thresholds: { excellent: 200, good: 100, fair: 20 },
      },
    ],
  },
  {
    name: 'offerPerformance',
    weight: 10,
    metrics: [
      {
        key: 'activeOffers',
        label: 'Active Offers',
        getValue: (stats) => stats.activeOffers,
        thresholds: { excellent: 10, good: 5, fair: 1 },
      },
    ],
  },
];

/**
 * Calculate individual metric score
 */
export function calculateMetricScore(
  value: number,
  thresholds: { excellent: number; good: number; fair: number }
): number {
  if (value >= thresholds.excellent) return 100;
  if (value >= thresholds.good) {
    const range = thresholds.excellent - thresholds.good;
    const position = value - thresholds.good;
    return 60 + (position / range) * 40;
  }
  if (value >= thresholds.fair) {
    const range = thresholds.good - thresholds.fair;
    const position = value - thresholds.fair;
    return 30 + (position / range) * 30;
  }
  if (value > 0) {
    const range = thresholds.fair;
    const position = value;
    return (position / range) * 30;
  }
  return 0;
}

/**
 * Calculate component score
 */
export function calculateComponentScore(
  component: HealthComponentConfig,
  stats: MerchantStats,
  orders: Order[]
): number {
  if (component.metrics.length === 0) return 50;

  const scores = component.metrics.map((metric) =>
    calculateMetricScore(metric.getValue(stats, orders), metric.thresholds)
  );

  // Average of all metric scores for this component
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Determine trend based on recent data
 */
export function determineTrend(
  currentScore: number,
  previousScore: number
): 'up' | 'down' | 'stable' {
  const diff = currentScore - previousScore;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

/**
 * Calculate health score from REAL service data
 */
export function calculateHealthScoreFromRealData(
  orderStats: OrderStats | null,
  revenueStats: RevenueStats | null,
  reviewStats: ReviewStats | null,
  qrCodes: QRCode[]
): MerchantHealthScore {
  // Revenue component (30% weight)
  const revenueScore = calculateRevenueComponentScore(revenueStats, orderStats);
  const revenueTrend = determineTrend(revenueScore, 50);

  // Orders component (25% weight)
  const ordersScore = calculateOrdersComponentScore(orderStats);
  const ordersTrend = determineTrend(ordersScore, 50);

  // Customer Satisfaction component (20% weight)
  const satisfactionScore = calculateSatisfactionComponentScore(reviewStats);
  const satisfactionTrend = determineTrend(satisfactionScore, 50);

  // Engagement component (15% weight)
  const engagementScore = calculateEngagementComponentScore(qrCodes);
  const engagementTrend = determineTrend(engagementScore, 50);

  // Offer Performance component (10% weight)
  const offerScore = calculateOfferComponentScore(qrCodes);
  const offerTrend = determineTrend(offerScore, 50);

  // Calculate weighted overall score
  const overall = Math.round(
    revenueScore * 0.30 +
    ordersScore * 0.25 +
    satisfactionScore * 0.20 +
    engagementScore * 0.15 +
    offerScore * 0.10
  );

  const healthScore: MerchantHealthScore = {
    overall,
    components: {
      revenue: { score: Math.round(revenueScore), weight: 30, trend: revenueTrend },
      orders: { score: Math.round(ordersScore), weight: 25, trend: ordersTrend },
      customerSatisfaction: { score: Math.round(satisfactionScore), weight: 20, trend: satisfactionTrend },
      engagement: { score: Math.round(engagementScore), weight: 15, trend: engagementTrend },
      offerPerformance: { score: Math.round(offerScore), weight: 10, trend: offerTrend },
    },
    lastUpdated: new Date().toISOString(),
    insights: [],
  };

  // Generate insights from real data
  healthScore.insights = generateHealthInsightsFromRealData(healthScore, orderStats, revenueStats, reviewStats, qrCodes);

  return healthScore;
}

/**
 * Calculate revenue component score from real data
 */
function calculateRevenueComponentScore(
  revenueStats: RevenueStats | null,
  orderStats: OrderStats | null
): number {
  const dailyRevenue = revenueStats?.dailyRevenue ?? orderStats?.revenueToday ?? 0;
  const growthRate = revenueStats?.growthRate ?? orderStats?.growthRateMonth ?? 0;

  // Score based on daily revenue
  let revenueScore: number;
  if (dailyRevenue >= 5000) revenueScore = 100;
  else if (dailyRevenue >= 2000) revenueScore = 80;
  else if (dailyRevenue >= 1000) revenueScore = 60;
  else if (dailyRevenue >= 500) revenueScore = 40;
  else if (dailyRevenue > 0) revenueScore = 20;
  else revenueScore = 0;

  // Growth adjustment
  if (growthRate > 20) return Math.min(100, revenueScore + 10);
  if (growthRate > 10) return Math.min(100, revenueScore + 5);
  if (growthRate > 0) return Math.min(100, revenueScore + 2);
  if (growthRate < -10) return Math.max(0, revenueScore - 15);
  if (growthRate < 0) return Math.max(0, revenueScore - 5);
  return revenueScore;
}

/**
 * Calculate orders component score from real data
 */
function calculateOrdersComponentScore(orderStats: OrderStats | null): number {
  const totalOrders = orderStats?.completedOrders ?? 0;
  const avgOrderValue = orderStats?.avgOrderValue ?? 0;

  // Volume score
  let volumeScore: number;
  if (totalOrders >= 100) volumeScore = 100;
  else if (totalOrders >= 50) volumeScore = 80;
  else if (totalOrders >= 20) volumeScore = 60;
  else if (totalOrders >= 10) volumeScore = 40;
  else if (totalOrders > 0) volumeScore = 20;
  else volumeScore = 0;

  // Average order value score
  let valueScore: number;
  if (avgOrderValue >= 500) valueScore = 100;
  else if (avgOrderValue >= 200) valueScore = 80;
  else if (avgOrderValue >= 100) valueScore = 60;
  else if (avgOrderValue >= 50) valueScore = 40;
  else if (avgOrderValue > 0) valueScore = 20;
  else valueScore = 0;

  return volumeScore * 0.6 + valueScore * 0.4;
}

/**
 * Calculate satisfaction component score from real data
 */
function calculateSatisfactionComponentScore(reviewStats: ReviewStats | null): number {
  const avgRating = reviewStats?.averageRating ?? 0;
  const sentimentScore = reviewStats?.sentimentScore ?? 50;
  const totalReviews = reviewStats?.totalReviews ?? 0;

  // Rating score (out of 5)
  let ratingScore: number;
  if (avgRating >= 4.5) ratingScore = 100;
  else if (avgRating >= 4.0) ratingScore = 80;
  else if (avgRating >= 3.5) ratingScore = 60;
  else if (avgRating >= 3.0) ratingScore = 40;
  else if (avgRating > 0) ratingScore = 20;
  else ratingScore = 50; // Neutral if no reviews

  // Sentiment adjustment
  let sentimentAdj = 0;
  if (sentimentScore >= 80) sentimentAdj = 5;
  else if (sentimentScore < 40) sentimentAdj = -10;

  // Volume bonus
  const volumeBonus = totalReviews >= 20 ? 5 : totalReviews >= 5 ? 2 : 0;

  return Math.min(100, Math.max(0, ratingScore + sentimentAdj + volumeBonus));
}

/**
 * Calculate engagement component score from real data
 */
function calculateEngagementComponentScore(qrCodes: QRCode[]): number {
  const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0);
  const activeCodes = qrCodes.filter(qr => qr.isActive).length;

  // Scan score
  let scanScore: number;
  if (totalScans >= 500) scanScore = 100;
  else if (totalScans >= 200) scanScore = 80;
  else if (totalScans >= 100) scanScore = 60;
  else if (totalScans >= 50) scanScore = 40;
  else if (totalScans > 0) scanScore = 20;
  else scanScore = 0;

  // Active codes bonus
  const activeBonus = activeCodes >= 5 ? 10 : activeCodes >= 2 ? 5 : 0;

  return Math.min(100, scanScore + activeBonus);
}

/**
 * Calculate offer performance component score from real data
 */
function calculateOfferComponentScore(qrCodes: QRCode[]): number {
  const promoCodes = qrCodes.filter(qr => qr.type === 'promotional' && qr.isActive);

  if (promoCodes.length >= 5) return 100;
  if (promoCodes.length >= 3) return 80;
  if (promoCodes.length >= 2) return 60;
  if (promoCodes.length >= 1) return 40;
  return 20; // Needs at least one promo
}

/**
 * Generate health insights from REAL data
 */
export function generateHealthInsightsFromRealData(
  healthScore: MerchantHealthScore,
  orderStats: OrderStats | null,
  revenueStats: RevenueStats | null,
  reviewStats: ReviewStats | null,
  qrCodes: QRCode[]
): HealthInsight[] {
  const insights: HealthInsight[] = [];

  // Overall score
  if (healthScore.overall >= 80) {
    insights.push({
      type: 'positive',
      title: 'Excellent Performance',
      description: `Your health score is ${healthScore.overall}. Keep up the great work!`,
    });
  } else if (healthScore.overall < 50) {
    insights.push({
      type: 'critical',
      title: 'Health Score Alert',
      description: `Your health score is ${healthScore.overall}. Review your performance.`,
      action: 'Focus on improving revenue and order metrics.',
    });
  }

  // Revenue insight
  const dailyRevenue = revenueStats?.dailyRevenue ?? orderStats?.revenueToday ?? 0;
  const growthRate = revenueStats?.growthRate ?? orderStats?.growthRateMonth ?? 0;
  if (dailyRevenue > 0) {
    if (growthRate > 10) {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        description: `Your revenue increased by ${growthRate.toFixed(1)}% this period.`,
      });
    } else if (growthRate < 0) {
      insights.push({
        type: 'warning',
        title: 'Revenue Decline',
        description: `Revenue dropped by ${Math.abs(growthRate).toFixed(1)}%. Consider promotions.`,
        action: 'Create a special offer to boost sales.',
      });
    }
  }

  // Order insight
  const totalOrders = orderStats?.completedOrders ?? 0;
  if (totalOrders >= 50) {
    insights.push({
      type: 'positive',
      title: 'Strong Order Volume',
      description: `${totalOrders} orders completed this period.`,
    });
  }

  // Rating insight
  const avgRating = reviewStats?.averageRating ?? 0;
  if (avgRating >= 4.5) {
    insights.push({
      type: 'positive',
      title: 'Excellent Ratings',
      description: `${avgRating.toFixed(1)} star average. Customers love you!`,
    });
  } else if (avgRating > 0 && avgRating < 3.5) {
    insights.push({
      type: 'warning',
      title: 'Rating Improvement Needed',
      description: `${avgRating.toFixed(1)} star rating. Focus on customer experience.`,
      action: 'Address common customer complaints.',
    });
  }

  // Sort by priority
  const typeOrder = { critical: 0, warning: 1, positive: 2 };
  insights.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return insights.slice(0, 5);
}

/**
 * Generate health insights based on component scores
 */
export function generateHealthInsights(
  healthScore: MerchantHealthScore,
  stats: MerchantStats
): HealthInsight[] {
  const insights: HealthInsight[] = [];

  // Check overall score
  if (healthScore.overall >= 80) {
    insights.push({
      type: 'positive',
      title: 'Excellent Performance',
      description: `Your merchant health score is ${healthScore.overall}. Keep up the great work!`,
    });
  } else if (healthScore.overall < 50) {
    insights.push({
      type: 'critical',
      title: 'Health Score Alert',
      description: `Your health score is ${healthScore.overall}. Consider reviewing your performance metrics.`,
      action: 'Review your revenue and order trends to identify areas for improvement.',
    });
  }

  // Component-specific insights
  const components = healthScore.components;

  // Revenue insights
  if (components.revenue.score >= 80 && stats.growthRate > 0) {
    insights.push({
      type: 'positive',
      title: 'Revenue Growth',
      description: `Your revenue has increased by ${stats.growthRate}% compared to last month.`,
    });
  } else if (components.revenue.score < 50) {
    insights.push({
      type: 'warning',
      title: 'Revenue Opportunity',
      description: 'Your daily revenue could be improved. Consider adding promotional offers.',
      action: 'Create a new offer to attract more customers.',
    });
  }

  // Order insights
  if (components.orders.score >= 80) {
    insights.push({
      type: 'positive',
      title: 'Strong Order Volume',
      description: `You're processing ${stats.totalOrders} orders with an average value of Rs. ${stats.avgOrderValue}.`,
    });
  }

  // Customer satisfaction insights
  if (components.customerSatisfaction.score >= 80) {
    insights.push({
      type: 'positive',
      title: 'High Customer Retention',
      description: `${stats.customerRetention}% of your customers are returning. Great job!`,
    });
  } else if (components.customerSatisfaction.score < 60) {
    insights.push({
      type: 'warning',
      title: 'Customer Retention',
      description: 'Your customer retention rate could be improved. Consider a loyalty program.',
      action: 'Create a loyalty offer to reward returning customers.',
    });
  }

  // Engagement insights
  if (components.engagement.score < 50) {
    insights.push({
      type: 'warning',
      title: 'QR Code Engagement',
      description: 'Your QR codes are getting fewer scans. Consider adding more promotional codes.',
      action: 'Create 2-3 new promotional QR codes to increase customer engagement.',
    });
  }

  // Offer performance insights
  if (components.offerPerformance.score >= 70) {
    insights.push({
      type: 'positive',
      title: 'Active Promotions',
      description: `You have ${stats.activeOffers} active offers running.`,
    });
  } else if (stats.activeOffers < 2) {
    insights.push({
      type: 'warning',
      title: 'More Offers Needed',
      description: 'Having more active offers can attract more customers.',
      action: 'Create a new promotional offer.',
    });
  }

  // Sort insights by type priority
  const typeOrder = { critical: 0, warning: 1, positive: 2 };
  insights.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

  return insights.slice(0, 5); // Limit to top 5 insights
}

/**
 * Calculate complete merchant health score with validation
 */
export function calculateMerchantHealthScore(
  stats: MerchantStats,
  orders: Order[],
  previousScore?: MerchantHealthScore
): MerchantHealthScore {
  // Validate input stats
  validateMerchantStats(stats);

  // Validate component configurations
  HEALTH_COMPONENTS.forEach(validateComponentConfig);

  const componentScores: MerchantHealthScore['components'] = {
    revenue: { score: 0, weight: 30, trend: 'stable' },
    orders: { score: 0, weight: 25, trend: 'stable' },
    customerSatisfaction: { score: 0, weight: 20, trend: 'stable' },
    engagement: { score: 0, weight: 15, trend: 'stable' },
    offerPerformance: { score: 0, weight: 10, trend: 'stable' },
  };

  // Calculate scores for each component
  for (const config of HEALTH_COMPONENTS) {
    const score = calculateComponentScore(config, stats, orders);
    const componentKey = config.name as keyof typeof componentScores;

    if (componentKey in componentScores) {
      componentScores[componentKey].score = Math.round(score);

      // Determine trend if previous score is available
      if (previousScore && previousScore.components[componentKey]) {
        componentScores[componentKey].trend = determineTrend(
          score,
          previousScore.components[componentKey].score
        );
      }
    }
  }

  // Calculate weighted overall score
  let totalWeight = 0;
  let weightedSum = 0;
  for (const [key, value] of Object.entries(componentScores)) {
    weightedSum += value.score * value.weight;
    totalWeight += value.weight;
  }
  const overall = Math.round(weightedSum / totalWeight);

  // Generate insights
  const healthScore: MerchantHealthScore = {
    overall,
    components: componentScores,
    lastUpdated: new Date().toISOString(),
    insights: [],
  };

  healthScore.insights = generateHealthInsights(healthScore, stats);

  return healthScore;
}

/**
 * Get health score color
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // Green
  if (score >= 60) return '#F59E0B'; // Amber
  if (score >= 40) return '#EF4444'; // Red
  return '#6B7280'; // Gray
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

/**
 * Get component status
 */
export function getComponentStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Get recommendation for improvement
 */
export function getComponentRecommendation(
  componentKey: keyof MerchantHealthScore['components']
): string {
  const recommendations: Record<string, string> = {
    revenue: 'Increase your revenue by creating special offers during peak hours.',
    orders: 'Focus on increasing order volume through promotions and advertising.',
    customerSatisfaction:
      'Improve customer satisfaction by reducing wait times and ensuring quality.',
    engagement: 'Add more QR codes for tables and promotions to increase customer engagement.',
    offerPerformance: 'Create more offers or improve existing ones to attract more customers.',
  };
  return recommendations[componentKey] || 'Keep monitoring your performance.';
}

/**
 * Calculate potential improvement
 */
export function calculatePotentialImprovement(
  currentScore: number,
  targetScore: number,
  componentWeight: number
): number {
  const scoreGap = targetScore - currentScore;
  if (scoreGap <= 0) return 0;
  // Weight-based impact on overall score
  return Math.round((scoreGap * componentWeight) / 100);
}

/**
 * Get health summary
 */
export function getHealthSummary(healthScore: MerchantHealthScore): string {
  const excellentComponents = Object.values(healthScore.components).filter(
    (c) => c.score >= 80
  ).length;
  const needsWorkComponents = Object.values(healthScore.components).filter(
    (c) => c.score < 60
  ).length;

  if (healthScore.overall >= 80) {
    return `Your merchant health is excellent! ${excellentComponents} components are performing at peak.`;
  }
  if (healthScore.overall >= 60) {
    return `Your merchant health is good. Focus on the ${needsWorkComponents} component(s) that need attention.`;
  }
  return `Your merchant health needs improvement. ${needsWorkComponents} components are below target.`;
}

// React Hook for merchant health with error handling
export function useMerchantHealth(
  stats: MerchantStats | null,
  orders: Order[] = []
) {
  const calculateHealth = (
    previousScore?: MerchantHealthScore
  ): { result: MerchantHealthScore | null; error: HealthCalculationError | null } => {
    if (!stats) {
      return { result: null, error: null };
    }

    try {
      const result = calculateMerchantHealthScore(stats, orders, previousScore);
      return { result, error: null };
    } catch (error) {
      if (error instanceof HealthCalculationError) {
        return { result: null, error };
      }
      return { result: null, error: new HealthCalculationError('Failed to calculate health score') };
    }
  };

  return {
    calculateHealth,
    getScoreColor: (score: number) => getHealthScoreColor(score),
    getScoreLabel: (score: number) => getHealthScoreLabel(score),
    getComponentStatus: (score: number) => getComponentStatus(score),
    getRecommendation: (component: keyof MerchantHealthScore['components']) =>
      getComponentRecommendation(component),
    getSummary: (healthScore: MerchantHealthScore) => getHealthSummary(healthScore),
  };
}

export default {
  calculateMerchantHealthScore,
  calculateHealthScoreFromRealData,
  generateHealthInsights,
  generateHealthInsightsFromRealData,
  getHealthScoreColor,
  getHealthScoreLabel,
  getComponentStatus,
  getComponentRecommendation,
  getHealthSummary,
  useMerchantHealth,
  HEALTH_COMPONENTS,
  // Export error types for external usage
  HealthCalculationError,
  InvalidStatsError,
  InvalidComponentError,
};
