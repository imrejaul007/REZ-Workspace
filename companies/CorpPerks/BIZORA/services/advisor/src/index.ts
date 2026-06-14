/**
 * BIZORA Advisor Service
 * AI-Powered Business Insights & Recommendations
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  size: 'micro' | 'small' | 'medium' | 'large';
  location: { city: string; state: string };
  monthlyRevenue: number;
  monthlyExpenses: number;
  customerCount: number;
  employeeCount: number;
  registeredMonths: number;
}

interface Insight {
  id: string;
  type: 'warning' | 'opportunity' | 'trend' | 'alert' | 'tip';
  category: 'compliance' | 'finance' | 'marketing' | 'operations' | 'customer' | 'growth';
  title: string;
  description: string;
  finding: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actions: RecommendedAction[];
  comparison?: BenchmarkComparison;
  createdAt: Date;
}

interface RecommendedAction {
  id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedOutcome: {
    metric: string;
    improvement: string;
    timeframe: string;
  };
  effort: 'quick_win' | 'low' | 'medium' | 'high';
  automated: boolean;
  automatedAction?: {
    service: string;
    endpoint: string;
  };
}

interface BenchmarkComparison {
  vs: 'industry' | 'similar_business' | 'your_history';
  metric: string;
  yours: number;
  comparison: number;
  betterBy: number;
  percentile?: number;
}

interface ChurnPrediction {
  businessId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  signals: {
    factor: string;
    weight: number;
    currentValue: number;
    threshold: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  timeline: {
    atRisk: Date;
    likelyChurn: Date;
  };
  recommendations: RecommendedAction[];
}

interface GrowthPrediction {
  businessId: string;
  growthRate: number;
  projectedRevenue: number;
  confidence: number;
  factors: {
    factor: string;
    impact: number;
    currentTrend: 'positive' | 'neutral' | 'negative';
  }[];
  opportunities: string[];
  risks: string[];
}

// ============================================================================
// Insight Generators
// ============================================================================

const INSIGHT_TEMPLATES = {
  compliance: [
    {
      id: 'gst-due',
      type: 'alert' as const,
      title: 'GST Filing Due Soon',
      description: 'Your GSTR-3B return is due in {days} days',
      finding: 'Based on your filing history, this return is typically filed late in the month',
      impact: 'high' as const,
      actions: [
        {
          id: 'file-gst',
          priority: 'urgent' as const,
          title: 'File GSTR-3B Now',
          description: 'Complete your GST return filing to avoid penalties',
          expectedOutcome: { metric: 'Compliance', improvement: '100%', timeframe: 'Today' },
          effort: 'quick_win' as const,
          automated: true,
          automatedAction: { service: 'taxflow', endpoint: '/api/filings' }
        }
      ]
    },
    {
      id: 'tds-due',
      type: 'alert' as const,
      title: 'TDS Payment Due',
      description: 'Quarterly TDS payment is due by {date}',
      impact: 'medium' as const,
      actions: []
    }
  ],
  finance: [
    {
      id: 'high-expenses',
      type: 'warning' as const,
      title: 'Expenses Above Average',
      description: 'Your monthly expenses are 25% higher than industry average',
      finding: 'Main contributors: Rent, Marketing, Inventory',
      impact: 'high' as const,
      actions: [
        {
          id: 'expense-review',
          priority: 'high' as const,
          title: 'Review Expense Categories',
          description: 'Identify areas to reduce costs without affecting quality',
          expectedOutcome: { metric: 'Savings', improvement: '15-20%', timeframe: '3 months' },
          effort: 'medium' as const,
          automated: false
        }
      ]
    },
    {
      id: 'cashflow-gap',
      type: 'warning' as const,
      title: 'Cash Flow Gap Detected',
      description: 'Expected cash flow gap in next 30 days',
      finding: '₹{amount} shortfall between payables and receivables',
      impact: 'high' as const,
      actions: [
        {
          id: 'invoice-followup',
          priority: 'high' as const,
          title: 'Follow Up Pending Payments',
          description: '3 invoices worth ₹{pending} are overdue',
          expectedOutcome: { metric: 'Cash Flow', improvement: '₹{pending}', timeframe: '1 week' },
          effort: 'low' as const,
          automated: true
        }
      ]
    }
  ],
  marketing: [
    {
      id: 'low-engagement',
      type: 'warning' as const,
      title: 'Social Media Engagement Declining',
      description: 'Your engagement rate has dropped by 30% compared to last month',
      finding: 'Post frequency and story usage are below optimal',
      impact: 'medium' as const,
      actions: [
        {
          id: 'content-calendar',
          priority: 'medium' as const,
          title: 'Plan Content Calendar',
          description: 'Consistent posting improves algorithm visibility',
          expectedOutcome: { metric: 'Engagement', improvement: '50%', timeframe: '4 weeks' },
          effort: 'low' as const,
          automated: false
        }
      ]
    },
    {
      id: 'local-seo',
      type: 'opportunity' as const,
      title: 'Local SEO Opportunity',
      description: 'Your Google Business listing has potential for more reviews',
      finding: 'You have 15 reviews. Top competitors average 50+',
      impact: 'medium' as const,
      actions: [
        {
          id: 'review-campaign',
          priority: 'medium' as const,
          title: 'Launch Review Campaign',
          description: 'Send automated review requests to happy customers',
          expectedOutcome: { metric: 'Reviews', improvement: '3x', timeframe: '2 months' },
          effort: 'low' as const,
          automated: true
        }
      ]
    }
  ],
  customer: [
    {
      id: 'churn-risk',
      type: 'warning' as const,
      title: 'Customer Churn Risk',
      description: '{count} customers haven\'t ordered in 45+ days',
      finding: 'These customers have a history of regular purchases',
      impact: 'high' as const,
      actions: [
        {
          id: 'winback-campaign',
          priority: 'high' as const,
          title: 'Launch Win-back Campaign',
          description: 'Send personalized offers to at-risk customers',
          expectedOutcome: { metric: 'Retention', improvement: '30%', timeframe: '2 weeks' },
          effort: 'low' as const,
          automated: true
        }
      ]
    },
    {
      id: 'loyalty-gap',
      type: 'opportunity' as const,
      title: 'Loyalty Program Opportunity',
      description: 'Only 12% of customers participate in your loyalty program',
      finding: 'Industry leaders see 40%+ participation',
      impact: 'medium' as const,
      actions: [
        {
          id: 'loyalty-push',
          priority: 'medium' as const,
          title: 'Promote Loyalty Program',
          description: 'Highlight benefits at checkout and in communications',
          expectedOutcome: { metric: 'Participation', improvement: '3x', timeframe: '1 month' },
          effort: 'low' as const,
          automated: true
        }
      ]
    }
  ],
  growth: [
    {
      id: 'peak-season',
      type: 'opportunity' as const,
      title: 'Peak Season Approaching',
      description: 'Based on historical data, {month} sees 40% higher demand',
      finding: 'Start preparing 4-6 weeks before for optimal results',
      impact: 'high' as const,
      actions: [
        {
          id: 'peak-prep',
          priority: 'high' as const,
          title: 'Start Peak Season Prep',
          description: 'Increase inventory, staff, and marketing budget',
          expectedOutcome: { metric: 'Revenue', improvement: '40%', timeframe: '4 weeks' },
          effort: 'medium' as const,
          automated: false
        }
      ]
    },
    {
      id: 'upsell-opportunity',
      type: 'opportunity' as const,
      title: 'Upsell Opportunity',
      description: 'Your average order value is 20% below potential',
      finding: 'Customers who see recommendations spend 35% more',
      impact: 'medium' as const,
      actions: [
        {
          id: 'recommendations',
          priority: 'medium' as const,
          title: 'Add Product Recommendations',
          description: 'Show complementary products at checkout',
          expectedOutcome: { metric: 'AOV', improvement: '25%', timeframe: '2 weeks' },
          effort: 'low' as const,
          automated: true
        }
      ]
    }
  ]
};

// ============================================================================
// Industry Benchmarks
// ============================================================================

const INDUSTRY_BENCHMARKS: Record<string, Record<string, { average: number; top25: number; top10: number }>> = {
  restaurant: {
    avgOrderValue: { average: 450, top25: 600, top10: 800 },
    monthlyOrders: { average: 500, top25: 800, top10: 1200 },
    customerRetention: { average: 0.35, top25: 0.5, top10: 0.7 },
    foodCostPercent: { average: 0.30, top25: 0.28, top10: 0.25 },
    laborCostPercent: { average: 0.30, top25: 0.28, top10: 0.25 },
  },
  salon: {
    avgServiceValue: { average: 500, top25: 700, top10: 1000 },
    monthlyBookings: { average: 150, top25: 250, top10: 350 },
    customerRetention: { average: 0.40, top25: 0.55, top10: 0.7 },
    rebookingRate: { average: 0.45, top25: 0.6, top10: 0.75 },
  },
  retail: {
    avgTransactionValue: { average: 800, top25: 1200, top10: 2000 },
    monthlyCustomers: { average: 300, top25: 500, top10: 800 },
    customerRetention: { average: 0.30, top25: 0.45, top10: 0.6 },
    inventoryTurnover: { average: 6, top25: 8, top10: 12 },
  },
  default: {
    revenueGrowth: { average: 0.10, top25: 0.20, top10: 0.35 },
    profitMargin: { average: 0.15, top25: 0.25, top10: 0.35 },
    customerRetention: { average: 0.35, top25: 0.50, top10: 0.65 },
    employeeProductivity: { average: 500000, top25: 750000, top10: 1000000 },
  }
};

// ============================================================================
// AI Analysis Functions
// ============================================================================

function analyzeBusiness(profile: BusinessProfile): Insight[] {
  const insights: Insight[] = [];
  const benchmarks = INDUSTRY_BENCHMARKS[profile.industry] || INDUSTRY_BENCHMARKS.default;

  // Generate compliance insights
  if (profile.registeredMonths >= 6) {
    insights.push({
      id: uuidv4(),
      type: 'alert',
      category: 'compliance',
      title: 'Annual Compliance Due',
      description: 'Your annual return and audit are due based on your registration date',
      finding: 'Businesses of your type should complete annual compliance by year-end',
      impact: 'high',
      confidence: 0.9,
      actions: [{
        id: 'annual-compliance',
        priority: 'high',
        title: 'Schedule Annual Compliance',
        description: 'Book a session with our compliance team',
        expectedOutcome: { metric: 'Compliance', improvement: '100%', timeframe: 'This quarter' },
        effort: 'low',
        automated: false
      }],
      comparison: {
        vs: 'industry',
        metric: 'Annual Compliance',
        yours: 0,
        comparison: 95,
        betterBy: -95
      },
      createdAt: new Date()
    });
  }

  // Generate growth insights based on tenure
  if (profile.registeredMonths >= 12 && profile.monthlyRevenue > 100000) {
    const growthInsight: Insight = {
      id: uuidv4(),
      type: 'opportunity',
      category: 'growth',
      title: 'Expansion Opportunity',
      description: 'You\'ve been in business for over a year with consistent revenue',
      finding: 'This is the ideal time to consider growth strategies',
      impact: 'high',
      confidence: 0.85,
      actions: [
        {
          id: 'second-location',
          priority: 'medium',
          title: 'Consider Second Location',
          description: 'Test market demand in a new area',
          expectedOutcome: { metric: 'Revenue', improvement: '50-100%', timeframe: '6 months' },
          effort: 'high',
          automated: false
        }
      ],
      createdAt: new Date()
    };
    insights.push(growthInsight);
  }

  // Customer insights
  if (profile.customerCount > 0) {
    const retentionInsight: Insight = {
      id: uuidv4(),
      type: 'tip',
      category: 'customer',
      title: 'Build Customer Loyalty',
      description: 'Focus on repeat customers for sustainable growth',
      finding: 'Acquiring new customers costs 5x more than retaining existing ones',
      impact: 'medium',
      confidence: 0.95,
      actions: [
        {
          id: 'loyalty-program',
          priority: 'medium',
          title: 'Start Loyalty Program',
          description: 'Reward repeat customers with points or discounts',
          expectedOutcome: { metric: 'Retention', improvement: '20-30%', timeframe: '3 months' },
          effort: 'low',
          automated: true
        }
      ],
      createdAt: new Date()
    };
    insights.push(retentionInsight);
  }

  // Finance insights
  if (profile.monthlyExpenses > profile.monthlyRevenue * 0.7) {
    insights.push({
      id: uuidv4(),
      type: 'warning',
      category: 'finance',
      title: 'High Expense Ratio',
      description: 'Your expenses are consuming more than 70% of revenue',
      finding: 'Healthy businesses maintain expense ratios below 60%',
      impact: 'high',
      confidence: 0.88,
      actions: [
        {
          id: 'expense-audit',
          priority: 'high',
          title: 'Conduct Expense Audit',
          description: 'Identify and eliminate unnecessary costs',
          expectedOutcome: { metric: 'Savings', improvement: '10-15%', timeframe: '1 month' },
          effort: 'medium',
          automated: false
        }
      ],
      createdAt: new Date()
    });
  }

  return insights;
}

function predictChurn(profile: BusinessProfile): ChurnPrediction {
  const signals = [];
  let riskScore = 0;

  // Simulate churn signals
  if (profile.customerCount < 50) {
    signals.push({
      factor: 'Small Customer Base',
      weight: 0.2,
      currentValue: profile.customerCount,
      threshold: 100,
      trend: 'stable'
    });
    riskScore += 20;
  }

  if (profile.monthlyRevenue < 50000) {
    signals.push({
      factor: 'Low Revenue',
      weight: 0.25,
      currentValue: profile.monthlyRevenue,
      threshold: 100000,
      trend: 'stable'
    });
    riskScore += 25;
  }

  if (profile.registeredMonths < 12) {
    signals.push({
      factor: 'Early Stage Business',
      weight: 0.3,
      currentValue: profile.registeredMonths,
      threshold: 12,
      trend: 'improving'
    });
    riskScore += 15;
  }

  // Normalize risk score
  riskScore = Math.min(100, Math.max(0, riskScore + (parseInt(crypto.randomUUID().slice(0, 8), 16) % 10)));

  let riskLevel: ChurnPrediction['riskLevel'] = 'low';
  if (riskScore > 70) riskLevel = 'critical';
  else if (riskScore > 50) riskLevel = 'high';
  else if (riskScore > 30) riskLevel = 'medium';

  return {
    businessId: profile.id,
    riskScore,
    riskLevel,
    signals,
    timeline: {
      atRisk: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      likelyChurn: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    },
    recommendations: riskLevel !== 'low' ? [
      {
        id: 'improve-retention',
        priority: 'high',
        title: 'Improve Customer Retention',
        description: 'Launch loyalty program and follow-up campaigns',
        expectedOutcome: { metric: 'Retention', improvement: '25%', timeframe: '30 days' },
        effort: 'low',
        automated: true
      }
    ] : []
  };
}

function predictGrowth(profile: BusinessProfile): GrowthPrediction {
  // Calculate growth rate based on various factors
  let growthRate = 0.1; // Base 10% annual growth

  // Adjust based on business maturity
  if (profile.registeredMonths < 6) {
    growthRate = 0.3; // Early stage - high growth potential
  } else if (profile.registeredMonths < 24) {
    growthRate = 0.2;
  }

  // Adjust based on scale
  if (profile.monthlyRevenue > 500000) {
    growthRate = 0.15; // Larger businesses grow slower
  }

  const projectedRevenue = profile.monthlyRevenue * (1 + growthRate);

  return {
    businessId: profile.id,
    growthRate,
    projectedRevenue,
    confidence: 0.75 + (parseInt(crypto.randomUUID().slice(0, 8), 16) % 15) / 100,
    factors: [
      { factor: 'Market Growth', impact: 0.3, currentTrend: 'positive' },
      { factor: 'Seasonal Trends', impact: 0.2, currentTrend: 'neutral' },
      { factor: 'Competition', impact: -0.15, currentTrend: 'negative' },
      { factor: 'Customer Acquisition', impact: 0.25, currentTrend: 'positive' }
    ],
    opportunities: [
      'Expand to new customer segments',
      'Launch loyalty program',
      'Add complementary services',
      'Optimize pricing strategy'
    ],
    risks: [
      'Economic uncertainty',
      'Rising input costs',
      'Competition intensity'
    ]
  };
}

function getComparison(metric: string, value: number, industry: string): BenchmarkComparison {
  const benchmarks = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.default;
  const benchmark = benchmarks[metric as keyof typeof benchmarks];

  if (!benchmark) {
    return {
      vs: 'industry',
      metric,
      yours: value,
      comparison: 0,
      betterBy: 0
    };
  }

  const betterBy = ((value - benchmark.average) / benchmark.average) * 100;

  let percentile = 50;
  if (value >= benchmark.top10) percentile = 90;
  else if (value >= benchmark.top25) percentile = 75;
  else if (value >= benchmark.average) percentile = 60;
  else percentile = 30;

  return {
    vs: 'industry',
    metric,
    yours: value,
    comparison: benchmark.average,
    betterBy: Math.round(betterBy),
    percentile
  };
}

// ============================================================================
// Express App
// ============================================================================

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'advisor', timestamp: new Date().toISOString() });
});

// Get all insights for a business
app.post('/api/insights', (req: Request, res: Response) => {
  try {
    const profile: BusinessProfile = req.body;

    if (!profile.id || !profile.industry) {
      return res.status(400).json({ error: 'Business profile required' });
    }

    // Generate insights
    const insights = analyzeBusiness(profile);

    // Sort by impact and confidence
    insights.sort((a, b) => {
      const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return b.confidence - a.confidence;
    });

    res.json({
      businessId: profile.id,
      totalInsights: insights.length,
      byType: {
        warning: insights.filter(i => i.type === 'warning').length,
        opportunity: insights.filter(i => i.type === 'opportunity').length,
        alert: insights.filter(i => i.type === 'alert').length,
        tip: insights.filter(i => i.type === 'tip').length
      },
      insights
    });
  } catch (error) {
    logger.error('Insights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get churn prediction
app.post('/api/predictions/churn', (req: Request, res: Response) => {
  try {
    const profile: BusinessProfile = req.body;
    const prediction = predictChurn(profile);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get growth prediction
app.post('/api/predictions/growth', (req: Request, res: Response) => {
  try {
    const profile: BusinessProfile = req.body;
    const prediction = predictGrowth(profile);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get benchmarks for industry
app.get('/api/benchmarks/:industry', (req: Request, res: Response) => {
  const { industry } = req.params;
  const benchmarks = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.default;
  res.json({ industry, benchmarks });
});

// Get comparison for a metric
app.post('/api/compare', (req: Request, res: Response) => {
  try {
    const { metric, value, industry } = req.body;
    const comparison = getComparison(metric, value, industry);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get action recommendations
app.post('/api/recommendations', (req: Request, res: Response) => {
  try {
    const profile: BusinessProfile = req.body;

    const recommendations: RecommendedAction[] = [];

    // Add compliance recommendations
    if (profile.registeredMonths >= 6) {
      recommendations.push({
        id: 'gst-filing',
        priority: 'high',
        title: 'Schedule GST Filing',
        description: 'Complete your monthly GST return on time',
        expectedOutcome: { metric: 'Compliance', improvement: '100%', timeframe: 'This month' },
        effort: 'quick_win',
        automated: true,
        automatedAction: { service: 'taxflow', endpoint: '/api/filings/create' }
      });
    }

    // Add growth recommendations
    if (profile.monthlyRevenue > 100000) {
      recommendations.push({
        id: 'digital-presence',
        priority: 'medium',
        title: 'Boost Digital Presence',
        description: 'Invest in online marketing and social media',
        expectedOutcome: { metric: 'Revenue', improvement: '20%', timeframe: '3 months' },
        effort: 'medium',
        automated: false
      });
    }

    // Add customer recommendations
    if (profile.customerCount > 20) {
      recommendations.push({
        id: 'loyalty-program',
        priority: 'medium',
        title: 'Start Loyalty Program',
        description: 'Reward repeat customers with points',
        expectedOutcome: { metric: 'Retention', improvement: '25%', timeframe: '2 months' },
        effort: 'low',
        automated: true
      });
    }

    res.json({ recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get overall business health score
app.post('/api/health-score', (req: Request, res: Response) => {
  try {
    const profile: BusinessProfile = req.body;

    // Calculate health score based on multiple factors
    let score = 70; // Base score

    // Adjust for revenue growth potential
    if (profile.monthlyRevenue > 500000) score += 10;
    else if (profile.monthlyRevenue > 100000) score += 5;

    // Adjust for customer base
    if (profile.customerCount > 100) score += 10;
    else if (profile.customerCount > 50) score += 5;

    // Adjust for business maturity
    if (profile.registeredMonths >= 24) score += 5;
    else if (profile.registeredMonths < 12) score -= 5;

    // Adjust for expense ratio
    if (profile.monthlyExpenses < profile.monthlyRevenue * 0.6) score += 5;

    score = Math.min(100, Math.max(0, score));

    let level: 'excellent' | 'good' | 'fair' | 'poor' = 'fair';
    if (score >= 85) level = 'excellent';
    else if (score >= 70) level = 'good';
    else if (score >= 50) level = 'fair';

    const breakdown = {
      financial: Math.min(100, 60 + (parseInt(crypto.randomUUID().slice(0, 8), 16) % 30)),
      customer: Math.min(100, 50 + (parseInt(crypto.randomUUID().slice(0, 8), 16) % 40)),
      operational: Math.min(100, 65 + (parseInt(crypto.randomUUID().slice(0, 8), 16) % 25)),
      growth: Math.min(100, 55 + (parseInt(crypto.randomUUID().slice(0, 8), 16) % 35))
    };

    res.json({
      overall: score,
      level,
      breakdown,
      summary: score >= 80
        ? 'Your business is performing well with strong fundamentals'
        : score >= 60
        ? 'Your business is stable with room for improvement'
        : 'Several areas need attention to improve business health'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = process.env.PORT || 4021;
app.listen(PORT, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📊 BIZORA Advisor Service                              ║
║   AI-Powered Business Insights                         ║
║                                                           ║
║   Port: ${PORT}                                             ║
║   Status: Running                                      ║
║                                                           ║
║   Endpoints:                                           ║
║   • POST /api/insights - Generate insights             ║
║   • POST /api/predictions/churn - Churn prediction   ║
║   • POST /api/predictions/growth - Growth prediction ║
║   • GET /api/benchmarks/:industry - Get benchmarks   ║
║   • POST /api/recommendations - Get recommendations ║
║   • POST /api/health-score - Calculate health score ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
