import { Router, Request, Response, NextFunction } from 'express';
import { festivalService, artistService, scheduleService, analyticsService, targetingService } from '../services/index.js';
import {
  CreateFestivalSchema,
  UpdateFestivalSchema,
  AddArtistSchema,
  AddScheduleSchema,
  UpdateScheduleSchema,
  UpdateAnalyticsSchema,
  ListFestivalsQuerySchema,
  UpcomingFestivalsQuerySchema,
} from '../services/schemas.js';
import { logger } from '../config/logger.js';
import { ZodError } from 'zod';

const router = Router();

// Helper to handle Zod validation errors
function handleZodError(error: ZodError, res: Response): void {
  const errors = error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));

  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: errors,
    },
  });
}

// ==================== FESTIVAL ROUTES ====================

/**
 * POST /api/festivals
 * Register a new festival
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = CreateFestivalSchema.parse(req.body);
    const festival = await festivalService.create(input);

    logger.info('Festival registered via API', { festivalId: festival._id });

    res.status(201).json({
      success: true,
      data: festival,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

/**
 * GET /api/festivals
 * List festivals with pagination and filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListFestivalsQuerySchema.parse(req.query);
    const result = await festivalService.list(query);

    res.json({
      success: true,
      data: {
        festivals: result.festivals,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

/**
 * GET /api/festivals/upcoming
 * Get upcoming festivals
 */
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = UpcomingFestivalsQuerySchema.parse(req.query);
    const result = await festivalService.getUpcoming(query.withinDays, {
      city: query.city,
      type: query.type,
      page: query.page,
      limit: query.limit,
    });

    res.json({
      success: true,
      data: {
        festivals: result.festivals,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

/**
 * GET /api/festivals/:id
 * Get festival by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const festival = await festivalService.getById(req.params.id);

    if (!festival) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Festival not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: festival,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/festivals/:id
 * Update festival
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateFestivalSchema.parse(req.body);
    const festival = await festivalService.update(req.params.id, input);

    if (!festival) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Festival not found',
        },
      });
      return;
    }

    logger.info('Festival updated via API', { festivalId: req.params.id });

    res.json({
      success: true,
      data: festival,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

/**
 * DELETE /api/festivals/:id
 * Delete festival
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await festivalService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Festival not found',
        },
      });
      return;
    }

    logger.info('Festival deleted via API', { festivalId: req.params.id });

    res.json({
      success: true,
      message: 'Festival deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ARTIST ROUTES ====================

/**
 * POST /api/festivals/:id/artists
 * Add artist to festival
 */
router.post('/:id/artists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = AddArtistSchema.parse(req.body);
    const artist = await artistService.addToFestival(req.params.id, input);

    logger.info('Artist added to festival via API', {
      festivalId: req.params.id,
      artistId: artist._id,
    });

    res.status(201).json({
      success: true,
      data: artist,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

/**
 * GET /api/festivals/:id/artists
 * List artists for a festival
 */
router.get('/:id/artists', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const genre = req.query.genre as string;

    const result = await artistService.getByFestival(req.params.id, { page, limit, genre });

    res.json({
      success: true,
      data: {
        artists: result.artists,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SCHEDULE ROUTES ====================

/**
 * POST /api/festivals/:id/schedule
 * Add schedule for a festival day
 */
router.post('/:id/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = AddScheduleSchema.parse(req.body);
    const schedule = await scheduleService.addSchedule(req.params.id, input);

    logger.info('Schedule added to festival via API', {
      festivalId: req.params.id,
      day: input.day,
    });

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

/**
 * GET /api/festivals/:id/schedule
 * Get schedule for a festival
 */
router.get('/:id/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const day = req.query.day ? parseInt(req.query.day as string) : undefined;

    if (day) {
      const schedule = await scheduleService.getByDay(req.params.id, day);

      if (!schedule) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Schedule not found for this day',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: schedule,
      });
    } else {
      const schedules = await scheduleService.getByFestival(req.params.id);

      res.json({
        success: true,
        data: {
          schedules,
          totalDays: schedules.length,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/festivals/:id/schedule/:day
 * Update schedule for a festival day
 */
router.put('/:id/schedule/:day', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateScheduleSchema.parse(req.body);
    const day = parseInt(req.params.day);
    const schedule = await scheduleService.updateSchedule(req.params.id, day, input);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Schedule not found',
        },
      });
      return;
    }

    logger.info('Schedule updated via API', { festivalId: req.params.id, day });

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

// ==================== ANALYTICS ROUTES ====================

/**
 * GET /api/festivals/:id/analytics
 * Get festival analytics
 */
router.get('/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period as string | undefined;
    const result = await analyticsService.getAnalyticsWithSummary(req.params.id);

    res.json({
      success: true,
      data: {
        analytics: result.analytics,
        summary: result.summary,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/festivals/:id/analytics
 * Update festival analytics
 */
router.put('/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = UpdateAnalyticsSchema.parse(req.body);
    const analytics = await analyticsService.update(req.params.id, input);

    if (!analytics) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Festival not found',
        },
      });
      return;
    }

    logger.info('Festival analytics updated via API', { festivalId: req.params.id });

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return handleZodError(error, res);
    }
    next(error);
  }
});

// ==================== TARGETING ROUTES ====================

/**
 * GET /api/festivals/:id/targeting
 * Get ad targeting configuration
 */
router.get('/:id/targeting', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targeting = await targetingService.getTargetingConfig(req.params.id);

    if (!targeting) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Festival not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: targeting,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/festivals/:id/audience
 * Get audience segments
 */
router.get('/:id/audience', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segments = await targetingService.getAudienceSegments(req.params.id);

    res.json({
      success: true,
      data: {
        segments,
        totalSegments: segments.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/festivals/:id/ad-slots
 * Get optimal ad slots
 */
router.get('/:id/ad-slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slots = await targetingService.getOptimalAdSlots(req.params.id);

    res.json({
      success: true,
      data: {
        slots,
        totalSlots: slots.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;