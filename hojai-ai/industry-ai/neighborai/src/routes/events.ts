/**
 * NEIGHBORAI - Events Routes
 */

import { Router, Response } from 'express';
import { Event } from '../models';
import { eventSchema, eventUpdateSchema } from '../utils/validators';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { CommunityAgentService } from '../services/ai-employees';
import { logger } from '../middleware/logger';

const router = Router();

// GET /api/events - List events
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { upcoming, past, limit = 50, page = 1 } = req.query;
    const query: any = {};

    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    } else if (past === 'true') {
      query.date = { $lt: new Date() };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const events = await Event.find(query)
      .sort({ date: upcoming !== 'false' ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    // Get statistics
    const analytics = await CommunityAgentService.getEventAnalytics();

    logger.info('Events fetched', { count: events.length, filters: req.query, userId: req.userId });

    res.json({
      success: true,
      events,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      analytics: analytics.summary
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/:id - Get single event
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    // Get attendee details
    const attendeeDetails = [];
    for (const flatNumber of event.attendees) {
      const { Resident } = await import('../models');
      const resident = await Resident.findOne({ flatNumber });
      if (resident) {
        attendeeDetails.push({
          flatNumber,
          name: resident.name,
          wing: resident.wing
        });
      } else {
        attendeeDetails.push({ flatNumber, name: 'Unknown' });
      }
    }

    res.json({
      success: true,
      event,
      attendeeDetails,
      attendeeCount: event.attendees.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events - Create event
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = eventSchema.parse(req.body);

    const event = await Event.create({
      ...validatedData,
      attendees: []
    });

    logger.info('Event created', {
      eventId: event._id,
      title: event.title,
      date: event.date,
      userId: req.userId
    });

    res.status(201).json({
      success: true,
      event,
      message: `Event "${event.title}" scheduled for ${new Date(event.date).toLocaleDateString()}`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    next(error);
  }
});

// PATCH /api/events/:id - Update event
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const validatedData = eventUpdateSchema.parse(req.body);

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    logger.info('Event updated', {
      eventId: event._id,
      updates: Object.keys(validatedData),
      userId: req.userId
    });

    res.json({
      success: true,
      event,
      message: 'Event updated successfully'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.errors
      });
    }
    next(error);
  }
});

// POST /api/events/:id/rsvp - RSVP to event
router.post('/:id/rsvp', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { flatNumber, rsvp } = req.body;

    if (!flatNumber || !rsvp) {
      return res.status(400).json({
        success: false,
        error: 'Flat number and RSVP status are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const attending = rsvp === 'yes';
    const result = await CommunityAgentService.rsvpEvent(req.params.id, flatNumber, attending);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    if (error.message === 'Event not found') {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }
    next(error);
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    logger.info('Event deleted', {
      eventId: req.params.id,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/events/:id/announce - Announce event to residents
router.post('/:id/announce', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
        code: 'EVENT_NOT_FOUND'
      });
    }

    // Get all residents
    const { Resident } = await import('../models');
    const residents = await Resident.find({});

    logger.info('Event announced', {
      eventId: event._id,
      title: event.title,
      residentCount: residents.length
    });

    res.json({
      success: true,
      message: `Event "${event.title}" announced to ${residents.length} residents`,
      announcement: {
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        description: event.description
      },
      recipients: residents.map(r => ({ flatNumber: r.flatNumber, name: r.name }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;