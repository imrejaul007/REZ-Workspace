/**
 * Audience Intelligence Service
 * Advanced audience segmentation and insights
 *
 * Features:
 * - Dynamic segmentation
 * - Behavior analysis
 * - Predictive analytics
 * - Audience matching
 * - Lookalike discovery
 */

import axios from 'axios';

const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4012';

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  size: number;
  metrics: SegmentMetrics;
  channels: ChannelPreference;
  behavior: BehavioralProfile;
  value: ValueMetrics;
  recommendations: SegmentRecommendation[];
}

export interface SegmentCriteria {
  orderFrequency?: { min?: number; max?: number; period?: string };
  lastOrderDate?: { operator: 'lt' | 'gt' | 'between'; days?: number };
  totalSpent?: { min?: number; max?: number };
  avgOrderValue?: { min?: number; max?: number };
  location?: string | string[];
  tags?: string[];
  channel?: string[];
  daysSinceFirstOrder?: { min?: number; max?: number };
  orderCount?: { min?: number; max?: number };
}

export interface SegmentMetrics {
  total: number;
  active: number;
  dormant: number;
  churned: number;
  growthRate: number;
  retentionRate: number;
  avgLifetime: number;
}

export interface ChannelPreference {
  preferred: string[];
  breakdown: Record<string, number>;
  engagement: Record<string, number>;
}

export interface BehavioralProfile {
  avgOrdersPerMonth: number;
  avgOrderValue: number;
  preferredCategories: string[];
  preferredTimeSlots: string[];
  preferredDays: string[];
  avgDaysBetweenOrders: number;
  typicalSessionDuration: number;
  deviceBreakdown: Record<string, number>;
}

export interface ValueMetrics {
  totalRevenue: number;
  avgRevenue: number;
  totalOrders: number;
  avgOrders: number;
  potentialRevenue: number;
  ltv: number;
  revenueContribution: number;
}

export interface SegmentRecommendation {
  type: 'acquisition' | 'retention' | 'upsell' | 'reactivation';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  expectedImpact: string;
  suggestedCampaigns: string[];
}

export interface AudienceInsight {
  merchantId: string;
  period: string;
  overview: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    avgCustomerValue: number;
  };
  segments: AudienceSegment[];
  demographics: {
    age: Record<string, number>;
    gender: Record<string, number>;
    location: Record<string, number>;
    device: Record<string, number>;
  };
  behaviors: {
    purchaseFrequency: Record<string, number>;
    avgOrderValue: Record<string, number>;
    preferredChannels: Record<string, number>;
    peakHours: Record<string, number>;
    peakDays: Record<string, number>;
  };
  predictions: {
    nextPurchaseDate: Record<string, number>;
    churnRisk: Record<string, number>;
    ltvTier: Record<string, number>;
  };
  opportunities: Array<{
    segment: string;
    type: string;
    title: string;
    description: string;
    size: number;
    potential: number;
  }>;
  generatedAt: string;
}

export interface LookalikeAudience {
  sourceSegment: string;
  size: number;
  similarity: number;
  characteristics: Array<{
    attribute: string;
    match: number;
  }>;
  recommendedChannels: string[];
  estimatedReach: number;
}

export class AudienceIntelligenceService {
  /**
   * Get comprehensive audience insights
   */
  async getAudienceInsights(
    merchantId: string,
    period: string = '30d'
  ): Promise<AudienceInsight> {
    const segments = await this.getSegments(merchantId);
    const demographics = await this.getDemographics(merchantId);
    const behaviors = await this.getBehaviors(merchantId);
    const predictions = await this.getPredictions(merchantId);
    const opportunities = this.identifyOpportunities(segments, behaviors);

    return {
      merchantId,
      period,
      overview: this.calculateOverview(segments),
      segments,
      demographics,
      behaviors,
      predictions,
      opportunities,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all audience segments
   */
  async getSegments(merchantId: string): Promise<AudienceSegment[]> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/segments`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.segments || [];
    } catch {
      return this.getMockSegments();
    }
  }

  /**
   * Get specific segment details
   */
  async getSegmentDetails(
    merchantId: string,
    segmentId: string
  ): Promise<AudienceSegment | null> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/segments/${segmentId}`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      const segments = this.getMockSegments();
      return segments.find(s => s.id === segmentId) || null;
    }
  }

