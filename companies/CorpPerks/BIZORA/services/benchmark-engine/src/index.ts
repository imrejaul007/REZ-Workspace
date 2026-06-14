/**
 * BIZORA Industry Benchmark Engine
 * "Operational Intelligence Moat"
 * Regional benchmarks, industry comparisons, efficiency rankings
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface Benchmark {
  industry: string;
  metric: string;
  values: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    average: number;
  };
  region?: string;
  updatedAt: string;
}

interface BusinessMetrics {
  businessId: string;
  industry: string;
  city: string;
  metrics: Record<string, number>;
  percentile?: number;
}

interface Comparison {
  metric: string;
  yourValue: number;
  industryAvg: number;
  cityAvg: number;
  percentile: number;
  status: 'above' | 'below' | 'at_par';
  gap: number;
  recommendation: string;
}

// ============================================================================
// Benchmark Data
// ============================================================================

const benchmarks: Map<string, Benchmark> = new Map([
  ['restaurant_revenue_per_sqft', {
    industry: 'restaurant',
    metric: 'revenue_per_sqft_monthly',
    values: { p10: 250, p25: 400, p50: 650, p75: 900, p90: 1200, average: 620 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['restaurant_table_turnover', {
    industry: 'restaurant',
    metric: 'table_turnover',
    values: { p10: 1.5, p25: 2.0, p50: 2.8, p75: 3.5, p90: 4.2, average: 2.6 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['restaurant_food_cost', {
    industry: 'restaurant',
    metric: 'food_cost_percentage',
    values: { p10: 22, p25: 26, p50: 30, p75: 34, p90: 38, average: 30 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['restaurant_labor_cost', {
    industry: 'restaurant',
    metric: 'labor_cost_percentage',
    values: { p10: 20, p25: 25, p50: 30, p75: 35, p90: 40, average: 28 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['restaurant_delivery_ratio', {
    industry: 'restaurant',
    metric: 'delivery_orders_percentage',
    values: { p10: 15, p25: 25, p50: 40, p75: 55, p90: 70, average: 38 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['salon_revenue_per_stylist', {
    industry: 'salon',
    metric: 'revenue_per_stylist_monthly',
    values: { p10: 45000, p25: 65000, p50: 90000, p75: 120000, p90: 150000, average: 85000 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['salon_retention_rate', {
    industry: 'salon',
    metric: 'customer_retention_percentage',
    values: { p10: 30, p25: 45, p50: 60, p75: 75, p90: 85, average: 55 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['hotel_occupancy_rate', {
    industry: 'hotel',
    metric: 'occupancy_percentage',
    values: { p10: 40, p25: 55, p50: 70, p75: 82, p90: 92, average: 68 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['hotel_adr', {
    industry: 'hotel',
    metric: 'average_daily_rate',
    values: { p10: 2500, p25: 4000, p50: 6000, p75: 8500, p90: 12000, average: 5800 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['hotel_revpar', {
    industry: 'hotel',
    metric: 'revpar',
    values: { p10: 1500, p25: 2500, p50: 4000, p75: 6000, p90: 9000, average: 3800 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['ad_spend_roi', {
    industry: 'all',
    metric: 'marketing_roi_percentage',
    values: { p10: 50, p25: 100, p50: 180, p75: 280, p90: 400, average: 160 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['payment_collection_days', {
    industry: 'all',
    metric: 'days_to_collect',
    values: { p10: 7, p25: 15, p50: 30, p75: 45, p90: 60, average: 28 },
    region: 'India',
    updatedAt: '2026-05',
  }],
  ['compliance_score', {
    industry: 'all',
    metric: 'compliance_percentage',
    values: { p10: 50, p25: 70, p50: 85, p75: 95, p90: 100, average: 82 },
    region: 'India',
    updatedAt: '2026-05',
  }],
]);

// Regional adjustments
const regionalFactors: Record<string, Record<string, number>> = {
  'Mumbai': { multiplier: 1.3, adjustment: 1.2 },
  'Delhi': { multiplier: 1.25, adjustment: 1.15 },
  'Bangalore': { multiplier: 1.35, adjustment: 1.25 },
  'Hyderabad': { multiplier: 1.1, adjustment: 1.05 },
  'Chennai': { multiplier: 1.15, adjustment: 1.1 },
  'Pune': { multiplier: 1.1, adjustment: 1.05 },
};

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'benchmark-engine',
    benchmarks: benchmarks.size,
  });
});

// Get industry benchmarks
app.get('/api/benchmarks/:industry', (req: Request, res: Response) => {
  const industry = req.params.industry;

  const industryBenchmarks = Array.from(benchmarks.values())
    .filter(b => b.industry === industry || b.industry === 'all');

  res.json({
    industry,
    benchmarks: industryBenchmarks,
    summary: {
      totalMetrics: industryBenchmarks.length,
      updatedAt: industryBenchmarks[0]?.updatedAt || '2026-05',
    },
  });
});

// Get single benchmark
app.get('/api/benchmarks/:industry/:metric', (req: Request, res: Response) => {
  const key = `${req.params.industry}_${req.params.metric}`;
  const benchmark = benchmarks.get(key);

  if (!benchmark) {
    // Try generic
    const genericKey = `all_${req.params.metric}`;
    const generic = benchmarks.get(genericKey);
    if (!generic) {
      return res.status(404).json({ error: 'Benchmark not found' });
    }
    return res.json(generic);
  }

  res.json(benchmark);
});

// Compare business to benchmarks
app.post('/api/compare', (req: Request, res: Response) => {
  const { businessId, industry, city, metrics } = req.body;

  const comparisons: Comparison[] = [];

  for (const [metric, value] of Object.entries(metrics)) {
    const key = `${industry}_${metric}`;
    const genericKey = `all_${metric}`;
    const benchmark = benchmarks.get(key) || benchmarks.get(genericKey);

    if (benchmark) {
      const percentile = calculatePercentile(value, benchmark.values);
      const cityFactor = city ? (regionalFactors[city]?.multiplier || 1) : 1;
      const adjustedValue = value * cityFactor;

      comparisons.push({
        metric,
        yourValue: value,
        industryAvg: benchmark.values.average,
        cityAvg: city ? benchmark.values.average * (regionalFactors[city]?.adjustment || 1) : benchmark.values.average,
        percentile,
        status: percentile >= 50 ? 'above' : percentile < 30 ? 'below' : 'at_par',
        gap: value - benchmark.values.average,
        recommendation: getRecommendation(metric, percentile),
      });
    }
  }

  const overallPercentile = comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length;

  res.json({
    businessId,
    industry,
    comparisons,
    overall: {
      percentile: Math.round(overallPercentile),
      status: overallPercentile >= 50 ? 'above_average' : overallPercentile >= 30 ? 'at_par' : 'below_average',
      topPerformers: comparisons.filter(c => c.percentile >= 75).map(c => c.metric),
      improvementAreas: comparisons.filter(c => c.percentile < 40).map(c => c.metric),
    },
  });
});

function calculatePercentile(value: number, values: { p10: number; p25: number; p50: number; p75: number; p90: number }): number {
  if (value >= values.p90) return 90;
  if (value >= values.p75) return 75 + ((value - values.p75) / (values.p90 - values.p75)) * 15;
  if (value >= values.p50) return 50 + ((value - values.p50) / (values.p75 - values.p50)) * 25;
  if (value >= values.p25) return 25 + ((value - values.p25) / (values.p50 - values.p25)) * 25;
  return Math.max(5, ((value - values.p10) / (values.p25 - values.p10)) * 20);
}

function getRecommendation(metric: string, percentile: number): string {
  if (percentile >= 75) return 'Excellent! You are in the top quartile.';

  const recommendations: Record<string, string> = {
    'revenue_per_sqft_monthly': 'Focus on higher-margin items and optimize table turnover.',
    'food_cost_percentage': 'Review supplier contracts and reduce waste.',
    'labor_cost_percentage': 'Optimize scheduling based on peak hours.',
    'customer_retention_percentage': 'Launch loyalty program to improve retention.',
    'occupancy_percentage': 'Adjust pricing strategy and enhance marketing.',
    'marketing_roi_percentage': 'Review ad targeting and creative quality.',
    'days_to_collect': 'Implement automated payment reminders.',
  };

  return recommendations[metric] || 'Review processes to identify improvement areas.';
}

// Get regional benchmarks
app.get('/api/benchmarks/regional/:city', (req: Request, res: Response) => {
  const city = req.params.city;
  const factor = regionalFactors[city];

  if (!factor) {
    return res.status(404).json({ error: 'City not found in database' });
  }

  const regionalBenchmarks = Array.from(benchmarks.values()).map(b => ({
    ...b,
    cityAdjusted: {
      p50: Math.round(b.values.p50 * factor.multiplier),
      average: Math.round(b.values.average * factor.adjustment),
    },
  }));

  res.json({
    city,
    benchmarks: regionalBenchmarks,
    adjustment: factor,
  });
});

// Get efficiency rankings
app.get('/api/rankings/:industry', (req: Request, res: Response) => {
  const industry = req.params.industry;

  const industryBenchmarks = Array.from(benchmarks.values())
    .filter(b => b.industry === industry);

  const rankings = industryBenchmarks
    .sort((a, b) => b.values.p50 - a.values.p50)
    .map((b, i) => ({
      rank: i + 1,
      metric: b.metric,
      p50: b.values.p50,
      average: b.values.average,
      topPerformers: `${b.values.p90}+`,
    }));

  res.json({ industry, rankings });
});

// Generate report
app.post('/api/report', (req: Request, res: Response) => {
  const { businessId, industry, city, metrics } = req.body;

  const comparisons: Comparison[] = [];

  for (const [metric, value] of Object.entries(metrics)) {
    const key = `${industry}_${metric}`;
    const genericKey = `all_${metric}`;
    const benchmark = benchmarks.get(key) || benchmarks.get(genericKey);

    if (benchmark) {
      const percentile = calculatePercentile(value, benchmark.values);

      comparisons.push({
        metric,
        yourValue: value,
        industryAvg: benchmark.values.average,
        cityAvg: city ? benchmark.values.average * (regionalFactors[city]?.adjustment || 1) : benchmark.values.average,
        percentile,
        status: percentile >= 50 ? 'above' : percentile < 30 ? 'below' : 'at_par',
        gap: value - benchmark.values.average,
        recommendation: getRecommendation(metric, percentile),
      });
    }
  }

  const overall = comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length;

  res.json({
    reportId: `report_${Date.now()}`,
    businessId,
    industry,
    city,
    generatedAt: new Date().toISOString(),
    executiveSummary: {
      overallPercentile: Math.round(overall),
      status: overall >= 50 ? 'above_average' : overall >= 30 ? 'at_par' : 'below_average',
      strengths: comparisons.filter(c => c.percentile >= 70).map(c => c.metric),
      opportunities: comparisons.filter(c => c.percentile < 60).map(c => c.metric),
    },
    comparisons,
    actionItems: comparisons
      .filter(c => c.percentile < 50)
      .map(c => ({
        metric: c.metric,
        priority: c.percentile < 30 ? 'high' : 'medium',
        action: c.recommendation,
      })),
  });
});

const PORT = process.env.PORT || 4082;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════╗
║  📊 Industry Benchmark Engine             ║
║  Operational Intelligence Moat           ║
║  Port: ${PORT}                               ║
╚═══════════════════════════════════════════════╝
  `);
});
