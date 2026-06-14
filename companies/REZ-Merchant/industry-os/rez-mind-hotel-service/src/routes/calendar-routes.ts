/**
 * REZ Mind Hotel Service - Event Calendar Routes
 *
 * Endpoints for managing local events and their pricing impact:
 * - GET /calendar/events/:hotelId - Get events for a hotel
 * - POST /calendar/events - Add a new event
 * - GET /calendar/impact/:hotelId/:date - Get pricing impact
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { eventCalendarService } from '../services/event-calendar.service';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createEventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  venue: z.string().min(1),
  city: z.string().min(1),
  startDate: z.string().datetime().or(z.string()),
  endDate: z.string().datetime().or(z.string()),
  type: z.enum(['festival', 'conference', 'concert', 'sports', 'exhibition', 'holiday']),
  expectedAttendance: z.number().int().positive(),
  impact: z.enum(['low', 'medium', 'high']),
  hotelIds: z.array(z.string()).min(1),
});

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// ─── GET /calendar/events/:hotelId ─────────────────────────────────────────────

/**
 * GET /calendar/events/:hotelId
 * Get all events for a specific hotel
 *
 * Query params:
 * - startDate: ISO date string (optional, defaults to today)
 * - endDate: ISO date string (optional, defaults to 30 days from startDate)
 */
router.get('/events/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    if (!hotelId) {
      res.status(400).json({ success: false, message: 'hotelId is required' });
      return;
    }

    const start = startDate
      ? new Date(startDate as string)
      : new Date();
    const end = endDate
      ? new Date(endDate as string)
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const events = await eventCalendarService.getEvents(hotelId, start, end);

    res.json({
      success: true,
      data: {
        hotelId,
        dateRange: { startDate: start, endDate: end },
        events,
        totalEvents: events.length,
      },
    });
  } catch (error) {
    console.error('[Calendar] Get events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get events' });
  }
});

// ─── POST /calendar/events ────────────────────────────────────────────────────

/**
 * POST /calendar/events
 * Add a new local event
 *
 * Body:
 * - id: string (unique event identifier)
 * - name: string
 * - venue: string
 * - city: string
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - type: 'festival' | 'conference' | 'concert' | 'sports' | 'exhibition' | 'holiday'
 * - expectedAttendance: number
 * - impact: 'low' | 'medium' | 'high'
 * - hotelIds: string[]
 */
router.post('/events', async (req: Request, res: Response) => {
  try {
    const validationResult = createEventSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.errors,
      });
      return;
    }

    const eventData = validationResult.data;

    // Parse dates if they're strings
    const event = await eventCalendarService.addEvent({
      ...eventData,
      startDate: new Date(eventData.startDate),
      endDate: new Date(eventData.endDate),
    });

    // Trigger price updates for affected hotels
    const priceUpdatePromises = event.hotelIds.map((hotelId) =>
      eventCalendarService.triggerPriceUpdate(hotelId)
    );
    await Promise.allSettled(priceUpdatePromises);

    res.status(201).json({
      success: true,
      data: event,
      message: `Event added. Price update triggered for ${event.hotelIds.length} hotel(s).`,
    });
  } catch (error) {
    console.error('[Calendar] Add event error:', error);
    res.status(500).json({ success: false, message: 'Failed to add event' });
  }
});

// ─── GET /calendar/impact/:hotelId/:date ─────────────────────────────────────

/**
 * GET /calendar/impact/:hotelId/:date
 * Get pricing impact for a hotel on a specific date
 *
 * Returns:
 * - multiplier: 1.0 = no impact, 1.5 = high impact
 * - impact: 'low' | 'medium' | 'high'
 * - reason: Explanation of the impact
 * - eventId: The event causing the impact
 * - eventName: Name of the event
 * - daysUntilEvent: Days until the event starts
 */
router.get('/impact/:hotelId/:date', async (req: Request, res: Response) => {
  try {
    const { hotelId, date } = req.params;

    if (!hotelId || !date) {
      res.status(400).json({ success: false, message: 'hotelId and date are required' });
      return;
    }

    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      res.status(400).json({ success: false, message: 'Invalid date format' });
      return;
    }

    const impact = await eventCalendarService.getEventImpact(hotelId, targetDate);

    if (!impact) {
      res.json({
        success: true,
        data: {
          hotelId,
          date: targetDate,
          hasImpact: false,
          multiplier: 1.0,
          message: 'No events affecting pricing on this date',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        hotelId,
        date: targetDate,
        hasImpact: true,
        ...impact,
      },
    });
  } catch (error) {
    console.error('[Calendar] Get impact error:', error);
    res.status(500).json({ success: false, message: 'Failed to get impact' });
  }
});

// ─── GET /calendar/range-impact/:hotelId ──────────────────────────────────────

