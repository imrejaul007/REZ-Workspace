/**
 * Event Commerce Ads Service
 *
 * Event-triggered advertising for AdBazaar.
 * Connect ads to real-world events.
 *
 * Features:
 * - Event integration
 * - Event-based campaigns
 * - Real-time demand spikes
 * - Event attribution
 *
 * Port: 4660
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

// ============================================================================
// TYPES
// ============================================================================

interface Event {
  id: string;
  name: string;
  type: 'sports' | 'concert' | 'festival' | 'market' | 'conference' | 'religious' | 'sports';
  city: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  expectedAttendees: number;
  category: string[];
}

interface EventCampaign {
  id: string;
  advertiserId: string;
  eventId: string;
  name: string;
  strategy: 'pre' | 'during' | 'post';
  budget: number;
  spent: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats: EventCampaignStats;
}

interface EventCampaignStats {
  impressions: number;
  conversions: number;
  revenue: number;
  footfall: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const events: Event[] = [
  { id: 'evt_001', name: 'IPL Final', type: 'sports', city: 'Bangalore', venue: 'Chinnaswamy Stadium', startDate: new Date('2026-06-15'), endDate: new Date('2026-06-15'), expectedAttendees: 40000, category: ['cricket', 'sports', 'entertainment'] },
  { id: 'evt_002', name: 'Food Festival', type: 'festival', city: 'Mumbai', venue: 'Jio Garden', startDate: new Date('2026-06-20'), endDate: new Date('2026-06-22'), expectedAttendees: 50000, category: ['food', 'culture'] },
];

const campaigns: EventCampaign[] = [];

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();
const PORT = parseInt(process.env.PORT || '4660', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'event-commerce', version: '1.0.0', events: events.length });
});

// List events
app.get('/api/events', (req: Request, res: Response) => {
  const { city, type, upcoming } = req.query;
  let filtered = [...events];
  if (city) filtered = filtered.filter(e => e.city === city);
  if (type) filtered = filtered.filter(e => e.type === type);
  if (upcoming === 'true') filtered = filtered.filter(e => new Date(e.startDate) > new Date());
  res.json({ success: true, data: filtered });
});

// Get event
app.get('/api/events/:id', (req: Request, res: Response) => {
  const event = events.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
  res.json({ success: true, data: event });
});

// Create campaign
app.post('/api/campaigns', (req: Request, res: Response) => {
  const { advertiserId, eventId, name, strategy, budget } = req.body;
  const campaign: EventCampaign = {
    id: `ec_${Date.now()}`,
    advertiserId, eventId, name, strategy: strategy || 'during',
    budget, spent: 0, status: 'draft',
    stats: { impressions: 0, conversions: 0, revenue: 0, footfall: 0 },
  };
  campaigns.push(campaign);
  res.json({ success: true, data: campaign });
});

// List campaigns
app.get('/api/campaigns', (req: Request, res: Response) => {
  res.json({ success: true, data: campaigns });
});

// Get campaign
app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  res.json({ success: true, data: campaign });
});

// Update status
app.patch('/api/campaigns/:id/status', (req: Request, res: Response) => {
  const campaign = campaigns.find(c => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });
  campaign.status = req.body.status;
  res.json({ success: true, data: campaign });
});

app.listen(PORT, () => {
  logger.info(`[Event Commerce] Running on port ${PORT}`);
});

export default app;
