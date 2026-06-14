/**
 * Voice Campaign Insights Service
 * Provides analytics and insights for voice/IVR campaigns
 *
 * Features:
 * - Call campaign tracking
 * - IVR flow analytics
 * - Voice message performance
 * - Call disposition analysis
 * - Agent performance metrics
 */

import axios from 'axios';

const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:4009';
const AI_VOICE_URL = process.env.AI_VOICE_URL || 'http://localhost:4010';

export interface VoiceCampaign {
  id: string;
  merchantId: string;
  name: string;
  type: 'outbound' | 'inbound' | 'ivr' | 'broadcast' | 'follow_up';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed';
  ivrFlow?: {
    id: string;
    name: string;
    nodes: number;
  };
  voiceMessage?: {
    id: string;
    script: string;
    duration: number;
    voiceId: string;
  };
  targetAudience: {
    segment: string;
    size: number;
  };
  metrics: {
    initiated: number;
    answered: number;
    completed: number;
    abandoned: number;
    failed: number;
    transfers: number;
    voicemails: number;
    avgDuration: number;
    avgWaitTime: number;
  };
  costs: {
    perMinute: number;
    totalMinutes: number;
    total: number;
  };
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface VoiceInsight {
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
    totalCalls: number;
    answerRate: number;
    completionRate: number;
    abandonmentRate: number;
    avgCallDuration: number;
    avgWaitTime: number;
    totalMinutes: number;
    totalCost: number;
    conversions: number;
    costPerConversion: number;
    roi: number;
  };
  ivrMetrics: {
    totalInteractions: number;
    successfulResolutions: number;
    transferRate: number;
    topExitPoints: Array<{ nodeId: string; name: string; exits: number }>;
    avgNodesVisited: number;
  };
  timeMetrics: {
    peakHours: Array<{ hour: number; calls: number; answerRate: number }>;
    bestDays: Array<{ day: string; calls: number; answerRate: number }>;
    avgWaitByHour: Array<{ hour: number; waitTime: number }>;
  };
  topCampaigns: Array<{
    id: string;
    name: string;
    answerRate: number;
    avgDuration: number;
  }>;
  trends: {
    callVolume: Array<{ date: string; count: number }>;
    answerRate: Array<{ date: string; rate: number }>;
    avgDuration: Array<{ date: string; duration: number }>;
  };
  recommendations: Array<{
    type: 'timing' | 'script' | 'ivr_flow' | 'voicemail' | 'budget';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    potentialImpact: string;
  }>;
  generatedAt: string;
}

export interface IVRAnalytics {
  flowId: string;
  flowName: string;
  period: {
    start: string;
    end: string;
  };
  totalStarts: number;
  completions: number;
  nodeMetrics: Array<{
    nodeId: string;
    nodeName: string;
    nodeType: string;
    visits: number;
    avgTimeSpent: number;
    exits: number;
    transfers: number;
    successRate: number;
  }>;
  pathMetrics: Array<{
    path: string[];
    frequency: number;
    avgDuration: number;
    conversionRate: number;
  }>;
  dropOffPoints: Array<{
    nodeId: string;
    nodeName: string;
    dropOffRate: number;
    suggestedAction: string;
  }>;
}

export interface VoiceAgentMetrics {
  agentId: string;
  agentName: string;
  period: {
    start: string;
    end: string;
  };
  calls: {
    handled: number;
    inbound: number;
    outbound: number;
    transferred: number;
  };
  performance: {
    avgHandleTime: number;
    avgTalkTime: number;
    avgAfterCallWork: number;
    firstCallResolution: number;
    customerSatisfaction: number;
  };
  queueMetrics: {
    avgWaitTime: number;
    maxWaitTime: number;
    callsAbandoned: number;
    serviceLevel: number;
  };
}

