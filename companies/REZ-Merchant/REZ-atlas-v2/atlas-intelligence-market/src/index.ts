/**
 * Atlas Intelligence Market - Trend Analysis
 * Market trends and opportunity identification
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5330;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-intelligence-market', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/trends', (req: Request, res: Response) => {
  res.json({
    trends: [
      { sector: 'Restaurants', growth: 45, opportunity: 'high' },
      { sector: 'Retail', growth: 32, opportunity: 'medium' },
      { sector: 'Healthcare', growth: 28, opportunity: 'high' }
    ]
  });
});

app.listen(PORT, () => console.log(`📊 Atlas Intelligence Market running on port ${PORT}`));
export default app;
