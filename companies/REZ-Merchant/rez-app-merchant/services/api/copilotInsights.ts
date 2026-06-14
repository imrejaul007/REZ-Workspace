/**
 * Copilot Insights API Service
 *
 * Connects to the REZ Intent Graph to provide AI-powered insights for merchants.
 * Each agent provides specific intelligence data for the Copilot Dashboard.
 */

import { apiClient } from './client';

// ─── Shared Types ──────────────────────────────────────────────────────────────

export interface AgentStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastRun: string | null;
  lastSuccess: string | null;
  consecutiveFailures: number;
  avgDurationMs: number;
}

export interface AgentInsight {
  id: string;
  agent: string;
  title: string;
  description: string;
  type: 'opportunity' | 'alert' | 'recommendation' | 'metric';
  priority: 'high' | 'medium' | 'low';
  value?: number;
  unit?: string;
  trend?: 'rising' | 'stable' | 'declining';
  action?: string;
  actionRoute?: string;
  timestamp: string;
}

// ─── Demand Signal Agent Types ────────────────────────────────────────────────

export interface DemandSignalData {
  merchantId: string;
  category: string;
  demandCount: number;
  unmetDemandPct: number;
  avgPriceExpectation: number;
  topCities: string[];
  trend: 'rising' | 'stable' | 'declining';
  spikeDetected: boolean;
  spikeFactor?: number;
  timestamp: string;
}

// ─── Scarcity Agent Types ─────────────────────────────────────────────────────

export interface ScarcitySignalData {
  merchantId: string;
  category: string;
  supplyCount: number;
  demandCount: number;
  scarcityScore: number; // 0-100
  urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  timestamp: string;
}

// ─── Personalization Agent Types ──────────────────────────────────────────────

export interface PersonalizationData {
  userId: string;
  openRates: Record<string, number>;
  clickRates: Record<string, number>;
  convertRates: Record<string, number>;
  optimalSendTimes: string[];
  preferredChannels: string[];
  tonePreferences: 'formal' | 'casual' | 'friendly' | 'urgent';
  avgSessionValue: number;
  lastUpdated: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  size: number;
  conversionRate: number;
  avgOrderValue: number;
  topChannels: string[];
}

// ─── Attribution Agent Types ──────────────────────────────────────────────────

export interface AttributionData {
  nudgeGMV: number;
  organicGMV: number;
  totalGMV: number;
  incrementality: number;
  lift: number;
  roiByChannel: Record<string, number>;
  organic: number;
  influenced: number;
  ratio: number;
}

export interface Touchpoint {
  type: 'impression' | 'click' | 'convert' | 'organic';
  channel: string;
  timestamp: string;
  nudgeId?: string;
}

// ─── Churn Signal (Adaptive Scoring) Types ───────────────────────────────────

export interface ChurnSignalData {
  userId: string;
  intentId: string;
  intentKey: string;
  predictedConversionProb: number;
  confidence: number;
  factors: {
    userHistory: number;
    timeOfDay: number;
    category: number;
    price: number;
    velocity: number;
  };
  modelVersion: string;
  churnRisk: 'high' | 'medium' | 'low';
  recommendedAction?: string;
  timestamp: string;
}

// ─── Margin Alert Types ───────────────────────────────────────────────────────

export interface MarginAlertData {
  id: string;
  type: 'margin_drop' | 'cost_increase' | 'price_pressure' | 'opportunity';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentMargin: number;
  targetMargin?: number;
  change?: number;
  affectedProducts?: string[];
  recommendations: string[];
  timestamp: string;
}

// ─── Inventory Forecast Types ──────────────────────────────────────────────────

export interface InventoryForecastData {
  merchantId: string;
  category: string;
  currentStock: number;
  dailyBurnRate: number;
  daysUntilStockout: number;
  predictedDemand: number;
  forecastConfidence: number;
  restockRecommendation: {
    quantity: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    estimatedRestockDate: string;
  };
  seasonalFactors: Record<string, number>;
  timestamp: string;
}

// ─── Revenue Optimizer Types ──────────────────────────────────────────────────

