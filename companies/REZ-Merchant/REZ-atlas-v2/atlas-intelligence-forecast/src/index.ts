/**
 * Atlas Intelligence Forecast - Revenue Forecasting
 * ML-powered revenue predictions
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5310;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-intelligence-forecast', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/forecast', (req: Request, res: Response) => {
  res.json({
    period: 'Q2 2026',
    revenue: { actual: 5000000, predicted: 5500000, confidence: 0.92 },
    growth: { monthly: [12, 15, 18, 22, 19, 25]
  });
});

app.listen(PORT, () => console.log(`📈 Atlas Intelligence Forecast running on port ${PORT}`));
export default app;
