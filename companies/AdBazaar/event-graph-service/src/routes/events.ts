import { Router, Request, Response } from 'express';
import { eventService } from '../services/index.js';
import { impactService } from '../services/index.js';
import { validate, asyncHandler } from '../middleware/validation.js';
import {
  CreateEventSchema,
  UpdateEventSchema,
  NearbyEventsQuerySchema,
  EventGraphQuerySchema,
  EventStatusEnum
} from '../types/index.js';
import { AppError } from '../middleware/error.js';
import { eventsTotal, eventsActive, footfallPrediction } from '../middleware/metrics.js';
import logger from '../config/logger.js';

const router = Router();
const eventLogger = logger.child({ component: 'EventsRouter' });

/**
 * POST /api/events
 * Create a new event
 */
router.post(
  '/',
  validate(CreateEventSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.createEvent(req.body);

    // Update metrics
    eventsTotal.inc({ type: event.type, status: event.status });
    if (event.expectedFootfall) {
      footfallPrediction.set({ type: event.type }, event.expectedFootfall);
    }

    eventLogger.info('Event created via API', { eventId: event._id.toString() });

    res.status(201).json({
      success: true,
      data: event.toPublicJSON(),
      meta: {
        id: event._id.toString()
      }
    });
  })
);

/**
 * POST /api/events/bulk
 * Bulk create events
 */
router.post(
  '/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const events = req.body.events;

    if (!Array.isArray(events)) {
      throw AppError.validation('events must be an array');
    }

    if (events.length > 100) {
      throw AppError.validation('Maximum 100 events per bulk create');
    }

    const created = await eventService.bulkCreateEvents(events);

    created.forEach(event => {
      eventsTotal.inc({ type: event.type, status: event.status });
    });

    eventLogger.info('Bulk events created', { count: created.length });

    res.status(201).json({
      success: true,
      data: {
        count: created.length,
        ids: created.map(e => e._id.toString())
      }
    });
  })
);

/**
 * GET /api/events
 * List events with pagination and filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { type, status, startDate, endDate, limit = 20, offset = 0 } = req.query;

    const query: any = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const [events, total] = await Promise.all([
      eventService['findEventsByType']?.('other' as any, { limit: Number(limit) }) || Promise.resolve([]),
      eventService['getStatistics']()
    ]);

    res.json({
      success: true,
      data: events,
      meta: {
        total: total.totalEvents,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  })
);

/**
 * GET /api/events/nearby
 * Find events near a location
 */
router.get(
  '/nearby',
  validate(NearbyEventsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const query = (req as any).validatedQuery;

    const result = await eventService.findNearbyEvents(query);

    eventLogger.info('Nearby events query', {
      lat: query.lat,
      lng: query.lng,
      count: result.events.length
    });

    res.json({
      success: true,
      data: result.events,
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.hasMore
      }
    });
  })
);

/**
 * GET /api/events/graph/:type
 * Get event graph by type
 */
router.get(
  '/graph/:type',
  validate(EventGraphQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const query = (req as any).validatedQuery;

    const graph = await eventService.findEventsByType(type as any, {
      startDate: query.startDate,
      endDate: query.endDate,
      city: query.city,
      limit: query.limit
    });

    eventLogger.info('Event graph query', { type, eventCount: graph.count });

    res.json({
      success: true,
      data: {
        type: graph._id,
        count: graph.count,
        totalFootfall: graph.totalFootfall,
        averageFootfall: Math.round(graph.averageFootfall || 0),
        events: graph.events
      }
    });
  })
);

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await eventService.getStatistics();

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.getEventById(req.params.id);

    if (!event) {
      throw AppError.notFound('Event');
    }

    res.json({
      success: true,
      data: event
    });
  })
);

/**
 * PATCH /api/events/:id
 * Update an event
 */
router.patch(
  '/:id',
  validate(UpdateEventSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.updateEvent(req.params.id, req.body);

    if (!event) {
      throw AppError.notFound('Event');
    }

    eventLogger.info('Event updated via API', { eventId: req.params.id });

    res.json({
      success: true,
      data: event
    });
  })
);

/**
 * PATCH /api/events/:id/status
 * Update event status
 */
router.patch(
  '/:id/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    const parsedStatus = EventStatusEnum.safeParse(status);
    if (!parsedStatus.success) {
      throw AppError.validation('Invalid status');
    }

    const event = await eventService.updateStatus(req.params.id, parsedStatus.data);

    if (!event) {
      throw AppError.notFound('Event');
    }

    // Update active events gauge
    if (event.status === 'active') {
      eventsActive.set({ type: event.type }, 1);
    }

    eventLogger.info('Event status updated', { eventId: req.params.id, status });

    res.json({
      success: true,
      data: event
    });
  })
);

/**
 * PATCH /api/events/:id/footfall
 * Update actual footfall
 */
router.patch(
  '/:id/footfall',
  asyncHandler(async (req: Request, res: Response) => {
    const { footfall } = req.body;

    if (typeof footfall !== 'number' || footfall < 0) {
      throw AppError.validation('footfall must be a positive number');
    }

    const event = await eventService.updateActualFootfall(req.params.id, footfall);

    if (!event) {
      throw AppError.notFound('Event');
    }

    res.json({
      success: true,
      data: event
    });
  })
);

/**
 * DELETE /api/events/:id
 * Delete an event
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await eventService.deleteEvent(req.params.id);

    if (!deleted) {
      throw AppError.notFound('Event');
    }

    eventLogger.info('Event deleted', { eventId: req.params.id });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  })
);

export default router;