/**
 * Event Routes
 * Handles all event operations including creation, RSVP, and check-in
 *
 * @module routes/events
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Event, Group, RiderProfile } from '../models/index';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { validateBody } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

/** Schema for creating a new event */
const CreateEventSchema = z.object({
  groupId: z.string().optional(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  type: z.enum(['ride', 'meet', 'rally', 'track_day', 'workshop', 'rally_event', 'rally_stage']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  startLocation: z.object({
    name: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string(),
    landmark: z.string().optional(),
  }),
  endLocation: z.object({
    name: z.string(),
    coordinates: z.tuple([z.number(), z.number()]),
    address: z.string(),
  }).optional(),
  route: z.object({
    name: z.string().optional(),
    start: z.object({
      name: z.string(),
      coordinates: z.tuple([z.number(), z.number()]),
      address: z.string().optional(),
    }).optional(),
    end: z.object({
      name: z.string(),
      coordinates: z.tuple([z.number(), z.number()]),
      address: z.string().optional(),
    }).optional(),
    waypoints: z.array(z.object({
      name: z.string(),
      coordinates: z.tuple([z.number(), z.number()]),
      address: z.string().optional(),
    })).optional(),
    distance: z.number().optional(),
    difficulty: z.enum(['easy', 'moderate', 'hard', 'extreme']).optional(),
  }).optional(),
  maxParticipants: z.number().int().positive().optional(),
  minTrustScore: z.number().min(0).max(100).optional(),
  requiredGear: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'expert', 'all_levels']).optional(),
  checkInEnabled: z.boolean().optional(),
  checkInRadius: z.number().int().positive().optional(),
  fees: z.object({
    amount: z.number().min(0),
    currency: z.string().optional(),
    includes: z.array(z.string()).optional(),
    refundPolicy: z.enum(['full', 'partial', 'none']).optional(),
  }).optional(),
  rewards: z.object({
    points: z.number().optional(),
    badges: z.array(z.string()).optional(),
    certificate: z.boolean().optional(),
  }).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  banner: z.string().url().optional(),
  coverImage: z.string().url().optional(),
});

/** Schema for updating event (all fields optional) */
const UpdateEventSchema = CreateEventSchema.partial();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a URL-friendly slug from event title
 * @param title - Event title
 * @returns URL-safe slug with timestamp
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

// ============================================================================
// Routes
// ============================================================================

/**
 * @route POST /api/events
 * @desc Create a new event
 * @access Private
 *
 * @requestBody - Event data including title, description, time, location
 * @returns Created event
 *
 * @example
 * POST /api/events
 * {
 *   "title": "Monsoon Ride to Mahabaleshwar",
 *   "description": "A thrilling ride through the Western Ghats",
 *   "type": "ride",
 *   "startTime": "2024-07-15T06:00:00Z",
 *   "endTime": "2024-07-15T18:00:00Z",
 *   "startLocation": { "name": "Mumbai", "coordinates": [72.8777, 19.0760], "address": "Mumbai, Maharashtra" }
 * }
 */
router.post('/',
  authenticate,
  validateBody(CreateEventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    // If group event, verify admin permissions
    if (req.body.groupId) {
      const group = await Group.findById(req.body.groupId);
      if (!group) {
        res.status(404).json({ error: 'Group not found' });
        return;
      }
      if (!group.isAdmin(rider._id)) {
        res.status(403).json({ error: 'Only group admins can create events' });
        return;
      }
    }

    const slug = createSlug(req.body.title);

    const event = new Event({
      ...req.body,
      organizerId: rider._id,
      slug,
      status: 'published',
    });

    await event.save();

    logger.info(`Event created: ${event._id} by rider ${rider._id}`);

    res.status(201).json({
      success: true,
      data: event,
    });
  })
);