export interface RevenueOptimizerData {
  period: {
    start: string;
    end: string;
  };
  nudgeInfluencedGMV: number;
  organicGMV: number;
  totalGMV: number;
  nudgeLiftPct: number;
  roiByChannel: Record<string, number>;
  roiByMerchant: Record<string, number>;
  conversionLift: number;
  topPerformingNudges: Array<{
    nudgeId: string;
    revenue: number;
    roi: number;
  }>;
  underperformingNudges: Array<{
    nudgeId: string;
    reason: string;
  }>;
  optimizationRecommendations: Array<{
    type: string;
    currentValue: string;
    recommendedValue: string;
    expectedImpact: number;
    confidence: number;
  }>;
  timestamp: string;
}

// ─── Copilot Dashboard Types ─────────────────────────────────────────────────

export interface CopilotDashboardData {
  merchantId: string;
  storeId?: string;
  timestamp: string;
  agents: AgentStatus[];
  summary: {
    totalInsights: number;
    highPriority: number;
    opportunities: number;
    alerts: number;
  };
  insights: AgentInsight[];
  demandSignals: DemandSignalData[];
  scarcitySignals: ScarcitySignalData[];
  personalization: PersonalizationData[];
  audienceSegments: AudienceSegment[];
  attribution: AttributionData;
  churnSignals: ChurnSignalData[];
  marginAlerts: MarginAlertData[];
  inventoryForecasts: InventoryForecastData[];
  revenueOptimizer: RevenueOptimizerData;
}

// ─── API Service ─────────────────────────────────────────────────────────────

class CopilotInsightsService {
  private readonly basePath = 'merchant/copilot';

  /**
   * Get full copilot dashboard data
   */
  async getDashboard(storeId?: string): Promise<CopilotDashboardData> {
    try {
      const url = storeId
        ? `${this.basePath}/dashboard?storeId=${storeId}`
        : `${this.basePath}/dashboard`;
      const response = await apiClient.get<CopilotDashboardData>(url);
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to fetch copilot dashboard');
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Dashboard error:', err);
      throw new Error(err.message || 'Failed to fetch copilot dashboard');
    }
  }

  /**
   * Get agent statuses
   */
  async getAgentStatuses(): Promise<AgentStatus[]> {
    try {
      const response = await apiClient.get<AgentStatus[]>(`${this.basePath}/agents`);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Agent statuses error:', err);
      return [];
    }
  }

  /**
   * Get demand signals for a merchant
   */
  async getDemandSignals(merchantId: string, category?: string): Promise<DemandSignalData[]> {
    try {
      const url = category
        ? `${this.basePath}/demand/${merchantId}?category=${category}`
        : `${this.basePath}/demand/${merchantId}`;
      const response = await apiClient.get<DemandSignalData[]>(url);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Demand signals error:', err);
      return [];
    }
  }

  /**
   * Get scarcity signals
   */
  async getScarcitySignals(merchantId: string, category?: string): Promise<ScarcitySignalData[]> {
    try {
      const url = category
        ? `${this.basePath}/scarcity/${merchantId}?category=${category}`
        : `${this.basePath}/scarcity/${merchantId}`;
      const response = await apiClient.get<ScarcitySignalData[]>(url);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Scarcity signals error:', err);
      return [];
    }
  }

  /**
   * Get personalization data
   */
  async getPersonalizationData(merchantId: string): Promise<PersonalizationData[]> {
    try {
      const response = await apiClient.get<PersonalizationData[]>(
        `${this.basePath}/personalization/${merchantId}`
      );
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Personalization error:', err);
      return [];
    }
  }

  /**
   * Get audience segments
   */
  async getAudienceSegments(merchantId: string): Promise<AudienceSegment[]> {
    try {
      const response = await apiClient.get<AudienceSegment[]>(
        `${this.basePath}/segments/${merchantId}`
      );
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Audience segments error:', err);
      return [];
    }
  }

