import type { ChartConfig, ChartDataPoint, ChartType, Metric } from '@/types/copilot';

/**
 * Format raw data into chart-ready format
 */
export function formatChartData(
  data: Record<string, unknown>[],
  options: {
    xAxisKey: string;
    yAxisKey: string;
    seriesKey?: string;
    chartType?: ChartType;
  }
): ChartConfig {
  const { xAxisKey, yAxisKey, seriesKey, chartType = 'bar' } = options;

  const dataPoints: ChartDataPoint[] = data.map((item) => ({
    label: String(item[xAxisKey] || ''),
    value: Number(item[yAxisKey]) || 0,
    ...item,
  }));

  return {
    type: chartType,
    data: dataPoints,
    xAxisLabel: formatLabel(xAxisKey),
    yAxisLabel: formatLabel(yAxisKey),
  };
}

/**
 * Convert metrics to chart data
 */
export function metricsToChartData(
  metrics: Metric[],
  options: {
    chartType?: ChartType;
    title?: string;
  } = {}
): ChartConfig {
  const { chartType = 'bar', title } = options;

  const data: ChartDataPoint[] = metrics.map((metric) => ({
    label: metric.name,
    value: typeof metric.value === 'number' ? metric.value : 0,
  }));

  return {
    type: chartType,
    data,
    title,
  };
}

/**
 * Create comparison chart data
 */
export function createComparisonData(
  current: Record<string, number>,
  previous: Record<string, number>,
  chartType: ChartType = 'bar'
): ChartConfig {
  const labels = Object.keys(current);

  const data: ChartDataPoint[] = labels.map((label) => ({
    label,
    value: current[label] || 0,
    previous: previous[label] || 0,
  }));

  return {
    type: chartType,
    data,
    title: 'Comparison',
    colors: ['#0ea5e9', '#a855f7'],
  };
}

/**
 * Create time series chart data
 */
export function createTimeSeriesData(
  data: { date: string; value: number }[],
  options: {
    title?: string;
    yAxisLabel?: string;
  } = {}
): ChartConfig {
  return {
    type: 'line',
    data: data.map((item) => ({
      label: item.date,
      value: item.value,
    })),
    title: options.title,
    yAxisLabel: options.yAxisLabel || 'Value',
  };
}

/**
 * Create pie/donut chart data
 */
export function createDistributionData(
  data: Record<string, number>,
  chartType: ChartType = 'donut'
): ChartConfig {
  const dataPoints: ChartDataPoint[] = Object.entries(data).map(([label, value]) => ({
    label,
    value,
  }));

  return {
    type: chartType,
    data: dataPoints,
  };
}

/**
 * Create KPI gauge data
 */
export function createKPIData(metrics: Metric[]): {
  formatted: { name: string; value: string; trend: string; change: string }[];
} {
  return {
    formatted: metrics.map((metric) => ({
      name: metric.name,
      value: formatValue(metric.value, metric.format),
      trend: metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→',
      change: metric.changePercentage !== undefined
        ? `${metric.changePercentage >= 0 ? '+' : ''}${metric.changePercentage.toFixed(1)}%`
        : '',
    })),
  };
}

/**
 * Format value based on type
 */
export function formatValue(
  value: string | number,
  format?: 'number' | 'currency' | 'percentage'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) return String(value);

  switch (format) {
    case 'currency':
      return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'percentage':
      return `${numValue.toFixed(1)}%`;
    case 'number':
    default:
      return numValue.toLocaleString();
  }
}

/**
 * Format label for axis
 */
export function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Generate chart colors based on data
 */
export function generateChartColors(count: number): string[] {
  const baseColors = [
    '#0ea5e9', // blue
    '#a855f7', // purple
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#6366f1', // indigo
    '#ec4899', // pink
    '#14b8a6', // teal
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // Generate additional colors
  const colors: string[] = [...baseColors];
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(`hsl(${hue}, 70%, 50%)`);
  }

  return colors;
}

/**
 * Aggregate data for summary charts
 */
export function aggregateData(
  data: Record<string, unknown>[],
  groupBy: string,
  valueKey: string,
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum'
): Record<string, number> {
  const groups: Record<string, number[]> = {};

  data.forEach((item) => {
    const group = String(item[groupBy] || 'Unknown');
    const value = Number(item[valueKey]) || 0;

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(value);
  });

  const result: Record<string, number> = {};

  for (const [group, values] of Object.entries(groups)) {
    switch (aggregation) {
      case 'sum':
        result[group] = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result[group] = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'count':
        result[group] = values.length;
        break;
      case 'min':
        result[group] = Math.min(...values);
        break;
      case 'max':
        result[group] = Math.max(...values);
        break;
    }
  }

  return result;
}

/**
 * Calculate trend from historical data
 */
export function calculateTrend(data: number[]): {
  direction: 'up' | 'down' | 'neutral';
  change: number;
  changePercentage: number;
} {
  if (data.length < 2) {
    return { direction: 'neutral', change: 0, changePercentage: 0 };
  }

  const first = data[0];
  const last = data[data.length - 1];
  const change = last - first;
  const changePercentage = first !== 0 ? (change / first) * 100 : 0;

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (changePercentage > 5) direction = 'up';
  else if (changePercentage < -5) direction = 'down';

  return { direction, change, changePercentage };
}

/**
 * Prepare data for recharts
 */
export function prepareRechartsData(chartConfig: ChartConfig): {
  data: Record<string, string | number>[];
  keys: string[];
  colors: string[];
} {
  const colors = chartConfig.colors || generateChartColors(chartConfig.data.length);
  const keys = chartConfig.data[0] ? Object.keys(chartConfig.data[0]).filter(k => k !== 'label') : [];

  return {
    data: chartConfig.data.map((point) => ({
      name: point.label,
      ...point,
    })),
    keys,
    colors,
  };
}

/**
 * Validate chart data
 */
export function validateChartData(data: ChartDataPoint[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('No data provided');
    return { valid: false, errors };
  }

  data.forEach((point, index) => {
    if (!point.label) {
      errors.push(`Missing label at index ${index}`);
    }
    if (typeof point.value !== 'number' || isNaN(point.value)) {
      errors.push(`Invalid value at index ${index}`);
    }
  });

  return { valid: errors.length === 0, errors };
}