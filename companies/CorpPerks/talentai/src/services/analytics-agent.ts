/**
 * Analytics AI Agent - Port 4016
 * Workforce analytics, insights, predictions
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Sample workforce data
const workforceData = {
  headcount: [
    { month: 'Jan', count: 35, revenue: 420 },
    { month: 'Feb', count: 37, revenue: 445 },
    { month: 'Mar', count: 40, revenue: 480 },
    { month: 'Apr', count: 42, revenue: 510 },
    { month: 'May', count: 45, revenue: 540 },
  ],
  departments: {
    Engineering: { headcount: 27, avgSalary: 18, productivity: 92 },
    Sales: { headcount: 8, avgSalary: 12, productivity: 88 },
    Marketing: { headcount: 4, avgSalary: 14, productivity: 85 },
    Operations: { headcount: 3, avgSalary: 10, productivity: 90 },
    Finance: { headcount: 2, avgSalary: 16, productivity: 95 },
    HR: { headcount: 1, avgSalary: 12, productivity: 88 },
  },
  metrics: {
    retention: 94,
    engagement: 78,
    productivity: 87,
    satisfaction: 82,
    nps: 45,
  },
  trends: {
    attrition: 6,
    sickLeaves: 2.3,
    avgTenure: 2.4,
    promotionRate: 15,
  },
};

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'analytics', port: 4016 }));

// Dashboard
app.get('/dashboard', (_, res) => {
  const latest = workforceData.headcount[workforceData.headcount.length - 1];

  res.json({
    summary: {
      totalHeadcount: latest.count,
      totalRevenue: latest.revenue,
      revenuePerEmployee: Math.round(latest.revenue / latest.count * 10) / 10,
      avgSalary: 15,
    },
    metrics: workforceData.metrics,
    trends: workforceData.trends,
  });
});

// Headcount trend
app.get('/headcount', (req, res) => {
  const period = req.query.period as string || '6m';

  let data = workforceData.headcount;
  if (period === '3m') data = data.slice(-3);
  else if (period === '12m') {
    // Add projected months
    data = [...data, { month: 'Jun', count: 48, revenue: 576 }, { month: 'Jul', count: 52, revenue: 624 }];
  }

  res.json({ headcount: data });
});

// Department analysis
app.get('/departments', (_, res) => {
  const analysis = Object.entries(workforceData.departments).map(([name, dept]) => ({
    name,
    ...dept,
    costRatio: Math.round((dept.headcount * dept.avgSalary / 700) * 100),
  }));

  res.json({ departments: analysis });
});

// AI insights
app.get('/insights', (_, res) => {
  const insights = [
    {
      type: 'trend',
      title: 'Headcount Growth',
      description: 'Team grew 28% in 5 months, aligned with revenue growth',
      impact: 'positive',
      confidence: 95,
    },
    {
      type: 'alert',
      title: 'Engineering Burnout Risk',
      description: 'Productivity at 92% may indicate overtime. Monitor for burnout signs.',
      impact: 'warning',
      confidence: 78,
    },
    {
      type: 'opportunity',
      title: 'Sales Expansion Ready',
      description: 'Current team can handle 20% more volume. Consider expansion at 55 headcount.',
      impact: 'neutral',
      confidence: 85,
    },
    {
      type: 'prediction',
      title: 'Q3 Hiring Need',
      description: 'Based on growth rate, expect need for 8 new hires by Q3',
      impact: 'action',
      confidence: 82,
    },
  ];

  res.json({ insights });
});

// Predict attrition risk
app.post('/predict/attrition', (req, res) => {
  const { employeeId, factors } = req.body;

  // Simple risk calculation
  const riskScore = Math.round(20 + Math.random() * 60);
  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

  const factors_ = factors || ['tenure', 'satisfaction', 'growth'];
  const recommendations = {
    high: ['Schedule 1:1 with manager', 'Review compensation', 'Discuss growth path'],
    medium: ['Regular check-ins', 'Mentorship pairing', 'Project rotation'],
    low: ['Continue current approach', 'Recognition programs'],
  };

  res.json({
    employeeId,
    riskScore,
    riskLevel,
    factors: factors_,
    recommendations: recommendations[riskLevel],
  });
});

// Revenue forecast
app.get('/forecast', (req, res) => {
  const months = req.query.months as string || '6';
  const n = parseInt(months);

  const current = workforceData.headcount[workforceData.headcount.length - 1];
  const forecast = [];

  for (let i = 1; i <= n; i++) {
    const growthRate = 1.08;
    forecast.push({
      month: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i - 1] || `M${i}`,
      projectedHeadcount: Math.round(current.count * Math.pow(growthRate, i)),
      projectedRevenue: Math.round(current.revenue * Math.pow(growthRate, i)),
      confidence: 100 - (i * 8),
    });
  }

  res.json({ forecast });
});

// Generate report
app.post('/report', (req, res) => {
  const { type, period, department } = req.body;

  const reportId = `RPT${Date.now()}`;
  const report = {
    id: reportId,
    type: type || 'workforce',
    period: period || 'monthly',
    department: department || 'all',
    generatedAt: new Date(),
    status: 'ready',
    downloadUrl: `/reports/${reportId}.pdf`,
  };

  res.json({
    report,
    message: 'Report generated. Download link valid for 24 hours.',
  });
});

const PORT = 4016;
app.listen(PORT, () => logger.info(`Analytics Agent running on port ${PORT}`));
