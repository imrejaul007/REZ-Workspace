/**
 * Atlas GTM - Go-To-Market Module
 * Autonomous GTM campaign generator
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 5200;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-gtm', version: '3.5.0', timestamp: new Date().toISOString() });
});

app.post('/api/campaign/generate', (req: Request, res: Response) => {
  const { domain, targetICP } = req.body;
  res.json({
    campaignId: `campaign-${Date.now()}`,
    domain,
    segments: [],
    contacts: 0,
    status: 'generating'
  });
});

app.listen(PORT, () => console.log(`🎯 Atlas GTM running on port ${PORT}`));
export default app;
