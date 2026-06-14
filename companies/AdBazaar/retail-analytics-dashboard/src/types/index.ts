export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface FilterParams extends DateRangeParams {
  retailerId?: string;
  campaignId?: string;
  category?: string;
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  campaigns?: string[];
  regions?: string[];
  categories?: string[];
}

export interface ExportRequest {
  type: 'sales_lift' | 'performance' | 'trends' | 'attribution' | 'full';
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  retailerId?: string;
  campaignId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeRaw?: boolean;
  includeSummary?: boolean;
}

export interface TrendPoint {
  date: Date;
  value: number;
  predicted?: boolean;
}

export interface SeasonalityPattern {
  dayOfWeek: Record<string, number>;
  hourOfDay: Record<string, number>;
  monthOfYear: Record<string, number>;
}

export interface Anomaly {
  date: Date;
  value: number;
  reason: string;
}

export interface AttributionChannel {
  channel: string;
  touchpoints: number;
  revenue: number;
  conversionRate: number;
  attributionWeight: number;
}

export interface MetricDimension {
  name: string;
  value: string;
}

export interface Widget {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'map';
  title: string;
  dataSource: string;
  config: Record<string, unknown>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
}

export interface PerformanceComparison {
  currentPeriod: {
    impressions: number;
    conversions: number;
    engagement: number;
  };
  previousPeriod: {
    impressions: number;
    conversions: number;
    engagement: number;
  };
  changes: {
    impressions: number;
    conversions: number;
    engagement: number;
  };
}

export interface ForecastPoint {
  date: Date;
  predictedValue: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  metric: string;
  value: number;
}