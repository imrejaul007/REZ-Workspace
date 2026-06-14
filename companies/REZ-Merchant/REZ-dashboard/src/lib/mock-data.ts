import {
  MetricData,
  FunnelStage,
  CampaignData,
  RevenueDataPoint,
  TimeSeriesData,
  RealtimeMetric,
} from '@/types';

// Key metrics for the dashboard
export const keyMetrics: MetricData[] = [
  { label: 'Total Revenue', value: 847293, change: 12.5, trend: 'up' },
  { label: 'Active Users', value: 24389, change: 8.2, trend: 'up' },
  { label: 'Conversion Rate', value: 3.24, change: -0.8, trend: 'down' },
  { label: 'Avg Order Value', value: 127.45, change: 5.3, trend: 'up' },
];

// Funnel visualization data
export const funnelData: FunnelStage[] = [
  { name: 'Visitors', value: 100000, fill: '#0ea5e9' },
  { name: 'Product Views', value: 45000, fill: '#6366f1' },
  { name: 'Add to Cart', value: 18000, fill: '#8b5cf6' },
  { name: 'Checkout', value: 8500, fill: '#a855f7' },
  { name: 'Purchase', value: 3200, fill: '#d946ef' },
];

// Campaign performance data
export const campaignData: CampaignData[] = [
  {
    name: 'Summer Sale',
    impressions: 1250000,
    clicks: 45000,
    conversions: 2100,
    spend: 15000,
    revenue: 89200,
  },
  {
    name: 'Brand Awareness',
    impressions: 2500000,
    clicks: 32000,
    conversions: 890,
    spend: 8500,
    revenue: 42300,
  },
  {
    name: 'Retargeting',
    impressions: 380000,
    clicks: 28000,
    conversions: 3400,
    spend: 12000,
    revenue: 156000,
  },
  {
    name: 'New User Acquisition',
    impressions: 890000,
    clicks: 18000,
    conversions: 1200,
    spend: 9800,
    revenue: 54200,
  },
  {
    name: 'Holiday Special',
    impressions: 1650000,
    clicks: 62000,
    conversions: 4100,
    spend: 22000,
    revenue: 198000,
  },
];

// Revenue tracking data (last 30 days)
export const revenueData: RevenueDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseRevenue = 25000 + Math.random() * 15000;
  const weekendBoost = [0, 6].includes(date.getDay()) ? 1.3 : 1;
  return {
    date: date.toISOString().split('T')[0],
    revenue: Math.round(baseRevenue * weekendBoost),
    target: 28000,
  };
});

// Real-time time series data (hourly for last 24 hours)
export const timeSeriesData: TimeSeriesData[] = Array.from({ length: 24 }, (_, i) => {
  const hour = new Date();
  hour.setHours(hour.getHours() - (23 - i));
  const hourStr = hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return {
    time: hourStr,
    value: Math.round(500 + Math.random() * 300 + Math.sin(i / 3) * 100),
  };
});

// Real-time metrics for live updating
export const generateRealtimeMetric = (id: string): RealtimeMetric => {
  const metrics: Record<string, { name: string; unit: string; base: number }> = {
    active_users: { name: 'Active Users', unit: '', base: 24389 },
    page_views: { name: 'Page Views', unit: '/min', base: 1847 },
    orders: { name: 'Orders', unit: '/hr', base: 342 },
    revenue_live: { name: 'Revenue', unit: '/hr', base: 45678 },
    cart_abandonment: { name: 'Cart Abandonment', unit: '%', base: 68.2 },
    avg_session: { name: 'Avg Session', unit: 'min', base: 4.2 },
  };

  const config = metrics[id] || metrics.active_users;
  const variance = config.base * 0.05;

  return {
    id,
    name: config.name,
    value: Math.round(config.base + (Math.random() - 0.5) * variance * 2),
    unit: config.unit,
    timestamp: new Date(),
  };
};

// Campaign chart data by date
export const getCampaignChartData = (campaignName: string) => {
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      impressions: Math.round(50000 + Math.random() * 30000),
      clicks: Math.round(2000 + Math.random() * 1500),
      conversions: Math.round(100 + Math.random() * 80),
    };
  });
};
