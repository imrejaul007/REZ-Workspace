import logger from './utils/logger';

import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-native-toast-message';

const COPILOT_URL =
  process.env.REZ_MERCHANT_COPILOT_URL || 'https://rez-merchant-copilot.onrender.com';
const INTEGRATIONS_URL =
  process.env.REZ_MERCHANT_INTEGRATIONS_URL || 'https://rez-merchant-integrations.onrender.com';

// Retry configuration
const DEFAULT_RETRY_CONFIG = {
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
};

// ─── Loading State Types ────────────────────────────────────────────────────────

export interface LoadingState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refetch: () => Promise<void>;
}

export function createLoadingState<T>(initialData: T | null = null): LoadingState<T> {
  return {
    data: initialData,
    loading: false,
    error: null,
    refreshing: false,
    refetch: async () => {},
  };
}

// ─── Toast Notification Helpers ─────────────────────────────────────────────────

function showSuccessToast(title: string, message?: string) {
  toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    autoHide: true,
  });
}

function showErrorToast(title: string, message?: string) {
  toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 5000,
    autoHide: true,
  });
}

function showNetworkErrorToast() {
  showErrorToast('Connection Error', 'Please check your internet connection');
}

function showServiceUnavailableToast(serviceName: string) {
  showErrorToast('Service Unavailable', `${serviceName} is temporarily unavailable`);
}

// ─── Error Types ─────────────────────────────────────────────────────────────────

export class CopilotServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isServiceUnavailable: boolean = false,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'CopilotServiceError';
  }
}

