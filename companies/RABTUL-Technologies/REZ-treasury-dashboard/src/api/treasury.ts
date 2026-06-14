/**
 * TreasuryOS Dashboard - API Client
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4055';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Token': import.meta.env.VITE_INTERNAL_TOKEN || '',
  },
});

// ============================================
// TYPES
// ============================================

export interface TreasuryAccount {
  accountId: string;
  businessId: string;
  businessName: string;
  accountType: 'master' | 'operating' | 'reserve' | 'escrow';
  currency: string;
  balance: number;
  reservedBalance: number;
  availableBalance: number;
  status: string;
}

export interface CashPosition {
  totalBalance: number;
  totalReserved: number;
  totalAvailable: number;
  byCurrency: Record<string, { balance: number; reserved: number; available: number }>;
  byAccountType: Record<string, { balance: number; reserved: number; available: number }>;
}

export interface Investment {
  investmentId: string;
  name: string;
  type: string;
  principal: number;
  currentValue: number;
  interestRate: number;
  maturityDate: Date;
  status: 'active' | 'matured' | 'foreclosed';
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  returnPercent: number;
  activeCount: number;
  upcomingMaturities: Array<{
    investmentId: string;
    name: string;
    amount: number;
    maturityDate: Date;
    daysRemaining: number;
  }>;
}

export interface ForecastWeek {
  weekNumber: number;
  weekStartDate: Date;
  projectedInflow: number;
  projectedOutflow: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
  confidence: number;
  shortfallRisk: 'low' | 'medium' | 'high' | 'critical';
}

export interface ShortfallPrediction {
  willShortfall: boolean;
  projectedShortfall: number;
  shortfallDate?: Date;
  projectedBalance: number;
  requiredBalance: number;
  recoveryActions: Array<{
    action: string;
    estimatedAmount?: number;
    timeline: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

export interface ShortfallAlert {
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  projectedShortfall: number;
  shortfallDate: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

export interface BankStatementResult {
  accountId: string;
  fileName: string;
  imported: number;
  duplicates: number;
  errors: string[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    netFlow: number;
    transactionCount: number;
  };
}

export interface Bank {
  code: string;
  name: string;
}

export interface MLForecastOutput {
  weeklyForecasts: Array<{
    weekNumber: number;
    projectedInflow: number;
    projectedOutflow: number;
    closingBalance: number;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  modelInfo: {
    modelType: string;
    accuracy: number;
    dataPoints: number;
  };
  insights: Array<{
    type: 'pattern' | 'anomaly' | 'recommendation';
    title: string;
    description: string;
  }>;
}

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

export interface FXExposure {
  currency: string;
  totalExposure: number;
  hedgedAmount: number;
  unhedgedAmount: number;
  hedgeRatio: number;
  var95: number;
  var99: number;
  dailyVaR: number;
}

export interface HedgePosition {
  positionId: string;
  currency: string;
  type: 'forward' | 'option';
  notionalAmount: number;
  hedgedAmount: number;
  strikeRate?: number;
  status: 'active' | 'settled';
  unrealizedPnL: number;
}

export interface HedgeRecommendation {
  currency: string;
  currentExposure: number;
  recommendedHedgeRatio: number;
  recommendedAmount: number;
  instrument: 'forward' | 'option';
  estimatedCost: number;
  riskReduction: number;
}

// ============================================
// CASH MANAGEMENT API
// ============================================

export const cashApi = {
  getPosition: (businessId: string) =>
    api.get<CashPosition>(`/api/v1/accounts/${businessId}/position`),

  getAccounts: (businessId: string) =>
    api.get<TreasuryAccount[]>(`/api/v1/accounts/${businessId}`),

  createAccount: (data: {
    businessId: string;
    businessName: string;
    accountType: string;
    currency?: string;
    bankName?: string;
  }) => api.post('/api/v1/accounts', data),

  deposit: (accountId: string, amount: number, description?: string) =>
    api.post(`/api/v1/accounts/${accountId}/deposit`, { amount, description }),

  withdraw: (accountId: string, amount: number, description?: string) =>
    api.post(`/api/v1/accounts/${accountId}/withdraw`, { amount, description }),

  transfer: (fromAccountId: string, toAccountId: string, amount: number, description?: string) =>
    api.post('/api/v1/transfers', { fromAccountId, toAccountId, amount, description }),

  getCashFlow: (businessId: string, startDate: string, endDate: string) =>
    api.get(`/api/v1/cash-flow/${businessId}`, { params: { startDate, endDate } }),

  reserveFunds: (accountId: string, amount: number) =>
    api.post(`/api/v1/accounts/${accountId}/reserve`, { amount }),

  releaseFunds: (accountId: string, amount: number) =>
    api.post(`/api/v1/accounts/${accountId}/release`, { amount }),
};

// ============================================
// INVESTMENT API
// ============================================

export const investmentApi = {
  getAll: (businessId: string, params?: { status?: string; type?: string }) =>
    api.get<Investment[]>(`/api/v1/investments/${businessId}`, { params }),

  getSummary: (businessId: string) =>
    api.get<InvestmentSummary>(`/api/v1/investments/${businessId}/summary`),

  create: (data: {
    businessId: string;
    accountId: string;
    type: string;
    name: string;
    provider: string;
    principal: number;
    interestRate: number;
    tenureDays: number;
    autoRenew?: boolean;
  }) => api.post('/api/v1/investments', data),

  redeem: (investmentId: string, targetAccountId: string, premature?: boolean) =>
    api.post(`/api/v1/investments/${investmentId}/redeem`, { targetAccountId, premature }),

  updateValue: (investmentId: string, value: number, benchmarkValue?: number) =>
    api.patch(`/api/v1/investments/${investmentId}/value`, { value, benchmarkValue }),

  getReturns: (investmentId: string, startDate?: string, endDate?: string) =>
    api.get(`/api/v1/investments/${investmentId}/returns`, { params: { startDate, endDate } }),
};

// ============================================
// FORECAST API
// ============================================

export const forecastApi = {
  generate: (businessId: string, startingBalance?: number) =>
    api.post<ForecastWeek[]>(`/api/v1/forecast/${businessId}`, { startingBalance }),

  getCurrent: (businessId: string) =>
    api.get<ForecastWeek[]>(`/api/v1/forecast/${businessId}/current`),

  getShortfall: (businessId: string, requiredBalance?: number) =>
    api.get<ShortfallPrediction>(`/api/v1/forecast/${businessId}/shortfall`, {
      params: { requiredBalance },
    }),

  updateActuals: (
    forecastId: string,
    actualInflow: number,
    actualOutflow: number,
    actualClosingBalance: number
  ) =>
    api.patch(`/api/v1/forecast/${forecastId}/actuals`, {
      actualInflow,
      actualOutflow,
      actualClosingBalance,
    }),
};

// ============================================
// ML FORECASTING API
// ============================================

export const mlForecastApi = {
  generate: (businessId: string, options?: {
    historicalDays?: number;
    forecastWeeks?: number;
    includeSeasonality?: boolean;
    includeExternalFactors?: boolean;
  }) =>
    api.post<MLForecastOutput>(`/api/v1/forecast/${businessId}/ml`, options),

  getInsights: (businessId: string, historicalDays?: number) =>
    api.get(`/api/v1/forecast/${businessId}/ml/insights`, {
      params: { historicalDays },
    }),

  detectAnomaly: (businessId: string, value: number, metric: 'inflow' | 'outflow') =>
    api.post('/api/v1/forecast/anomaly', { businessId, value, metric }),
};

// ============================================
// ALERTS API
// ============================================

export const alertsApi = {
  getActive: (businessId: string) =>
    api.get<ShortfallAlert[]>(`/api/v1/alerts/${businessId}`),

  acknowledge: (alertId: string) =>
    api.post(`/api/v1/alerts/${alertId}/acknowledge`),

  resolve: (alertId: string, resolution: string) =>
    api.post(`/api/v1/alerts/${alertId}/resolve`, { resolution }),
};

// ============================================
// BANK STATEMENT API
// ============================================

export const bankStatementApi = {
  import: (accountId: string, fileContent: string, fileName: string, bankType: string) =>
    api.post<BankStatementResult>('/api/v1/bank-statements/import', {
      accountId,
      fileContent,
      fileName,
      bankType,
    }),

  getSupportedBanks: () =>
    api.get<Bank[]>('/api/v1/bank-statements/banks'),
};

// ============================================
// FX HEDGING API
// ============================================

export const fxApi = {
  getRate: (from: string, to: string) =>
    api.get<FXRate>(`/api/v1/fx/rate/${from}/${to}`),

  getSpotRate: (from: string, to: string) =>
    api.get(`/api/v1/fx/spot/${from}/${to}`),

  createForwardHedge: (data: {
    businessId: string;
    currency: string;
    amount: number;
    hedgeRatio?: number;
    forwardRate?: number;
    startDate: string;
    endDate: string;
  }) => api.post('/api/v1/fx/hedge/forward', data),

  createOptionHedge: (data: {
    businessId: string;
    currency: string;
    amount: number;
    strikeRate: number;
    premium: number;
    optionType: 'call' | 'put';
    expiryDate: string;
  }) => api.post('/api/v1/fx/hedge/option', data),

  getExposure: (businessId: string, currency?: string) =>
    api.get<FXExposure>(`/api/v1/fx/exposure/${businessId}`, {
      params: { currency },
    }),

  getPositions: (businessId: string) =>
    api.get<HedgePosition[]>(`/api/v1/fx/positions/${businessId}`),

  getRecommendations: (businessId: string) =>
    api.get<HedgeRecommendation[]>(`/api/v1/fx/recommendations/${businessId}`),

  settlePosition: (positionId: string, settlementRate: number) =>
    api.post(`/api/v1/fx/positions/${positionId}/settle`, { settlementRate }),

  executeAutoHedge: (businessId: string) =>
    api.post(`/api/v1/fx/auto-hedge/${businessId}`),

  getSupportedCurrencies: () =>
    api.get('/api/v1/fx/currencies'),
};

// ============================================
// WEBHOOK API
// ============================================

export const webhookApi = {
  subscribe: (data: {
    businessId?: string;
    url: string;
    secret: string;
    events: string[];
  }) => api.post('/api/v1/webhooks', data),

  unsubscribe: (webhookId: string) =>
    api.delete(`/api/v1/webhooks/${webhookId}`),

  getDeliveries: (webhookId: string, params?: { limit?: number; offset?: number }) =>
    api.get(`/api/v1/webhooks/${webhookId}/deliveries`, { params }),
};

export default api;