/**
 * @route GET /api/events
 * @desc Search and filter events
 * @access Public
 *
 * @query q - Search query
 * @query type - Filter by event type
 * @query city - Filter by city
 * @query startDate - Filter start date range
 * @query endDate - Filter end date range
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 20)
 * @returns Paginated list of upcoming events
 *
 * @example
 * GET /api/events?type=ride&city=Mumbai&startDate=2024-07-01
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    const { q, type, city, startDate, endDate, page = '1', limit = '20' } = req.query;

    const query: any = { status: 'published' };

    if (q) {
      query.$text = { $search: q as string };
    }

    if (type) query['type'] = type;
    if (city) query['startLocation.address'] = { $regex: city, $options: 'i' };

    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate as string);
      if (endDate) query.startTime.$lte = new Date(endDate as string);
    } else {
      // Default: upcoming events only
      query.startTime = { $gte: new Date() };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizerId', 'displayName avatar')
        .populate('groupId', 'name slug avatar')
        .sort({ startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Event.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  })
);

/**
 * @route GET /api/events/:id
 * @desc Get event by ID or slug
 * @access Public
 *
 * @param id - Event MongoDB ID or slug
 * @returns Event details with organizer and group info
 *
 * @example
 * GET /api/events/monsoon-ride-to-mahabaleshwar-abc123
 */
router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const event = await Event.findOne({
      $or: [
        { _id: req.params.id },
        { slug: req.params.id },
      ],
    })
      .populate('organizerId', 'displayName avatar trustScore')
      .populate('groupId', 'name slug avatar memberCount')
      .populate('coOrganizers', 'displayName avatar');

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    res.json({
      success: true,
      data: event,
    });
  })
);

/**
 * @route PUT /api/events/:id
 * @desc Update event
 * @access Private (organizer only)
 *
 * @param id - Event MongoDB ID or slug
 * @requestBody - Partial event data
 * @returns Updated event
 *
 * @example
 * PUT /api/events/monsoon-ride-abc123
 * { "maxParticipants": 50 }
 */
router.put('/:id',
  authenticate,
  validateBody(UpdateEventSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const event = await Event.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (!event.isOrganizer(rider._id)) {
      res.status(403).json({ error: 'Only organizer can update event' });
      return;
    }

    Object.assign(event, req.body);
    await event.save();

    res.json({
      success: true,
      data: event,
    });
  })
);

/**
 * @route DELETE /api/events/:id
 * @desc Cancel event
 * @access Private (organizer only)
 *
 * @param id - Event MongoDB ID or slug
 * @requestBody - { reason: string }
 * @returns Success message
 *
 * @example
 * DELETE /api/events/monsoon-ride-abc123
 * { "reason": "Weather conditions" }
 */
router.delete('/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { reason } = req.body;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const event = await Event.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (!event.isOrganizer(rider._id)) {
      res.status(403).json({ error: 'Only organizer can cancel event' });
      return;
    }

    event.status = 'cancelled';
    event.cancellationReason = reason || 'Cancelled by organizer';
    await event.save();

    res.json({
      success: true,
      message: 'Event cancelled',
    });
  })
);

/**
 * @route POST /api/events/:id/rsvp
 * @desc RSVP to event
 * @access Private
 *
 * @param id - Event MongoDB ID or slug
 * @requestBody - { status: 'going' | 'maybe' | 'not_going', note?: string }
 * @returns RSVP status and participant count
 *
 * @example
 * POST /api/events/monsoon-ride-abc123/rsvp
 * { "status": "going", "note": "Looking forward to it!" }
 */
router.post('/:id/rsvp',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { status = 'going', note } = req.body;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const event = await Event.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (event.status !== 'published') {
      res.status(400).json({ error: 'Event is not accepting RSVPs' });
      return;
    }

    if (rider.trustScore < event.minTrustScore) {
      res.status(400).json({
        error: `Minimum trust score of ${event.minTrustScore} required`,
        yourScore: rider.trustScore,
      });
      return;
    }

    await event.rsvp(rider._id, status);

    res.json({
      success: true,
      data: {
        status,
        currentParticipants: event.currentParticipants,
      },
    });
  })
);

/**
 * @route DELETE /api/events/:id/rsvp
 * @desc Cancel RSVP
 * @access Private
 *
 * @param id - Event MongoDB ID or slug
 * @returns Success message
 *
 * @example
 * DELETE /api/events/monsoon-ride-abc123/rsvp
 */