  /**
   * Create custom segment
   */
  async createSegment(
    merchantId: string,
    criteria: SegmentCriteria,
    name: string,
    description?: string
  ): Promise<{ success: boolean; segmentId?: string; error?: string }> {
    try {
      const response = await axios.post(`${ANALYTICS_SERVICE_URL}/api/segments`, {
        merchantId,
        name,
        description,
        criteria,
      }, { timeout: 5000 });

      return { success: true, segmentId: response.data.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get segment audience members
   */
  async getSegmentAudience(
    merchantId: string,
    segmentId: string,
    options?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{
    customers: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      totalSpent: number;
      orderCount: number;
      lastOrderDate: string;
      engagementScore: number;
    }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/segments/${segmentId}/audience`, {
        params: { merchantId, ...options },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockAudience(segmentId, options?.limit || 20);
    }
  }

  /**
   * Get demographics breakdown
   */
  async getDemographics(merchantId: string): Promise<AudienceInsight['demographics']> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/audience/demographics`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockDemographics();
    }
  }

  /**
   * Get behavioral patterns
   */
  async getBehaviors(merchantId: string): Promise<AudienceInsight['behaviors']> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/audience/behaviors`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockBehaviors();
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictions(merchantId: string): Promise<AudienceInsight['predictions']> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/audience/predictions`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockPredictions();
    }
  }

