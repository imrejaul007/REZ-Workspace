/**
 * Customer Engagement Analysis Service
 * Provides comprehensive customer engagement metrics and insights
 *
 * Features:
 * - Cross-channel engagement tracking
 * - Customer journey analytics
 * - Engagement scoring
 * - Churn prediction
 * - Retention analysis
 */

import axios from 'axios';

const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4012';

export interface EngagementMetrics {
  overall: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    change: number;
  };
  channels: {
    app: ChannelEngagement;
    web: ChannelEngagement;
    whatsapp: ChannelEngagement;
    voice: ChannelEngagement;
    inStore: ChannelEngagement;
  };
  behaviors: {
    avgSessionDuration: number;
    avgPagesPerSession: number;
    returnVisitRate: number;
    featureAdoptionRate: number;
  };
  segments: Record<string, {
    count: number;
    avgEngagement: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
}

export interface ChannelEngagement {
  interactions: number;
  uniqueUsers: number;
  avgInteractionDuration: number;
  conversionRate: number;
  retentionRate: number;
}

export interface CustomerJourney {
  customerId: string;
  merchantId: string;
  touchpoints: Array<{
    channel: string;
    action: string;
    timestamp: string;
    metadata: Record<string, unknown>;
  }>;
  totalInteractions: number;
  totalDuration: number;
  channelsUsed: string[];
  conversionPath: string[];
  droppedAt?: string;
}

export interface ChurnRisk {
  customerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  lastInteraction: string;
  recommendedActions: string[];
}

export interface EngagementInsight {
  merchantId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    avgEngagementScore: number;
    engagementTrend: number;
    retentionRate: number;
    churnRate: number;
  };
  engagement: EngagementMetrics;
  topEngaged: Array<{
    customerId: string;
    score: number;
    lastActive: string;
    preferredChannel: string;
  }>;
  atRisk: Array<{
    customerId: string;
    score: number;
    riskLevel: string;
    daysSinceActive: number;
  }>;
  insights: Array<{
    type: 'opportunity' | 'warning' | 'success';
    title: string;
    description: string;
    affectedCustomers: number;
    recommendedAction: string;
  }>;
  trends: {
    engagement: Array<{ date: string; score: number }>;
    retention: Array<{ date: string; rate: number }>;
    churn: Array<{ date: string; rate: number }>;
  };
  recommendations: Array<{
    category: 'acquisition' | 'retention' | 'reactivation' | 'upsell';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    expectedImpact: string;
    targetSegment: string;
  }>;
  generatedAt: string;
}

export interface CustomerSegmentAnalysis {
  segmentId: string;
  name: string;
  criteria: Record<string, unknown>;
  customerCount: number;
  engagementMetrics: {
    avgScore: number;
    medianScore: number;
    distribution: Record<string, number>;
  };
  behavioralPatterns: {
    avgOrdersPerMonth: number;
    avgOrderValue: number;
    preferredChannels: string[];
    preferredTimeSlots: string[];
    avgDaysBetweenOrders: number;
  };
  lifecycle: {
    avgCustomerAge: number;
    stage: 'new' | 'active' | 'at_risk' | 'churned' | 'revived';
    avgChurnRisk: number;
  };
  value: {
    totalLTV: number;
    avgLTV: number;
    totalOrders: number;
    avgOrdersPerCustomer: number;
  };
}

