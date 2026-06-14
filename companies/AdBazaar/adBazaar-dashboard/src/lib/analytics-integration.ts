/**
 * Analytics Integration
 *
 * Connects AdBazaar Dashboard to:
 *   - REZ-media-analytics (port 4069) - Campaign analytics, DOOH tracking, attribution
 *   - REZ-realtime-dashboard (port 3001) - Live metrics, WebSocket updates, alerts
 *
 * Features:
 *   - Campaign performance metrics (impressions, clicks, conversions, CTR, CPC)
 *   - Real-time dashboard updates via WebSocket
 *   - DOOH placement analytics
 *   - Revenue reports
 *   - Attribution modeling
 *   - Alert management
 */

// Service URLs
const MEDIA_ANALYTICS_URL = process.env.NEXT_PUBLIC_MEDIA_ANALYTICS_URL || 'http://localhost:4069';
const REALTIME_DASHBOARD_URL = process.env.NEXT_PUBLIC_REALTIME_DASHBOARD_URL || 'http://localhost:3001';
const TIMEOUT = 15000; // 15 seconds

// Types from REZ-realtime-dashboard
export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  budget: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  roi: number;
  lastUpdated: Date;
}

export interface Alert {
  id: string;
  type: 'budget_warning' | 'performance_drop' | 'anomaly_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  campaignId?: string;
  message: string;
  triggeredAt: Date;
  acknowledged: boolean;
}

export interface LiveMetricsSnapshot {
  timestamp: Date;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  activeCampaigns: number;
  campaigns: CampaignMetrics[];
}

// Types from REZ-media-analytics
export interface MediaAnalyticsCampaign {
  id: string;
  name: string;
  company: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  startDate: Date;
  endDate: Date;
}

export interface DOOHPlacement {
  id: string;
  location: string;
  type: 'retail' | 'restaurant' | 'elevator' | 'taxi';
  impressions: number;
  revenue: number;
}

export interface DOOHAnalytics {
  placements: DOOHPlacement[];
  summary: {
    totalPlacements: number;
    totalImpressions: number;
    totalRevenue: number;
    avgRevenuePerPlacement: string;
  };
  byType: Record<string, number>;
}

export interface RevenueReport {
  revenue: {
    ads: number;
    dooh: number;
    total: number;
  };
  byCompany: Record<string, number>;
  timestamp: string;
}

export interface CampaignAnalyticsResponse {
  campaign: MediaAnalyticsCampaign;
  metrics: {
    ctr: string;
    cvr: string;
    cpm: string;
    costPerConversion: string;
  };
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AggregatedMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalSpend: number;
  totalBudget: number;
  avgCTR: number;
  avgCPC: number;
  avgConversionRate: number;
  avgROI: number;
  budgetUtilization: number;
  campaignsCount: number;
}

export interface WebSocketStats {
  connections: number;
  rooms: number;
  roomDetails: Record<string, number>;
}

