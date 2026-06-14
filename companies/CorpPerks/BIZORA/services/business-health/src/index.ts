/**
 * BIZORA Business Health Engine
 * "Operational Dependency Moat"
 * Daily engagement through health scores and recommendations
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// ============================================================================
// Types
// ============================================================================

interface HealthScore {
  overall: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
}

interface CategoryScore {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'review' | 'critical';
  factors: Factor[];
  trend: 'up' | 'stable' | 'down';
}

interface Factor {
  name: string;
  impact: 'positive' | 'negative';
  value: number;
  description: string;
}

interface Recommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'score' | 'revenue' | 'compliance';
  estimatedImprovement: number;
  action: string;
  deadline?: string;
}

interface BusinessHealth {
  businessId: string;
  health: HealthScore;
  categories: CategoryScore[];
  recommendations: Recommendation[];
  alerts: Alert[];
  comparedTo: {
    industry: string;
    industryAverage: number;
    percentile: number;
  };
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: string;
  title: string;
  message: string;
  action: string;
  createdAt: string;
}

// ============================================================================
// Sample Business Health
// ============================================================================

const businessHealth: Map<string, BusinessHealth> = new Map([
  ['biz_001', {
    businessId: 'biz_001',
    health: {
      overall: 82,
      grade: 'A-',
      trend: 'improving',
      lastUpdated: new Date().toISOString(),
    },
    categories: [
      {
        name: 'Finance',
        score: 78,
        status: 'review',
        trend: 'stable',
        factors: [
          { name: 'Revenue Growth', impact: 'positive', value: 85, description: '15% MoM growth' },
          { name: 'Profit Margin', impact: 'positive', value: 72, description: 'Above industry avg' },
          { name: 'Cash Flow', impact: 'negative', value: 65, description: '30-day collection cycle' },
          { name: 'Expense Ratio', impact: 'positive', value: 80, description: 'Well controlled' },
        ],
      },
      {
        name: 'Compliance',
        score: 96,
        status: 'excellent',
        trend: 'stable',
        factors: [
          { name: 'VAT Filing', impact: 'positive', value: 100, description: 'Filed on time 24 months' },
          { name: 'Corporate Tax', impact: 'positive', value: 98, description: 'Quarterly on time' },
          { name: 'Labor Law', impact: 'positive', value: 95, description: 'All contracts updated' },
          { name: 'Trade License', impact: 'positive', value: 100, description: 'Valid until 2027' },
        ],
      },
      {
        name: 'Marketing',
        score: 71,
        status: 'review',
        trend: 'down',
        factors: [
          { name: 'Campaign ROI', impact: 'positive', value: 75, description: '4.2x average ROI' },
          { name: 'Lead Quality', impact: 'negative', value: 60, description: 'Need better targeting' },
          { name: 'Social Engagement', impact: 'positive', value: 80, description: 'Growing followers' },
          { name: 'Brand Awareness', impact: 'positive', value: 70, description: 'Stable in market' },
        ],
      },
      {
        name: 'Operations',
        score: 88,
        status: 'good',
        trend: 'up',
        factors: [
          { name: 'Process Efficiency', impact: 'positive', value: 90, description: 'Workflows optimized' },
          { name: 'Staff Productivity', impact: 'positive', value: 85, description: 'Good utilization' },
          { name: 'Response Time', impact: 'negative', value: 75, description: 'Can improve' },
          { name: 'Quality Control', impact: 'positive', value: 92, description: 'High standards' },
        ],
      },
      {
        name: 'Sales',
        score: 75,
        status: 'review',
        trend: 'up',
        factors: [
          { name: 'Win Rate', impact: 'positive', value: 78, description: 'Above target' },
          { name: 'Pipeline Value', impact: 'positive', value: 82, description: '3x monthly revenue' },
          { name: 'Sales Cycle', impact: 'negative', value: 65, description: '45 days avg' },
          { name: 'Follow-up Speed', impact: 'negative', value: 70, description: '4 hour response' },
        ],
      },
      {
        name: 'Customer',
        score: 82,
        status: 'good',
        trend: 'stable',
        factors: [
          { name: 'NPS Score', impact: 'positive', value: 78, description: 'Good satisfaction' },
          { name: 'Repeat Rate', impact: 'negative', value: 65, description: 'Can improve loyalty' },
          { name: 'Response Time', impact: 'positive', value: 85, description: 'Fast support' },
          { name: 'Resolution Rate', impact: 'positive', value: 90, description: '95% resolved' },
        ],
      },
    ],
    recommendations: [
      {
        id: 'rec_001',
        category: 'Marketing',
        priority: 'high',
        title: 'Launch customer loyalty program',
        description: 'Repeat customer rate dropped 8% this quarter. Launch loyalty campaign to increase retention.',
        impact: 'revenue',
        estimatedImprovement: 15,
        action: 'Create loyalty campaign in Marketing OS',
        deadline: '2026-06-15',
      },
      {
        id: 'rec_002',
        category: 'Finance',
        priority: 'high',
        title: 'Improve cash flow cycle',
        description: 'Collection period is 30 days. Offer early payment discount to reduce to 20 days.',
        impact: 'score',
        estimatedImprovement: 8,
        action: 'Set up auto payment reminders',
      },
      {
        id: 'rec_003',
        category: 'Sales',
        priority: 'medium',
        title: 'Speed up follow-ups',
        description: 'Current 4-hour response time. Target is under 1 hour for better conversion.',
        impact: 'revenue',
        estimatedImprovement: 12,
        action: 'Enable WhatsApp auto-responses',
      },
      {
        id: 'rec_004',
        category: 'Marketing',
        priority: 'medium',
        title: 'Optimize ad targeting',
        description: 'Lead quality score is low. Refine audience targeting to improve conversions.',
        impact: 'score',
        estimatedImprovement: 5,
        action: 'Review Meta Ads targeting',
      },
      {
        id: 'rec_005',
        category: 'Customer',
        priority: 'low',
        title: 'Add review collection',
        description: 'Only 23% of customers leave reviews. Increase to 50% for better social proof.',
        impact: 'revenue',
        estimatedImprovement: 8,
        action: 'Set up review request automation',
      },
    ],
    alerts: [
      {
        id: 'alert_001',
        type: 'warning',
        category: 'Compliance',
        title: 'VAT filing due soon',
        message: 'GSTR-3B filing due in 7 days. Amount estimated: AED 12,500.',
        action: 'Review and file VAT',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'alert_002',
        type: 'info',
        category: 'Finance',
        title: 'Revenue milestone',
        message: 'Congratulations! You crossed AED 500K monthly revenue.',
        action: 'View analytics',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'alert_003',
        type: 'warning',
        category: 'Sales',
        title: 'Pipeline stalled',
        message: 'No new deals added in 5 days. Add 3 leads to maintain target.',
        action: 'Add leads to pipeline',
        createdAt: new Date().toISOString(),
      },
    ],
    comparedTo: {
      industry: 'Restaurant',
      industryAverage: 72,
      percentile: 85,
    },
  }],
]);

// ============================================================================
// API Routes
// ============================================================================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'business-health',
    businesses: businessHealth.size,
  });
});

// Get complete business health
app.get('/api/health/:businessId', (req: Request, res: Response) => {
  let health = businessHealth.get(req.params.businessId);

  if (!health) {
    // Generate mock health
    health = generateMockHealth(req.params.businessId);
    businessHealth.set(req.params.businessId, health);
  }

  res.json(health);
});

// Get health summary
app.get('/api/health/:businessId/summary', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  res.json({
    businessId: health.businessId,
    overall: health.health,
    quickStats: {
      totalRecommendations: health.recommendations.length,
      highPriority: health.recommendations.filter(r => r.priority === 'high').length,
      activeAlerts: health.alerts.length,
      percentile: health.comparedTo.percentile,
    },
    categorySummary: health.categories.map(c => ({
      name: c.name,
      score: c.score,
      status: c.status,
      trend: c.trend,
    })),
  });
});

// Get recommendations
app.get('/api/health/:businessId/recommendations', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  const { priority, category, status } = req.query;

  let filtered = [...health.recommendations];

  if (priority) filtered = filtered.filter(r => r.priority === priority);
  if (category) filtered = filtered.filter(r => r.category === category);

  // Sort by priority
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  res.json({
    recommendations: filtered,
    summary: {
      total: filtered.length,
      high: filtered.filter(r => r.priority === 'high').length,
      medium: filtered.filter(r => r.priority === 'medium').length,
      low: filtered.filter(r => r.priority === 'low').length,
      potentialScoreIncrease: filtered.reduce((sum, r) => sum + r.estimatedImprovement, 0),
    },
  });
});

// Get alerts
app.get('/api/health/:businessId/alerts', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  const { type, status } = req.query;

  let filtered = [...health.alerts];

  if (type) filtered = filtered.filter(a => a.type === type);

  res.json({
    alerts: filtered,
    summary: {
      total: filtered.length,
      critical: filtered.filter(a => a.type === 'critical').length,
      warning: filtered.filter(a => a.type === 'warning').length,
      info: filtered.filter(a => a.type === 'info').length,
    },
  });
});

// Get category details
app.get('/api/health/:businessId/category/:category', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  const category = health.categories.find(c => c.name.toLowerCase() === req.params.category.toLowerCase());
  if (!category) return res.status(404).json({ error: 'Category not found' });

  // Get recommendations for this category
  const categoryRecs = health.recommendations.filter(r => r.category === category.name);

  res.json({
    category,
    recommendations: categoryRecs,
    alerts: health.alerts.filter(a => a.category === category.name),
  });
});

// Execute recommendation
app.post('/api/health/:businessId/recommendations/:recId/execute', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  const recommendation = health.recommendations.find(r => r.id === req.params.recId);
  if (!recommendation) return res.status(404).json({ error: 'Recommendation not found' });

  // Update health based on execution
  const category = health.categories.find(c => c.name === recommendation.category);
  if (category) {
    category.score = Math.min(100, category.score + recommendation.estimatedImprovement);
    category.status = category.score >= 85 ? 'excellent' : category.score >= 70 ? 'good' : 'review';

    // Recalculate overall
    health.health.overall = Math.round(
      health.categories.reduce((sum, c) => sum + c.score, 0) / health.categories.length
    );
    health.health.lastUpdated = new Date().toISOString();
  }

  res.json({
    executed: true,
    recommendation: recommendation.title,
    newScore: category?.score,
    message: 'Recommendation executed. Score updated.',
  });
});

// Get industry comparison
app.get('/api/health/:businessId/compare', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  res.json({
    business: {
      overall: health.health.overall,
      grade: health.health.grade,
    },
    industry: {
      average: health.comparedTo.industryAverage,
      name: health.comparedTo.industry,
    },
    percentile: health.comparedTo.percentile,
    betterThan: `${health.comparedTo.percentile}% of businesses in ${health.comparedTo.industry}`,
    categoryComparison: health.categories.map(c => ({
      name: c.name,
      yourScore: c.score,
      industryAvg: getIndustryAvg(c.name),
      difference: c.score - getIndustryAvg(c.name),
    })),
  });
});

// Get health trends
app.get('/api/health/:businessId/trends', (req: Request, res: Response) => {
  const health = businessHealth.get(req.params.businessId);
  if (!health) return res.status(404).json({ error: 'Health not found' });

  // Mock trend data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const overallTrend = [72, 75, 78, 80, health.health.overall];

  res.json({
    businessId: health.businessId,
    overall: {
      months,
      scores: overallTrend,
    },
    categories: health.categories.map(c => ({
      name: c.name,
      trend: c.trend,
      change: c.trend === 'up' ? 5 : c.trend === 'down' ? -3 : 0,
    })),
    summary: {
      overallTrend: health.health.trend,
      improving: health.categories.filter(c => c.trend === 'up').length,
      stable: health.categories.filter(c => c.trend === 'stable').length,
      declining: health.categories.filter(c => c.trend === 'down').length,
    },
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function generateMockHealth(businessId: string): BusinessHealth {
  const financeScore = 60 + Math.random() * 30;
  const complianceScore = 70 + Math.random() * 25;
  const marketingScore = 55 + Math.random() * 35;
  const operationsScore = 65 + Math.random() * 30;
  const salesScore = 60 + Math.random() * 30;
  const customerScore = 65 + Math.random() * 25;

  const overall = Math.round((financeScore + complianceScore + marketingScore + operationsScore + salesScore + customerScore) / 6);

  return {
    businessId,
    health: {
      overall,
      grade: overall >= 85 ? 'A+' : overall >= 75 ? 'A' : overall >= 65 ? 'B+' : overall >= 55 ? 'B' : 'C',
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    },
    categories: [
      { name: 'Finance', score: Math.round(financeScore), status: financeScore >= 75 ? 'good' : financeScore >= 60 ? 'review' : 'critical', trend: 'stable', factors: [] },
      { name: 'Compliance', score: Math.round(complianceScore), status: complianceScore >= 85 ? 'excellent' : 'good', trend: 'stable', factors: [] },
      { name: 'Marketing', score: Math.round(marketingScore), status: marketingScore >= 70 ? 'good' : 'review', trend: 'stable', factors: [] },
      { name: 'Operations', score: Math.round(operationsScore), status: operationsScore >= 75 ? 'good' : 'review', trend: 'stable', factors: [] },
      { name: 'Sales', score: Math.round(salesScore), status: salesScore >= 70 ? 'good' : 'review', trend: 'stable', factors: [] },
      { name: 'Customer', score: Math.round(customerScore), status: customerScore >= 75 ? 'good' : 'review', trend: 'stable', factors: [] },
    ],
    recommendations: [],
    alerts: [],
    comparedTo: {
      industry: 'General',
      industryAverage: 70,
      percentile: overall,
    },
  };
}

function getIndustryAvg(category: string): number {
  const averages: Record<string, number> = {
    Finance: 72,
    Compliance: 78,
    Marketing: 68,
    Operations: 75,
    Sales: 70,
    Customer: 74,
  };
  return averages[category] || 70;
}

// ============================================================================
// START
// ============================================================================

const PORT = process.env.PORT || 4097;
app.listen(PORT, () => {
  logger.info(`
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║  🏥 Business Health Engine                                      ║
║                                                                       ║
║  Daily engagement through health scores                           ║
║                                                                       ║
║  Categories: Finance | Compliance | Marketing | Operations | Sales | Customer ║
║                                                                       ║
║  Port: ${PORT}                                                          ║
║                                                                       ║
╚═════════════════════════════════════════════════════════════════════════════╝
  `);
});