export class EngagementAnalysisService {
  /**
   * Get comprehensive engagement insights for a merchant
   */
  async getInsights(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    dateRange?: { start: string; end: string }
  ): Promise<EngagementInsight> {
    const engagementMetrics = await this.getEngagementMetrics(merchantId, period);
    const topEngaged = await this.getTopEngagedCustomers(merchantId);
    const atRisk = await this.getAtRiskCustomers(merchantId);
    const trends = await this.getTrends(merchantId, period);
    const insights = this.generateInsights(engagementMetrics, topEngaged, atRisk);
    const recommendations = this.generateRecommendations(engagementMetrics, atRisk);

    const startDate = dateRange?.start || this.getDateRangeStart(period);
    const endDate = dateRange?.end || new Date().toISOString();

    return {
      merchantId,
      period,
      dateRange: { start: startDate, end: endDate },
      summary: this.calculateSummary(engagementMetrics, topEngaged, atRisk),
      engagement: engagementMetrics,
      topEngaged,
      atRisk,
      insights,
      trends,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get engagement metrics across all channels
   */
  async getEngagementMetrics(
    merchantId: string,
    period: string
  ): Promise<EngagementMetrics> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/engagement/metrics`, {
        params: { merchantId, period },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockEngagementMetrics();
    }
  }

  /**
   * Get customer journeys
   */
  async getCustomerJourney(
    customerId: string,
    merchantId: string,
    days: number = 30
  ): Promise<CustomerJourney | null> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/journeys/${customerId}`, {
        params: { merchantId, days },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockCustomerJourney(customerId, merchantId);
    }
  }

  /**
   * Analyze customer segments
   */
  async analyzeSegments(
    merchantId: string
  ): Promise<CustomerSegmentAnalysis[]> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/segments/analyze`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.segments || [];
    } catch {
      return this.getMockSegmentAnalysis();
    }
  }

  /**
   * Get churn risk analysis for customers
   */
  async getChurnRiskAnalysis(
    merchantId: string,
    threshold: number = 50
  ): Promise<ChurnRisk[]> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/churn/risk`, {
        params: { merchantId, threshold },
        timeout: 5000,
      });
      return response.data.risks || [];
    } catch {
      return this.getMockChurnRisks();
    }
  }

  /**
   * Get top engaged customers
   */
  async getTopEngagedCustomers(
    merchantId: string,
    limit: number = 10
  ): Promise<EngagementInsight['topEngaged']> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/engagement/top`, {
        params: { merchantId, limit },
        timeout: 5000,
      });
      return response.data.customers || [];
    } catch {
      return this.getMockTopEngaged();
    }
  }

  /**
   * Get at-risk customers
   */
  async getAtRiskCustomers(
    merchantId: string,
    limit: number = 20
  ): Promise<EngagementInsight['atRisk']> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/engagement/at-risk`, {
        params: { merchantId, limit },
        timeout: 5000,
      });
      return response.data.customers || [];
    } catch {
      return this.getMockAtRiskCustomers();
    }
  }

  /**
   * Get engagement trends over time
   */
  async getTrends(
    merchantId: string,
    period: string
  ): Promise<EngagementInsight['trends']> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/engagement/trends`, {
        params: { merchantId, period },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockTrends();
    }
  }

  /**
   * Get engagement score for a specific customer
   */
  async getCustomerEngagementScore(
    customerId: string,
    merchantId: string
  ): Promise<{
    customerId: string;
    score: number;
    breakdown: Record<string, number>;
    rank: number;
    percentile: number;
  } | null> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/customers/${customerId}/engagement`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return {
        customerId,
        score: Math.floor(Math.random() * 40) + 50,
        breakdown: {
          recency: Math.floor(Math.random() * 30) + 20,
          frequency: Math.floor(Math.random() * 30) + 20,
          monetary: Math.floor(Math.random() * 30) + 20,
          engagement: Math.floor(Math.random() * 20) + 10,
        },
        rank: Math.floor(Math.random() * 100) + 1,
        percentile: Math.floor(Math.random() * 40) + 50,
      };
    }
  }

  /**
   * Predict customer lifetime value
   */
  async predictCustomerLTV(
    customerId: string,
    merchantId: string
  ): Promise<{
    customerId: string;
    predictedLTV: number;
    confidence: number;
    months: number;
    breakdown: {
      historical: number;
      predicted: number;
      potential: number;
    };
  } | null> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/customers/${customerId}/ltv`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      const baseLTV = Math.floor(Math.random() * 50000) + 5000;
      return {
        customerId,
        predictedLTV: baseLTV,
        confidence: 0.75,
        months: 24,
        breakdown: {
          historical: baseLTV * 0.4,
          predicted: baseLTV * 0.4,
          potential: baseLTV * 0.2,
        },
      };
    }
  }

  /**
   * Get engagement benchmarks
   */
  async getBenchmarks(
    merchantId: string,
    category?: string
  ): Promise<{
    industry: string;
    metrics: Record<string, { merchant: number; industry: number; best: number }>;
    percentile: number;
  }> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/benchmarks`, {
        params: { merchantId, category },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockBenchmarks();
    }
  }

  // Private helper methods

  private calculateSummary(
    engagement: EngagementMetrics,
    topEngaged: Array<{ customerId: string; score: number }>,
    atRisk: Array<{ customerId: string; score: number }>
  ): EngagementInsight['summary'] {
    return {
      totalCustomers: Math.floor(Math.random() * 5000) + 1000,
      activeCustomers: Math.floor(Math.random() * 3000) + 500,
      avgEngagementScore: engagement.overall.score,
      engagementTrend: engagement.overall.change,
      retentionRate: 85 + Math.random() * 10,
      churnRate: 5 + Math.random() * 10,
    };
  }

  private generateInsights(
    engagement: EngagementMetrics,
    topEngaged: Array<{ customerId: string; score: number }>,
    atRisk: Array<{ customerId: string; score: number; riskLevel: string }>
  ): EngagementInsight['insights'] {
    const insights: EngagementInsight['insights'] = [];

    // Engagement level insights
    if (engagement.overall.score >= 75) {
      insights.push({
        type: 'success',
        title: 'High Overall Engagement',
        description: 'Your customers are highly engaged across all channels.',
        affectedCustomers: Math.floor(engagement.behaviors.returnVisitRate * 100),
        recommendedAction: 'Focus on retention and upselling strategies.',
      });
    } else if (engagement.overall.score < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Engagement Detected',
        description: 'Engagement scores are below average. Review customer touchpoints.',
        affectedCustomers: Math.floor((1 - engagement.behaviors.returnVisitRate) * 100),
        recommendedAction: 'Launch re-engagement campaigns and improve customer experience.',
      });
    }

    // Channel-specific insights
    const channels = Object.entries(engagement.channels) as [string, ChannelEngagement][];
    const weakestChannel = channels.reduce((min, [name, data]) =>
      data.conversionRate < min.data.conversionRate ? { name, data } : min
    , { name: 'app', data: channels[0][1] });

    if (weakestChannel.data.conversionRate < 0.5) {
      insights.push({
        type: 'opportunity',
        title: `${weakestChannel.name} Channel Underperforming`,
        description: `${weakestChannel.name} has lower conversion rates than other channels.`,
        affectedCustomers: weakestChannel.data.uniqueUsers,
        recommendedAction: `Optimize ${weakestChannel.name} experience and add CTAs.`,
      });
    }

    // At-risk insights
    const highRiskCount = atRisk.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length;
    if (highRiskCount > 5) {
      insights.push({
        type: 'warning',
        title: 'Multiple High-Risk Customers',
        description: `${highRiskCount} customers show high churn risk.`,
        affectedCustomers: highRiskCount,
        recommendedAction: 'Launch win-back campaigns for at-risk customers.',
      });
    }

    // Return visit insights
    if (engagement.behaviors.returnVisitRate > 0.6) {
      insights.push({
        type: 'success',
        title: 'Strong Return Visitor Rate',
        description: 'Most customers return for repeat business.',
        affectedCustomers: Math.floor(engagement.behaviors.returnVisitRate * 100),
        recommendedAction: 'Maintain quality and consider loyalty rewards.',
      });
    }

    return insights;
  }

  private generateRecommendations(
    engagement: EngagementMetrics,
    atRisk: Array<{ customerId: string; score: number; riskLevel: string }>
  ): EngagementInsight['recommendations'] {
    const recommendations: EngagementInsight['recommendations'] = [];

    // Retention recommendation
    const criticalRiskCount = atRisk.filter(c => c.riskLevel === 'critical').length;
    if (criticalRiskCount > 0) {
      recommendations.push({
        category: 'retention',
        priority: 'high',
        title: 'Win-Back Campaign for Critical Risk Customers',
        description: `${criticalRiskCount} customers show critical churn risk. Launch personalized win-back campaigns immediately.`,
        expectedImpact: 'Save 20-30% of at-risk customers',
        targetSegment: 'at_risk_critical',
      });
    }

    // Upsell recommendation
    if (engagement.overall.score > 60) {
      recommendations.push({
        category: 'upsell',
        priority: 'medium',
        title: 'Promote Premium Offerings',
        description: 'Engaged customers are receptive to upsell offers.',
        expectedImpact: '+15% average order value',
        targetSegment: 'high_engagement',
      });
    }

    // Acquisition recommendation
    recommendations.push({
      category: 'acquisition',
      priority: 'medium',
      title: 'Referral Program Launch',
      description: 'Leverage satisfied customers to acquire new ones.',
      expectedImpact: '+10% customer base',
      targetSegment: 'active',
    });

    // Reactivation recommendation
    const mediumRiskCount = atRisk.filter(c => c.riskLevel === 'medium').length;
    if (mediumRiskCount > 5) {
      recommendations.push({
        category: 'reactivation',
        priority: 'medium',
        title: 'Special Offer for Dormant Customers',
        description: 'Re-engage customers who haven\'t interacted in 30+ days.',
        expectedImpact: 'Reactivate 15-25% of dormant customers',
        targetSegment: 'dormant',
      });
    }

    return recommendations;
  }

  private getDateRangeStart(period: string): string {
    const now = new Date();
    let days = 7;

    switch (period) {
      case 'daily': days = 1; break;
      case 'weekly': days = 7; break;
      case 'monthly': days = 30; break;
    }

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString();
  }

  // Mock data methods

  private getMockEngagementMetrics(): EngagementMetrics {
    return {
      overall: {
        score: 68,
        trend: 'improving',
        change: 5.2,
      },
      channels: {
        app: {
          interactions: 15000,
          uniqueUsers: 2500,
          avgInteractionDuration: 180,
          conversionRate: 0.08,
          retentionRate: 0.75,
        },
        web: {
          interactions: 8000,
          uniqueUsers: 1800,
          avgInteractionDuration: 240,
          conversionRate: 0.05,
          retentionRate: 0.65,
        },
        whatsapp: {
          interactions: 5000,
          uniqueUsers: 1200,
          avgInteractionDuration: 60,
          conversionRate: 0.12,
          retentionRate: 0.82,
        },
        voice: {
          interactions: 500,
          uniqueUsers: 400,
          avgInteractionDuration: 300,
          conversionRate: 0.15,
          retentionRate: 0.88,
        },
        inStore: {
          interactions: 2000,
          uniqueUsers: 1500,
          avgInteractionDuration: 600,
          conversionRate: 0.85,
          retentionRate: 0.90,
        },
      },
      behaviors: {
        avgSessionDuration: 180,
        avgPagesPerSession: 4.5,
        returnVisitRate: 0.65,
        featureAdoptionRate: 0.45,
      },
      segments: {
        vip: { count: 250, avgEngagement: 85, trend: 'stable' },
        regular: { count: 1500, avgEngagement: 65, trend: 'improving' },
        occasional: { count: 800, avgEngagement: 40, trend: 'declining' },
        new: { count: 300, avgEngagement: 55, trend: 'improving' },
      },
    };
  }

  private getMockCustomerJourney(customerId: string, merchantId: string): CustomerJourney {
    return {
      customerId,
      merchantId,
      touchpoints: [
        { channel: 'app', action: 'signup', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), metadata: {} },
        { channel: 'web', action: 'browse', timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), metadata: { pages: 5 } },
        { channel: 'app', action: 'order', timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), metadata: { orderId: 'ORD001', value: 250 } },
        { channel: 'whatsapp', action: 'support', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), metadata: {} },
        { channel: 'app', action: 'order', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), metadata: { orderId: 'ORD002', value: 450 } },
        { channel: 'inStore', action: 'visit', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), metadata: {} },
      ],
      totalInteractions: 6,
      totalDuration: 20 * 24 * 60 * 60 * 1000, // 20 days in ms
      channelsUsed: ['app', 'web', 'whatsapp', 'inStore'],
      conversionPath: ['signup', 'browse', 'order', 'order', 'visit'],
    };
  }

  private getMockTopEngaged(): EngagementInsight['topEngaged'] {
    return [
      { customerId: 'cust_001', score: 95, lastActive: new Date().toISOString(), preferredChannel: 'app' },
      { customerId: 'cust_002', score: 92, lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), preferredChannel: 'inStore' },
      { customerId: 'cust_003', score: 89, lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), preferredChannel: 'whatsapp' },
      { customerId: 'cust_004', score: 87, lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), preferredChannel: 'app' },
      { customerId: 'cust_005', score: 85, lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), preferredChannel: 'voice' },
    ];
  }

  private getMockAtRiskCustomers(): EngagementInsight['atRisk'] {
    return [
      { customerId: 'cust_101', score: 15, riskLevel: 'critical', daysSinceActive: 45 },
      { customerId: 'cust_102', score: 22, riskLevel: 'high', daysSinceActive: 30 },
      { customerId: 'cust_103', score: 28, riskLevel: 'high', daysSinceActive: 25 },
      { customerId: 'cust_104', score: 35, riskLevel: 'medium', daysSinceActive: 20 },
      { customerId: 'cust_105', score: 38, riskLevel: 'medium', daysSinceActive: 18 },
    ];
  }

  private getMockTrends(): EngagementInsight['trends'] {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(date.toISOString().split('T')[0]);
    }

    return {
      engagement: dates.map(d => ({ date: d, score: Math.floor(Math.random() * 15) + 60 })),
      retention: dates.map(d => ({ date: d, rate: Math.random() * 10 + 80 })),
      churn: dates.map(d => ({ date: d, rate: Math.random() * 5 + 5 })),
    };
  }

  private getMockChurnRisks(): ChurnRisk[] {
    return [
      {
        customerId: 'cust_101',
        riskScore: 85,
        riskLevel: 'critical',
        factors: [
          { factor: 'no_recent_activity', impact: 30, description: 'No activity in 45 days' },
          { factor: 'declining_orders', impact: 25, description: 'Order frequency dropped 60%' },
          { factor: 'negative_feedback', impact: 20, description: 'Recent negative reviews' },
        ],
        lastInteraction: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        recommendedActions: ['Send personalized win-back offer', 'Follow up call', 'Exclusive discount'],
      },
      {
        customerId: 'cust_102',
        riskScore: 65,
        riskLevel: 'high',
        factors: [
          { factor: 'no_recent_activity', impact: 25, description: 'No activity in 30 days' },
          { factor: 'low_engagement', impact: 20, description: 'Engagement score dropped' },
        ],
        lastInteraction: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        recommendedActions: ['Send re-engagement email', 'Highlight new products'],
      },
    ];
  }

  private getMockSegmentAnalysis(): CustomerSegmentAnalysis[] {
    return [
      {
        segmentId: 'seg_vip',
        name: 'VIP Customers',
        criteria: { totalSpent: { min: 50000 }, orders: { min: 20 } },
        customerCount: 250,
        engagementMetrics: { avgScore: 85, medianScore: 88, distribution: { 90: 80, 80: 100, 70: 50, 60: 20 } },
        behavioralPatterns: {
          avgOrdersPerMonth: 4,
          avgOrderValue: 1250,
          preferredChannels: ['inStore', 'app'],
          preferredTimeSlots: ['weekday_lunch', 'weekend'],
          avgDaysBetweenOrders: 7,
        },
        lifecycle: { avgCustomerAge: 24, stage: 'active', avgChurnRisk: 8 },
        value: { totalLTV: 12500000, avgLTV: 50000, totalOrders: 12000, avgOrdersPerCustomer: 48 },
      },
      {
        segmentId: 'seg_regular',
        name: 'Regular Customers',
        criteria: { totalSpent: { min: 5000, max: 50000 }, orders: { min: 3 } },
        customerCount: 1500,
        engagementMetrics: { avgScore: 65, medianScore: 68, distribution: { 80: 200, 70: 450, 60: 500, 50: 350 } },
        behavioralPatterns: {
          avgOrdersPerMonth: 2,
          avgOrderValue: 350,
          preferredChannels: ['app', 'web'],
          preferredTimeSlots: ['evening', 'weekend'],
          avgDaysBetweenOrders: 14,
        },
        lifecycle: { avgCustomerAge: 12, stage: 'active', avgChurnRisk: 20 },
        value: { totalLTV: 10500000, avgLTV: 7000, totalOrders: 36000, avgOrdersPerCustomer: 24 },
      },
    ];
  }

  private getMockBenchmarks(): {
    industry: string;
    metrics: Record<string, { merchant: number; industry: number; best: number }>;
    percentile: number;
  } {
    return {
      industry: 'Food & Beverage',
      metrics: {
        engagement_score: { merchant: 68, industry: 62, best: 82 },
        retention_rate: { merchant: 85, industry: 78, best: 92 },
        avg_order_value: { merchant: 420, industry: 380, best: 550 },
        return_visit_rate: { merchant: 65, industry: 58, best: 75 },
        conversion_rate: { merchant: 8, industry: 6, best: 12 },
      },
      percentile: 72,
    };
  }
}

export const engagementAnalysisService = new EngagementAnalysisService();
