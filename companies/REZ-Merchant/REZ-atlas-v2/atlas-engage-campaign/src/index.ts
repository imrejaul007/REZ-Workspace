/**
 * Atlas Engage Campaign - Multi-Channel Campaign Engine
 * Orchestrate campaigns across WhatsApp, SMS, Email, Push
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5260;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-engage-campaign', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.post('/api/campaigns', (req: Request, res: Response) => {
  const id = uuidv4();
  const campaign = {
    id,
    name: req.body.name,
    channels: req.body.channels || ['whatsapp'],
    audience: req.body.audience,
    content: req.body.content,
    schedule: req.body.schedule,
    status: 'draft',
    createdAt: new Date().toISOString()
  };
  res.status(201).json(campaign);
});

app.post('/api/campaigns/:id/launch', (req: Request, res: Response) => {
  res.json({ success: true, status: 'launched', launchedAt: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`📣 Atlas Engage Campaign running on port ${PORT}`));
export default app;
