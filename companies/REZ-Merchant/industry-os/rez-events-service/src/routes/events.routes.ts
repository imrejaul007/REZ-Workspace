import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventType, EventStatus, Guest } from '../models';
import { authenticateToken } from '../middleware/auth';
import { sendGuestReminderPush, trackTicketSaleEvent } from '../integrations/rabtul';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createEventSchema = z.object({
  merchantId: z.string().min(1),
  name: z.string().min(1),
  type: z.nativeEnum(EventType),
  description: z.string().min(1),
  venueId: z.string().optional(),
  startDate: z.string().transform(s => new Date(s)),
  endDate: z.string().transform(s => new Date(s)),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  expectedGuests: z.number().int().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional()
});

const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.nativeEnum(EventType).optional(),
  description: z.string().min(1).optional(),
  venueId: z.string().optional(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  endDate: z.string().transform(s => new Date(s)).optional(),
  startTime: z.string().min(1).optional(),
  endTime: z.string().min(1).optional(),
  expectedGuests: z.number().int().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional()
});

const searchQuerySchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  merchantId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(EventStatus)
});

const budgetUpdateSchema = z.object({
  spent: z.number().nonnegative()
});

/**
 * POST /api/events - Create a new event
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createEventSchema.parse(req.body);

    const event = new Event({
      ...validatedData,
      eventId: `EVT-${uuidv4().substring(0, 8).toUpperCase()}`,
      confirmedGuests: 0,
      spent: 0,
      status: EventStatus.PLANNING,
      tags: validatedData.tags || []
    });

    await event.save();

    // Track event creation via RABTUL SDK for intent analysis
    try {
      await trackTicketSaleEvent({
        customerId: validatedData.merchantId,
        merchantId: validatedData.merchantId,
        eventId: event.eventId,
        eventName: event.name,
        ticketId: event.eventId,
        ticketType: event.type,
        quantity: 1,
        totalAmount: 0,
        currency: 'INR',
        action: 'purchased',
        metadata: { eventType: event.type, expectedGuests: event.expectedGuests },
      });
    } catch (trackError) {
      logger.warn('Failed to track event creation', { error: trackError, eventId: event.eventId });
    }

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/events - List/search events
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$text = { $search: query.q };
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }
    if (query.startDate) {
      filter.startDate = { $gte: new Date(query.startDate) };
    }
    if (query.endDate) {
      filter.endDate = { ...(filter.endDate as object || {}), $lte: new Date(query.endDate) };
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        events,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/events/:id - Get event by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOne({ eventId: req.params.id });

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/events/:id - Update event
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateEventSchema.parse(req.body);

    const event = await Event.findOneAndUpdate(
      { eventId: req.params.id },
      { $set: validatedData },
      { new: true }
    );

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * DELETE /api/events/:id - Delete event
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOneAndDelete({ eventId: req.params.id });

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/events/:id/status - Update event status
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const validatedData = updateStatusSchema.parse(req.body);

    const event = await Event.findOneAndUpdate(
      { eventId: req.params.id },
      { $set: { status: validatedData.status } },
      { new: true }
    );

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/events/:id/timeline - Get event timeline
 */
router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const event = await Event.findOne({ eventId: req.params.id });

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    const now = new Date();
    const timeline = {
      planning: {
        completed: event.status !== EventStatus.PLANNING,
        status: event.status === EventStatus.PLANNING ? 'in_progress' : 'completed'
      },
      confirmed: {
        completed: [EventStatus.IN_PROGRESS, EventStatus.COMPLETED].includes(event.status),
        status: event.status === EventStatus.CONFIRMED ? 'in_progress' :
                [EventStatus.IN_PROGRESS, EventStatus.COMPLETED].includes(event.status) ? 'completed' : 'pending'
      },
      eventStart: {
        completed: event.status === EventStatus.COMPLETED,
        status: event.status === EventStatus.IN_PROGRESS ? 'in_progress' :
                event.status === EventStatus.COMPLETED ? 'completed' : 'pending',
        scheduledDate: event.startDate,
        scheduledTime: event.startTime
      },
      eventEnd: {
        completed: event.status === EventStatus.COMPLETED,
        status: event.status === EventStatus.COMPLETED ? 'completed' : 'pending',
        scheduledDate: event.endDate,
        scheduledTime: event.endTime
      }
    };

    res.json({
      success: true,
      data: {
        event,
        timeline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PATCH /api/events/:id/budget - Update budget spent
 */
router.patch('/:id/budget', async (req: Request, res: Response) => {
  try {
    const validatedData = budgetUpdateSchema.parse(req.body);

    const event = await Event.findOneAndUpdate(
      { eventId: req.params.id },
      { $set: { spent: validatedData.spent } },
      { new: true }
    );

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        event,
        remainingBudget: event.budget - event.spent
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/events/meta/types - Get all event types
 */
router.get('/meta/types', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(EventType)
  });
});

export default router;