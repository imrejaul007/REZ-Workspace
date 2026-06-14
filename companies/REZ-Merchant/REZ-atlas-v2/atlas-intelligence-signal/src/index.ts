/**
 * Atlas Intelligence Signal - Opportunity Signal Detection
 * Real-time opportunity identification
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5370;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-intelligence-signal', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/signals', (req: Request, res: Response) => {
  res.json({
    signals: [
      { type: 'expansion', merchant: 'Restaurant ABC', score: 92, description: 'High growth potential' },
      { type: 'churn_risk', merchant: 'Cafe XYZ', score: 78, description: 'Declining engagement' }
    ]
  });
});

app.listen(PORT, () => console.log(`📡 Atlas Intelligence Signal running on port ${PORT}`));
export default app;
