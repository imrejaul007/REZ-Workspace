/**
 * Event Manager AI Agent
 * NEIGHBORAI - Society Management AI Operating System
 * Port: 4921
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface SocietyEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: 'cultural' | 'sports' | 'festival' | 'meeting' | 'workshop' | 'general';
  organizer: string;
  expectedAttendees: number;
  budget: number;
  actualCost: number;
  status: 'planning' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled';
  rsvps: { residentId: string; flatNo: string; status: 'confirmed' | 'maybe' | 'declined' }[];
  createdAt: string;
}

class EventManager {
  private events: Map<string, SocietyEvent> = new Map();

  async createEvent(data: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    category: SocietyEvent['category'];
    organizer: string;
    expectedAttendees: number;
    budget: number;
  }): Promise<SocietyEvent> {
    const event: SocietyEvent = {
      ...data,
      id: uuidv4(),
      actualCost: 0,
      status: 'planning',
      rsvps: [],
      createdAt: new Date().toISOString(),
    };

    this.events.set(event.id, event);
    return event;
  }

  async getEventById(id: string): Promise<SocietyEvent | undefined> {
    return this.events.get(id);
  }

  async getUpcomingEvents(days: number = 30): Promise<SocietyEvent[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    return Array.from(this.events.values())
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= today && eventDate <= futureDate && e.status !== 'cancelled';
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async rsvp(eventId: string, residentId: string, flatNo: string, status: 'confirmed' | 'maybe' | 'declined'): Promise<SocietyEvent | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    const existingRsvp = event.rsvps.find(r => r.residentId === residentId);
    if (existingRsvp) {
      existingRsvp.status = status;
    } else {
      event.rsvps.push({ residentId, flatNo, status });
    }

    this.events.set(eventId, event);
    return event;
  }

  async confirmEvent(eventId: string): Promise<SocietyEvent | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    event.status = 'confirmed';
    this.events.set(eventId, event);
    return event;
  }

  async updateActualCost(eventId: string, cost: number): Promise<SocietyEvent | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    event.actualCost = cost;
    this.events.set(eventId, event);
    return event;
  }

  async completeEvent(eventId: string): Promise<SocietyEvent | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    event.status = 'completed';
    this.events.set(eventId, event);
    return event;
  }

  async getEventStats(): Promise<{
    totalEvents: number;
    upcoming: number;
    completed: number;
    totalBudget: number;
    totalActualCost: number;
    avgAttendance: number;
    byCategory: Record<string, number>;
  }> {
    const events = Array.from(this.events.values());

    return {
      totalEvents: events.length,
      upcoming: events.filter(e => e.status === 'planning' || e.status === 'confirmed').length,
      completed: events.filter(e => e.status === 'completed').length,
      totalBudget: events.reduce((sum, e) => sum + e.budget, 0),
      totalActualCost: events.reduce((sum, e) => sum + e.actualCost, 0),
      avgAttendance: events.length > 0
        ? Math.round(events.reduce((sum, e) => sum + e.rsvps.filter(r => r.status === 'confirmed').length, 0) / events.length)
        : 0,
      byCategory: events.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async generateEventReminder(eventId: string): Promise<{ subject: string; message: string; recipients: string[] } | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    const recipients = event.rsvps.filter(r => r.status !== 'declined').map(r => r.flatNo);

    return {
      subject: `Reminder: ${event.title} on ${event.date}`,
      message: `Dear Resident,\n\nThis is a reminder for "${event.title}" scheduled on ${event.date} at ${event.time} at ${event.venue}.\n\nWe hope to see you there!\n\nRegards,\nSociety Management`,
      recipients,
    };
  }
}

const eventManager = new EventManager();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'neighborai-event-manager', port: 4921 });
});

app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const event = await eventManager.createEvent(req.body);
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const event = await eventManager.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get event' });
  }
});

app.get('/api/events/upcoming/list', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const events = await eventManager.getUpcomingEvents(days);
    res.json({ success: true, events, count: events.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get events' });
  }
});

app.post('/api/events/:id/rsvp', async (req: Request, res: Response) => {
  try {
    const { residentId, flatNo, status } = req.body;
    const event = await eventManager.rsvp(req.params.id, residentId, flatNo, status);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

app.post('/api/events/:id/confirm', async (req: Request, res: Response) => {
  try {
    const event = await eventManager.confirmEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm event' });
  }
});

app.patch('/api/events/:id/cost', async (req: Request, res: Response) => {
  try {
    const { cost } = req.body;
    const event = await eventManager.updateActualCost(req.params.id, cost);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cost' });
  }
});

app.post('/api/events/:id/complete', async (req: Request, res: Response) => {
  try {
    const event = await eventManager.completeEvent(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete event' });
  }
});

app.get('/api/events/:id/reminder', async (req: Request, res: Response) => {
  try {
    const reminder = await eventManager.generateEventReminder(req.params.id);
    if (!reminder) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, ...reminder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate reminder' });
  }
});

app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await eventManager.getEventStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

const PORT = 4921;
app.listen(PORT, () => {
  console.log(`🎉 Event Manager running on port ${PORT}`);
  console.log(`🏢 NEIGHBORAI - Society Management AI`);
});

export default app;