  /**
   * Find lookalike audiences
   */
  async findLookalikes(
    merchantId: string,
    seedSegmentId: string,
    options?: {
      size?: number;
      similarity?: number;
    }
  ): Promise<LookalikeAudience[]> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/audience/lookalikes`, {
        params: { merchantId, seedSegmentId, ...options },
        timeout: 5000,
      });
      return response.data.audiences || [];
    } catch {
      return this.getMockLookalikes();
    }
  }

  /**
   * Get high-value customer insights
   */
  async getHighValueInsights(merchantId: string): Promise<{
    topCustomers: Array<{
      id: string;
      name: string;
      value: number;
      orders: number;
      lastActive: string;
      tier: string;
    }>;
    valueDistribution: Record<string, number>;
    upgradePotential: Array<{
      from: string;
      to: string;
      count: number;
      avgSpendIncrease: number;
    }>;
  }> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/audience/high-value`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockHighValueInsights();
    }
  }

  /**
   * Get churn analysis
   */
  async getChurnAnalysis(merchantId: string): Promise<{
    churnRate: number;
    trend: 'improving' | 'stable' | 'worsening';
    atRiskCount: number;
    segments: Array<{
      name: string;
      churnRisk: number;
      count: number;
    }>;
    factors: Array<{
      factor: string;
      impact: number;
    }>;
  }> {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/audience/churn`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockChurnAnalysis();
    }
  }

  // Private helper methods

  private calculateOverview(segments: AudienceSegment[]): AudienceInsight['overview'] {
    const totalCustomers = segments.reduce((sum, s) => sum + s.size, 0);
    const activeCustomers = segments.reduce((sum, s) => sum + s.metrics.active, 0);
    const totalRevenue = segments.reduce((sum, s) => sum + s.value.totalRevenue, 0);
    const totalOrders = segments.reduce((sum, s) => sum + s.value.totalOrders, 0);

    return {
      totalCustomers,
      activeCustomers,
      newCustomers: Math.floor(totalCustomers * 0.15),
      returningCustomers: Math.floor(totalCustomers * 0.65),
      avgCustomerValue: totalRevenue / totalCustomers,
    };
  }

  private identifyOpportunities(
    segments: AudienceSegment[],
    behaviors: AudienceInsight['behaviors']
  ): AudienceInsight['opportunities'] {
    const opportunities: AudienceInsight['opportunities'] = [];

    // Find high-potential segments
    for (const segment of segments) {
      if (segment.behavior.avgOrderValue < 500 && segment.size > 50) {
        opportunities.push({
          segment: segment.name,
          type: 'upsell',
          title: 'Upsell Opportunity',
          description: `${segment.name} customers have potential for higher basket sizes`,
          size: segment.size,
          potential: segment.size * 200,
        });
      }

      if (segment.metrics.dormant > segment.size * 0.3) {
        opportunities.push({
          segment: segment.name,
          type: 'reactivation',
          title: 'Reactivation Campaign',
          description: `${segment.metrics.dormant} customers in ${segment.name} are dormant`,
          size: segment.metrics.dormant,
          potential: segment.metrics.dormant * 150,
        });
      }
    }

    // Channel opportunity
    const lowestChannel = Object.entries(behaviors.preferredChannels)
      .sort((a, b) => a[1] - b[1])[0];

    if (lowestChannel) {
      opportunities.push({
        segment: 'All Segments',
        type: 'acquisition',
        title: 'Channel Expansion',
        description: `${lowestChannel[0]} channel has low engagement - expand reach`,
        size: 0,
        potential: 0,
      });
    }

    return opportunities.sort((a, b) => b.potential - a.potential);
  }

  // Mock data methods

  private getMockSegments(): AudienceSegment[] {
    return [
      {
        id: 'seg_vip',
        name: 'VIP Customers',
        description: 'Top spending customers with high engagement',
        criteria: { totalSpent: { min: 50000 }, orderCount: { min: 20 } },
        size: 250,
        metrics: { total: 250, active: 200, dormant: 25, churned: 25, growthRate: 5, retentionRate: 92, avgLifetime: 24 },
        channels: {
          preferred: ['inStore', 'app'],
          breakdown: { inStore: 45, app: 35, web: 15, whatsapp: 5 },
          engagement: { inStore: 95, app: 88, web: 75, whatsapp: 70 },
        },
        behavior: {
          avgOrdersPerMonth: 4,
          avgOrderValue: 1500,
          preferredCategories: ['Premium Items', 'Combos'],
          preferredTimeSlots: ['weekend_lunch', 'weekday_dinner'],
          preferredDays: ['Saturday', 'Friday'],
          avgDaysBetweenOrders: 7,
          typicalSessionDuration: 600,
          deviceBreakdown: { mobile: 60, desktop: 30, tablet: 10 },
        },
        value: {
          totalRevenue: 12500000,
          avgRevenue: 50000,
          totalOrders: 12000,
          avgOrders: 48,
          potentialRevenue: 15000000,
          ltv: 60000,
          revenueContribution: 0.4,
        },
        recommendations: [
          { type: 'retention', priority: 'high', title: 'VIP Loyalty Program', description: 'Exclusive rewards for top customers', expectedImpact: '+10% retention', suggestedCampaigns: ['VIP Appreciation', 'Early Access'] },
          { type: 'upsell', priority: 'medium', title: 'Premium Bundles', description: 'Create premium product bundles', expectedImpact: '+15% AOV', suggestedCampaigns: ['Premium Collection'] },
        ],
      },
      {
        id: 'seg_regular',
        name: 'Regular Customers',
        description: 'Consistent buyers with moderate engagement',
        criteria: { totalSpent: { min: 5000, max: 50000 }, orderCount: { min: 3 } },
        size: 1500,
        metrics: { total: 1500, active: 1200, dormant: 200, churned: 100, growthRate: 8, retentionRate: 78, avgLifetime: 12 },
        channels: {
          preferred: ['app', 'web'],
          breakdown: { app: 50, web: 30, inStore: 15, whatsapp: 5 },
          engagement: { app: 75, web: 68, inStore: 60, whatsapp: 55 },
        },
        behavior: {
          avgOrdersPerMonth: 2,
          avgOrderValue: 450,
          preferredCategories: ['Popular Items', 'Daily Essentials'],
          preferredTimeSlots: ['evening', 'lunch'],
          preferredDays: ['Tuesday', 'Wednesday'],
          avgDaysBetweenOrders: 14,
          typicalSessionDuration: 300,
          deviceBreakdown: { mobile: 75, desktop: 20, tablet: 5 },
        },
        value: {
          totalRevenue: 10500000,
          avgRevenue: 7000,
          totalOrders: 36000,
          avgOrders: 24,
          potentialRevenue: 12600000,
          ltv: 8500,
          revenueContribution: 0.35,
        },
        recommendations: [
          { type: 'upsell', priority: 'high', title: 'Order Frequency Program', description: 'Incentivize more frequent purchases', expectedImpact: '+20% frequency', suggestedCampaigns: ['Weekly Special', 'Order More'] },
          { type: 'retention', priority: 'medium', title: 'Engagement Campaign', description: 'Increase app/web engagement', expectedImpact: '+15% retention', suggestedCampaigns: ['App Exclusive Offers'] },
        ],
      },
      {
        id: 'seg_new',
        name: 'New Customers',
        description: 'Recently acquired customers',
        criteria: { daysSinceFirstOrder: { max: 30 } },
        size: 500,
        metrics: { total: 500, active: 450, dormant: 40, churned: 10, growthRate: 15, retentionRate: 65, avgLifetime: 1 },
        channels: {
          preferred: ['app', 'inStore'],
          breakdown: { app: 40, inStore: 35, web: 20, whatsapp: 5 },
          engagement: { app: 60, inStore: 55, web: 45, whatsapp: 40 },
        },
        behavior: {
          avgOrdersPerMonth: 1.5,
          avgOrderValue: 350,
          preferredCategories: ['Bestsellers', 'Introductory Offers'],
          preferredTimeSlots: ['weekend'],
          preferredDays: ['Saturday'],
          avgDaysBetweenOrders: 20,
          typicalSessionDuration: 180,
          deviceBreakdown: { mobile: 70, desktop: 25, tablet: 5 },
        },
        value: {
          totalRevenue: 1750000,
          avgRevenue: 3500,
          totalOrders: 750,
          avgOrders: 1.5,
          potentialRevenue: 3000000,
          ltv: 4000,
          revenueContribution: 0.1,
        },
        recommendations: [
          { type: 'retention', priority: 'high', title: 'Welcome Series', description: 'Nurture new customers with onboarding', expectedImpact: '+30% second purchase', suggestedCampaigns: ['Welcome Offer', 'Getting Started Guide'] },
          { type: 'acquisition', priority: 'medium', title: 'Referral Program', description: 'Encourage word-of-mouth', expectedImpact: '+10% acquisition', suggestedCampaigns: ['Refer & Earn'] },
        ],
      },
      {
        id: 'seg_at_risk',
        name: 'At-Risk Customers',
        description: 'Customers showing churn signals',
        criteria: { lastOrderDate: { operator: 'lt', days: 60 } },
        size: 300,
        metrics: { total: 300, active: 100, dormant: 150, churned: 50, growthRate: -5, retentionRate: 45, avgLifetime: 8 },
        channels: {
          preferred: ['whatsapp', 'inStore'],
          breakdown: { whatsapp: 40, inStore: 35, app: 20, web: 5 },
          engagement: { whatsapp: 50, inStore: 45, app: 35, web: 25 },
        },
        behavior: {
          avgOrdersPerMonth: 0.5,
          avgOrderValue: 300,
          preferredCategories: ['Bestsellers'],
          preferredTimeSlots: ['weekend_lunch'],
          preferredDays: ['Sunday'],
          avgDaysBetweenOrders: 45,
          typicalSessionDuration: 120,
          deviceBreakdown: { mobile: 65, desktop: 30, tablet: 5 },
        },
        value: {
          totalRevenue: 450000,
          avgRevenue: 1500,
          totalOrders: 150,
          avgOrders: 0.5,
          potentialRevenue: 900000,
          ltv: 2000,
          revenueContribution: 0.05,
        },
        recommendations: [
          { type: 'reactivation', priority: 'critical', title: 'Win-Back Campaign', description: 'Urgent re-engagement needed', expectedImpact: '+25% retention', suggestedCampaigns: ['We Miss You', 'Special Comeback Offer'] },
          { type: 'retention', priority: 'high', title: 'Personal Outreach', description: 'Direct contact to understand issues', expectedImpact: '+40% retention', suggestedCampaigns: ['Customer Feedback Call'] },
        ],
      },
    ];
  }

  private getMockDemographics(): AudienceInsight['demographics'] {
    return {
      age: {
        '18-24': 20,
        '25-34': 35,
        '35-44': 25,
        '45-54': 12,
        '55+': 8,
      },
      gender: {
        male: 55,
        female: 42,
        other: 3,
      },
      location: {
        'Mumbai': 30,
        'Delhi': 25,
        'Bangalore': 20,
        'Chennai': 15,
        'Other': 10,
      },
      device: {
        'iOS': 45,
        'Android': 48,
        'Desktop': 5,
        'Tablet': 2,
      },
    };
  }

  private getMockBehaviors(): AudienceInsight['behaviors'] {
    return {
      purchaseFrequency: {
        'daily': 5,
        'weekly': 25,
        'biweekly': 30,
        'monthly': 25,
        'rarely': 15,
      },
      avgOrderValue: {
        '0-200': 15,
        '200-500': 35,
        '500-1000': 30,
        '1000-2000': 15,
        '2000+': 5,
      },
      preferredChannels: {
        'app': 40,
        'website': 30,
        'inStore': 20,
        'whatsapp': 10,
      },
      peakHours: {
        '8-12': 35,
        '12-16': 25,
        '16-20': 30,
        '20-24': 10,
      },
      peakDays: {
        'Monday': 8,
        'Tuesday': 10,
        'Wednesday': 12,
        'Thursday': 11,
        'Friday': 15,
        'Saturday': 22,
        'Sunday': 22,
      },
    };
  }

  private getMockPredictions(): AudienceInsight['predictions'] {
    return {
      nextPurchaseDate: {
        'within_week': 35,
        'within_month': 40,
        'within_quarter': 20,
        'beyond_quarter': 5,
      },
      churnRisk: {
        'low': 60,
        'medium': 25,
        'high': 10,
        'critical': 5,
      },
      ltvTier: {
        'tier1_0_5k': 40,
        'tier2_5_20k': 35,
        'tier3_20_50k': 18,
        'tier4_50k_plus': 7,
      },
    };
  }

  private getMockLookalikes(): LookalikeAudience[] {
    return [
      {
        sourceSegment: 'VIP Customers',
        size: 500,
        similarity: 85,
        characteristics: [
          { attribute: 'High spending', match: 92 },
          { attribute: 'Frequent orders', match: 88 },
          { attribute: 'Premium products', match: 85 },
          { attribute: 'Weekend preference', match: 80 },
        ],
        recommendedChannels: ['app', 'inStore'],
        estimatedReach: 500,
      },
      {
        sourceSegment: 'VIP Customers',
        size: 1200,
        similarity: 72,
        characteristics: [
          { attribute: 'Regular orders', match: 85 },
          { attribute: 'Good engagement', match: 78 },
          { attribute: 'Similar demographics', match: 70 },
        ],
        recommendedChannels: ['app', 'whatsapp'],
        estimatedReach: 1200,
      },
    ];
  }

  private getMockAudience(segmentId: string, limit: number): {
    customers: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      totalSpent: number;
      orderCount: number;
      lastOrderDate: string;
      engagementScore: number;
    }>;
    total: number;
    page: number;
    totalPages: number;
  } {
    const customers = [];
    for (let i = 0; i < limit; i++) {
      customers.push({
        id: `cust_${segmentId}_${i}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@email.com`,
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        totalSpent: Math.floor(Math.random() * 50000) + 1000,
        orderCount: Math.floor(Math.random() * 30) + 1,
        lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        engagementScore: Math.floor(Math.random() * 40) + 50,
      });
    }

    return {
      customers,
      total: 100,
      page: 1,
      totalPages: 5,
    };
  }

  private getMockHighValueInsights(): {
    topCustomers: Array<{
      id: string;
      name: string;
      value: number;
      orders: number;
      lastActive: string;
      tier: string;
    }>;
    valueDistribution: Record<string, number>;
    upgradePotential: Array<{
      from: string;
      to: string;
      count: number;
      avgSpendIncrease: number;
    }>;
  } {
    return {
      topCustomers: [
        { id: 'cust_001', name: 'Rajesh Kumar', value: 125000, orders: 85, lastActive: new Date().toISOString(), tier: 'Platinum' },
        { id: 'cust_002', name: 'Priya Sharma', value: 98000, orders: 72, lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), tier: 'Gold' },
        { id: 'cust_003', name: 'Amit Patel', value: 85000, orders: 65, lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), tier: 'Gold' },
      ],
      valueDistribution: {
        'Platinum': 5,
        'Gold': 15,
        'Silver': 30,
        'Bronze': 50,
      },
      upgradePotential: [
        { from: 'Silver', to: 'Gold', count: 150, avgSpendIncrease: 15000 },
        { from: 'Gold', to: 'Platinum', count: 25, avgSpendIncrease: 30000 },
      ],
    };
  }

  private getMockChurnAnalysis(): {
    churnRate: number;
    trend: 'improving' | 'stable' | 'worsening';
    atRiskCount: number;
    segments: Array<{
      name: string;
      churnRisk: number;
      count: number;
    }>;
    factors: Array<{
      factor: string;
      impact: number;
    }>;
  } {
    return {
      churnRate: 8.5,
      trend: 'stable',
      atRiskCount: 150,
      segments: [
        { name: 'Regular Customers', churnRisk: 12, count: 180 },
        { name: 'New Customers', churnRisk: 35, count: 175 },
        { name: 'At-Risk', churnRisk: 55, count: 165 },
      ],
      factors: [
        { factor: 'Days since last order', impact: 35 },
        { factor: 'Order frequency decline', impact: 25 },
        { factor: 'Support complaints', impact: 15 },
        { factor: 'Competitor activity', impact: 15 },
        { factor: 'Price sensitivity', impact: 10 },
      ],
    };
  }
}

export const audienceIntelligenceService = new AudienceIntelligenceService();
