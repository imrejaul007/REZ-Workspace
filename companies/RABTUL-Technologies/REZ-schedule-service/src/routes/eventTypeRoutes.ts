// ReZ Schedule - Event Type Routes
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { eventTypeService } from '../services/eventTypeService';
import { logger } from '../utils/logger';

const router = Router();

// Validation schemas
const createEventTypeSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  duration: z.number().int().min(5).max(480),
  bufferTime: z.number().int().min(0).max(120).default(0),
  locationType: z.enum(['IN_PERSON', 'PHONE_CALL', 'VIDEO_CALL', 'CUSTOM_LINK']).default('VIDEO_CALL'),
  locationAddress: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  requiresConfirmation: z.boolean().default(false),
  disableGuests: z.boolean().default(false),
  maxBookingsPerDay: z.number().int().min(1).optional(),
  minNoticeMinutes: z.number().int().min(0).default(0),
  slotInterval: z.number().int().min(5).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  paidBooking: z.boolean().default(false),
  scheduleId: z.string().optional(),
  customQuestions: z.array(z.object({
    question: z.string(),
    type: z.enum(['TEXT', 'TEXTAREA', 'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO']).default('TEXT'),
    required: z.boolean().default(false),
    options: z.array(z.string()).optional(),
  })).optional(),
});

const updateEventTypeSchema = createEventTypeSchema.partial();

// Middleware to extract user ID (from auth service)
const extractUserId = (req: Request, res: Response, next: NextFunction) => {
  // In production, this would verify JWT and extract user ID
  // For now, accept userId from header
  req.headers['x-user-id'] = req.headers['x-user-id'] || 'demo-user-id';
  next();
};

/**
 * List event types for current user
 * GET /api/event-types
 */
router.get('/', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const eventTypes = await eventTypeService.listEventTypes(userId);

    res.json({
      success: true,
      data: eventTypes,
    });
  } catch (error) {
    logger.error('[EventType] List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list event types',
    });
  }
});

/**
 * Create event type
 * POST /api/event-types
 */
router.post('/', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const data = createEventTypeSchema.parse(req.body);

    const eventType = await eventTypeService.createEventType(userId, data);

    res.status(201).json({
      success: true,
      data: eventType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('[EventType] Create error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create event type',
    });
  }
});

/**
 * Get event type by ID
 * GET /api/event-types/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const eventType = await eventTypeService.getEventTypeById(id);

    if (!eventType) {
      return res.status(404).json({
        success: false,
        error: 'Event type not found',
      });
    }

    res.json({
      success: true,
      data: eventType,
    });
  } catch (error) {
    logger.error('[EventType] Get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event type',
    });
  }
});

/**
 * Get public event type by username and slug
 * GET /api/event-types/public/:username/:slug
 */
router.get('/public/:username/:slug', async (req: Request, res: Response) => {
  try {
    const { username, slug } = req.params;

    const eventType = await eventTypeService.getEventTypeByUsernameAndSlug(username, slug);

    if (!eventType) {
      return res.status(404).json({
        success: false,
        error: 'Event type not found',
      });
    }

    // Return limited info for public view
    res.json({
      success: true,
      data: {
        id: eventType.id,
        slug: eventType.slug,
        title: eventType.title,
        description: eventType.description,
        duration: eventType.duration,
        locationType: eventType.locationType,
        locationAddress: eventType.locationAddress,
        meetingUrl: eventType.meetingUrl,
        phoneNumber: eventType.phoneNumber,
        price: eventType.price,
        currency: eventType.currency,
        paidBooking: eventType.paidBooking,
        requiresConfirmation: eventType.requiresConfirmation,
        user: {
          username: eventType.user.username,
          name: eventType.user.name,
          avatarUrl: eventType.user.avatarUrl,
        },
        customQuestions: eventType.customQuestions.map(q => ({
          id: q.id,
          question: q.question,
          type: q.type,
          required: q.required,
          options: q.options,
        })),
      },
    });
  } catch (error) {
    logger.error('[EventType] Public get error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event type',
    });
  }
});

/**
 * Update event type
 * PUT /api/event-types/:id
 */
router.put('/:id', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const data = updateEventTypeSchema.parse(req.body);

    const eventType = await eventTypeService.updateEventType(id, userId, data);

    res.json({
      success: true,
      data: eventType,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('[EventType] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event type',
    });
  }
});

/**
 * Delete event type
 * DELETE /api/event-types/:id
 */
router.delete('/:id', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    await eventTypeService.deleteEventType(id, userId);

    res.json({
      success: true,
      message: 'Event type deleted',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    if (error instanceof Error && error.message.includes('active bookings')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('[EventType] Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete event type',
    });
  }
});

/**
 * Toggle event type active status
 * PATCH /api/event-types/:id/toggle
 */
router.patch('/:id/toggle', extractUserId, async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    const eventType = await eventTypeService.toggleEventType(id, userId);

    res.json({
      success: true,
      data: eventType,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }

    logger.error('[EventType] Toggle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle event type',
    });
  }
});

export default router;
