/**
 * Auto-Campaign Service
 * Automated campaign creation and optimization
 *
 * Features:
 * - Smart campaign generation
 * - Audience targeting
 * - Content optimization
 * - Scheduling automation
 * - Performance prediction
 */

import axios from 'axios';
import { whatsAppInsightsService } from './whatsappInsights';
import { voiceInsightsService } from './voiceInsights';
import { engagementAnalysisService } from './engagementAnalysis';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4008';
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:4009';

export interface CampaignBrief {
  id: string;
  merchantId: string;
  objective: string;
  channel: 'whatsapp' | 'voice' | 'multi';
  targetSegment: string;
  estimatedReach: number;
  estimatedCost: number;
  content: {
    headline: string;
    body: string;
    cta: string;
    offer?: string;
  };
  schedule: {
    startDate: string;
    endDate: string;
    optimalTime?: string;
    frequency: 'once' | 'daily' | 'weekly';
  };
  expectedMetrics: {
    deliveryRate: number;
    openRate: number;
    conversionRate: number;
    roi: number;
  };
  createdAt: string;
}

export interface AutoCampaignResult {
  success: boolean;
  campaignId?: string;
  brief?: CampaignBrief;
  alternatives?: CampaignBrief[];
  recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    suggestion: string;
    reason: string;
  }>;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  type: 'promotional' | 'seasonal' | 'retention' | 'reengagement' | 'announcement';
  channel: 'whatsapp' | 'voice' | 'multi';
  useCases: string[];
  template: {
    headline: string;
    body: string;
    cta: string;
  };
  targetingRules: {
    minOrders?: number;
    maxDaysSinceOrder?: number;
    minSpent?: number;
    segment?: string[];
  };
  performance: {
    avgOpenRate: number;
    avgConversionRate: number;
    avgRoi: number;
  };
}

export class AutoCampaignService {
  /**
   * Generate automatic campaign based on objectives
   */
  async generateCampaign(
    merchantId: string,
    objective: string,
    options?: {
      channel?: 'whatsapp' | 'voice' | 'auto';
      targetSegment?: string;
      budget?: number;
      timeframe?: 'immediate' | 'week' | 'month';
    }
  ): Promise<AutoCampaignResult> {
    const channel = options?.channel || 'auto';
    const segment = options?.targetSegment || 'auto';
    const timeframe = options?.timeframe || 'week';

    // Get insights to inform campaign
    const [whatsappInsights, voiceInsights, engagementInsights] = await Promise.all([
      whatsAppInsightsService.getInsights(merchantId, 'weekly'),
      voiceInsightsService.getInsights(merchantId, 'weekly'),
      engagementAnalysisService.getInsights(merchantId, 'weekly'),
    ]);

    // Determine best channel based on performance
    const bestChannel = channel === 'auto'
      ? this.determineBestChannel(whatsappInsights, voiceInsights)
      : channel;

    // Generate targeting criteria
    const targeting = await this.generateTargeting(merchantId, segment, objective, engagementInsights);

    // Generate content
    const content = this.generateContent(objective, targeting, engagementInsights);

    // Generate schedule
    const schedule = this.generateSchedule(timeframe, bestChannel);

    // Estimate metrics
    const estimatedMetrics = this.estimateMetrics(bestChannel, targeting, content);

    const brief: CampaignBrief = {
      id: `brief_${Date.now()}`,
      merchantId,
      objective,
      channel: bestChannel,
      targetSegment: targeting.name,
      estimatedReach: targeting.size,
      estimatedCost: this.estimateCost(targeting.size, bestChannel),
      content,
      schedule,
      expectedMetrics: estimatedMetrics,
      createdAt: new Date().toISOString(),
    };

    // Generate alternatives
    const alternatives = await this.generateAlternatives(merchantId, brief, engagementInsights);

    // Generate recommendations
    const recommendations = this.generateRecommendations(brief, whatsappInsights, voiceInsights);

    return {
      success: true,
      brief,
      alternatives,
      recommendations,
    };
  }

