import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { weddingService, CreateWeddingDto, UpdateWeddingDto } from '../services/weddingService';
import { analyticsService } from '../services/analyticsService';
import { targetingService } from '../services/targetingService';
import { recordWeddingCreated } from '../utils/metrics';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createWeddingSchema = z.object({
  coupleName: z.string().min(1).max(200),
  brideName: z.string().min(1).max(100),
  groomName: z.string().min(1).max(100),
  weddingDate: z.string().datetime().or(z.date()),
  weddingEndDate: z.string().datetime().optional(),
  venue: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    capacity: z.number().optional()
  }),
  budget: z.object({
    total: z.number().min(0),
    currency: z.string().optional(),
    breakdown: z.object({
      venue: z.number().optional(),
      catering: z.number().optional(),
      photography: z.number().optional(),
      decoration: z.number().optional(),
      entertainment: z.number().optional(),
      attire: z.number().optional(),
      flowers: z.number().optional(),
      transportation: z.number().optional(),
      gifts: z.number().optional(),
      other: z.number().optional()
    }).optional()
  }).optional(),
  theme: z.string().optional(),
  style: z.string().optional(),
  guestCategories: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  instagramHandle: z.string().optional(),
  ownerId: z.string().min(1),
  createdBy: z.string().min(1)
});

const updateWeddingSchema = z.object({
  coupleName: z.string().min(1).max(200).optional(),
  brideName: z.string().min(1).max(100).optional(),
  groomName: z.string().min(1).max(100).optional(),
  weddingDate: z.string().datetime().or(z.date()).optional(),
  weddingEndDate: z.string().datetime().optional(),
  venue: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    capacity: z.number().optional()
  }).optional(),
  budget: z.object({
    total: z.number().min(0).optional(),
    spent: z.number().min(0).optional(),
    currency: z.string().optional()
  }).optional(),
  guestCount: z.object({
    expected: z.number().optional(),
    confirmed: z.number().optional(),
    declined: z.number().optional(),
    tentative: z.number().optional()
  }).optional(),
  theme: z.string().optional(),
  style: z.string().optional(),
  guestCategories: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  instagramHandle: z.string().optional(),
  status: z.enum(['planning', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  estimatedAttendees: z.number().optional(),
  updatedBy: z.string()
});

/**
 * POST /api/weddings - Create a new wedding
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = createWeddingSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid wedding data',
        details: validationResult.error.errors
      });
      return;
    }

    const data: CreateWeddingDto = {
      ...validationResult.data,
      weddingDate: new Date(validationResult.data.weddingDate)
    };

    if (validationResult.data.weddingEndDate) {
      data.weddingEndDate = new Date(validationResult.data.weddingEndDate);
    }

    const wedding = await weddingService.createWedding(data);

    recordWeddingCreated(wedding.status);

    logger.info('Wedding created via API', {
      weddingId: wedding.weddingId,
      coupleName: wedding.coupleName
    });

    res.status(201).json({
      success: true,
      data: wedding
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings - List weddings
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const sortBy = (req.query.sortBy as string) || 'weddingDate';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const filters = {
      ownerId: req.query.ownerId as string,
      status: req.query.status as any,
      city: req.query.city as string,
      state: req.query.state as string,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      minBudget: req.query.minBudget ? parseInt(req.query.minBudget as string) : undefined,
      maxBudget: req.query.maxBudget ? parseInt(req.query.maxBudget as string) : undefined,
      hashtags: req.query.hashtags
        ? (req.query.hashtags as string).split(',')
        : undefined
    };

    const result = await weddingService.listWeddings(
      filters,
      { page, limit, sortBy, sortOrder }
    );

    res.json({
      success: true,
      data: result.weddings,
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/nearby - Find nearby weddings
 */
router.get('/nearby', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latitude = parseFloat(req.query.latitude as string);
    const longitude = parseFloat(req.query.longitude as string);
    const radiusKm = parseFloat(req.query.radius as string) || 50;

    if (isNaN(latitude) || isNaN(longitude)) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid coordinates'
      });
      return;
    }

    const weddings = await weddingService.findNearbyWeddings(latitude, longitude, radiusKm);

    res.json({
      success: true,
      data: weddings,
      count: weddings.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:id - Get wedding by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wedding = await weddingService.getWeddingById(req.params.id);

    if (!wedding) {
      res.status(404).json({
        error: 'Not Found',
        message: `Wedding ${req.params.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: wedding
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/weddings/:id - Update wedding
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationResult = updateWeddingSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid update data',
        details: validationResult.error.errors
      });
      return;
    }

    const data: UpdateWeddingDto = validationResult.data;

    if (data.weddingDate) {
      data.weddingDate = new Date(data.weddingDate as any);
    }

    const wedding = await weddingService.updateWedding(req.params.id, data);

    if (!wedding) {
      res.status(404).json({
        error: 'Not Found',
        message: `Wedding ${req.params.id} not found`
      });
      return;
    }

    logger.info('Wedding updated via API', {
      weddingId: wedding.weddingId,
      updatedFields: Object.keys(data)
    });

    res.json({
      success: true,
      data: wedding
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/weddings/:id - Delete wedding (cancel)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const success = await weddingService.deleteWedding(req.params.id);

    if (!success) {
      res.status(404).json({
        error: 'Not Found',
        message: `Wedding ${req.params.id} not found`
      });
      return;
    }

    logger.info('Wedding cancelled via API', { weddingId: req.params.id });

    res.json({
      success: true,
      message: 'Wedding cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:id/analytics - Get wedding analytics
 */
router.get('/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await analyticsService.getWeddingAnalytics(req.params.id);

    if (!analytics) {
      res.status(404).json({
        error: 'Not Found',
        message: `Wedding ${req.params.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:id/targeting - Get ad targeting data
 */
router.get('/:id/targeting', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targeting = await targetingService.getTargetingData(req.params.id);

    if (!targeting) {
      res.status(404).json({
        error: 'Not Found',
        message: `Wedding ${req.params.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: targeting
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/weddings/:id/stats - Get wedding statistics
 */
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await weddingService.getWeddingStats(req.params.id);

    if (!stats) {
      res.status(404).json({
        error: 'Not Found',
        message: `Wedding ${req.params.id} not found`
      });
      return;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;