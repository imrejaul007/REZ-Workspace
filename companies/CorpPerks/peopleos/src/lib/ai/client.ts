// CorpPerks Intelligence API Client
// Connects PeopleOS to the Intelligence Layer

const INTELLIGENCE_API_URL = process.env.NEXT_PUBLIC_INTELLIGENCE_API_URL || 'http://localhost:4135/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Decision Cards
interface DecisionCard {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  data: Record<string, any>;
  actions: DecisionAction[];
  createdAt: string;
  expiresAt?: string;
}

interface DecisionAction {
  label: string;
  action: 'navigate' | 'api_call' | 'dismiss' | 'snooze';
  params?: Record<string, any>;
  apiEndpoint?: string;
}

// Health Score
interface WorkforceHealthScore {
  overall: number;
  components: {
    engagement: number;
    attendance: number;
    productivity: number;
    sentiment: number;
  };
  trends: {
    weekly: number;
    monthly: number;
  };
  riskIndicators: RiskIndicator[];
  healthiestDept: string;
  atRiskDept: string;
  generatedAt: string;
}

interface RiskIndicator {
  indicator: string;
  severity: 'low' | 'medium' | 'high';
  department?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Anomaly
interface Anomaly {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  metric: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  department?: string;
  acknowledged: boolean;
}

// Copilot
interface CopilotQuery {
  query: string;
  context?: string;
  department?: string;
}

interface CopilotResponse {
  answer: string;
  data?: Record<string, any>;
  sources: string[];
  confidence: number;
  suggestions: string[];
  visualizations?: Visualization[];
  actionItems?: ActionItem[];
}

interface Visualization {
  type: 'chart' | 'metric' | 'table' | 'list';
  title: string;
  data: Record<string, any>;
}

interface ActionItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

// Forecast
interface WorkforceForecast {
  attritionForecast: Forecast;
  headcountForecast: Forecast;
  payrollForecast: PayrollForecast;
  hiringBudget: HiringBudgetForecast;
  productivityTrend: ProductivityForecast;
  generatedAt: string;
}

interface Forecast {
  id: string;
  type: string;
  metric: string;
  predictions: ForecastPrediction[];
  confidence: number;
}

interface ForecastPrediction {
  date: string;
  value: number;
  lowerBound: number;
  upperBound: number;
}

interface PayrollForecast {
  next30Days: number;
  next60Days: number;
  next90Days: number;
  confidence: number;
}

interface HiringBudgetForecast {
  planned: number;
  recommended: number;
  justification: string;
}

interface ProductivityForecast {
  currentIndex: number;
  projected30Days: number;
  projected90Days: number;
}

class IntelligenceClient {
  private tenantId: string = 'default';

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Tenant-ID': this.tenantId,
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${INTELLIGENCE_API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error(`Intelligence API Error:`, error);
      throw error;
    }
  }

  // Decision Cards
  async getDecisionCards(): Promise<ApiResponse<{ cards: DecisionCard[]; summary: any }>> {
    return this.request<{ cards: DecisionCard[]; summary: any }>('/insights/cards');
  }

  async dismissCard(cardId: string): Promise<ApiResponse<void>> {
    return this.request(`/insights/cards/${cardId}`, { method: 'DELETE' });
  }

  async snoozeCard(cardId: string, hours: number = 24): Promise<ApiResponse<DecisionCard>> {
    return this.request(`/insights/cards/${cardId}/snooze`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    });
  }

  // Health Score
  async getHealthScore(): Promise<ApiResponse<WorkforceHealthScore>> {
    return this.request<WorkforceHealthScore>('/insights/health');
  }

  async getDepartmentComparison(): Promise<ApiResponse<{ departments: any[]; comparison: any }>> {
    return this.request('/insights/health/departments');
  }

  async getHealthHistory(days: number = 30): Promise<ApiResponse<{ date: string; score: number }[]>> {
    return this.request(`/insights/health/history?days=${days}`);
  }

  // Anomalies
  async getAnomalies(): Promise<ApiResponse<{ anomalies: Anomaly[]; statistics: any }>> {
    return this.request('/insights/anomalies');
  }

  async getActiveAnomalies(): Promise<ApiResponse<Anomaly[]>> {
    return this.request('/insights/anomalies/active');
  }

  async acknowledgeAnomaly(anomalyId: string): Promise<ApiResponse<void>> {
    return this.request(`/insights/anomalies/${anomalyId}/acknowledge`, { method: 'PUT' });
  }

  // Copilot
  async queryCopilot(data: CopilotQuery): Promise<ApiResponse<CopilotResponse>> {
    return this.request<CopilotResponse>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCopilotSuggestions(): Promise<ApiResponse<Record<string, string[]>>> {
    return this.request('/copilot/suggestions');
  }

  // Forecasts
  async getWorkforceForecast(): Promise<ApiResponse<WorkforceForecast>> {
    return this.request<WorkforceForecast>('/forecasts');
  }

  async getAttritionForecast(): Promise<ApiResponse<any>> {
    return this.request('/forecasts/attrition');
  }

  async getHiringForecast(): Promise<ApiResponse<any>> {
    return this.request('/forecasts/hiring');
  }

  async getCostProjection(months: number = 3): Promise<ApiResponse<any>> {
    return this.request(`/forecasts/cost?months=${months}`);
  }
}

export const intelligence = new IntelligenceClient();
export default intelligence;

// Types for convenience
export type {
  DecisionCard,
  DecisionAction,
  WorkforceHealthScore,
  RiskIndicator,
  Anomaly,
  CopilotQuery,
  CopilotResponse,
  WorkforceForecast,
  Visualization,
  ActionItem,
};
