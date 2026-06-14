// Pacing Strategy Types
export enum PacingStrategy {
  EVEN = 'even',
  ACCELERATED = 'accelerated',
  FRONT_LOADED = 'front_loaded',
  BACK_LOADED = 'back_loaded',
  AGGRESSIVE = 'aggressive',
  CONSERVATIVE = 'conservative',
  CUSTOM = 'custom'
}

// Alert Threshold Types
export enum AlertThreshold {
  DAILY_BUDGET = 'daily_budget',
  TOTAL_BUDGET = 'total_budget',
  PACE_DEVIATION = 'pace_deviation',
  SPEND_RATE = 'spend_rate'
}

// Alert Severity
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

// Pacing Status
export enum PacingStatusEnum {
  ON_TRACK = 'on_track',
  AHEAD = 'ahead',
  BEHIND = 'behind',
  EXHAUSTED = 'exhausted',
  PAUSED = 'paused'
}

// Base Interface
export interface IPacingBase {
  campaignId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Campaign Pacing Interface
export interface ICampaignPacing extends IPacingBase {
  strategy: PacingStrategy;
  totalBudget: number;
  dailyBudget: number;
  hourlyBudget?: number;
  startDate: Date;
  endDate: Date;
  targetImpressions?: number;
  targetClicks?: number;
  targetConversions?: number;
  isActive: boolean;
  customSchedule?: Record<string, number>;
}

// Pacing Status Interface
export interface IPacingStatus extends IPacingBase {
  date: Date;
  spent: number;
  remaining: number;
  pacePercentage: number;
  projectedSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  hourlyData: IHourlyData[];
}

export interface IHourlyData {
  hour: number;
  spent: number;
  impressions: number;
  clicks: number;
}

// Pacing Alert Interface
export interface IPacingAlert extends IPacingBase {
  alertType: AlertThreshold;
  threshold: number;
  currentValue: number;
  severity: AlertSeverity;
  message: string;
  isTriggered: boolean;
  lastTriggered?: Date;
  notificationChannels: string[];
  isEnabled: boolean;
}

// Pacing Forecast Interface
export interface IPacingForecast extends IPacingBase {
  date: Date;
  projectedSpend: number;
  projectedImpressions: number;
  projectedClicks: number;
  projectedConversions: number;
  confidence: number;
  factors: IForecastFactor[];
}

export interface IForecastFactor {
  factor: string;
  impact: number;
  description: string;
}

// Dashboard Summary
export interface IPacingDashboard {
  totalCampaigns: number;
  activeCampaigns: number;
  onTrack: number;
  ahead: number;
  behind: number;
  exhausted: number;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  averagePacePercentage: number;
}

// Optimization Request
export interface IOptimizationRequest {
  targetPace: number;
  adjustmentType: 'budget' | 'bid' | 'schedule';
  reason: string;
}

// Optimization Result
export interface IOptimizationResult {
  success: boolean;
  adjustedBudget?: number;
  adjustedDailyBudget?: number;
  newPacePercentage?: number;
  estimatedCompletionDate?: Date;
  warnings?: string[];
}

// API Response Types
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Redis Keys
export const REDIS_KEYS = {
  PACING_STATUS: (campaignId: string) => `pace:status:${campaignId}`,
  PACING_FORECAST: (campaignId: string) => `pace:forecast:${campaignId}`,
  ALERT_THRESHOLD: (campaignId: string) => `pace:alert:${campaignId}`,
  CAMPAIGN_PACING: (campaignId: string) => `pace:campaign:${campaignId}`,
  DASHBOARD_CACHE: 'pace:dashboard:cache'
};

// Metrics Labels
export const METRICS_LABELS = {
  SERVICE_NAME: 'pace_management_service',
  CAMPAIGN_STATUS: 'campaign_status',
  PACING_STRATEGY: 'pacing_strategy',
  ALERT_TYPE: 'alert_type',
  SEVERITY: 'severity'
};