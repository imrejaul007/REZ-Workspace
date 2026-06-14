/**
 * Atlas Intelligence Core - AI Analytics Hub
 * Central intelligence platform for business insights
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5300;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'atlas-intelligence-core',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============ DASHBOARD ============

app.get('/api/dashboard', (req: Request, res: Response) => {
  res.json({
    summary: {
      revenue: { value: 2845000, change: 12.5, trend: 'up' },
      merchants: { value: 1247, change: 8.3, trend: 'up' },
      activeTeams: { value: 45, change: 2.1, trend: 'up' },
      NPS: { value: 72, change: -1.2, trend: 'down' }
    },
    charts: {
      revenue: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 100000) + 50000
      })),
      merchants: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
        value: Math.floor(Math.random() * 50) + 20
      }))
    },
    timestamp: new Date().toISOString()
  });
});

// ============ INSIGHTS ============

app.get('/api/insights', (req: Request, res: Response) => {
  res.json({
    count: 15,
    insights: [
      {
        id: uuidv4(),
        type: 'opportunity',
        title: 'High-potential restaurant segment',
        description: 'Restaurants in South Delhi showing 40% growth',
        impact: 'high',
        recommendation: 'Increase sales team coverage in South Delhi'
      },
      {
        id: uuidv4(),
        type: 'risk',
        title: 'Merchant churn risk',
        description: '15 merchants at risk of leaving this month',
        impact: 'medium',
        recommendation: 'Launch retention campaign for at-risk merchants'
      },
      {
        id: uuidv4(),
        type: 'trend',
        title: 'Weekend bookings surge',
        description: 'Weekend merchant activations up 60% vs weekdays',
        impact: 'medium',
        recommendation: 'Consider weekend-focused promotions'
      }
    ]
  });
});

// ============ PREDICTIONS ============

app.get('/api/predictions', (req: Request, res: Response) => {
  res.json({
    period: req.query.period || '30d',
    predictions: [
      {
        metric: 'revenue',
        current: 2845000,
        predicted: 3150000,
        confidence: 0.92,
        trend: 'up'
      },
      {
        metric: 'merchants',
        current: 1247,
        predicted: 1380,
        confidence: 0.88,
        trend: 'up'
      },
      {
        metric: 'churn',
        current: 3.2,
        predicted: 2.8,
        confidence: 0.85,
        trend: 'down'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// ============ AI QUERIES ============

app.post('/api/query', (req: Request, res: Response) => {
  const { question } = req.body;

  // Simulate AI query processing
  res.json({
    question,
    answer: `Based on the data, ${question.toLowerCase().includes('revenue') ? 'revenue is up 12.5% this month.' : 'I\'ll analyze this for you.'}`,
    sources: ['revenue_data', 'merchant_analytics'],
    confidence: 0.95,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🧠 Atlas Intelligence Core running on port ${PORT}`);
});

export default app;
