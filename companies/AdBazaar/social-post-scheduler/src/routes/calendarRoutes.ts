import { Router, Response } from 'express';
import { z } from 'zod';
import { calendarService } from '../services';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';
import { createChildLogger } from '../utils/logger';

const logger = createChildLogger('CalendarRoutes');
const router = Router();

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  platform: z.enum(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'all']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tags: z.array(z.string()).optional(),
  reminders: z.array(z.string().datetime()).optional()
});

// Create calendar event
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = createEventSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const event = await calendarService.createEvent({
      userId: req.userId!,
      ...validation.data,
      startDate: new Date(validation.data.startDate),
      endDate: validation.data.endDate ? new Date(validation.data.endDate) : undefined,
      reminders: validation.data.reminders?.map(r => new Date(r))
    });

    res.status(201).json(event);
  } catch (error) {
    logger.error('Error creating calendar event', { error });
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Get calendar events (month view)
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { year, month, platform } = req.query;

    if (!year || !month) {
      res.status(400).json({ error: 'year and month are required' });
      return;
    }

    const events = await calendarService.getEventsForMonth(
      req.userId!,
      parseInt(year as string),
      parseInt(month as string),
      platform as string
    );

    res.json(events);
  } catch (error) {
    logger.error('Error fetching calendar events', { error });
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get week view
router.get('/week', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { start, platform } = req.query;
    const startOfWeek = start ? new Date(start as string) : new Date();

    const events = await calendarService.getEventsForWeek(
      req.userId!,
      startOfWeek,
      platform as string
    );

    res.json(events);
  } catch (error) {
    logger.error('Error fetching week events', { error });
    res.status(500).json({ error: 'Failed to fetch week events' });
  }
});

// Get upcoming events
router.get('/upcoming', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const events = await calendarService.getUpcomingEvents(req.userId!, limit);
    res.json(events);
  } catch (error) {
    logger.error('Error fetching upcoming events', { error });
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// Update calendar event
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const event = await calendarService.updateEvent(req.params.id, req.body);

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json(event);
  } catch (error) {
    logger.error('Error updating calendar event', { error });
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete calendar event
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const deleted = await calendarService.deleteEvent(req.params.id);

    if (!deleted) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting calendar event', { error });
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get calendar stats
router.get('/stats/summary', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await calendarService.getCalendarStats(req.userId!);
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching calendar stats', { error });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;