// Media Analytics Client (REZ-media-analytics)
export class MediaAnalyticsClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = MEDIA_ANALYTICS_URL, timeout: number = TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Track ad impression
   */
  async trackImpression(campaignId: string, userId: string, placement: string): Promise<ApiResponse<{ impression: object }>> {
    try {
      const response = await this.fetch('/api/track/impression', {
        method: 'POST',
        body: { campaignId, userId, placement },
      });
      return response as ApiResponse<{ impression: object }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Track ad click
   */
  async trackClick(campaignId: string, userId: string, impressionId: string): Promise<ApiResponse<{ click: object }>> {
    try {
      const response = await this.fetch('/api/track/click', {
        method: 'POST',
        body: { campaignId, userId, impressionId },
      });
      return response as ApiResponse<{ click: object }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Track conversion
   */
  async trackConversion(campaignId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetch('/api/track/conversion', {
        method: 'POST',
        body: { campaignId, userId },
      });
      return response as ApiResponse<void>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: {
    name: string;
    company?: string;
    budget: number;
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<{ campaign: MediaAnalyticsCampaign }>> {
    try {
      const response = await this.fetch('/api/campaigns', {
        method: 'POST',
        body: data,
      });
      return response as ApiResponse<{ campaign: MediaAnalyticsCampaign }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get campaign analytics with computed metrics
   */
  async getCampaignAnalytics(campaignId: string): Promise<ApiResponse<CampaignAnalyticsResponse>> {
    try {
      const response = await this.fetch(`/api/campaigns/${campaignId}/analytics`);
      return response as ApiResponse<CampaignAnalyticsResponse>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(company?: string): Promise<ApiResponse<{ campaigns: MediaAnalyticsCampaign[] }>> {
    try {
      const params = company ? `?company=${encodeURIComponent(company)}` : '';
      const response = await this.fetch(`/api/campaigns${params}`);
      return response as ApiResponse<{ campaigns: MediaAnalyticsCampaign[] }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get DOOH analytics
   */
  async getDOOHAnalytics(type?: string): Promise<ApiResponse<DOOHAnalytics>> {
    try {
      const params = type ? `?type=${encodeURIComponent(type)}` : '';
      const response = await this.fetch(`/api/dooh/analytics${params}`);
      return response as ApiResponse<DOOHAnalytics>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(): Promise<ApiResponse<RevenueReport>> {
    try {
      const response = await this.fetch('/api/reports/revenue');
      return response as ApiResponse<RevenueReport>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get attribution report
   */
  async getAttributionReport(): Promise<ApiResponse<object>> {
    try {
      const response = await this.fetch('/api/reports/attribution');
      return response as ApiResponse<object>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch('/health');
      return response.success;
    } catch {
      return false;
    }
  }

  private async fetch(endpoint: string, options?: { method?: string; body?: object }): Promise<ApiResponse<unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options?.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: (errorData as { error?: string }).error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Real-time Dashboard Client (REZ-realtime-dashboard)
export class RealtimeDashboardClient {
  private baseUrl: string;
  private timeout: number;
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(baseUrl: string = REALTIME_DASHBOARD_URL, timeout: number = TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Get live metrics snapshot
   */
  async getSnapshot(): Promise<ApiResponse<LiveMetricsSnapshot>> {
    try {
      const response = await this.fetch('/api/analytics/snapshot');
      return response as ApiResponse<LiveMetricsSnapshot>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<ApiResponse<{ alerts: Alert[]; total: number; critical: number; high: number; medium: number; low: number }>> {
    try {
      const response = await this.fetch('/api/analytics/alerts');
      return response as ApiResponse<{ alerts: Alert[]; total: number; critical: number; high: number; medium: number; low: number }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get aggregated metrics across all campaigns
   */
  async getAggregatedMetrics(): Promise<ApiResponse<AggregatedMetrics>> {
    try {
      const response = await this.fetch('/api/analytics/aggregated');
      return response as ApiResponse<AggregatedMetrics>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get WebSocket connection stats
   */
  async getWebSocketStats(): Promise<ApiResponse<WebSocketStats>> {
    try {
      const response = await this.fetch('/api/analytics/ws/stats');
      return response as ApiResponse<WebSocketStats>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Broadcast message to specific rooms
   */
  async broadcast(event: string, data: unknown, roomIds: string[]): Promise<ApiResponse<object>> {
    try {
      const response = await this.fetch('/api/analytics/broadcast', {
        method: 'POST',
        body: { event, data, roomIds },
      });
      return response as ApiResponse<object>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Trigger simulation update (for demo/testing)
   */
  async simulateUpdates(): Promise<ApiResponse<{ message: string; snapshot: LiveMetricsSnapshot }>> {
    try {
      const response = await this.fetch('/api/analytics/simulate', { method: 'POST' });
      return response as ApiResponse<{ message: string; snapshot: LiveMetricsSnapshot }>;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connectWebSocket(onMessage?: (event: string, data: unknown) => void): void {
    if (typeof window === 'undefined') return;

    const wsUrl = this.baseUrl.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws/analytics`);

    this.ws.onopen = () => {
      logger.info('[RealtimeDashboard] WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { event: eventName, data } = message;

        // Notify registered listeners
        const listeners = this.listeners.get(eventName);
        if (listeners) {
          listeners.forEach((callback) => callback(data));
        }

        // Notify general callback
        if (onMessage) {
          onMessage(eventName, data);
        }
      } catch (error) {
        logger.error('[RealtimeDashboard] Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      logger.error('[RealtimeDashboard] WebSocket error:', error);
    };

    this.ws.onclose = () => {
      logger.info('[RealtimeDashboard] WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connectWebSocket(onMessage), 5000);
    };
  }

  /**
   * Subscribe to specific events
   */
  subscribe(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetch('/health');
      return response.success;
    } catch {
      return false;
    }
  }

  private async fetch(endpoint: string, options?: { method?: string; body?: object }): Promise<ApiResponse<unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: options?.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: (errorData as { error?: string }).error || `HTTP ${response.status}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        return { success: false, error: 'Request timeout' };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

// Singleton instances
export const mediaAnalytics = new MediaAnalyticsClient();
export const realtimeDashboard = new RealtimeDashboardClient();

// Combined Analytics Service
export class AnalyticsService {
  private media: MediaAnalyticsClient;
  private realtime: RealtimeDashboardClient;

  constructor() {
    this.media = new MediaAnalyticsClient();
    this.realtime = new RealtimeDashboardClient();
  }

  /**
   * Get comprehensive analytics combining both services
   */
  async getDashboardData(): Promise<{
    liveMetrics: LiveMetricsSnapshot | null;
    aggregatedMetrics: AggregatedMetrics | null;
    alerts: Alert[];
    revenueReport: RevenueReport | null;
    errors: Record<string, string>;
  }> {
    const errors: Record<string, string> = {};

    // Fetch all data in parallel
    const [liveMetricsRes, aggregatedMetricsRes, alertsRes, revenueRes] = await Promise.all([
      this.realtime.getSnapshot(),
      this.realtime.getAggregatedMetrics(),
      this.realtime.getAlerts(),
      this.media.getRevenueReport(),
    ]);

    if (!liveMetricsRes.success) errors.liveMetrics = liveMetricsRes.error || 'Failed';
    if (!aggregatedMetricsRes.success) errors.aggregatedMetrics = aggregatedMetricsRes.error || 'Failed';
    if (!alertsRes.success) errors.alerts = alertsRes.error || 'Failed';
    if (!revenueRes.success) errors.revenueReport = revenueRes.error || 'Failed';

    return {
      liveMetrics: liveMetricsRes.success ? (liveMetricsRes.data as LiveMetricsSnapshot) : null,
      aggregatedMetrics: aggregatedMetricsRes.success ? (aggregatedMetricsRes.data as AggregatedMetrics) : null,
      alerts: alertsRes.success ? (alertsRes.data as { alerts: Alert[] }).alerts : [],
      revenueReport: revenueRes.success ? (revenueRes.data as RevenueReport) : null,
      errors,
    };
  }

  /**
   * Get campaign performance with real-time data
   */
  async getCampaignPerformance(campaignId: string): Promise<{
    liveMetrics: CampaignMetrics | null;
    analytics: CampaignAnalyticsResponse | null;
    errors: Record<string, string>;
  }> {
    const errors: Record<string, string> = {};

    const [liveSnapshot, analyticsRes] = await Promise.all([
      this.realtime.getSnapshot(),
      this.media.getCampaignAnalytics(campaignId),
    ]);

    let campaignMetrics: CampaignMetrics | null = null;
    if (liveSnapshot.success) {
      const snapshot = liveSnapshot.data as LiveMetricsSnapshot;
      campaignMetrics = snapshot.campaigns.find((c) => c.campaignId === campaignId) || null;
    } else {
      errors.liveMetrics = liveSnapshot.error || 'Failed';
    }

    if (!analyticsRes.success) {
      errors.analytics = analyticsRes.error || 'Failed';
    }

    return {
      liveMetrics: campaignMetrics,
      analytics: analyticsRes.success ? (analyticsRes.data as CampaignAnalyticsResponse) : null,
      errors,
    };
  }
}

export const analyticsService = new AnalyticsService();

// React hooks for analytics
export function useAnalytics() {
  return {
    // Media Analytics
    mediaAnalytics: {
      trackImpression: (campaignId: string, userId: string, placement: string) =>
        mediaAnalytics.trackImpression(campaignId, userId, placement),
      trackClick: (campaignId: string, userId: string, impressionId: string) =>
        mediaAnalytics.trackClick(campaignId, userId, impressionId),
      trackConversion: (campaignId: string, userId: string) =>
        mediaAnalytics.trackConversion(campaignId, userId),
      getCampaigns: (company?: string) => mediaAnalytics.getCampaigns(company),
      getCampaignAnalytics: (campaignId: string) => mediaAnalytics.getCampaignAnalytics(campaignId),
      getDOOHAnalytics: (type?: string) => mediaAnalytics.getDOOHAnalytics(type),
      getRevenueReport: () => mediaAnalytics.getRevenueReport(),
      getAttributionReport: () => mediaAnalytics.getAttributionReport(),
    },

    // Real-time Dashboard
    realtimeDashboard: {
      getSnapshot: () => realtimeDashboard.getSnapshot(),
      getAlerts: () => realtimeDashboard.getAlerts(),
      getAggregatedMetrics: () => realtimeDashboard.getAggregatedMetrics(),
      getWebSocketStats: () => realtimeDashboard.getWebSocketStats(),
      simulateUpdates: () => realtimeDashboard.simulateUpdates(),
      connectWebSocket: (onMessage?: (event: string, data: unknown) => void) =>
        realtimeDashboard.connectWebSocket(onMessage),
      subscribe: (event: string, callback: (data: unknown) => void) =>
        realtimeDashboard.subscribe(event, callback),
      disconnect: () => realtimeDashboard.disconnect(),
    },

    // Combined Service
    analyticsService: {
      getDashboardData: () => analyticsService.getDashboardData(),
      getCampaignPerformance: (campaignId: string) => analyticsService.getCampaignPerformance(campaignId),
    },

    // Health checks
    healthCheck: async () => ({
      mediaAnalytics: await mediaAnalytics.healthCheck(),
      realtimeDashboard: await realtimeDashboard.healthCheck(),
    }),
  };
}
