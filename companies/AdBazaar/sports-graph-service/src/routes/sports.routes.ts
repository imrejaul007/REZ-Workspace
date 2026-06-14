import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { sportsEventService } from '../services/sports-event.service.js';
import { teamService, CreateTeamDto } from '../services/team.service.js';
import { playerService, CreatePlayerDto } from '../services/player.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { targetingService } from '../services/targeting.service.js';
import logger from '../config/logger.js';

const router = Router();

// Validation schemas
const CreateEventSchema = z.object({
  name: z.string().min(1),
  sport: z.enum(['cricket', 'football', 'hockey', 'tennis', 'basketball', 'volleyball', 'badminton', 'kabaddi', 'wrestling', 'other']),
  tournament: z.string().optional(),
  season: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled', 'postponed']).default('scheduled'),
  venue: z.object({
    name: z.string(),
    address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string().default('India'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    capacity: z.number().positive(),
    type: z.enum(['stadium', 'arena', 'ground', 'indoor', 'outdoor']),
    amenities: z.array(z.string()).default([])
  }),
  teams: z.array(z.object({
    name: z.string(),
    logo: z.string().optional(),
    homeCity: z.string().optional()
  })).optional(),
  expectedFootfall: z.number().positive().optional(),
  broadcastChannels: z.array(z.string()).default([]),
  prizePool: z.number().optional(),
  metadata: z.record(z.unknown()).default({})
});

const UpdateEventSchema = CreateEventSchema.partial();

const CreateTeamSchema = z.object({
  eventId: z.string(),
  name: z.string().min(1),
  logo: z.string().optional(),
  fans: z.number().min(0).default(0),
  ranking: z.number().optional(),
  homeCity: z.string().optional(),
  stats: z.object({
    wins: z.number().min(0).default(0),
    losses: z.number().min(0).default(0),
    draws: z.number().min(0).default(0)
  }).optional(),
  metadata: z.record(z.unknown()).default({})
});

const CreatePlayerSchema = z.object({
  eventId: z.string(),
  teamId: z.string(),
  name: z.string().min(1),
  position: z.string().optional(),
  jerseyNumber: z.number().optional(),
  stats: z.object({
    matches: z.number().min(0).default(0),
    goals: z.number().optional(),
    assists: z.number().optional(),
    points: z.number().optional(),
    rebounds: z.number().optional(),
    wickets: z.number().optional(),
    runs: z.number().optional()
  }).optional(),
  nationality: z.string().optional(),
  age: z.number().optional(),
  metadata: z.record(z.unknown()).default({})
});

const CreatePlayersBatchSchema = z.object({
  players: z.array(CreatePlayerSchema)
});

// POST /api/sports - Register sports event
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateEventSchema.parse(req.body);
    const event = await sportsEventService.createEvent(validatedData);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Sports event created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to create sports event', { error });
      res.status(500).json({ success: false, error: 'Failed to create sports event' });
    }
  }
});

// GET /api/sports - List events
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sport, status, city, startDate, endDate, page, limit } = req.query;

    const result = await sportsEventService.listEvents({
      sport: sport as any,
      status: status as any,
      city: city as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.json({
      success: true,
      data: result.events,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    logger.error('Failed to list events', { error });
    res.status(500).json({ success: false, error: 'Failed to list events' });
  }
});

// GET /api/sports/live - Live events
router.get('/live', async (req: Request, res: Response) => {
  try {
    const events = await sportsEventService.listEvents({ status: 'live' });
    res.json({
      success: true,
      data: events.events,
      count: events.total
    });
  } catch (error) {
    logger.error('Failed to get live events', { error });
    res.status(500).json({ success: false, error: 'Failed to get live events' });
  }
});

// GET /api/sports/upcoming - Upcoming events
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const events = await sportsEventService.getUpcomingEvents(days);

    res.json({
      success: true,
      data: events,
      count: events.length,
      days
    });
  } catch (error) {
    logger.error('Failed to get upcoming events', { error });
    res.status(500).json({ success: false, error: 'Failed to get upcoming events' });
  }
});

// GET /api/sports/:id - Get event by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const event = await sportsEventService.getEventById(req.params.id);

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    res.json({ success: true, data: event });
  } catch (error) {
    logger.error('Failed to get event', { id: req.params.id, error });
    res.status(500).json({ success: false, error: 'Failed to get event' });
  }
});

