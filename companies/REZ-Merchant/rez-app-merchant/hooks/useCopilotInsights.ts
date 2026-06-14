/**
 * useCopilotInsights Hook
 *
 * React Query hooks for fetching copilot insights data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { copilotInsightsService } from '../services/api/copilotInsights';

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const copilotKeys = {
  all: ['copilot'] as const,
  dashboard: (storeId?: string) => [...copilotKeys.all, 'dashboard', storeId] as const,
  agents: () => [...copilotKeys.all, 'agents'] as const,
  demandSignals: (merchantId: string, category?: string) =>
    [...copilotKeys.all, 'demand', merchantId, category] as const,
  scarcitySignals: (merchantId: string, category?: string) =>
    [...copilotKeys.all, 'scarcity', merchantId, category] as const,
  personalization: (merchantId: string) =>
    [...copilotKeys.all, 'personalization', merchantId] as const,
  segments: (merchantId: string) => [...copilotKeys.all, 'segments', merchantId] as const,
  attribution: (merchantId: string, windowDays?: number) =>
    [...copilotKeys.all, 'attribution', merchantId, windowDays] as const,
  churn: (merchantId: string, limit?: number) =>
    [...copilotKeys.all, 'churn', merchantId, limit] as const,
  margin: (merchantId: string, severity?: string) =>
    [...copilotKeys.all, 'margin', merchantId, severity] as const,
  inventory: (merchantId: string, category?: string) =>
    [...copilotKeys.all, 'inventory', merchantId, category] as const,
  revenue: (merchantId: string, periodDays?: number) =>
    [...copilotKeys.all, 'revenue', merchantId, periodDays] as const,
  insights: (merchantId: string, options?: { type?: string; priority?: string; limit?: number }) =>
    [...copilotKeys.all, 'insights', merchantId, options] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetch copilot dashboard data
 */
