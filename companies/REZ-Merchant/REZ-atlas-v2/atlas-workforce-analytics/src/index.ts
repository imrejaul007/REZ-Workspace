/**
 * Atlas Workforce Analytics - Performance Tracking
 * Employee and team performance analytics
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5240;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-workforce-analytics', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/analytics/performance', (req: Request, res: Response) => {
  res.json({
    period: req.query.period || 'month',
    topPerformers: [
      { id: '1', name: 'Rahul Sharma', score: 95, visits: 145, conversions: 42 },
      { id: '2', name: 'Priya Patel', score: 92, visits: 138, conversions: 38 },
      { id: '3', name: 'Amit Kumar', score: 89, visits: 130, conversions: 35 }
    ],
    metrics: {
      avgVisits: 125,
      avgConversion: 32,
      teamProductivity: 87
    }
  });
});

app.listen(PORT, () => console.log(`📊 Atlas Workforce Analytics running on port ${PORT}`));
export default app;