// ─── Retry Logic ────────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number;
    retryDelay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
    retryCondition?: (error: CopilotServiceError) => boolean;
  } = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRY_CONFIG.retries,
    retryDelay = DEFAULT_RETRY_CONFIG.retryDelay,
    backoffMultiplier = DEFAULT_RETRY_CONFIG.backoffMultiplier,
    maxDelay = DEFAULT_RETRY_CONFIG.maxDelay,
    retryCondition = (error: CopilotServiceError) =>
      error.isNetworkError || error.isServiceUnavailable,
  } = options;

  let lastError: CopilotServiceError;
  let currentDelay = retryDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof CopilotServiceError
        ? error
        : classifyError(error);

      const shouldRetry = attempt < retries && retryCondition(lastError);

      if (!shouldRetry) {
        throw lastError;
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

function classifyError(error: unknown): CopilotServiceError {
  if (error instanceof CopilotServiceError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const isNetworkError =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED';

    const isServiceUnavailable =
      error.response?.status === 503 ||
      error.response?.status === 504;

    const message = error.response?.data?.message || error.message || 'Unknown error';

    return new CopilotServiceError(
      message,
      error.response?.status,
      isServiceUnavailable,
      isNetworkError
    );
  }

  if (error instanceof Error) {
    return new CopilotServiceError(error.message, undefined, false, true);
  }

  return new CopilotServiceError('Unknown error occurred', undefined, false, true);
}

function getErrorMessage(error: unknown): string {
  return classifyError(error).message;
}

function isServiceUnavailable(error: unknown): boolean {
  const classifiedError = classifyError(error);
  return classifiedError.isServiceUnavailable;
}

function isNetworkError(error: unknown): boolean {
  const classifiedError = classifyError(error);
  return classifiedError.isNetworkError;
}

// ─── API Clients ────────────────────────────────────────────────────────────────

const copilotApi = axios.create({
  baseURL: COPILOT_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const integrationsApi = axios.create({
  baseURL: INTEGRATIONS_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interfaces ─────────────────────────────────────────────────────────────────

export interface HealthScore {
  overall: number;
  breakdown: {
    orderHealth: number;
    revenueHealth: number;
    customerHealth: number;
    reviewHealth: number;
    inventoryHealth: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alerts: Array<{
    type: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface MerchantMetrics {
  ordersThisWeek: number;
  revenueThisWeek: number;
  totalCustomers: number;
  avgRating: number;
  lastUpdated?: string;
}

export interface Recommendation {
  id: string;
  type: 'inventory' | 'pricing' | 'marketing' | 'operations' | 'customer';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actions: Array<{
    type: string;
    title: string;
  }>;
  expectedImpact: string;
  confidence?: number;
}

export interface Competitor {
  id: string;
  name: string;
  similarity: number;
  distanceKm: number;
  avgRating: number;
  priceLevel: 'low' | 'medium' | 'high';
  strengths?: string[];
  weaknesses?: string[];
}

export interface Decision {
  decisionId: string;
  itemId: string;
  itemName: string;
  suggestedQuantity: number;
  actionLevel: 'SAFE' | 'SEMI_SAFE' | 'WARNING' | 'DANGER';
  confidence: number;
}

export interface AdPerformance {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpend: number;
  totalConversions: number;
  totalRevenue: number;
  avgROAS: number;
  topCampaign: {
    id: string;
    name: string;
    roas: number;
  } | null;
}

export interface AggregatorOrder {
  id: string;
  aggregatorId: 'swiggy' | 'zomato';
  aggregatorName: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
  }>;
  total: number;
  status: string;
  orderTime: string;
}

export interface DeliveryQuote {
  partnerId: string;
  partnerName: string;
  vehicleType: string;
  estimatedTime: number;
  price: number;
}

// ─── Mock Data for Fallback ─────────────────────────────────────────────────────

const MOCK_HEALTH_SCORE: HealthScore = {
  overall: 75,
  breakdown: {
    orderHealth: 80,
    revenueHealth: 72,
    customerHealth: 78,
    reviewHealth: 70,
    inventoryHealth: 75,
  },
  trend: 'stable',
  riskLevel: 'medium',
  alerts: [
    { type: 'warning', message: 'Review response time is above average', priority: 'low' },
  ],
};

const MOCK_METRICS: MerchantMetrics = {
  ordersThisWeek: 0,
  revenueThisWeek: 0,
  totalCustomers: 0,
  avgRating: 0,
  lastUpdated: new Date().toISOString(),
};

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'mock-1',
    type: 'inventory',
    title: 'Optimize inventory levels',
    description: 'Based on current demand patterns, consider adjusting stock levels for peak hours.',
    priority: 'medium',
    actions: [
      { type: 'adjust', title: 'Review stock thresholds' },
    ],
    expectedImpact: 'Reduce stockouts by 15%',
    confidence: 0.75,
  },
];

const MOCK_COMPETITORS = {
  competitors: [
    {
      id: 'comp-1',
      name: 'Nearby Restaurant',
      similarity: 0.85,
      distanceKm: 0.5,
      avgRating: 4.2,
      priceLevel: 'medium' as const,
    },
  ],
  priceGap: 5,
  marketShare: 12,
  insights: [
    { type: 'opportunity', message: 'Consider competitive pricing for lunch specials' },
  ],
};

// ─── Base Service Methods with Retry and Loading State ──────────────────────────

async function fetchWithRetry<T>(
  api: AxiosInstance,
  url: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    data?: unknown;
    fallbackData?: T;
    useFallbackOnError?: boolean;
    serviceName?: string;
    showToastOnError?: boolean;
  } = {}
): Promise<T> {
  const {
    method = 'GET',
    data,
    fallbackData,
    useFallbackOnError = true,
    serviceName = 'Service',
    showToastOnError = true,
  } = options;

  try {
    const response = await withRetry(async () => {
      if (method === 'GET') {
        return await api.get(url) as T;
      } else if (method === 'POST') {
        return await api.post(url, data) as T;
      } else if (method === 'PATCH') {
        return await api.patch(url, data) as T;
      } else {
        return await api.delete(url) as T;
      }
    }, {});

    return response;
  } catch (error) {
    if (isNetworkError(error)) {
      showNetworkErrorToast();
    } else if (isServiceUnavailable(error) && showToastOnError) {
      showServiceUnavailableToast(serviceName);
    } else if (showToastOnError) {
      showErrorToast('Request Failed', getErrorMessage(error));
    }

    if (useFallbackOnError && fallbackData !== undefined) {
      logger.warn(`[CopilotService] ${serviceName} failed, using fallback data`);
      return fallbackData;
    }

    throw error;
  }
}

// ─── Service Implementation ─────────────────────────────────────────────────────

export const merchantCopilotService = {
  // Health & Insights
  async getMerchantProfile(merchantId: string): Promise<{
    profile;
    metrics: MerchantMetrics;
    insights: { health_score: number; growth_score: number; engagement_score: number };
  }> {
    return fetchWithRetry(
      copilotApi,
      `/api/merchant/${merchantId}/profile`,
      {
        fallbackData: {
          profile: null,
          metrics: MOCK_METRICS,
          insights: { health_score: 75, growth_score: 50, engagement_score: 60 },
        },
        serviceName: 'Merchant Profile',
      }
    );
  },

  async getMerchantProfileWithState(
    merchantId: string,
    setState?: (state: LoadingState<{
      profile;
      metrics: MerchantMetrics;
      insights: { health_score: number; growth_score: number; engagement_score: number };
    }>) => void
  ) {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getMerchantProfileWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getMerchantProfile(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getMerchantProfileWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getMerchantProfileWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async getHealthScore(merchantId: string): Promise<HealthScore> {
    return fetchWithRetry(
      copilotApi,
      `/api/health/${merchantId}`,
      {
        fallbackData: MOCK_HEALTH_SCORE,
        serviceName: 'Health Score',
      }
    );
  },

  async getHealthScoreWithState(
    merchantId: string,
    setState?: (state: LoadingState<HealthScore>) => void
  ): Promise<HealthScore | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getHealthScoreWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getHealthScore(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getHealthScoreWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getHealthScoreWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async refreshHealthScore(
    merchantId: string,
    setState?: (state: LoadingState<HealthScore>) => void
  ): Promise<HealthScore | null> {
    if (setState) {
      setState((prev) => ({ ...prev, refreshing: true }));
    }

    try {
      const data = await this.getHealthScore(merchantId);
      showSuccessToast('Health Score Refreshed');
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.refreshHealthScore(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      showErrorToast('Refresh Failed', getErrorMessage(error));
      if (setState) {
        setState((prev) => ({ ...prev, refreshing: false }));
      }
      return null;
    }
  },

  async getMetrics(merchantId: string): Promise<MerchantMetrics> {
    return fetchWithRetry(
      copilotApi,
      `/api/metrics/${merchantId}`,
      {
        fallbackData: MOCK_METRICS,
        serviceName: 'Metrics',
      }
    );
  },

  async getMetricsWithState(
    merchantId: string,
    setState?: (state: LoadingState<MerchantMetrics>) => void
  ): Promise<MerchantMetrics | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getMetricsWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getMetrics(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getMetricsWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getMetricsWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async getRecommendations(merchantId: string): Promise<Recommendation[]> {
    return fetchWithRetry(
      copilotApi,
      `/api/recommendations/${merchantId}`,
      {
        fallbackData: MOCK_RECOMMENDATIONS,
        serviceName: 'Recommendations',
      }
    );
  },

  async getRecommendationsWithState(
    merchantId: string,
    setState?: (state: LoadingState<Recommendation[]>) => void
  ): Promise<Recommendation[] | null> {
    if (setState) {
      setState({
        data: [],
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getRecommendationsWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getRecommendations(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getRecommendationsWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: [],
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getRecommendationsWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async getCompetitors(merchantId: string): Promise<{
    competitors: Competitor[];
    priceGap: number;
    marketShare: number;
    insights: Array<{ type: string; message: string }>;
  }> {
    return fetchWithRetry(
      copilotApi,
      `/api/competitors/${merchantId}`,
      {
        fallbackData: MOCK_COMPETITORS,
        serviceName: 'Competitor Data',
      }
    );
  },

  async getCompetitorsWithState(
    merchantId: string,
    setState?: (state: LoadingState<{
      competitors: Competitor[];
      priceGap: number;
      marketShare: number;
      insights: Array<{ type: string; message: string }>;
    }>) => void
  ) {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getCompetitorsWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getCompetitors(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getCompetitorsWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getCompetitorsWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async getDecisions(merchantId: string): Promise<Decision[]> {
    return fetchWithRetry(
      copilotApi,
      `/api/decisions/${merchantId}`,
      {
        fallbackData: [],
        serviceName: 'Decisions',
        showToastOnError: false,
      }
    );
  },

  async getDecisionsWithState(
    merchantId: string,
    setState?: (state: LoadingState<Decision[]>) => void
  ): Promise<Decision[] | null> {
    if (setState) {
      setState({
        data: [],
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getDecisionsWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getDecisions(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getDecisionsWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: [],
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getDecisionsWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async submitFeedback(
    merchantId: string,
    params: {
      decisionId: string;
      outcome: 'accepted' | 'rejected' | 'modified';
      suggestedQuantity?: number;
      actualQuantity?: number;
      reason?: string;
    }
  ): Promise<void> {
    try {
      await withRetry(async () => {
        await copilotApi.post(`/api/feedback/${merchantId}`, {
          ...params,
          decision_id: params.decisionId,
          suggested_quantity: params.suggestedQuantity,
          actual_quantity: params.actualQuantity,
        });
      }, {});
      showSuccessToast('Feedback Submitted', 'Thank you for your feedback');
    } catch (error) {
      showErrorToast('Submission Failed', getErrorMessage(error));
      throw error;
    }
  },

  // Ad Performance
  async getAdPerformance(merchantId: string): Promise<AdPerformance> {
    return fetchWithRetry(
      integrationsApi,
      `/api/ads/merchant/${merchantId}/performance`,
      {
        fallbackData: {
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalSpend: 0,
          totalConversions: 0,
          totalRevenue: 0,
          avgROAS: 0,
          topCampaign: null,
        },
        serviceName: 'Ad Performance',
      }
    );
  },

  async getAdPerformanceWithState(
    merchantId: string,
    setState?: (state: LoadingState<AdPerformance>) => void
  ): Promise<AdPerformance | null> {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getAdPerformanceWithState(merchantId, setState),
      });
    }

    try {
      const data = await this.getAdPerformance(merchantId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getAdPerformanceWithState(merchantId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getAdPerformanceWithState(merchantId, setState),
        });
      }
      return null;
    }
  },

  async getCampaignROI(campaignId: string): Promise<{
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue: number;
    ctr: number;
    conversionRate: number;
    cpa: number;
    roas: number;
  }> {
    return fetchWithRetry(
      integrationsApi,
      `/api/ads/campaign/${campaignId}/roi`,
      {
        fallbackData: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          ctr: 0,
          conversionRate: 0,
          cpa: 0,
          roas: 0,
        },
        serviceName: 'Campaign ROI',
      }
    );
  },

  async getCampaignROIWithState(
    campaignId: string,
    setState?: (state: LoadingState<{
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue: number;
      ctr: number;
      conversionRate: number;
      cpa: number;
      roas: number;
    }>) => void
  ) {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getCampaignROIWithState(campaignId, setState),
      });
    }

    try {
      const data = await this.getCampaignROI(campaignId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getCampaignROIWithState(campaignId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getCampaignROIWithState(campaignId, setState),
        });
      }
      return null;
    }
  },

  // Aggregator Orders
  async getAggregatorOrders(): Promise<AggregatorOrder[]> {
    return fetchWithRetry(
      integrationsApi,
      '/api/aggregators/orders',
      {
        fallbackData: [],
        serviceName: 'Aggregator Orders',
        showToastOnError: false,
      }
    );
  },

  async getAggregatorOrdersWithState(
    setState?: (state: LoadingState<AggregatorOrder[]>) => void
  ): Promise<AggregatorOrder[] | null> {
    if (setState) {
      setState({
        data: [],
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getAggregatorOrdersWithState(setState),
      });
    }

    try {
      const data = await this.getAggregatorOrders();
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getAggregatorOrdersWithState(setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: [],
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getAggregatorOrdersWithState(setState),
        });
      }
      return null;
    }
  },

  async refreshAggregatorOrders(
    setState?: (state: LoadingState<AggregatorOrder[]>) => void
  ): Promise<AggregatorOrder[] | null> {
    if (setState) {
      setState((prev) => ({ ...prev, refreshing: true }));
    }

    try {
      const data = await this.getAggregatorOrders();
      showSuccessToast('Orders Refreshed');
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.refreshAggregatorOrders(setState),
        });
      }
      return data;
    } catch (error) {
      showErrorToast('Refresh Failed', getErrorMessage(error));
      if (setState) {
        setState((prev) => ({ ...prev, refreshing: false }));
      }
      return null;
    }
  },

  async updateAggregatorOrderStatus(
    aggregatorId: string,
    externalOrderId: string,
    status: string
  ): Promise<void> {
    try {
      await withRetry(async () => {
        await integrationsApi.post(`/api/aggregators/${aggregatorId}/status`, {
          externalOrderId,
          status,
        });
      }, {});
      showSuccessToast('Order Status Updated');
    } catch (error) {
      showErrorToast('Update Failed', getErrorMessage(error));
      throw error;
    }
  },

  // Delivery
  async getDeliveryQuotes(order: {
    pickupAddress: { lat: number; lng: number; address: string };
    deliveryAddress: { lat: number; lng: number; address: string };
  }): Promise<DeliveryQuote[]> {
    return fetchWithRetry(
      integrationsApi,
      '/api/delivery/quotes',
      {
        method: 'POST',
        data: order,
        fallbackData: [],
        serviceName: 'Delivery Quotes',
      }
    );
  },

  async getDeliveryQuotesWithState(
    order: {
      pickupAddress: { lat: number; lng: number; address: string };
      deliveryAddress: { lat: number; lng: number; address: string };
    },
    setState?: (state: LoadingState<DeliveryQuote[]>) => void
  ): Promise<DeliveryQuote[] | null> {
    if (setState) {
      setState({
        data: [],
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.getDeliveryQuotesWithState(order, setState),
      });
    }

    try {
      const data = await this.getDeliveryQuotes(order);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.getDeliveryQuotesWithState(order, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: [],
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.getDeliveryQuotesWithState(order, setState),
        });
      }
      return null;
    }
  },

  async bookDelivery(params: {
    order;
    partnerId: 'dunzo' | 'shadowfax';
    quoteId: string;
  }): Promise<{ bookingId: string; status: string }> {
    try {
      const result = await withRetry(async () => {
        const response = await integrationsApi.post('/api/delivery/book', params);
        return response.data as { bookingId: string; status: string };
      }, {});
      showSuccessToast('Delivery Booked', 'Your delivery has been scheduled');
      return result;
    } catch (error) {
      if (isServiceUnavailable(error)) {
        showServiceUnavailableToast('Delivery Service');
      } else {
        showErrorToast('Booking Failed', getErrorMessage(error));
      }
      throw error;
    }
  },

  async trackDelivery(bookingId: string): Promise<{
    status: string;
    driverLocation?: { lat: number; lng: number };
    estimatedArrival?: string;
  }> {
    return fetchWithRetry(
      integrationsApi,
      `/api/delivery/${bookingId}/track`,
      {
        fallbackData: { status: 'unknown' },
        serviceName: 'Delivery Tracking',
      }
    );
  },

  async trackDeliveryWithState(
    bookingId: string,
    setState?: (state: LoadingState<{
      status: string;
      driverLocation?: { lat: number; lng: number };
      estimatedArrival?: string;
    }>) => void
  ) {
    if (setState) {
      setState({
        data: null,
        loading: true,
        error: null,
        refreshing: false,
        refetch: () => this.trackDeliveryWithState(bookingId, setState),
      });
    }

    try {
      const data = await this.trackDelivery(bookingId);
      if (setState) {
        setState({
          data,
          loading: false,
          error: null,
          refreshing: false,
          refetch: () => this.trackDeliveryWithState(bookingId, setState),
        });
      }
      return data;
    } catch (error) {
      if (setState) {
        setState({
          data: null,
          loading: false,
          error: getErrorMessage(error),
          refreshing: false,
          refetch: () => this.trackDeliveryWithState(bookingId, setState),
        });
      }
      return null;
    }
  },
};

// Export individual service methods for direct API access without fallback
export const copilotApiService = {
  getHealthScore: (merchantId: string) => copilotApi.get(`/api/health/${merchantId}`),
  getMetrics: (merchantId: string) => copilotApi.get(`/api/metrics/${merchantId}`),
  getRecommendations: (merchantId: string) => copilotApi.get(`/api/recommendations/${merchantId}`),
  getCompetitors: (merchantId: string) => copilotApi.get(`/api/competitors/${merchantId}`),
  getDecisions: (merchantId: string) => copilotApi.get(`/api/decisions/${merchantId}`),
  submitFeedback: (merchantId: string, params) => copilotApi.post(`/api/feedback/${merchantId}`, params),
};

export default merchantCopilotService;