/**
 * GET /calendar/range-impact/:hotelId
 * Get aggregated impact for a date range
 *
 * Query params:
 * - startDate: ISO date string (optional, defaults to today)
 * - endDate: ISO date string (optional, defaults to 30 days from startDate)
 */
router.get('/range-impact/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date();
    const end = endDate
      ? new Date(endDate as string)
      : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);

    const rangeImpact = await eventCalendarService.getRangeImpact(hotelId, start, end);

    res.json({
      success: true,
      data: {
        hotelId,
        dateRange: { startDate: start, endDate: end },
        ...rangeImpact,
      },
    });
  } catch (error) {
    console.error('[Calendar] Get range impact error:', error);
    res.status(500).json({ success: false, message: 'Failed to get range impact' });
  }
});

// ─── POST /calendar/crawl/:city ────────────────────────────────────────────────

/**
 * POST /calendar/crawl/:city
 * Trigger event crawling for a city
 *
 * In production, this would integrate with external event APIs
 */
router.post('/crawl/:city', async (req: Request, res: Response) => {
  try {
    const { city } = req.params;

    if (!city) {
      res.status(400).json({ success: false, message: 'city is required' });
      return;
    }

    const events = await eventCalendarService.crawlEvents(city);

    res.json({
      success: true,
      data: {
        city,
        eventsFound: events.length,
        events,
      },
      message: `Crawled ${events.length} events for ${city}`,
    });
  } catch (error) {
    console.error('[Calendar] Crawl error:', error);
    res.status(500).json({ success: false, message: 'Failed to crawl events' });
  }
});

// ─── DELETE /calendar/events/:eventId ─────────────────────────────────────────

/**
 * DELETE /calendar/events/:eventId
 * Delete an event
 */
router.delete('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'eventId is required' });
      return;
    }

    const affectedHotels = await eventCalendarService.getAffectedHotels(eventId);
    const deleted = await eventCalendarService.deleteEvent(eventId);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Trigger price recalculation for affected hotels
    for (const hotelId of affectedHotels) {
      await eventCalendarService.triggerPriceUpdate(hotelId);
    }

    res.json({
      success: true,
      message: `Event deleted. Price recalculation triggered for ${affectedHotels.length} hotel(s).`,
    });
  } catch (error) {
    console.error('[Calendar] Delete event error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event' });
  }
});

// ─── PUT /calendar/events/:eventId ────────────────────────────────────────────

/**
 * PUT /calendar/events/:eventId
 * Update an event
 */
router.put('/events/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      res.status(400).json({ success: false, message: 'eventId is required' });
      return;
    }

    const updates = req.body;

    // Parse dates if provided
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const event = await eventCalendarService.updateEvent(eventId, updates);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found' });
      return;
    }

    // Trigger price recalculation for affected hotels
    for (const hotelId of event.hotelIds) {
      await eventCalendarService.triggerPriceUpdate(hotelId);
    }

    res.json({
      success: true,
      data: event,
      message: `Event updated. Price recalculation triggered for ${event.hotelIds.length} hotel(s).`,
    });
  } catch (error) {
    console.error('[Calendar] Update event error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
});

// ─── GET /calendar/city/:city ─────────────────────────────────────────────────

/**
 * GET /calendar/city/:city
 * Get all events for a city
 */
router.get('/city/:city', async (req: Request, res: Response) => {
  try {
    const { city } = req.params;
    const { startDate, endDate } = req.query;

    if (!city) {
      res.status(400).json({ success: false, message: 'city is required' });
      return;
    }

    const start = startDate
      ? new Date(startDate as string)
      : new Date();
    const end = endDate
      ? new Date(endDate as string)
      : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // Default 90 days

    const events = await eventCalendarService.getEventsByCity(city, start, end);

    res.json({
      success: true,
      data: {
        city,
        dateRange: { startDate: start, endDate: end },
        events,
        totalEvents: events.length,
      },
    });
  } catch (error) {
    console.error('[Calendar] Get city events error:', error);
    res.status(500).json({ success: false, message: 'Failed to get city events' });
  }
});

// ─── POST /calendar/bulk ───────────────────────────────────────────────────────

/**
 * POST /calendar/bulk
 * Bulk add events
 */
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ success: false, message: 'events array is required' });
      return;
    }

    // Parse dates for each event
    const parsedEvents = events.map((event) => ({
      ...event,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
    }));

    const results = await eventCalendarService.bulkAddEvents(parsedEvents);

    res.json({
      success: true,
      data: results,
      message: `Bulk add complete: ${results.added} added, ${results.skipped} skipped`,
    });
  } catch (error) {
    console.error('[Calendar] Bulk add error:', error);
    res.status(500).json({ success: false, message: 'Failed to bulk add events' });
  }
});

export default router;
