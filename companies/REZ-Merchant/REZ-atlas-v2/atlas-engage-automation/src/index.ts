/**
 * Atlas Engage Automation - Workflow Automation Engine
 * Visual workflow builder for marketing automation
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5290;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'atlas-engage-automation', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/api/workflows', (req: Request, res: Response) => {
  res.json({
    workflows: [
      { id: '1', name: 'New Merchant Onboarding', triggers: 2, actions: 5, status: 'active' },
      { id: '2', name: 'Win-Back Campaign', triggers: 1, actions: 4, status: 'draft' }
    ]
  });
});

app.post('/api/workflows', (req: Request, res: Response) => {
  const workflow = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  res.status(201).json(workflow);
});

app.listen(PORT, () => console.log(`⚡ Atlas Engage Automation running on port ${PORT}`));
export default app;
