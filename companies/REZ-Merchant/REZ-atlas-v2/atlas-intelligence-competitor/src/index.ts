/**
 * Atlas Intelligence Competitor - Market Analysis
 * Track competitors and market positioning
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5320;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-intelligence-competitor', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/competitors', (req: Request, res: Response) => {
  res.json({
    competitors: [
      { name: 'Competitor A', marketShare: 35, strengths: ['Pricing', 'Reach'], weaknesses: ['Technology'] },
      { name: 'Competitor B', marketShare: 25, strengths: ['Brand', 'Products'], weaknesses: ['Service'] }
    ]
  });
});

app.listen(PORT, () => console.log(`🔍 Atlas Intelligence Competitor running on port ${PORT}`));
export default app;
