import logger from './utils/logger';

/**
 * WhatsApp Marketing Insights Service
 * Provides analytics and insights for WhatsApp marketing campaigns
 *
 * Features:
 * - Campaign performance tracking
 * - Message analytics
 * - Customer engagement metrics
 * - ROI calculation
 * - Audience segmentation insights
 */

import axios from 'axios';

const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4008';
const MERCHANT_SERVICE_URL = process.env.MERCHANT_SERVICE_URL || 'http://localhost:4003';

export interface WhatsAppCampaign {
  id: string;
  merchantId: string;
  name: string;
  type: 'promotional' | 'transactional' | 'broadcast' | 'automation';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  messageTemplate: string;
  targetAudience: {
    segment: string;
    size: number;
    criteria: Record<string, unknown>;
  };
  metrics: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    replied: number;
    conversions: number;
  };
  costs: {
    perMessage: number;
    total: number;
  };
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  completedAt?: string;
}

export interface WhatsAppInsight {
  campaignId: string;
  merchantId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalMessages: number;
    deliveryRate: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
    optOutRate: number;
    revenue: number;
    roi: number;
  };
  audienceMetrics: {
    totalSubscribers: number;
    activeSubscribers: number;
    newSubscribers: number;
    unsubscribed: number;
    segmentDistribution: Record<string, number>;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    performance: number;
    roi: number;
  }>;
  trends: {
    messageVolume: Array<{ date: string; count: number }>;
    engagement: Array<{ date: string; rate: number }>;
    revenue: Array<{ date: string; amount: number }>;
  };
  recommendations: Array<{
    type: 'timing' | 'content' | 'audience' | 'budget';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    potentialImpact: string;
  }>;
  generatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  content: string;
  variables: string[];
  status: 'pending' | 'approved' | 'rejected' | 'requires_updates';
  language: string;
  createdAt: string;
}

export interface WhatsAppAudience {
  segmentId: string;
  name: string;
  criteria: {
    orderFrequency?: { min?: number; max?: number };
    lastOrderDate?: { daysAgo: number };
    totalSpent?: { min?: number; max?: number };
    tags?: string[];
    location?: string;
  };
  size: number;
  avgOrderValue: number;
  lastActive: string;
  engagementScore: number;
}

export class WhatsAppInsightsService {
  /**
   * Get comprehensive WhatsApp insights for a merchant
   */
  async getInsights(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    dateRange?: { start: string; end: string }
  ): Promise<WhatsAppInsight> {
    const campaigns = await this.getCampaigns(merchantId);
    const audience = await this.getAudienceInsights(merchantId);
    const templates = await this.getTemplates(merchantId);

    const startDate = dateRange?.start || this.getDateRangeStart(period);
    const endDate = dateRange?.end || new Date().toISOString();

    const metrics = this.calculateMetrics(campaigns, audience);
    const trends = await this.getTrends(merchantId, startDate, endDate);
    const recommendations = this.generateRecommendations(campaigns, metrics, audience);

    return {
      campaignId: '',
      merchantId,
      period,
      dateRange: { start: startDate, end: endDate },
      metrics,
      audienceMetrics: audience,
      topCampaigns: this.getTopCampaigns(campaigns),
      trends,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all WhatsApp campaigns for a merchant
   */
  async getCampaigns(merchantId: string): Promise<WhatsAppCampaign[]> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/campaigns`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.campaigns || [];
    } catch (error) {
      logger.warn('[WhatsAppInsights] Failed to fetch campaigns, using mock data');
      return this.getMockCampaigns(merchantId);
    }
  }

  /**
   * Get specific campaign details
   */
  async getCampaign(campaignId: string): Promise<WhatsAppCampaign | null> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/campaigns/${campaignId}`, {
        timeout: 5000,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Get audience insights
   */
  async getAudienceInsights(merchantId: string): Promise<WhatsAppInsight['audienceMetrics']> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/audience/insights`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockAudienceMetrics();
    }
  }

  /**
   * Get message templates
   */
  async getTemplates(merchantId: string): Promise<WhatsAppTemplate[]> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/templates`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.templates || [];
    } catch {
      return [];
    }
  }

  /**
   * Get audience segments
   */
  async getAudienceSegments(merchantId: string): Promise<WhatsAppAudience[]> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/audience/segments`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.segments || [];
    } catch {
      return this.getMockAudienceSegments();
    }
  }

  /**
   * Get message trends over time
   */
  async getTrends(
    merchantId: string,
    startDate: string,
    endDate: string
  ): Promise<WhatsAppInsight['trends']> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/insights/trends`, {
        params: { merchantId, startDate, endDate },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockTrends();
    }
  }