  /**
   * Create a campaign from a brief
   */
  async createCampaign(brief: CampaignBrief): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      if (brief.channel === 'whatsapp' || brief.channel === 'multi') {
        const response = await axios.post(`${WHATSAPP_SERVICE_URL}/api/campaigns`, {
          merchantId: brief.merchantId,
          name: brief.content.headline,
          type: 'promotional',
          messageTemplate: brief.content.body,
          targetAudience: brief.targetSegment,
          schedule: brief.schedule,
        }, { timeout: 10000 });

        return { success: true, campaignId: response.data.id };
      }

      if (brief.channel === 'voice') {
        const response = await axios.post(`${VOICE_SERVICE_URL}/api/campaigns`, {
          merchantId: brief.merchantId,
          name: brief.content.headline,
          type: 'outbound',
          script: brief.content.body,
          targetAudience: brief.targetSegment,
          schedule: brief.schedule,
        }, { timeout: 10000 });

        return { success: true, campaignId: response.data.id };
      }

      return { success: false, error: 'Unsupported channel' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available campaign templates
   */
  async getTemplates(
    merchantId: string,
    channel?: 'whatsapp' | 'voice'
  ): Promise<CampaignTemplate[]> {
    const templates = this.getDefaultTemplates();

    if (channel) {
      return templates.filter(t => t.channel === channel || t.channel === 'multi');
    }

    return templates;
  }

  /**
   * Get recommended campaigns based on merchant performance
   */
  async getRecommendedCampaigns(merchantId: string): Promise<Array<{
    type: string;
    reason: string;
    expectedImpact: string;
    priority: 'low' | 'medium' | 'high';
    channel: 'whatsapp' | 'voice';
  }>> {
    const [whatsappInsights, engagementInsights] = await Promise.all([
      whatsAppInsightsService.getInsights(merchantId, 'weekly'),
      engagementAnalysisService.getInsights(merchantId, 'weekly'),
    ]);

    const recommendations: Array<{
      type: string;
      reason: string;
      expectedImpact: string;
      priority: 'low' | 'medium' | 'high';
      channel: 'whatsapp' | 'voice';
    }> = [];

    // Check engagement levels
    if (engagementInsights.summary.engagementTrend < 0) {
      recommendations.push({
        type: 'Re-engagement Campaign',
        reason: 'Customer engagement is declining',
        expectedImpact: '+15% engagement',
        priority: 'high',
        channel: 'whatsapp',
      });
    }

    // Check at-risk customers
    const atRiskCount = engagementInsights.atRisk.filter(c => c.riskLevel === 'high').length;
    if (atRiskCount > 5) {
      recommendations.push({
        type: 'Win-Back Campaign',
        reason: `${atRiskCount} customers are at high risk of churning`,
        expectedImpact: 'Save 20-30% at-risk customers',
        priority: 'high',
        channel: 'whatsapp',
      });
    }

    // Check for order decline
    if (whatsappInsights.metrics.totalMessages < 100) {
      recommendations.push({
        type: 'Welcome Campaign',
        reason: 'New customers haven\'t been reached yet',
        expectedImpact: '+10% repeat orders',
        priority: 'medium',
        channel: 'whatsapp',
      });
    }

    // Check WhatsApp open rates
    if (whatsappInsights.metrics.openRate > 70) {
      recommendations.push({
        type: 'Flash Sale Campaign',
        reason: 'Your WhatsApp open rates are excellent (70%+)',
        expectedImpact: '+25% conversion',
        priority: 'medium',
        channel: 'whatsapp',
      });
    }

    // Check for seasonal opportunity
    const today = new Date();
    const month = today.getMonth();

    if (month === 11) { // December
      recommendations.push({
        type: 'Holiday Special',
        reason: 'Holiday season is approaching',
        expectedImpact: '+40% seasonal sales',
        priority: 'high',
        channel: 'multi',
      });
    }

    // VIP outreach
    recommendations.push({
      type: 'VIP Appreciation',
      reason: 'Your VIP customers drive 40% of revenue',
      expectedImpact: '+10% VIP retention',
      priority: 'medium',
      channel: 'voice',
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Optimize existing campaign
   */
  async optimizeCampaign(
    merchantId: string,
    campaignId: string,
    targetMetric: 'delivery' | 'open' | 'conversion'
  ): Promise<{
    success: boolean;
    optimizations: Array<{
      type: string;
      change: string;
      expectedImprovement: string;
    }>;
  }> {
    const optimizations: Array<{
      type: string;
      change: string;
      expectedImprovement: string;
    }> = [];

    // Content optimizations based on target metric
    if (targetMetric === 'delivery') {
      optimizations.push(
        { type: 'timing', change: 'Send during peak hours (10am-2pm)', expectedImprovement: '+10% delivery rate' },
        { type: 'audience', change: 'Remove inactive subscribers', expectedImprovement: '+5% delivery rate' },
        { type: 'content', change: 'Shorten message to under 160 characters', expectedImprovement: '+3% delivery rate' }
      );
    }

    if (targetMetric === 'open') {
      optimizations.push(
        { type: 'subject', change: 'Add personalization token {{name}}', expectedImprovement: '+15% open rate' },
        { type: 'content', change: 'Use a question in the opening', expectedImprovement: '+10% open rate' },
        { type: 'timing', change: 'Send on weekends between 10am-12pm', expectedImprovement: '+8% open rate' }
      );
    }

    if (targetMetric === 'conversion') {
      optimizations.push(
        { type: 'cta', change: 'Add urgency with limited time offer', expectedImprovement: '+20% conversion' },
        { type: 'offer', change: 'Include a specific discount code', expectedImprovement: '+15% conversion' },
        { type: 'content', change: 'Include social proof or reviews', expectedImprovement: '+10% conversion' }
      );
    }

    return { success: true, optimizations };
  }

  /**
   * Schedule campaign for optimal delivery
   */
  async scheduleOptimal(
    merchantId: string,
    campaignData: Partial<CampaignBrief>,
    channel: 'whatsapp' | 'voice'
  ): Promise<{
    recommendedTime: string;
    dayOfWeek: string;
    hour: number;
    reason: string;
  }> {
    const optimalTimes = channel === 'whatsapp'
      ? await whatsAppInsightsService.getOptimalSendTimes(merchantId)
      : await voiceInsightsService.getOptimalCallTimes(merchantId);

    const best = optimalTimes.find(t => t.recommended) || optimalTimes[0];

    const days: Record<string, string> = {
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday',
    };

    const dayOfWeek = days[best.dayOfWeek.substring(0, 3)] || 'Tuesday';

    return {
      recommendedTime: new Date().toISOString(),
      dayOfWeek,
      hour: best.hour,
      reason: `${dayOfWeek} at ${best.hour}:00 has the highest engagement rate (${(best.engagementRate * 100).toFixed(0)}%)`,
    };
  }

  // Private helper methods

  private determineBestChannel(
    whatsappInsights,
    voiceInsights: unknown
  ): 'whatsapp' | 'voice' | 'multi' {
    const whatsappScore = (whatsappInsights.metrics.openRate * 0.4) +
      (whatsappInsights.metrics.deliveryRate * 0.3) +
      (whatsappInsights.audienceMetrics.activeSubscribers / whatsappInsights.audienceMetrics.totalSubscribers * 100 * 0.3);

    const voiceScore = (voiceInsights.metrics.answerRate * 0.5) +
      (voiceInsights.metrics.completionRate * 0.3) +
      (voiceInsights.metrics.roi * 0.2);

    if (Math.abs(whatsappScore - voiceScore) < 10) {
      return 'multi';
    }

    return whatsappScore > voiceScore ? 'whatsapp' : 'voice';
  }

  private async generateTargeting(
    merchantId: string,
    segment: string,
    objective: string,
    engagementInsights: unknown
  ): Promise<{ name: string; size: number; criteria: Record<string, unknown> }> {
    if (segment === 'auto') {
      // Determine segment based on objective
      if (objective.toLowerCase().includes('retain') || objective.toLowerCase().includes('engage')) {
        return {
          name: 'active_customers',
          size: engagementInsights.summary.activeCustomers,
          criteria: { minOrders: 1, maxDaysSinceOrder: 30 },
        };
      }

      if (objective.toLowerCase().includes('win') || objective.toLowerCase().includes('recover')) {
        return {
          name: 'at_risk',
          size: engagementInsights.atRisk.length,
          criteria: { riskLevel: ['high', 'critical'], daysSinceActive: 30 },
        };
      }

      if (objective.toLowerCase().includes('vip') || objective.toLowerCase().includes('loyal')) {
        return {
          name: 'vip_customers',
          size: Math.floor(engagementInsights.summary.totalCustomers * 0.05),
          criteria: { minSpent: 10000, minOrders: 10 },
        };
      }

      return {
        name: 'all_customers',
        size: engagementInsights.summary.totalCustomers,
        criteria: {},
      };
    }

    return {
      name: segment,
      size: Math.floor(Math.random() * 1000) + 100,
      criteria: {},
    };
  }

  private generateContent(
    objective: string,
    targeting: { name: string },
    engagementInsights: unknown
  ): CampaignBrief['content'] {
    const objectiveLower = objective.toLowerCase();

    if (objectiveLower.includes('promotion') || objectiveLower.includes('sale')) {
      return {
        headline: 'Special Offer Just for You!',
        body: 'We\'re offering an exclusive discount on your next order. Use code SAVE20 for 20% off. Limited time only!',
        cta: 'Shop Now',
        offer: '20% off',
      };
    }

    if (objectiveLower.includes('retain') || objectiveLower.includes('engage')) {
      return {
        headline: 'We Miss You!',
        body: `It\'s been a while since your last visit. Here\'s a special offer to welcome you back.`,
        cta: 'Claim Offer',
        offer: 'Welcome back discount',
      };
    }

    if (objectiveLower.includes('win') || objectiveLower.includes('recover')) {
      return {
        headline: 'We Want You Back!',
        body: `We noticed you haven\'t ordered recently. Here\'s an exclusive offer just for you.`,
        cta: 'Reconnect',
        offer: 'Special comeback discount',
      };
    }

    if (objectiveLower.includes('vip') || objectiveLower.includes('loyal')) {
      return {
        headline: 'Thank You, VIP!',
        body: `As one of our valued customers, you get early access to our new collection.`,
        cta: 'Shop Early Access',
        offer: 'Early access',
      };
    }

    return {
      headline: 'New Arrivals Just Dropped!',
      body: 'Check out our latest products and find something you\'ll love.',
      cta: 'Explore Now',
    };
  }

  private generateSchedule(
    timeframe: string,
    channel: 'whatsapp' | 'voice' | 'multi'
  ): CampaignBrief['schedule'] {
    const now = new Date();
    const startDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow

    let endDate: Date;
    switch (timeframe) {
      case 'immediate':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'week':
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      optimalTime: channel === 'whatsapp' ? '10:00' : '11:00',
      frequency: timeframe === 'immediate' ? 'once' : 'weekly',
    };
  }

  private estimateMetrics(
    channel: 'whatsapp' | 'voice' | 'multi',
    targeting: { name: string },
    content: CampaignBrief['content']
  ): CampaignBrief['expectedMetrics'] {
    const hasOffer = !!content.offer;
    const hasPersonalization = content.body.includes('{{') || content.body.includes('you');

    if (channel === 'whatsapp') {
      return {
        deliveryRate: 92,
        openRate: hasPersonalization ? 72 : 65,
        conversionRate: hasOffer ? 8 : 4,
        roi: hasOffer ? 250 : 150,
      };
    }

    if (channel === 'voice') {
      return {
        deliveryRate: 85,
        openRate: 100, // Voice is always "opened"
        conversionRate: 5,
        roi: 180,
      };
    }

    return {
      deliveryRate: 88,
      openRate: 70,
      conversionRate: 6,
      roi: 200,
    };
  }

  private estimateCost(reach: number, channel: 'whatsapp' | 'voice' | 'multi'): number {
    const perMessage = channel === 'whatsapp' ? 0.05 : channel === 'voice' ? 0.10 : 0.08;
    return Math.round(reach * perMessage * 100) / 100;
  }

  private async generateAlternatives(
    merchantId: string,
    primary: CampaignBrief,
    engagementInsights: unknown
  ): Promise<CampaignBrief[]> {
    const alternatives: CampaignBrief[] = [];

    // Alternative 1: Different channel
    if (primary.channel !== 'whatsapp') {
      alternatives.push({
        ...primary,
        id: `brief_${Date.now()}_alt1`,
        channel: 'whatsapp',
        estimatedCost: this.estimateCost(primary.estimatedReach, 'whatsapp'),
        expectedMetrics: {
          deliveryRate: 92,
          openRate: 70,
          conversionRate: 5,
          roi: 200,
        },
      });
    }

    // Alternative 2: Different segment
    alternatives.push({
      ...primary,
      id: `brief_${Date.now()}_alt2`,
      targetSegment: 'vip_customers',
      estimatedReach: Math.floor(primary.estimatedReach * 0.1),
      estimatedCost: this.estimateCost(Math.floor(primary.estimatedReach * 0.1), primary.channel),
      expectedMetrics: {
        deliveryRate: 95,
        openRate: 80,
        conversionRate: 12,
        roi: 350,
      },
    });

    return alternatives;
  }

  private generateRecommendations(
    brief: CampaignBrief,
    whatsappInsights,
    voiceInsights: unknown
  ): AutoCampaignResult['recommendations'] {
    const recommendations: AutoCampaignResult['recommendations'] = [];

    // Timing recommendation
    if (brief.channel === 'whatsapp' && whatsappInsights.metrics.openRate < 70) {
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        suggestion: 'Send messages during optimal hours',
        reason: 'Your current send times have lower engagement rates',
      });
    }

    // Content recommendation
    if (!brief.content.offer) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        suggestion: 'Add an incentive or offer',
        reason: 'Campaigns with offers typically see 2x higher conversion',
      });
    }

