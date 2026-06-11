/**
 * Event Service
 * NEIGHBORAI - Society Management AI Operating System
 * Port: 4922
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: 'cultural' | 'sports' | 'festival' | 'meeting' | 'workshop' | 'general';
  organizerId: string;
  organizerName: string;
  expectedAttendees: number;
  budget: number;
  actualCost: number;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  rsvps: RSVP[];
  createdAt: string;
  updatedAt: string;
}

export interface RSVP {
  residentId: string;
  flatNo: string;
  name: string;
  phone: string;
  status: 'confirmed' | 'maybe' | 'declined';
  respondedAt: string;
}

export interface EventExpense {
  id: string;
  eventId: string;
  category: string;
  description: string;
  amount: number;
  vendor?: string;
  receipt?: string;
  createdAt: string;
}

class EventService {
  private events: Map<string, Event> = new Map();
  private expenses: Map<string, EventExpense> = new Map();

  async create(data: {
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    category: Event['category'];
    organizerId: string;
    organizerName: string;
    expectedAttendees: number;
    budget: number;
  }): Promise<Event> {
    const event: Event = {
      ...data,
      id: uuidv4(),
      actualCost: 0,
      status: 'draft',
      rsvps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.events.set(event.id, event);
    return event;
  }

  async getById(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getAll(filters?: { status?: string; category?: string; from?: string; to?: string }): Promise<Event[]> {
    let result = Array.from(this.events.values());

    if (filters?.status) result = result.filter(e => e.status === filters.status);
    if (filters?.category) result = result.filter(e => e.category === filters.category);
    if (filters?.from) result = result.filter(e => e.date >= filters.from!);
    if (filters?.to) result = result.filter(e => e.date <= filters.to!);

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async update(id: string, updates: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    Object.assign(event, updates, { updatedAt: new Date().toISOString() });
    this.events.set(id, event);
    return event;
  }

  async addRSVP(eventId: string, rsvp: Omit<RSVP, 'respondedAt'>): Promise<Event | undefined> {
    const event = this.events.get(eventId);
    if (!event) return undefined;

    const existing = event.rsvps.findIndex(r => r.residentId === rsvp.residentId);
    if (existing >= 0) {
      event.rsvps[existing] = { ...rsvp, respondedAt: new Date().toISOString() };
    } else {
      event.rsvps.push({ ...rsvp, respondedAt: new Date().toISOString() });
    }

    event.updatedAt = new Date().toISOString();
    this.events.set(eventId, event);
    return event;
  }

  async addExpense(eventId: string, expense: Omit<EventExpense, 'id' | 'eventId' | 'createdAt'>): Promise<EventExpense> {
    const exp: EventExpense = {
      ...expense,
      id: uuidv4(),
      eventId,
      createdAt: new Date().toISOString(),
    };

    this.expenses.set(exp.id, exp);

    // Update event actual cost
    const event = this.events.get(eventId);
    if (event) {
      event.actualCost = Array.from(this.expenses.values())
        .filter(e => e.eventId === eventId)
        .reduce((sum, e) => sum + e.amount, 0);
      this.events.set(eventId, event);
    }

    return exp;
  }

  async getExpenses(eventId: string): Promise<EventExpense[]> {
    return Array.from(this.expenses.values())
      .filter(e => e.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async publish(id: string): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    event.status = 'published';
    event.updatedAt = new Date().toISOString();
    this.events.set(id, event);
    return event;
  }

  async cancel(id: string): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    event.status = 'cancelled';
    event.updatedAt = new Date().toISOString();
    this.events.set(id, event);
    return event;
  }

  async getUpcoming(days: number = 7): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return Array.from(this.events.values())
      .filter(e => e.date >= today && e.date <= future && e.status !== 'cancelled')
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDashboard(): Promise<{
    upcomingCount: number;
    thisMonthCount: number;
    avgRsvpRate: number;
    totalBudget: number;
    totalSpent: number;
    popularCategories: { category: string; count: number }[];
  }> {
    const events = Array.from(this.events.values());
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);

    const upcoming = events.filter(e => e.date >= today && e.status !== 'cancelled');
    const thisMonthEvents = events.filter(e => e.date.startsWith(thisMonth));

    const totalRsvps = events.reduce((sum, e) => sum + e.rsvps.filter(r => r.status === 'confirmed').length, 0);
    const totalExpected = events.reduce((sum, e) => sum + e.expectedAttendees, 0);

    const categoryCounts: Record<string, number> = {};
    events.forEach(e => {
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    });

    return {
      upcomingCount: upcoming.length,
      thisMonthCount: thisMonthEvents.length,
      avgRsvpRate: totalExpected > 0 ? Math.round((totalRsvps / totalExpected) * 100) : 0,
      totalBudget: events.reduce((sum, e) => sum + e.budget, 0),
      totalSpent: events.reduce((sum, e) => sum + e.actualCost, 0),
      popularCategories: Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}

const eventService = new EventService();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'neighborai-event-service', port: 4922 });
});

app.post('/api/events', async (req: Request, res: Response) => {
  try {
    const event = await eventService.create(req.body);
    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const filters = {
      status: req.query.status as string,
      category: req.query.category as string,
      from: req.query.from as string,
      to: req.query.to as string,
    };
    const events = await eventService.getAll(filters);
    res.json({ success: true, events, count: events.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get events' });
  }
});

app.get('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const event = await eventService.getById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get event' });
  }
});

app.patch('/api/events/:id', async (req: Request, res: Response) => {
  try {
    const event = await eventService.update(req.params.id, req.body);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.post('/api/events/:id/rsvp', async (req: Request, res: Response) => {
  try {
    const event = await eventService.addRSVP(req.params.id, req.body);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add RSVP' });
  }
});

app.post('/api/events/:id/expenses', async (req: Request, res: Response) => {
  try {
    const expense = await eventService.addExpense(req.params.id, req.body);
    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

app.get('/api/events/:id/expenses', async (req: Request, res: Response) => {
  try {
    const expenses = await eventService.getExpenses(req.params.id);
    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

app.post('/api/events/:id/publish', async (req: Request, res: Response) => {
  try {
    const event = await eventService.publish(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish event' });
  }
});

app.post('/api/events/:id/cancel', async (req: Request, res: Response) => {
  try {
    const event = await eventService.cancel(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

app.get('/api/events/upcoming/list', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const events = await eventService.getUpcoming(days);
    res.json({ success: true, events, count: events.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

app.get('/api/dashboard', async (req: Request, res: Response) => {
  try {
    const dashboard = await eventService.getDashboard();
    res.json({ success: true, ...dashboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

const PORT = 4922;
app.listen(PORT, () => {
  console.log(`🎊 Event Service running on port ${PORT}`);
  console.log(`🏢 NEIGHBORAI - Society Management AI`);
});

export default app;