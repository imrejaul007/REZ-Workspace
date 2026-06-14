import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { conferenceService, speakerService, sessionService, analyticsService } from '../services';
import { AuthenticatedRequest, internalServiceAuth } from '../middleware';
import { CreateConferenceRequest, UpdateConferenceRequest, AddSpeakerRequest, AddSessionRequest, ConferenceFilters } from '../types';

const router = Router();

// Validation schemas
const createConferenceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  date: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }),
  venue: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
    capacity: z.number().int().positive()
  }),
  industry: z.string().min(1),
  expectedAttendance: z.number().int().positive(),
  topics: z.array(z.string()),
  tags: z.array(z.string()),
  organizer: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string().min(1)
  }),
  sponsors: z.array(z.object({
    name: z.string(),
    tier: z.enum(['platinum', 'gold', 'silver', 'bronze']),
    logo: z.string().optional()
  })).optional(),
  registrationUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  socialMedia: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    facebook: z.string().optional()
  }).optional(),
  targetAudience: z.array(z.string()).optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string()
  }).optional()
});

const updateConferenceSchema = createConferenceSchema.partial();

const addSpeakerSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  bio: z.string().min(1),
  topic: z.string().min(1),
  expertise: z.array(z.string()),
  followers: z.object({
    twitter: z.number().optional(),
    linkedin: z.number().optional(),
    instagram: z.number().optional()
  }).optional(),
  photo: z.string().optional(),
  socialLinks: z.object({
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional()
  }).optional()
});

const addSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['keynote', 'panel', 'workshop', 'networking', 'breakout', 'other']),
  speakerIds: z.array(z.string()),
  room: z.string().min(1),
  date: z.string().datetime(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  capacity: z.number().int().positive().optional(),
  tags: z.array(z.string()),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  materials: z.array(z.object({
    name: z.string(),
    url: z.string(),
    type: z.enum(['slides', 'video', 'document'])
  })).optional()
});

const listConferencesSchema = z.object({
  industry: z.string().optional(),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAttendance: z.coerce.number().optional(),
  maxAttendance: z.coerce.number().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

// Apply auth to all routes
router.use(internalServiceAuth);

/**
 * POST /api/conferences - Register a new conference
 */
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createConferenceSchema.parse(req.body) as CreateConferenceRequest;
    const conference = await conferenceService.create(data);

    res.status(201).json({
      success: true,
      data: conference,
      message: 'Conference created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences - List conferences
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listConferencesSchema.parse(req.query);

    const filters: ConferenceFilters = {
      ...query,
      tags: query.tags ? query.tags.split(',') : undefined
    };

    const result = await conferenceService.list(filters);

    res.json({
      success: true,
      data: result.conferences,
      pagination: {
        total: result.total,
        page: filters.page || 1,
        limit: filters.limit || 20,
        pages: Math.ceil(result.total / (filters.limit || 20))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences/upcoming - Get upcoming conferences
 */
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const conferences = await conferenceService.getUpcoming(Math.min(limit, 50));

    res.json({
      success: true,
      data: conferences,
      count: conferences.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences/:id - Get conference by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const conference = await conferenceService.getById(req.params.id);

    if (!conference) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conference not found'
      });
      return;
    }

    res.json({
      success: true,
      data: conference
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/conferences/:id - Update conference
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateConferenceSchema.parse(req.body) as UpdateConferenceRequest;
    const conference = await conferenceService.update(req.params.id, data);

    if (!conference) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conference not found'
      });
      return;
    }

    res.json({
      success: true,
      data: conference,
      message: 'Conference updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/conferences/:id - Delete conference
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const deleted = await conferenceService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conference not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Conference deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conferences/:id/speakers - Add speaker to conference
 */
router.post('/:id/speakers', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = addSpeakerSchema.parse(req.body) as AddSpeakerRequest;
    const speaker = await speakerService.addSpeaker(req.params.id, data);

    res.status(201).json({
      success: true,
      data: speaker,
      message: 'Speaker added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences/:id/speakers - List speakers for conference
 */
router.get('/:id/speakers', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const speakers = await speakerService.getByConference(req.params.id);

    res.json({
      success: true,
      data: speakers,
      count: speakers.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conferences/:id/sessions - Add session to conference
 */
router.post('/:id/sessions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = addSessionSchema.parse(req.body) as AddSessionRequest;
    const session = await sessionService.addSession(req.params.id, data);

    res.status(201).json({
      success: true,
      data: session,
      message: 'Session added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences/:id/sessions - Get sessions for conference
 */
router.get('/:id/sessions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sessions = await sessionService.getByConference(req.params.id);

    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences/:id/analytics - Get conference analytics
 */
router.get('/:id/analytics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const analytics = await analyticsService.getAnalytics(req.params.id);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conferences/:id/targeting - Get ad targeting data
 */
router.get('/:id/targeting', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { targetingService } = await import('../services');

    const criteria = {
      industry: req.query.industry as string,
      topics: req.query.topics ? (req.query.topics as string).split(',') : undefined,
      audience: req.query.audience ? (req.query.audience as string).split(',') : undefined,
      location: req.query.location as string,
      speakerInfluence: req.query.minFollowers ? {
        minFollowers: parseInt(req.query.minFollowers as string)
      } : undefined
    };

    const targetingData = await targetingService.getTargetingData(criteria);

    // Filter to only this conference
    const filteredData = {
      ...targetingData,
      conferences: targetingData.conferences.filter(c => c.conferenceId === req.params.id),
      speakers: targetingData.speakers,
      sessions: targetingData.sessions.filter(s => {
        // Get sessions for this conference from targeting service
        return true;
      })
    };

    res.json({
      success: true,
      data: filteredData
    });
  } catch (error) {
    next(error);
  }
});

export default router;