  /**
   * Get attribution data
   */
  async getAttributionData(merchantId: string, windowDays = 7): Promise<AttributionData> {
    try {
      const response = await apiClient.get<AttributionData>(
        `${this.basePath}/attribution/${merchantId}?window=${windowDays}`
      );
      if (response.success && response.data) return response.data;
      return {
        nudgeGMV: 0,
        organicGMV: 0,
        totalGMV: 0,
        incrementality: 0,
        lift: 0,
        roiByChannel: {},
        organic: 0,
        influenced: 0,
        ratio: 0,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Attribution error:', err);
      return {
        nudgeGMV: 0,
        organicGMV: 0,
        totalGMV: 0,
        incrementality: 0,
        lift: 0,
        roiByChannel: {},
        organic: 0,
        influenced: 0,
        ratio: 0,
      };
    }
  }

  /**
   * Get churn signals
   */
  async getChurnSignals(merchantId: string, limit = 20): Promise<ChurnSignalData[]> {
    try {
      const response = await apiClient.get<ChurnSignalData[]>(
        `${this.basePath}/churn/${merchantId}?limit=${limit}`
      );
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Churn signals error:', err);
      return [];
    }
  }

  /**
   * Get margin alerts
   */
  async getMarginAlerts(
    merchantId: string,
    severity?: 'critical' | 'high' | 'medium' | 'low'
  ): Promise<MarginAlertData[]> {
    try {
      const url = severity
        ? `${this.basePath}/margin/${merchantId}?severity=${severity}`
        : `${this.basePath}/margin/${merchantId}`;
      const response = await apiClient.get<MarginAlertData[]>(url);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Margin alerts error:', err);
      return [];
    }
  }

  /**
   * Get inventory forecasts
   */
  async getInventoryForecasts(
    merchantId: string,
    category?: string
  ): Promise<InventoryForecastData[]> {
    try {
      const url = category
        ? `${this.basePath}/inventory/${merchantId}?category=${category}`
        : `${this.basePath}/inventory/${merchantId}`;
      const response = await apiClient.get<InventoryForecastData[]>(url);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Inventory forecasts error:', err);
      return [];
    }
  }

  /**
   * Get revenue optimizer data
   */
  async getRevenueOptimizer(merchantId: string, periodDays = 7): Promise<RevenueOptimizerData> {
    try {
      const response = await apiClient.get<RevenueOptimizerData>(
        `${this.basePath}/revenue/${merchantId}?period=${periodDays}`
      );
      if (response.success && response.data) return response.data;
      return {
        period: { start: '', end: '' },
        nudgeInfluencedGMV: 0,
        organicGMV: 0,
        totalGMV: 0,
        nudgeLiftPct: 0,
        roiByChannel: {},
        roiByMerchant: {},
        conversionLift: 0,
        topPerformingNudges: [],
        underperformingNudges: [],
        optimizationRecommendations: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Revenue optimizer error:', err);
      return {
        period: { start: '', end: '' },
        nudgeInfluencedGMV: 0,
        organicGMV: 0,
        totalGMV: 0,
        nudgeLiftPct: 0,
        roiByChannel: {},
        roiByMerchant: {},
        conversionLift: 0,
        topPerformingNudges: [],
        underperformingNudges: [],
        optimizationRecommendations: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get all insights for dashboard
   */
  async getInsights(
    merchantId: string,
    options?: {
      type?: 'opportunity' | 'alert' | 'recommendation' | 'metric';
      priority?: 'high' | 'medium' | 'low';
      limit?: number;
    }
  ): Promise<AgentInsight[]> {
    try {
      const params = new URLSearchParams();
      if (options?.type) params.append('type', options.type);
      if (options?.priority) params.append('priority', options.priority);
      if (options?.limit) params.append('limit', options.limit.toString());

      const queryString = params.toString();
      const url = queryString
        ? `${this.basePath}/insights/${merchantId}?${queryString}`
        : `${this.basePath}/insights/${merchantId}`;

      const response = await apiClient.get<AgentInsight[]>(url);
      if (response.success && response.data) return response.data;
      return [];
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Insights error:', err);
      return [];
    }
  }

  /**
   * Acknowledge/dismiss an insight
   */
  async acknowledgeInsight(insightId: string, acknowledged = true): Promise<boolean> {
    try {
      const response = await apiClient.post(`${this.basePath}/insights/${insightId}/acknowledge`, {
        acknowledged,
      });
      return response.success;
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Acknowledge error:', err);
      return false;
    }
  }

  /**
   * Trigger a manual refresh of all agents
   */
  async refreshAgents(): Promise<boolean> {
    try {
      const response = await apiClient.post(`${this.basePath}/refresh`);
      return response.success;
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (__DEV__) console.error('[CopilotInsights] Refresh error:', err);
      return false;
    }
  }
}

export const copilotInsightsService = new CopilotInsightsService();
export default copilotInsightsService;
