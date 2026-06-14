/**
 * Atlas Revenue Core - Revenue Operations Hub
 * Central platform for revenue tracking and optimization
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5350;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Storage
const deals: Map<string, any> = new Map();
const pipelines: Map<string, any> = new Map();

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'atlas-revenue-core',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============ PIPELINE ============

app.get('/api/pipeline', (req: Request, res: Response) => {
  const stages = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed'];

  res.json({
    stages: stages.map(stage => ({
      name: stage,
      count: Math.floor(Math.random() * 50) + 10,
      value: Math.floor(Math.random() * 5000000) + 100000
    })),
    total: {
      count: Math.floor(Math.random() * 200) + 100,
      value: Math.floor(Math.random() * 20000000) + 5000000
    }
  });
});

// ============ DEALS ============

app.get('/api/deals', (req: Request, res: Response) => {
  const { stage, owner, minValue } = req.query;
  let result = Array.from(deals.values());

  if (stage) result = result.filter(d => d.stage === stage);
  if (owner) result = result.filter(d => d.ownerId === owner);
  if (minValue) result = result.filter(d => d.value >= Number(minValue));

  res.json({ count: result.length, deals: result });
});

app.get('/api/deals/:id', (req: Request, res: Response) => {
  const deal = deals.get(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });
  res.json(deal);
});

app.post('/api/deals', (req: Request, res: Response) => {
  const id = uuidv4();
  const deal = {
    id,
    ...req.body,
    stage: 'prospect',
    createdAt: new Date().toISOString()
  };
  deals.set(id, deal);
  res.status(201).json(deal);
});

app.put('/api/deals/:id/stage', (req: Request, res: Response) => {
  const deal = deals.get(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  deal.stage = req.body.stage;
  deal.stageChangedAt = new Date().toISOString();
  deals.set(req.params.id, deal);

  res.json(deal);
});

// ============ FORECAST ============

app.get('/api/forecast', (req: Request, res: Response) => {
  res.json({
    period: 'Q2 2026',
    forecast: {
      revenue: { committed: 5000000, bestCase: 6500000, worstCase: 4000000 },
      deals: { open: 127, closing: 45, probability: 0.78 }
    },
    breakdown: {
      individual: 3200000,
      team: 1800000,
      company: 0
    },
    timestamp: new Date().toISOString()
  });
});

// ============ REVENUE ANALYTICS ============

app.get('/api/analytics', (req: Request, res: Response) => {
  res.json({
    period: req.query.period || 'quarter',
    metrics: {
      totalRevenue: 15000000,
      newRevenue: 4500000,
      expansion: 1200000,
      Churned: -800000,
      NetNew: 4900000
    },
    bySegment: {
      enterprise: { revenue: 8000000, growth: 15 },
      midMarket: { revenue: 5000000, growth: 22 },
      smb: { revenue: 2000000, growth: 8 }
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`💰 Atlas Revenue Core running on port ${PORT}`);
});

export default app;