router.delete('/:id/rsvp',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const event = await Event.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    await event.cancelRsvp(rider._id);

    res.json({
      success: true,
      message: 'RSVP cancelled',
    });
  })
);

/**
 * @route POST /api/events/:id/checkin
 * @desc Check-in to event
 * @access Private
 *
 * @param id - Event MongoDB ID or slug
 * @requestBody - { type: 'start' | 'end', location?: { coordinates, address } }
 * @returns Check-in confirmation
 *
 * @example
 * POST /api/events/monsoon-ride-abc123/checkin
 * { "type": "start" }
 */
router.post('/:id/checkin',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { type = 'start', location } = req.body;

    const rider = await RiderProfile.findOne({ userId });
    if (!rider) {
      res.status(404).json({ error: 'Rider profile not found' });
      return;
    }

    const event = await Event.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    if (!event.checkInEnabled) {
      res.status(400).json({ error: 'Check-in not enabled for this event' });
      return;
    }

    // Verify RSVP
    const rsvp = event.hasRSVP(rider._id);
    if (!rsvp || rsvp.status !== 'going') {
      res.status(400).json({ error: 'You must RSVP before checking in' });
      return;
    }

    await event.checkIn(rider._id, type, location);

    res.json({
      success: true,
      data: {
        type,
        timestamp: new Date(),
      },
    });
  })
);

/**
 * @route GET /api/events/:id/attendees
 * @desc Get event attendees
 * @access Public
 *
 * @param id - Event MongoDB ID or slug
 * @query status - Filter by RSVP status (default: 'going')
 * @query page - Page number (default: 1)
 * @query limit - Results per page (default: 50)
 * @returns Paginated list of attendees
 *
 * @example
 * GET /api/events/monsoon-ride-abc123/attendees?status=going
 */
router.get('/:id/attendees',
  asyncHandler(async (req: Request, res: Response) => {
    const { status = 'going', page = '1', limit = '50' } = req.query;

    const event = await Event.findOne({
      $or: [{ _id: req.params.id }, { slug: req.params.id }],
    });

    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const rsvps = event.rsvps.filter(r => r.status === status);
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const paginatedRsvps = rsvps.slice(skip, skip + parseInt(limit as string));

    const populatedRsvps = await RiderProfile.populate(paginatedRsvps, {
      path: 'riderId',
      select: 'displayName avatar trustScore ridingStyle',
    });

    res.json({
      success: true,
      data: populatedRsvps,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: rsvps.length,
        pages: Math.ceil(rsvps.length / parseInt(limit as string)),
      },
    });
  })
);

/**
 * @route GET /api/events/upcoming/list
 * @desc Get upcoming events
 * @access Public
 *
 * @query limit - Number of results (default: 20)
 * @query type - Filter by event type
 * @returns List of upcoming events
 *
 * @example
 * GET /api/events/upcoming/list?limit=10&type=ride
 */
router.get('/upcoming/list',
  asyncHandler(async (req: Request, res: Response) => {
    const { limit = '20', type } = req.query;

    const query: any = {
      status: 'published',
      startTime: { $gte: new Date() },
    };

    if (type) query['type'] = type;

    const events = await Event.find(query)
      .populate('organizerId', 'displayName avatar')
      .populate('groupId', 'name slug avatar')
      .sort({ startTime: 1 })
      .limit(parseInt(limit as string));

    res.json({
      success: true,
      data: events,
    });
  })
);

/**
 * @route GET /api/events/nearby/list
 * @desc Get events near a location
 * @access Public
 *
 * @query lat - Latitude
 * @query lng - Longitude
 * @query radius - Radius in km (default: 50)
 * @returns List of nearby events
 *
 * @example
 * GET /api/events/nearby/list?lat=19.0760&lng=72.8777&radius=25
 */
router.get('/nearby/list',
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = '50' } = req.query;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat and lng required' });
      return;
    }

    const events = await Event.find({
      status: 'published',
      startTime: { $gte: new Date() },
      'startLocation.coordinates': {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: parseInt(radius as string) * 1000,
        },
      },
    })
      .populate('organizerId', 'displayName avatar')
      .limit(20);

    res.json({
      success: true,
      data: events,
    });
  })
);

export default router;
