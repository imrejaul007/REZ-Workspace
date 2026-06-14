/**
 * Atlas Engage Core - Customer Engagement Hub
 * Unified multi-channel engagement platform
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 5250;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

// Storage
const campaigns: Map<string, any> = new Map();
const contacts: Map<string, any> = new Map();

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'atlas-engage-core',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ============ CAMPAIGNS ============

app.get('/api/campaigns', (req: Request, res: Response) => {
  const { status, type } = req.query;
  let result = Array.from(campaigns.values());

  if (status) result = result.filter(c => c.status === status);
  if (type) result = result.filter(c => c.type === type);

  res.json({ count: result.length, campaigns: result });
});

app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  res.json(campaign);
});

app.post('/api/campaigns', (req: Request, res: Response) => {
  const id = uuidv4();
  const campaign = {
    id,
    ...req.body,
    status: 'draft',
    stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0 },
    createdAt: new Date().toISOString()
  };
  campaigns.set(id, campaign);
  res.status(201).json(campaign);
});

app.put('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const updated = { ...campaign, ...req.body, updatedAt: new Date().toISOString() };
  campaigns.set(req.params.id, updated);
  res.json(updated);
});

app.post('/api/campaigns/:id/send', (req: Request, res: Response) => {
  const campaign = campaigns.get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

  campaign.status = 'sending';
  campaign.sentAt = new Date().toISOString();
  campaign.stats.sent = req.body.count || 100;
  campaigns.set(req.params.id, campaign);

  res.json({ success: true, campaign });
});

// ============ CONTACTS ============

app.get('/api/contacts', (req: Request, res: Response) => {
  const contactsList = Array.from(contacts.values());
  res.json({ count: contactsList.length, contacts: contactsList });
});

app.post('/api/contacts', (req: Request, res: Response) => {
  const id = uuidv4();
  const contact = { id, ...req.body, createdAt: new Date().toISOString() };
  contacts.set(id, contact);
  res.status(201).json(contact);
});

// ============ ANALYTICS ============

app.get('/api/analytics', (req: Request, res: Response) => {
  res.json({
    period: req.query.period || '7d',
    metrics: {
      reach: 15420,
      engagement: 8923,
      conversions: 1247,
      revenue: 2845000
    },
    channels: {
      whatsapp: { sent: 5000, opened: 4500, clicked: 1200 },
      email: { sent: 8000, opened: 3200, clicked: 640 },
      sms: { sent: 2420, opened: 223, clicked: 7 }
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`📢 Atlas Engage Core running on port ${PORT}`);
});

export default app;