export function useCopilotDashboard(storeId?: string) {
  return useQuery({
    queryKey: copilotKeys.dashboard(storeId),
    queryFn: () => copilotInsightsService.getDashboard(storeId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

/**
 * Fetch agent statuses
 */
export function useAgentStatuses() {
  return useQuery({
    queryKey: copilotKeys.agents(),
    queryFn: () => copilotInsightsService.getAgentStatuses(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000,
  });
}

/**
 * Fetch demand signals
 */
export function useDemandSignals(merchantId: string, category?: string) {
  return useQuery({
    queryKey: copilotKeys.demandSignals(merchantId, category),
    queryFn: () => copilotInsightsService.getDemandSignals(merchantId, category),
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch scarcity signals
 */
export function useScarcitySignals(merchantId: string, category?: string) {
  return useQuery({
    queryKey: copilotKeys.scarcitySignals(merchantId, category),
    queryFn: () => copilotInsightsService.getScarcitySignals(merchantId, category),
    enabled: !!merchantId,
    staleTime: 60 * 1000, // 1 minute - scarcity is time-sensitive
  });
}

/**
 * Fetch personalization data
 */
export function usePersonalization(merchantId: string) {
  return useQuery({
    queryKey: copilotKeys.personalization(merchantId),
    queryFn: () => copilotInsightsService.getPersonalizationData(merchantId),
    enabled: !!merchantId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch audience segments
 */
export function useAudienceSegments(merchantId: string) {
  return useQuery({
    queryKey: copilotKeys.segments(merchantId),
    queryFn: () => copilotInsightsService.getAudienceSegments(merchantId),
    enabled: !!merchantId,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch attribution data
 */
export function useAttribution(merchantId: string, windowDays = 7) {
  return useQuery({
    queryKey: copilotKeys.attribution(merchantId, windowDays),
    queryFn: () => copilotInsightsService.getAttributionData(merchantId, windowDays),
    enabled: !!merchantId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch churn signals
 */
export function useChurnSignals(merchantId: string, limit = 20) {
  return useQuery({
    queryKey: copilotKeys.churn(merchantId, limit),
    queryFn: () => copilotInsightsService.getChurnSignals(merchantId, limit),
    enabled: !!merchantId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch margin alerts
 */
export function useMarginAlerts(
  merchantId: string,
  severity?: 'critical' | 'high' | 'medium' | 'low'
) {
  return useQuery({
    queryKey: copilotKeys.margin(merchantId, severity),
    queryFn: () => copilotInsightsService.getMarginAlerts(merchantId, severity),
    enabled: !!merchantId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch inventory forecasts
 */
export function useInventoryForecasts(merchantId: string, category?: string) {
  return useQuery({
    queryKey: copilotKeys.inventory(merchantId, category),
    queryFn: () => copilotInsightsService.getInventoryForecasts(merchantId, category),
    enabled: !!merchantId,
    staleTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch revenue optimizer data
 */
export function useRevenueOptimizer(merchantId: string, periodDays = 7) {
  return useQuery({
    queryKey: copilotKeys.revenue(merchantId, periodDays),
    queryFn: () => copilotInsightsService.getRevenueOptimizer(merchantId, periodDays),
    enabled: !!merchantId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetch insights
 */
export function useInsights(
  merchantId: string,
  options?: {
    type?: 'opportunity' | 'alert' | 'recommendation' | 'metric';
    priority?: 'high' | 'medium' | 'low';
    limit?: number;
  }
) {
  return useQuery({
    queryKey: copilotKeys.insights(merchantId, options),
    queryFn: () => copilotInsightsService.getInsights(merchantId, options),
    enabled: !!merchantId,
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch all insights (no filters)
 */
export function useAllInsights(merchantId: string) {
  return useInsights(merchantId, { limit: 50 });
}

/**
 * Fetch high priority insights only
 */
export function useHighPriorityInsights(merchantId: string) {
  return useInsights(merchantId, { priority: 'high', limit: 20 });
}

// ─── Mutation Hooks ────────────────────────────────────────────────────────────

/**
 * Acknowledge an insight
 */
export function useAcknowledgeInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      insightId,
      acknowledged = true,
    }: {
      insightId: string;
      acknowledged?: boolean;
    }) => copilotInsightsService.acknowledgeInsight(insightId, acknowledged),
    onSuccess: () => {
      // Invalidate insights queries
      queryClient.invalidateQueries({ queryKey: copilotKeys.all });
    },
  });
}

/**
 * Refresh all agents
 */
export function useRefreshAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => copilotInsightsService.refreshAgents(),
    onSuccess: () => {
      // Invalidate all copilot queries
      queryClient.invalidateQueries({ queryKey: copilotKeys.all });
    },
  });
}

// ─── Derived Hooks ────────────────────────────────────────────────────────────

/**
 * Hook for aggregated insights summary
 */
export function useInsightsSummary(merchantId: string) {
  const { data: insights, ...rest } = useAllInsights(merchantId);

  const summary = {
    total: insights?.length || 0,
    opportunities: insights?.filter((i) => i.type === 'opportunity').length || 0,
    alerts: insights?.filter((i) => i.type === 'alert').length || 0,
    recommendations: insights?.filter((i) => i.type === 'recommendation').length || 0,
    highPriority: insights?.filter((i) => i.priority === 'high').length || 0,
    mediumPriority: insights?.filter((i) => i.priority === 'medium').length || 0,
    lowPriority: insights?.filter((i) => i.priority === 'low').length || 0,
  };

  return { data: summary, insights, ...rest };
}

/**
 * Hook for demand trends
 */
export function useDemandTrends(merchantId: string) {
  const { data: signals, ...rest } = useDemandSignals(merchantId);

  const trends =
    signals?.map((signal) => ({
      ...signal,
      trendLabel:
        signal.trend === 'rising'
          ? 'Trending Up'
          : signal.trend === 'declining'
            ? 'Trending Down'
            : 'Stable',
      trendColor:
        signal.trend === 'rising'
          ? '#10B981'
          : signal.trend === 'declining'
            ? '#EF4444'
            : '#6B7280',
      isSpike: signal.spikeDetected,
    })) || [];

  return { data: trends, rawData: signals, ...rest };
}

/**
 * Hook for scarcity urgency summary
 */
export function useScarcitySummary(merchantId: string) {
  const { data: signals, ...rest } = useScarcitySignals(merchantId);

  const summary = {
    critical: signals?.filter((s) => s.urgencyLevel === 'critical').length || 0,
    high: signals?.filter((s) => s.urgencyLevel === 'high').length || 0,
    medium: signals?.filter((s) => s.urgencyLevel === 'medium').length || 0,
    low: signals?.filter((s) => s.urgencyLevel === 'low').length || 0,
    avgScore: signals?.length
      ? Math.round(signals.reduce((acc, s) => acc + s.scarcityScore, 0) / signals.length)
      : 0,
  };

  return { data: summary, rawData: signals, ...rest };
}

/**
 * Hook for revenue impact summary
 */
export function useRevenueImpact(merchantId: string) {
  const { data: revenue, ...rest } = useRevenueOptimizer(merchantId);
  const { data: attribution, ...attrRest } = useAttribution(merchantId);

  const impact = {
    totalGMV: revenue?.totalGMV || 0,
    nudgeInfluence: revenue?.nudgeInfluencedGMV || 0,
    nudgeLift: revenue?.nudgeLiftPct || 0,
    conversionLift: revenue?.conversionLift || 0,
    incrementality: attribution?.incrementality || 0,
    roi: attribution?.totalGMV
      ? ((attribution.nudgeGMV / attribution.totalGMV) * 100).toFixed(1)
      : '0',
    topChannel: revenue?.roiByChannel
      ? Object.entries(revenue.roiByChannel).sort((a, b) => b[1] - a[1])[0]?.[0]
      : null,
  };

  return { data: impact, revenue, attribution, ...rest, ...attrRest };
}

/**
 * Hook for inventory alerts
 */
export function useInventoryAlerts(merchantId: string) {
  const { data: forecasts, ...rest } = useInventoryForecasts(merchantId);

  const alerts =
    forecasts
      ?.filter((f) => f.daysUntilStockout <= 7)
      .map((f) => ({
        ...f,
        urgencyColor:
          f.daysUntilStockout <= 2 ? '#EF4444' : f.daysUntilStockout <= 5 ? '#F59E0B' : '#10B981',
      })) || [];

  return { data: alerts, rawData: forecasts, ...rest };
}
