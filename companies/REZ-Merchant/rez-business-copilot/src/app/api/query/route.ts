import { NextRequest, NextResponse } from 'next/server';
import { parseQuery, buildApiQuery, validateParsedQuery } from '@/lib/queryParser';
import { generateResponse } from '@/lib/answerGenerator';
import type { QueryRequest, QueryResponse, Metric, ChartConfig, Insight } from '@/types/copilot';

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest = await request.json();

    if (!body.query || typeof body.query !== 'string') {
      return NextResponse.json<QueryResponse>(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }

    // Parse the natural language query
    const parsedQuery = parseQuery(body.query);

    // Validate parsed query
    const validation = validateParsedQuery(parsedQuery);
    if (!validation.valid) {
      return NextResponse.json<QueryResponse>(
        { success: false, error: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Build API query for backend services
    const apiQuery = buildApiQuery(parsedQuery);

    // Mock data for demonstration - in production, this would call actual services
    const mockData = await fetchMockData(parsedQuery);

    // Generate response
    const response = generateResponse(parsedQuery, mockData);

    return NextResponse.json<QueryResponse>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Query processing error:', error);
    return NextResponse.json<QueryResponse>(
      { success: false, error: 'Failed to process query' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Query API is running',
    endpoints: {
      POST: 'Process natural language query',
    },
  });
}

/**
 * Fetch mock data based on the parsed query
 * In production, this would call actual backend services
 */
async function fetchMockData(parsedQuery: {
  intent: string;
  metric: string;
  timeframe: { start: Date; end: Date };
  filters: Record<string, unknown>;
}): Promise<{
  metrics?: Metric[];
  charts?: ChartConfig[];
  insights?: Insight[];
}> {
  const { intent, metric, filters } = parsedQuery;

  // Generate mock metrics based on query type
  const metrics: Metric[] = generateMockMetrics(metric, intent);
  const charts: ChartConfig[] = generateMockCharts(metric);
  const insights: Insight[] = generateMockInsights(intent, metric);

  return { metrics, charts, insights };
}

/**
 * Generate mock metrics
 */
function generateMockMetrics(metric: string, intent: string): Metric[] {
  const baseMetrics: Record<string, Metric[]> = {
    revenue: [
      {
        id: '1',
        name: 'Total Revenue',
        value: 125750,
        previousValue: 142500,
        change: -16850,
        changePercentage: -11.8,
        unit: '$',
        trend: 'down',
        format: 'currency',
      },
      {
        id: '2',
        name: 'Average Order Value',
        value: 85.50,
        previousValue: 82.30,
        change: 3.20,
        changePercentage: 3.9,
        unit: '$',
        trend: 'up',
        format: 'currency',
      },
    ],
    customer_count: [
      {
        id: '3',
        name: 'Total Customers',
        value: 1470,
        previousValue: 1520,
        change: -50,
        changePercentage: -3.3,
        trend: 'down',
        format: 'number',
      },
      {
        id: '4',
        name: 'New Customers',
        value: 180,
        previousValue: 210,
        change: -30,
        changePercentage: -14.3,
        trend: 'down',
        format: 'number',
      },
    ],
    churn_count: [
      {
        id: '5',
        name: 'Customers Lost',
        value: 45,
        previousValue: 32,
        change: 13,
        changePercentage: 40.6,
        trend: 'down',
        format: 'number',
      },
    ],
    general: [
      {
        id: '6',
        name: 'Total Orders',
        value: 1470,
        previousValue: 1730,
        change: -260,
        changePercentage: -15,
        trend: 'down',
        format: 'number',
      },
      {
        id: '7',
        name: 'Conversion Rate',
        value: 3.2,
        previousValue: 3.8,
        change: -0.6,
        changePercentage: -15.8,
        trend: 'down',
        format: 'percentage',
      },
    ],
  };

  return baseMetrics[metric] || baseMetrics.general;
}

/**
 * Generate mock charts
 */
function generateMockCharts(metric: string): ChartConfig[] {
  const chartConfigs: ChartConfig[] = [];

  // Revenue trend chart
  if (metric === 'revenue' || metric === 'general') {
    chartConfigs.push({
      type: 'line',
      data: [
        { label: 'Mon', value: 18500 },
        { label: 'Tue', value: 17200 },
        { label: 'Wed', value: 16800 },
        { label: 'Thu', value: 15900 },
        { label: 'Fri', value: 19100 },
        { label: 'Sat', value: 22100 },
        { label: 'Sun', value: 20150 },
      ],
      title: 'Revenue Trend (Last 7 Days)',
      xAxisLabel: 'Day',
      yAxisLabel: 'Revenue ($)',
      colors: ['#0ea5e9'],
    });
  }

  // Comparison chart
  chartConfigs.push({
    type: 'bar',
    data: [
      { label: 'This Week', value: 125750, previous: 142500 },
      { label: 'Last Week', value: 142500, previous: 138000 },
    ],
    title: 'Week-over-Week Comparison',
    xAxisLabel: 'Period',
    yAxisLabel: 'Revenue ($)',
    colors: ['#0ea5e9', '#a855f7'],
  });

  // Category breakdown
  chartConfigs.push({
    type: 'donut',
    data: [
      { label: 'Food & Beverage', value: 55000 },
      { label: 'Retail', value: 35000 },
      { label: 'Services', value: 25000 },
      { label: 'Other', value: 10750 },
    ],
    title: 'Revenue by Category',
    colors: ['#0ea5e9', '#a855f7', '#10b981', '#f59e0b'],
  });

  return chartConfigs;
}

/**
 * Generate mock insights
 */
function generateMockInsights(intent: string, metric: string): Insight[] {
  const insights: Insight[] = [
    {
      id: 'insight-1',
      title: 'Weekend Sales Dip',
      description: 'Sales typically drop 15% on Sundays compared to Saturdays. Consider running a Sunday special promotion.',
      type: 'warning',
      impact: 'medium',
      category: 'sales',
    },
    {
      id: 'insight-2',
      title: 'Loyal Customer Opportunity',
      description: 'Your top 20% of customers generate 60% of revenue. A loyalty program could increase retention by 25%.',
      type: 'opportunity',
      impact: 'high',
      category: 'retention',
    },
    {
      id: 'insight-3',
      title: 'Peak Hours Optimization',
      description: '30% of revenue comes from 11 AM - 1 PM. Consider adding staff during this window.',
      type: 'info',
      impact: 'medium',
      category: 'operations',
    },
  ];

  if (intent === 'recommendation') {
    insights.unshift({
      id: 'insight-rec-1',
      title: 'Recommended Action',
      description: 'Based on your sales patterns, launching a limited-time summer offer could boost revenue by 12-18%.',
      type: 'opportunity',
      impact: 'high',
      category: 'promotion',
    });
  }

  return insights;
}