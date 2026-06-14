export interface MetricData {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface FunnelStage {
  name: string;
  value: number;
  fill: string;
}

export interface CampaignData {
  name: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  target: number;
}

export interface TimeSeriesData {
  time: string;
  value: number;
}

export interface RealtimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
}