// PUT /api/sports/:id - Update event
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateEventSchema.parse(req.body);
    const event = await sportsEventService.updateEvent(req.params.id, validatedData);

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    res.json({
      success: true,
      data: event,
      message: 'Event updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to update event', { id: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to update event' });
    }
  }
});

// DELETE /api/sports/:id - Delete event
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await sportsEventService.deleteEvent(req.params.id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Event not found' });
      return;
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete event', { id: req.params.id, error });
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

// POST /api/sports/:id/teams - Add teams to event
router.post('/:id/teams', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateTeamSchema.parse(req.body);
    validatedData.eventId = req.params.id;

    const team = await teamService.createTeam(validatedData);

    res.status(201).json({
      success: true,
      data: team,
      message: 'Team added successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to add team', { eventId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to add team' });
    }
  }
});

// GET /api/sports/:id/teams - List teams for event
router.get('/:id/teams', async (req: Request, res: Response) => {
  try {
    const teams = await teamService.getTeamsByEventId(req.params.id);

    res.json({
      success: true,
      data: teams,
      count: teams.length
    });
  } catch (error) {
    logger.error('Failed to list teams', { eventId: req.params.id, error });
    res.status(500).json({ success: false, error: 'Failed to list teams' });
  }
});

// POST /api/sports/:id/players - Add players to event
router.post('/:id/players', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (Array.isArray(body.players)) {
      // Batch create
      const playersWithEventId = body.players.map((p: any) => ({
        ...p,
        eventId: req.params.id
      }));
      const validatedData = CreatePlayersBatchSchema.parse({ players: playersWithEventId });
      const players = await playerService.createPlayers(validatedData.players);

      res.status(201).json({
        success: true,
        data: players,
        count: players.length,
        message: 'Players added successfully'
      });
    } else {
      // Single create
      const validatedData = CreatePlayerSchema.parse(body);
      validatedData.eventId = req.params.id;
      const player = await playerService.createPlayer(validatedData);

      res.status(201).json({
        success: true,
        data: player,
        message: 'Player added successfully'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    } else {
      logger.error('Failed to add players', { eventId: req.params.id, error });
      res.status(500).json({ success: false, error: 'Failed to add players' });
    }
  }
});

// GET /api/sports/:id/players - List players for event
router.get('/:id/players', async (req: Request, res: Response) => {
  try {
    const { teamId } = req.query;

    let players;
    if (teamId) {
      players = await playerService.getPlayersByTeamId(teamId as string);
    } else {
      players = await playerService.getPlayersByEventId(req.params.id);
    }

    res.json({
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    logger.error('Failed to list players', { eventId: req.params.id, error });
    res.status(500).json({ success: false, error: 'Failed to list players' });
  }
});

// GET /api/sports/:id/analytics - Sports analytics
router.get('/:id/analytics', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;

    if (type === 'footfall') {
      const prediction = await analyticsService.predictFootfall(req.params.id);
      res.json({
        success: true,
        data: prediction
      });
    } else if (type === 'performance') {
      const performance = await analyticsService.getEventPerformance(req.params.id);
      res.json({
        success: true,
        data: performance
      });
    } else {
      const analytics = await analyticsService.getAnalyticsByEventId(req.params.id);
      const footfall = await analyticsService.predictFootfall(req.params.id);

      res.json({
        success: true,
        data: {
          analytics,
          footfall,
          eventId: req.params.id
        }
      });
    }
  } catch (error) {
    logger.error('Failed to get analytics', { eventId: req.params.id, error });
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// GET /api/sports/:id/targeting - Ad targeting
router.get('/:id/targeting', async (req: Request, res: Response) => {
  try {
    const { radiusKm, merchantCategories, category } = req.query;

    if (category) {
      const recommendation = await targetingService.generateCampaignRecommendations(
        req.params.id,
        category as string
      );
      res.json({
        success: true,
        data: recommendation
      });
    } else {
      const targeting = await targetingService.getTargetingData(req.params.id, {
        radiusKm: radiusKm ? parseInt(radiusKm as string) : undefined,
        merchantCategories: merchantCategories ? (merchantCategories as string).split(',') : undefined
      });

      res.json({
        success: true,
        data: targeting
      });
    }
  } catch (error) {
    logger.error('Failed to get targeting data', { eventId: req.params.id, error });
    res.status(500).json({ success: false, error: 'Failed to get targeting data' });
  }
});

export default router;