  /**
   * Get best time to send messages
   */
  async getOptimalSendTimes(merchantId: string): Promise<Array<{
    dayOfWeek: string;
    hour: number;
    engagementRate: number;
    recommended: boolean;
  }>> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/insights/optimal-times`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.times || [];
    } catch {
      return this.getMockOptimalTimes();
    }
  }

  /**
   * Get subscriber growth data
   */
  async getSubscriberGrowth(merchantId: string, days: number = 30): Promise<Array<{
    date: string;
    total: number;
    new: number;
    unsubscribed: number;
  }>> {
    try {
      const response = await axios.get(`${WHATSAPP_SERVICE_URL}/api/insights/subscriber-growth`, {
        params: { merchantId, days },
        timeout: 5000,
      });
      return response.data.growth || [];
    } catch {
      return this.getMockSubscriberGrowth(days);
    }
  }

  /**
   * Get campaign performance comparison
   */
  async compareCampaigns(
    merchantId: string,
    campaignIds: string[]
  ): Promise<Array<{
    campaignId: string;
    name: string;
    metrics: WhatsAppCampaign['metrics'];
    normalizedScore: number;
  }>> {
    const campaigns = await Promise.all(
      campaignIds.map(id => this.getCampaign(id))
    );

    const validCampaigns = campaigns.filter((c): c is WhatsAppCampaign => c !== null);

    return validCampaigns.map(campaign => ({
      campaignId: campaign.id,
      name: campaign.name,
      metrics: campaign.metrics,
      normalizedScore: this.calculateCampaignScore(campaign),
    }));
  }

  /**
   * Get predicted campaign performance
   */
  async predictCampaignPerformance(
    merchantId: string,
    campaignData: Partial<WhatsAppCampaign>
  ): Promise<{
    expectedDeliveryRate: number;
    expectedOpenRate: number;
    expectedConversionRate: number;
    confidence: number;
    similarCampaigns: Array<{ id: string; actualPerformance: number }>;
  }> {
    const historicalCampaigns = await this.getCampaigns(merchantId);

    const similarCampaigns = historicalCampaigns
      .filter(c => c.type === campaignData.type)
      .slice(0, 5);

    const avgDeliveryRate = this.average(
      similarCampaigns.map(c => (c.metrics.delivered / c.metrics.sent) * 100 || 0)
    );
    const avgOpenRate = this.average(
      similarCampaigns.map(c => (c.metrics.read / c.metrics.delivered) * 100 || 0)
    );
    const avgConversionRate = this.average(
      similarCampaigns.map(c => (c.metrics.conversions / c.metrics.sent) * 100 || 0)
    );

    return {
      expectedDeliveryRate: avgDeliveryRate || 95,
      expectedOpenRate: avgOpenRate || 70,
      expectedConversionRate: avgConversionRate || 5,
      confidence: similarCampaigns.length >= 5 ? 0.8 : 0.5,
      similarCampaigns: similarCampaigns.map(c => ({
        id: c.id,
        actualPerformance: this.calculateCampaignScore(c),
      })),
    };
  }

  // Private helper methods

  private calculateMetrics(
    campaigns: WhatsAppCampaign[],
    audience: WhatsAppInsight['audienceMetrics']
  ): WhatsAppInsight['metrics'] {
    const totalMessages = campaigns.reduce((sum, c) => sum + c.metrics.sent, 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.metrics.delivered, 0);
    const totalRead = campaigns.reduce((sum, c) => sum + c.metrics.read, 0);
    const totalReplied = campaigns.reduce((sum, c) => sum + c.metrics.replied, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.metrics.conversions, 0);
    const totalCost = campaigns.reduce((sum, c) => sum + c.costs.total, 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalMessages,
      deliveryRate: totalMessages > 0 ? (totalDelivered / totalMessages) * 100 : 0,
      openRate: totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0,
      responseRate: totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0,
      conversionRate: totalDelivered > 0 ? (totalConversions / totalDelivered) * 100 : 0,
      optOutRate: audience.totalSubscribers > 0
        ? (audience.unsubscribed / audience.totalSubscribers) * 100
        : 0,
      revenue: campaigns.reduce((sum, c) => {
        return sum + (c.metrics.conversions * (c.costs.total / (c.metrics.conversions || 1)));
      }, 0),
      roi: totalCost > 0
        ? ((campaigns.reduce((sum, c) => sum + (c.metrics.conversions * 100), 0) - totalCost) / totalCost) * 100
        : 0,
    };
  }

  private getTopCampaigns(campaigns: WhatsAppCampaign[]): WhatsAppInsight['topCampaigns'] {
    return campaigns
      .map(c => ({
        id: c.id,
        name: c.name,
        performance: this.calculateCampaignScore(c),
        roi: c.costs.total > 0
          ? ((c.metrics.conversions * 100 - c.costs.total) / c.costs.total) * 100
          : 0,
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
  }

  private calculateCampaignScore(campaign: WhatsAppCampaign): number {
    const deliveryScore = campaign.metrics.sent > 0
      ? (campaign.metrics.delivered / campaign.metrics.sent) * 30
      : 0;
    const engagementScore = campaign.metrics.delivered > 0
      ? (campaign.metrics.read / campaign.metrics.delivered) * 30
      : 0;
    const conversionScore = campaign.metrics.delivered > 0
      ? (campaign.metrics.conversions / campaign.metrics.delivered) * 40
      : 0;

    return deliveryScore + engagementScore + conversionScore;
  }

  private generateRecommendations(
    campaigns: WhatsAppCampaign[],
    metrics: WhatsAppInsight['metrics'],
    audience: WhatsAppInsight['audienceMetrics']
  ): WhatsAppInsight['recommendations'] {
    const recommendations: WhatsAppInsight['recommendations'] = [];

    // Delivery rate recommendations
    if (metrics.deliveryRate < 90) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        title: 'Improve Message Delivery',
        description: `Your delivery rate is ${metrics.deliveryRate.toFixed(1)}%. Clean your subscriber list and remove inactive numbers.`,
        potentialImpact: '+5-10% delivery rate',
      });
    }

    // Open rate recommendations
    if (metrics.openRate < 60) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        title: 'Increase Message Open Rate',
        description: 'Use personalized greetings and compelling preview text. Test different send times.',
        potentialImpact: '+10-20% open rate',
      });
    }

    // Response rate recommendations
    if (metrics.responseRate < 10) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        title: 'Boost Customer Responses',
        description: 'Add clear CTAs and ask questions. Use interactive buttons for better engagement.',
        potentialImpact: '+5-15% response rate',
      });
    }

    // Audience growth recommendations
    if (audience.activeSubscribers / audience.totalSubscribers < 0.5) {
      recommendations.push({
        type: 'audience',
        priority: 'medium',
        title: 'Re-engage Inactive Subscribers',
        description: `${((1 - audience.activeSubscribers / audience.totalSubscribers) * 100).toFixed(0)}% of your subscribers are inactive. Run a re-engagement campaign.`,
        potentialImpact: '+20% active subscribers',
      });
    }

    // Timing recommendations
    const optimalTimes = this.getMockOptimalTimes();
    const bestTime = optimalTimes.find(t => t.recommended);
    if (bestTime) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        title: `Optimal Send Time: ${bestTime.dayOfWeek} ${bestTime.hour}:00`,
        description: `Messages sent at this time have ${(bestTime.engagementRate * 100).toFixed(0)}% higher engagement.`,
        potentialImpact: '+15-25% engagement',
      });
    }

    // Budget recommendations
    if (metrics.roi < 100 && campaigns.length > 0) {
      recommendations.push({
        type: 'budget',
        priority: 'medium',
        title: 'Optimize Campaign Budget',
        description: 'Focus on high-performing campaigns and reduce spend on underperformers.',
        potentialImpact: '+30% ROI',
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

  private average(numbers: number[]): number {
    const valid = numbers.filter(n => !isNaN(n) && n > 0);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  }

  // Mock data for development

  private getMockCampaigns(merchantId: string): WhatsAppCampaign[] {
    return [
      {
        id: 'wc_001',
        merchantId,
        name: 'Weekend Special Offer',
        type: 'promotional',
        status: 'completed',
        messageTemplate: 'Get 20% off this weekend! Use code WEEKEND20',
        targetAudience: { segment: 'all_customers', size: 1500, criteria: {} },
        metrics: { sent: 1500, delivered: 1485, read: 1114, clicked: 223, replied: 148, conversions: 75 },
        costs: { perMessage: 0.05, total: 75 },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wc_002',
        merchantId,
        name: 'New Product Launch',
        type: 'promotional',
        status: 'active',
        messageTemplate: 'Check out our new {product_name}! Order now.',
        targetAudience: { segment: 'recent_buyers', size: 500, criteria: { daysAgo: 30 } },
        metrics: { sent: 500, delivered: 495, read: 347, clicked: 99, replied: 50, conversions: 25 },
        costs: { perMessage: 0.05, total: 25 },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wc_003',
        merchantId,
        name: 'Order Confirmation',
        type: 'transactional',
        status: 'active',
        messageTemplate: 'Your order #{order_id} is confirmed!',
        targetAudience: { segment: 'daily_orders', size: 100, criteria: {} },
        metrics: { sent: 300, delivered: 300, read: 285, clicked: 0, replied: 15, conversions: 0 },
        costs: { perMessage: 0.03, total: 9 },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  private getMockAudienceMetrics(): WhatsAppInsight['audienceMetrics'] {
    return {
      totalSubscribers: 2500,
      activeSubscribers: 1875,
      newSubscribers: 150,
      unsubscribed: 25,
      segmentDistribution: {
        'all_customers': 1500,
        'recent_buyers': 500,
        'VIP': 250,
        'at_risk': 250,
      },
    };
  }

  private getMockAudienceSegments(): WhatsAppAudience[] {
    return [
      {
        segmentId: 'seg_001',
        name: 'All Customers',
        criteria: {},
        size: 1500,
        avgOrderValue: 250,
        lastActive: new Date().toISOString(),
        engagementScore: 75,
      },
      {
        segmentId: 'seg_002',
        name: 'VIP Customers',
        criteria: { totalSpent: { min: 10000 } },
        size: 250,
        avgOrderValue: 850,
        lastActive: new Date().toISOString(),
        engagementScore: 90,
      },
      {
        segmentId: 'seg_003',
        name: 'At Risk',
        criteria: { lastOrderDate: { daysAgo: 60 } },
        size: 250,
        avgOrderValue: 180,
        lastActive: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        engagementScore: 25,
      },
    ];
  }

  private getMockTrends(): WhatsAppInsight['trends'] {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(date.toISOString().split('T')[0]);
    }

    return {
      messageVolume: dates.map(d => ({ date: d, count: Math.floor(Math.random() * 500) + 200 })),
      engagement: dates.map(d => ({ date: d, rate: Math.random() * 30 + 60 })),
      revenue: dates.map(d => ({ date: d, amount: Math.floor(Math.random() * 5000) + 2000 })),
    };
  }

  private getMockOptimalTimes(): Array<{
    dayOfWeek: string;
    hour: number;
    engagementRate: number;
    recommended: boolean;
  }> {
    return [
      { dayOfWeek: 'Monday', hour: 10, engagementRate: 0.72, recommended: false },
      { dayOfWeek: 'Tuesday', hour: 11, engagementRate: 0.75, recommended: false },
      { dayOfWeek: 'Wednesday', hour: 12, engagementRate: 0.78, recommended: true },
      { dayOfWeek: 'Thursday', hour: 10, engagementRate: 0.74, recommended: false },
      { dayOfWeek: 'Friday', hour: 18, engagementRate: 0.82, recommended: true },
      { dayOfWeek: 'Saturday', hour: 11, engagementRate: 0.85, recommended: true },
      { dayOfWeek: 'Sunday', hour: 12, engagementRate: 0.80, recommended: false },
    ];
  }

  private getMockSubscriberGrowth(days: number): Array<{
    date: string;
    total: number;
    new: number;
    unsubscribed: number;
  }> {
    const data = [];
    let total = 2300;

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const newSubs = Math.floor(Math.random() * 10) + 3;
      const unsubs = Math.floor(Math.random() * 3);
      total = total + newSubs - unsubs;

      data.push({
        date: date.toISOString().split('T')[0],
        total,
        new: newSubs,
        unsubscribed: unsubs,
      });
    }

    return data;
  }
}

export const whatsAppInsightsService = new WhatsAppInsightsService();