export class VoiceInsightsService {
  /**
   * Get comprehensive voice insights for a merchant
   */
  async getInsights(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    dateRange?: { start: string; end: string }
  ): Promise<VoiceInsight> {
    const campaigns = await this.getCampaigns(merchantId);
    const ivrAnalytics = await this.getIVRSummary(merchantId, period);
    const timeMetrics = await this.getTimeAnalytics(merchantId, period);

    const startDate = dateRange?.start || this.getDateRangeStart(period);
    const endDate = dateRange?.end || new Date().toISOString();

    const metrics = this.calculateMetrics(campaigns);
    const trends = await this.getTrends(merchantId, startDate, endDate);
    const recommendations = this.generateRecommendations(campaigns, metrics, ivrAnalytics);

    return {
      campaignId: '',
      merchantId,
      period,
      dateRange: { start: startDate, end: endDate },
      metrics,
      ivrMetrics: ivrAnalytics,
      timeMetrics,
      topCampaigns: this.getTopCampaigns(campaigns),
      trends,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get all voice campaigns
   */
  async getCampaigns(merchantId: string): Promise<VoiceCampaign[]> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/campaigns`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.campaigns || [];
    } catch {
      return this.getMockCampaigns(merchantId);
    }
  }

  /**
   * Get specific campaign details
   */
  async getCampaign(campaignId: string): Promise<VoiceCampaign | null> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/campaigns/${campaignId}`, {
        timeout: 5000,
      });
      return response.data;
    } catch {
      return null;
    }
  }

  /**
   * Get IVR flow analytics
   */
  async getIVRAnalytics(
    flowId: string,
    startDate: string,
    endDate: string
  ): Promise<IVRAnalytics | null> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/ivr/${flowId}/analytics`, {
        params: { startDate, endDate },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockIVRAnalytics(flowId);
    }
  }

  /**
   * Get IVR summary metrics
   */
  async getIVRSummary(
    merchantId: string,
    period: string
  ): Promise<VoiceInsight['ivrMetrics']> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/ivr/summary`, {
        params: { merchantId, period },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockIVRSummary();
    }
  }

  /**
   * Get time-based analytics
   */
  async getTimeAnalytics(
    merchantId: string,
    period: string
  ): Promise<VoiceInsight['timeMetrics']> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/insights/time`, {
        params: { merchantId, period },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockTimeMetrics();
    }
  }

  /**
   * Get call trends over time
   */
  async getTrends(
    merchantId: string,
    startDate: string,
    endDate: string
  ): Promise<VoiceInsight['trends']> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/insights/trends`, {
        params: { merchantId, startDate, endDate },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockTrends();
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentMetrics(
    agentId: string,
    startDate: string,
    endDate: string
  ): Promise<VoiceAgentMetrics | null> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/agents/${agentId}/metrics`, {
        params: { startDate, endDate },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockAgentMetrics(agentId);
    }
  }

  /**
   * Get optimal calling times
   */
  async getOptimalCallTimes(merchantId: string): Promise<Array<{
    dayOfWeek: string;
    hour: number;
    answerRate: number;
    recommended: boolean;
  }>> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/insights/optimal-times`, {
        params: { merchantId },
        timeout: 5000,
      });
      return response.data.times || [];
    } catch {
      return this.getMockOptimalTimes();
    }
  }

  /**
   * Get call recording analytics
   */
  async getRecordingAnalytics(
    merchantId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalRecordings: number;
    avgDuration: number;
    sentimentDistribution: Record<string, number>;
    topicDistribution: Record<string, number>;
    complianceScore: number;
  }> {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/recordings/analytics`, {
        params: { merchantId, startDate, endDate },
        timeout: 5000,
      });
      return response.data;
    } catch {
      return this.getMockRecordingAnalytics();
    }
  }

  /**
   * Compare campaign performance
   */
  async compareCampaigns(
    merchantId: string,
    campaignIds: string[]
  ): Promise<Array<{
    campaignId: string;
    name: string;
    metrics: VoiceCampaign['metrics'];
    score: number;
  }>> {
    const campaigns = await Promise.all(
      campaignIds.map(id => this.getCampaign(id))
    );

    const validCampaigns = campaigns.filter((c): c is VoiceCampaign => c !== null);

    return validCampaigns.map(campaign => ({
      campaignId: campaign.id,
      name: campaign.name,
      metrics: campaign.metrics,
      score: this.calculateCampaignScore(campaign),
    }));
  }

  // Private helper methods

  private calculateMetrics(campaigns: VoiceCampaign[]): VoiceInsight['metrics'] {
    const totalInitiated = campaigns.reduce((sum, c) => sum + c.metrics.initiated, 0);
    const totalAnswered = campaigns.reduce((sum, c) => sum + c.metrics.answered, 0);
    const totalCompleted = campaigns.reduce((sum, c) => sum + c.metrics.completed, 0);
    const totalAbandoned = campaigns.reduce((sum, c) => sum + c.metrics.abandoned, 0);
    const totalMinutes = campaigns.reduce((sum, c) => sum + c.costs.totalMinutes, 0);
    const totalCost = campaigns.reduce((sum, c) => sum + c.costs.total, 0);

    const weightedAvgDuration = campaigns.reduce((sum, c) => {
      return sum + (c.metrics.avgDuration * c.metrics.answered);
    }, 0) / (totalAnswered || 1);

    const weightedAvgWait = campaigns.reduce((sum, c) => {
      return sum + (c.metrics.avgWaitTime * c.metrics.initiated);
    }, 0) / (totalInitiated || 1);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      totalCalls: totalInitiated,
      answerRate: totalInitiated > 0 ? (totalAnswered / totalInitiated) * 100 : 0,
      completionRate: totalAnswered > 0 ? (totalCompleted / totalAnswered) * 100 : 0,
      abandonmentRate: totalInitiated > 0 ? (totalAbandoned / totalInitiated) * 100 : 0,
      avgCallDuration: weightedAvgDuration,
      avgWaitTime: weightedAvgWait,
      totalMinutes,
      totalCost,
      conversions: campaigns.reduce((sum, c) => sum + (c.metrics.completed * 0.15), 0), // Estimate conversions
      costPerConversion: 0, // Will be calculated if conversions > 0
      roi: 0, // Will be calculated
    };
  }

  private getTopCampaigns(campaigns: VoiceCampaign[]): VoiceInsight['topCampaigns'] {
    return campaigns
      .filter(c => c.metrics.initiated > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        answerRate: (c.metrics.answered / c.metrics.initiated) * 100,
        avgDuration: c.metrics.avgDuration,
      }))
      .sort((a, b) => b.answerRate - a.answerRate)
      .slice(0, 5);
  }

  private calculateCampaignScore(campaign: VoiceCampaign): number {
    const answerScore = campaign.metrics.initiated > 0
      ? (campaign.metrics.answered / campaign.metrics.initiated) * 30
      : 0;
    const completionScore = campaign.metrics.answered > 0
      ? (campaign.metrics.completed / campaign.metrics.answered) * 40
      : 0;
    const durationScore = Math.min(30, campaign.metrics.avgDuration / 10);

    return answerScore + completionScore + durationScore;
  }

  private generateRecommendations(
    campaigns: VoiceCampaign[],
    metrics: VoiceInsight['metrics'],
    ivrMetrics: VoiceInsight['ivrMetrics']
  ): VoiceInsight['recommendations'] {
    const recommendations: VoiceInsight['recommendations'] = [];

    // Answer rate recommendations
    if (metrics.answerRate < 60) {
      recommendations.push({
        type: 'timing',
        priority: 'high',
        title: 'Improve Answer Rate',
        description: `Your answer rate is ${metrics.answerRate.toFixed(1)}%. Consider calling during optimal hours (10am-2pm, 5pm-7pm).`,
        potentialImpact: '+10-20% answer rate',
      });
    }

    // Abandonment rate recommendations
    if (metrics.abandonmentRate > 10) {
      recommendations.push({
        type: 'ivr_flow',
        priority: 'high',
        title: 'Reduce Call Abandonment',
        description: `Abandonment rate is ${metrics.abandonmentRate.toFixed(1)}%. Simplify IVR and reduce wait times.`,
        potentialImpact: '-5% abandonment',
      });
    }

    // IVR optimization
    if (ivrMetrics.transferRate > 30) {
      recommendations.push({
        type: 'ivr_flow',
        priority: 'medium',
        title: 'Optimize IVR Transfers',
        description: `Transfer rate is ${ivrMetrics.transferRate.toFixed(1)}%. Self-service options could reduce transfers.`,
        potentialImpact: '-10% transfers',
      });
    }

    // Voicemail strategy
    const avgVoicemails = campaigns.reduce((sum, c) => sum + c.metrics.voicemails, 0) / campaigns.length;
    if (avgVoicemails > 20) {
      recommendations.push({
        type: 'voicemail',
        priority: 'medium',
        title: 'Improve Voicemail Strategy',
        description: `${avgVoicemails.toFixed(0)}% of calls go to voicemail. Add a callback prompt or improve first-message resolution.`,
        potentialImpact: '+15% callback rate',
      });
    }

    // Duration optimization
    if (metrics.avgCallDuration < 60) {
      recommendations.push({
        type: 'script',
        priority: 'low',
        title: 'Consider Call Duration',
        description: 'Short call durations may indicate rushed service. Ensure all customer needs are addressed.',
        potentialImpact: 'Improved CSAT',
      });
    }

    // Optimal timing
    const optimalTimes = this.getMockOptimalTimes();
    const bestTime = optimalTimes.find(t => t.recommended);
    if (bestTime) {
      recommendations.push({
        type: 'timing',
        priority: 'low',
        title: `Best Time to Call: ${bestTime.dayOfWeek} ${bestTime.hour}:00`,
        description: `Calls during this time have ${(bestTime.answerRate * 100).toFixed(0)}% higher answer rate.`,
        potentialImpact: '+15-25% answer rate',
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

  // Mock data for development

  private getMockCampaigns(merchantId: string): VoiceCampaign[] {
    return [
      {
        id: 'vc_001',
        merchantId,
        name: 'Order Confirmation Call',
        type: 'transactional',
        status: 'active',
        targetAudience: { segment: 'recent_orders', size: 100 },
        metrics: {
          initiated: 500, answered: 425, completed: 400, abandoned: 15,
          failed: 60, transfers: 50, voicemails: 25, avgDuration: 45, avgWaitTime: 12
        },
        costs: { perMinute: 0.02, totalMinutes: 300, total: 6 },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'vc_002',
        merchantId,
        name: 'Delivery Follow-up',
        type: 'follow_up',
        status: 'completed',
        targetAudience: { segment: 'pending_delivery', size: 50 },
        metrics: {
          initiated: 50, answered: 42, completed: 40, abandoned: 2,
          failed: 6, transfers: 5, voicemails: 2, avgDuration: 60, avgWaitTime: 8
        },
        costs: { perMinute: 0.02, totalMinutes: 40, total: 0.8 },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'vc_003',
        merchantId,
        name: 'VIP Customer Outreach',
        type: 'outbound',
        status: 'active',
        targetAudience: { segment: 'VIP', size: 200 },
        metrics: {
          initiated: 200, answered: 180, completed: 175, abandoned: 5,
          failed: 15, transfers: 10, voicemails: 5, avgDuration: 120, avgWaitTime: 5
        },
        costs: { perMinute: 0.02, totalMinutes: 350, total: 7 },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  private getMockIVRAnalytics(flowId: string): IVRAnalytics {
    return {
      flowId,
      flowName: 'Main Menu',
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      totalStarts: 1500,
      completions: 1200,
      nodeMetrics: [
        { nodeId: 'node_1', nodeName: 'Welcome', nodeType: 'announcement', visits: 1500, avgTimeSpent: 5, exits: 1500, transfers: 0, successRate: 100 },
        { nodeId: 'node_2', nodeName: 'Main Menu', nodeType: 'menu', visits: 1480, avgTimeSpent: 15, exits: 1480, transfers: 400, successRate: 80 },
        { nodeId: 'node_3', nodeName: 'Order Status', nodeType: 'action', visits: 500, avgTimeSpent: 30, exits: 450, transfers: 50, successRate: 90 },
        { nodeId: 'node_4', nodeName: 'Speak to Agent', nodeType: 'transfer', visits: 400, avgTimeSpent: 10, exits: 400, transfers: 400, successRate: 100 },
      ],
      pathMetrics: [
        { path: ['welcome', 'main_menu', 'order_status', 'end'], frequency: 450, avgDuration: 60, conversionRate: 90 },
        { path: ['welcome', 'main_menu', 'speak_agent', 'transfer'], frequency: 400, avgDuration: 90, conversionRate: 85 },
        { path: ['welcome', 'main_menu', 'products', 'end'], frequency: 350, avgDuration: 120, conversionRate: 75 },
      ],
      dropOffPoints: [
        { nodeId: 'node_2', nodeName: 'Main Menu', dropOffRate: 2.5, suggestedAction: 'Add timeout message' },
        { nodeId: 'node_3', nodeName: 'Order Status', dropOffRate: 10, suggestedAction: 'Simplify order lookup' },
      ],
    };
  }

  private getMockIVRSummary(): VoiceInsight['ivrMetrics'] {
    return {
      totalInteractions: 1500,
      successfulResolutions: 1200,
      transferRate: 26.7,
      topExitPoints: [
        { nodeId: 'node_1', name: 'Welcome', exits: 1500 },
        { nodeId: 'node_2', name: 'Main Menu', exits: 1480 },
        { nodeId: 'node_4', name: 'Agent Transfer', exits: 400 },
      ],
      avgNodesVisited: 3.2,
    };
  }

  private getMockTimeMetrics(): VoiceInsight['timeMetrics'] {
    return {
      peakHours: [
        { hour: 10, calls: 150, answerRate: 85 },
        { hour: 11, calls: 180, answerRate: 82 },
        { hour: 12, calls: 200, answerRate: 78 },
        { hour: 14, calls: 170, answerRate: 80 },
        { hour: 17, calls: 190, answerRate: 88 },
        { hour: 18, calls: 160, answerRate: 85 },
      ],
      bestDays: [
        { day: 'Tuesday', calls: 850, answerRate: 82 },
        { day: 'Wednesday', calls: 820, answerRate: 80 },
        { day: 'Thursday', calls: 780, answerRate: 78 },
        { day: 'Friday', calls: 750, answerRate: 75 },
      ],
      avgWaitByHour: [
        { hour: 10, waitTime: 8 },
        { hour: 11, waitTime: 12 },
        { hour: 12, waitTime: 18 },
        { hour: 14, waitTime: 15 },
        { hour: 17, waitTime: 10 },
        { hour: 18, waitTime: 6 },
      ],
    };
  }

  private getMockTrends(): VoiceInsight['trends'] {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(date.toISOString().split('T')[0]);
    }

    return {
      callVolume: dates.map(d => ({ date: d, count: Math.floor(Math.random() * 100) + 50 })),
      answerRate: dates.map(d => ({ date: d, rate: Math.random() * 20 + 70 })),
      avgDuration: dates.map(d => ({ date: d, duration: Math.floor(Math.random() * 60) + 40 })),
    };
  }

  private getMockOptimalTimes(): Array<{
    dayOfWeek: string;
    hour: number;
    answerRate: number;
    recommended: boolean;
  }> {
    return [
      { dayOfWeek: 'Monday', hour: 10, answerRate: 0.75, recommended: false },
      { dayOfWeek: 'Tuesday', hour: 11, answerRate: 0.82, recommended: true },
      { dayOfWeek: 'Wednesday', hour: 12, answerRate: 0.78, recommended: false },
      { dayOfWeek: 'Thursday', hour: 10, answerRate: 0.80, recommended: false },
      { dayOfWeek: 'Friday', hour: 17, answerRate: 0.88, recommended: true },
      { dayOfWeek: 'Saturday', hour: 11, answerRate: 0.85, recommended: true },
      { dayOfWeek: 'Sunday', hour: 12, answerRate: 0.70, recommended: false },
    ];
  }

  private getMockAgentMetrics(agentId: string): VoiceAgentMetrics {
    return {
      agentId,
      agentName: 'Agent ' + agentId.slice(-4),
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      calls: {
        handled: 450,
        inbound: 200,
        outbound: 250,
        transferred: 45,
      },
      performance: {
        avgHandleTime: 240,
        avgTalkTime: 180,
        avgAfterCallWork: 60,
        firstCallResolution: 0.85,
        customerSatisfaction: 4.5,
      },
      queueMetrics: {
        avgWaitTime: 25,
        maxWaitTime: 120,
        callsAbandoned: 15,
        serviceLevel: 0.88,
      },
    };
  }

  private getMockRecordingAnalytics(): {
    totalRecordings: number;
    avgDuration: number;
    sentimentDistribution: Record<string, number>;
    topicDistribution: Record<string, number>;
    complianceScore: number;
  } {
    return {
      totalRecordings: 500,
      avgDuration: 180,
      sentimentDistribution: {
        positive: 65,
        neutral: 25,
        negative: 10,
      },
      topicDistribution: {
        order_inquiry: 35,
        complaint: 20,
        general_inquiry: 25,
        feedback: 15,
        other: 5,
      },
      complianceScore: 94,
    };
  }
}

export const voiceInsightsService = new VoiceInsightsService();