    // Audience recommendation
    if (brief.estimatedReach > 5000) {
      recommendations.push({
        type: 'audience',
        priority: 'low',
        suggestion: 'Consider splitting into smaller segments',
        reason: 'Smaller targeted campaigns often perform better',
      });
    }

    return recommendations;
  }

  private getDefaultTemplates(): CampaignTemplate[] {
    return [
      {
        id: 'tpl_001',
        name: 'Weekly Promotion',
        type: 'promotional',
        channel: 'whatsapp',
        useCases: ['Weekly sales', 'Seasonal offers', 'New products'],
        template: {
          headline: 'This Week\'s Special',
          body: 'Check out our latest offers! {{offer}}',
          cta: 'Shop Now',
        },
        targetingRules: { minOrders: 1 },
        performance: { avgOpenRate: 68, avgConversionRate: 5, avgRoi: 180 },
      },
      {
        id: 'tpl_002',
        name: 'Win-Back Campaign',
        type: 'reengagement',
        channel: 'whatsapp',
        useCases: ['Churned customers', 'Dormant users', 'Lapsed subscribers'],
        template: {
          headline: 'We Miss You!',
          body: 'It\'s been a while! Here\'s a special offer to welcome you back.',
          cta: 'Come Back',
        },
        targetingRules: { maxDaysSinceOrder: 60 },
        performance: { avgOpenRate: 72, avgConversionRate: 8, avgRoi: 220 },
      },
      {
        id: 'tpl_003',
        name: 'VIP Outreach',
        type: 'retention',
        channel: 'voice',
        useCases: ['High-value customers', 'Exclusive offers', 'Feedback collection'],
        template: {
          headline: 'Thank You Call',
          body: 'As a valued customer, we\'d like to share some exclusive news.',
          cta: 'Learn More',
        },
        targetingRules: { minSpent: 10000, minOrders: 10 },
        performance: { avgOpenRate: 100, avgConversionRate: 15, avgRoi: 300 },
      },
      {
        id: 'tpl_004',
        name: 'Order Confirmation',
        type: 'retention',
        channel: 'whatsapp',
        useCases: ['Transactional', 'Order updates', 'Delivery notifications'],
        template: {
          headline: 'Order Confirmed!',
          body: 'Your order #{{order_id}} is confirmed. Expected delivery: {{delivery_date}}',
          cta: 'Track Order',
        },
        targetingRules: {},
        performance: { avgOpenRate: 95, avgConversionRate: 20, avgRoi: 500 },
      },
      {
        id: 'tpl_005',
        name: 'Holiday Special',
        type: 'seasonal',
        channel: 'multi',
        useCases: ['Festive seasons', 'Special occasions', 'Limited time offers'],
        template: {
          headline: '{{holiday}} Special!',
          body: 'Celebrate with us! Get {{discount}} off on all orders.',
          cta: 'Claim Offer',
        },
        targetingRules: {},
        performance: { avgOpenRate: 75, avgConversionRate: 12, avgRoi: 350 },
      },
    ];
  }
}

export const autoCampaignService = new AutoCampaignService();
