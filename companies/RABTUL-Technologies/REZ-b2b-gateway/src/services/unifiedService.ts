import { proxyService } from './proxyService';

/**
 * Unified data aggregation across all B2B services
 */
export class UnifiedService {

  /**
   * Get complete account view with all related data
   */
  async getAccountView(tenantId: string, accountId: string): Promise<{
    account: unknown;
    signals: unknown[];
    deals: unknown[];
    activities: unknown[];
    contacts: unknown[];
    insights: unknown;
  }> {
    // Fetch all data in parallel
    const [account, signals, deals, activities, contacts] = await Promise.allSettled([
      proxyService.proxyRequest('tamBuilder', 'get', `/api/v1/companies/${accountId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('signalService', 'get', `/api/v1/signals?accountId=${accountId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('dealIntelligence', 'get', `/api/v1/deals?accountId=${accountId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('activityService', 'get', `/api/v1/activities?accountId=${accountId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('buyerMapping', 'get', `/api/v1/contacts?companyId=${accountId}`, undefined, { 'x-tenant-id': tenantId })
    ]);

    // Generate insights from aggregated data
    const insights = this.generateInsights({
      signals: signals.status === 'fulfilled' ? signals.value : [],
      deals: deals.status === 'fulfilled' ? deals.value : [],
      activities: activities.status === 'fulfilled' ? activities.value : []
    });

    return {
      account: account.status === 'fulfilled' ? account.value : { id: accountId },
      signals: signals.status === 'fulfilled' ? (signals.value as { data?: unknown[] })?.data || [] : [],
      deals: deals.status === 'fulfilled' ? (deals.value as { data?: unknown[] })?.data || [] : [],
      activities: activities.status === 'fulfilled' ? (activities.value as { data?: unknown[] })?.data || [] : [],
      contacts: contacts.status === 'fulfilled' ? (contacts.value as { data?: unknown[] })?.data || [] : [],
      insights
    };
  }

  /**
   * Get deal with full context
   */
  async getDealView(tenantId: string, dealId: string): Promise<{
    deal: unknown;
    activities: unknown[];
    notes: unknown[];
    contacts: unknown[];
    signals: unknown[];
    score: unknown;
    recommendations: unknown[];
  }> {
    const [deal, activities, notes, contacts, signals, score] = await Promise.allSettled([
      proxyService.proxyRequest('dealIntelligence', 'get', `/api/v1/deals/${dealId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('activityService', 'get', `/api/v1/activities?dealId=${dealId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('meetingNotes', 'get', `/api/v1/notes/deal/${dealId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('buyerMapping', 'get', `/api/v1/matrix/deal/${dealId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('signalService', 'get', `/api/v1/signals?dealId=${dealId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('dealIntelligence', 'get', `/api/v1/deals/${dealId}/score`, undefined, { 'x-tenant-id': tenantId })
    ]);

    return {
      deal: deal.status === 'fulfilled' ? deal.value : { id: dealId },
      activities: activities.status === 'fulfilled' ? (activities.value as { data?: unknown[] })?.data || [] : [],
      notes: notes.status === 'fulfilled' ? (notes.value as { data?: unknown[] })?.data || [] : [],
      contacts: contacts.status === 'fulfilled' ? contacts.value : [],
      signals: signals.status === 'fulfilled' ? (signals.value as { data?: unknown[] })?.data || [] : [],
      score: score.status === 'fulfilled' ? score.value : null,
      recommendations: []
    };
  }

  /**
   * Get pipeline overview with all deal data
   */
  async getPipelineOverview(tenantId: string, pipelineId?: string): Promise<{
    pipeline: unknown;
    deals: unknown[];
    forecasts: unknown[];
    suggestions: unknown[];
    analytics: unknown;
  }> {
    const [pipeline, deals, forecasts, suggestions, analytics] = await Promise.allSettled([
      pipelineId
        ? proxyService.proxyRequest('pipelineSuggestions', 'get', `/api/v1/pipelines/${pipelineId}`, undefined, { 'x-tenant-id': tenantId })
        : proxyService.proxyRequest('pipelineSuggestions', 'get', '/api/v1/pipelines', undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('dealIntelligence', 'get', '/api/v1/deals', undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('pipelineSuggestions', 'get', '/api/v1/forecasts/latest', undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('pipelineSuggestions', 'get', '/api/v1/suggestions', undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('dealIntelligence', 'get', '/api/v1/deals/analytics/summary', undefined, { 'x-tenant-id': tenantId })
    ]);

    return {
      pipeline: pipeline.status === 'fulfilled' ? pipeline.value : {},
      deals: deals.status === 'fulfilled' ? (deals.value as { data?: unknown[] })?.data || [] : [],
      forecasts: forecasts.status === 'fulfilled' ? forecasts.value : [],
      suggestions: suggestions.status === 'fulfilled' ? (suggestions.value as { data?: unknown[] })?.data || [] : [],
      analytics: analytics.status === 'fulfilled' ? analytics.value : {}
    };
  }

  /**
   * Get outreach summary for a prospect
   */
  async getOutreachSummary(tenantId: string, prospectId: string): Promise<{
    prospect: unknown;
    sequences: unknown[];
    activities: unknown[];
    engagement: unknown;
  }> {
    const [prospect, sequences, activities] = await Promise.allSettled([
      proxyService.proxyRequest('outboundService', 'get', `/api/v1/prospects/${prospectId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('outboundService', 'get', `/api/v1/sequences?prospectId=${prospectId}`, undefined, { 'x-tenant-id': tenantId }),
      proxyService.proxyRequest('activityService', 'get', `/api/v1/activities?prospectId=${prospectId}`, undefined, { 'x-tenant-id': tenantId })
    ]);

    return {
      prospect: prospect.status === 'fulfilled' ? prospect.value : { id: prospectId },
      sequences: sequences.status === 'fulfilled' ? (sequences.value as { data?: unknown[] })?.data || [] : [],
      activities: activities.status === 'fulfilled' ? (activities.value as { data?: unknown[] })?.data || [] : [],
      engagement: this.calculateEngagement(
        activities.status === 'fulfilled' ? (activities.value as { data?: unknown[] })?.data || [] : []
      )
    };
  }

  /**
   * Generate insights from aggregated data
   */
  private generateInsights(data: {
    signals: unknown[];
    deals: unknown[];
    activities: unknown[];
  }): {
    intentLevel: 'high' | 'medium' | 'low';
    engagementScore: number;
    riskLevel: 'high' | 'medium' | 'low';
    recommendations: string[];
  } {
    const signalData = data.signals as Array<{ intentScore?: number }>;
    const dealData = data.deals as Array<{ value?: number; stage?: string }>;
    const activityData = data.activities as Array<{ date?: string }>;

    // Calculate intent level from signals
    const avgIntent = signalData.length > 0
      ? signalData.reduce((sum, s) => sum + (s.intentScore || 0), 0) / signalData.length
      : 50;

    // Calculate engagement from activities
    const recentActivities = activityData.filter(a => {
      if (!a.date) return false;
      const daysSince = (Date.now() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    const engagementScore = Math.min(recentActivities * 5, 100);

    // Calculate pipeline value
    const totalValue = dealData.reduce((sum, d) => sum + (d.value || 0), 0);

    // Generate recommendations
    const recommendations: string[] = [];
    if (avgIntent > 70) recommendations.push('High intent detected - prioritize outreach');
    if (engagementScore < 30) recommendations.push('Low engagement - increase touchpoints');
    if (totalValue > 100000) recommendations.push('High-value account - ensure executive sponsorship');
    if (signalData.length > 5) recommendations.push('Multiple signals active - timing is critical');

    return {
      intentLevel: avgIntent > 70 ? 'high' : avgIntent > 40 ? 'medium' : 'low',
      engagementScore,
      riskLevel: engagementScore < 20 ? 'high' : engagementScore < 50 ? 'medium' : 'low',
      recommendations
    };
  }

  /**
   * Calculate engagement metrics
   */
  private calculateEngagement(activities: unknown[]): {
    totalTouchpoints: number;
    lastActivity: string | null;
    engagementTrend: 'increasing' | 'stable' | 'decreasing';
    channelBreakdown: Record<string, number>;
  } {
    const activityData = activities as Array<{ type?: string; date?: string }>;

    // Group by channel
    const channelBreakdown: Record<string, number> = {};
    for (const activity of activityData) {
      const type = activity.type || 'other';
      channelBreakdown[type] = (channelBreakdown[type] || 0) + 1;
    }

    // Calculate trend
    const sortedActivities = [...activityData]
      .filter(a => a.date)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (sortedActivities.length >= 6) {
      const half = Math.floor(sortedActivities.length / 2);
      const recent = sortedActivities.slice(0, half);
      const older = sortedActivities.slice(half);

      const recentAvg = recent.length / 30;
      const olderAvg = older.length / 30;

      if (recentAvg > olderAvg * 1.2) trend = 'increasing';
      else if (recentAvg < olderAvg * 0.8) trend = 'decreasing';
    }

    return {
      totalTouchpoints: activityData.length,
      lastActivity: sortedActivities[0]?.date || null,
      engagementTrend: trend,
      channelBreakdown
    };
  }
}

export const unifiedService = new UnifiedService();
