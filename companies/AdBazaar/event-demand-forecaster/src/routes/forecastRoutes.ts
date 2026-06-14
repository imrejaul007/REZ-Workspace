import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { forecastService, CreateForecastRequest } from '../services/forecastService';
import { trendService } from '../services/trendService';
import { calibrationService, CalibrateForecastRequest } from '../services/calibrationService';
import { analyticsService } from '../services/analyticsService';
import { recommendationService } from '../services/recommendationService';
import { logger } from '../utils/logger';
import { internalServiceAuth } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(internalServiceAuth);

/**
 * Zod schemas for validation
 */

// Create forecast schema
const createForecastSchema = z.object({
  eventId: z.string().optional(),
  eventName: z.string().min(1, 'Event name is required'),
  category: z.enum(['concert', 'sports', 'conference', 'exhibition', 'festival', 'corporate', 'wedding', 'social', 'political', 'religious', 'other']),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().datetime().transform(s => new Date(s)),
  endDate: z.string().datetime().transform(s => new Date(s)),
  historicalData: z.object({
    previousDemand: z.number().optional(),
    sameEventLastYear: z.number().optional(),
    similarEvents: z.number().optional()
  }).optional(),
  factors: z.object({
    promotional: z.number().optional(),
    weather: z.number().optional(),
    economic: z.number().optional(),
    social: z.number().optional(),
    competitor: z.number().optional()
  }).optional()
}).refine(data => data.endDate >= data.startDate, {
  message: 'End date must be after or equal to start date'
});

// Create trend schema
const createTrendSchema = z.object({
  eventId: z.string(),
  eventName: z.string(),
  category: z.string(),
  location: z.string(),
  date: z.string().datetime().transform(s => new Date(s)),
  actualDemand: z.number().min(0),
  predictedDemand: z.number().min(0),
  signals: z.object({
    social: z.number().min(0).max(100).optional(),
    search: z.number().min(0).max(100).optional(),
    ticket: z.number().min(0).max(100).optional(),
    weather: z.number().min(0).max(100).optional(),
    competitor: z.number().min(0).max(100).optional()
  }).optional()
});

// Calibrate forecast schema
const calibrateForecastSchema = z.object({
  adjustments: z.array(z.object({
    factor: z.enum(['historical', 'seasonal', 'promotional', 'weather', 'economic', 'social', 'location', 'competitor', 'demand']),
    original: z.number(),
    value: z.number(),
    reason: z.string()
  })).min(1, 'At least one adjustment is required'),
  method: z.enum(['manual', 'automatic', 'ai_recommended']).optional().default('manual'),
  source: z.object({
    type: z.enum(['historical', 'real_time', 'expert', 'ai']),
    details: z.string()
  }).optional(),
  notes: z.string().optional()
});

// Validation helper
function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    };
  }
  return { valid: true, data: result.data };
}

// Response helper
function sendResponse(res: Response, statusCode: number, success: boolean, data?: unknown, error?: string) {
  res.status(statusCode).json({
    success,
    ...(data && { data }),
    ...(error && { error })
  });
}

/**
 * POST /api/forecast
 * Create a new demand forecast
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validate(createForecastSchema, req.body);
    if (!validation.valid) {
      return sendResponse(res, 400, false, undefined, validation.errors.map(e => e.message).join(', '));
    }

    const request: CreateForecastRequest = validation.data;
    const result = await forecastService.createForecast(request);

    if (result.success) {
      logger.info('Forecast created via API', { eventId: result.data?.eventId });
      sendResponse(res, 201, true, result.data);
    } else {
      sendResponse(res, 400, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/:eventId
 * Get forecast by event ID
 */
router.get('/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const result = await forecastService.getForecast(eventId);

    if (result.success) {
      sendResponse(res, 200, true, result.data);
    } else {
      sendResponse(res, 404, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/:eventId/trend
 * Get demand trend for an event
 */
router.get('/:eventId/trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const result = await trendService.getTrend(eventId, days);

    if (result.success) {
      sendResponse(res, 200, true, result.data);
    } else {
      sendResponse(res, 404, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/:eventId/analytics
 * Get forecast analytics for an event
 */
router.get('/:eventId/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    const result = await analyticsService.getAnalytics(eventId);

    if (result.success) {
      sendResponse(res, 200, true, result.data);
    } else {
      sendResponse(res, 404, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/category/:category
 * Get forecasts by category
 */
router.get('/category/:category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const { startDate, endDate, status } = req.query;

    const result = await forecastService.getCategoryForecasts({
      category,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string | undefined
    });

    sendResponse(res, 200, true, result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/location/:location
 * Get forecasts by location
 */
router.get('/location/:location', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location } = req.params;
    const { startDate, endDate, status } = req.query;

    const result = await forecastService.getLocationForecasts({
      location,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string | undefined
    });

    sendResponse(res, 200, true, result.data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/forecast/:eventId/calibrate
 * Calibrate a forecast
 */
router.post('/:eventId/calibrate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    const validation = validate(calibrateForecastSchema, req.body);
    if (!validation.valid) {
      return sendResponse(res, 400, false, undefined, validation.errors.map(e => e.message).join(', '));
    }

    const request: CalibrateForecastRequest = {
      eventId,
      ...validation.data
    };

    const result = await calibrationService.calibrateForecast(request);

    if (result.success) {
      logger.info('Forecast calibrated via API', { eventId });
      sendResponse(res, 200, true, result.data);
    } else {
      sendResponse(res, 400, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/recommendations/:eventId
 * Get recommendations for an event
 */
router.get('/recommendations/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    const result = await recommendationService.getRecommendations(eventId);

    if (result.success) {
      sendResponse(res, 200, true, result.data);
    } else {
      sendResponse(res, 404, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/forecast/dashboard
 * Get forecast dashboard data
 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.getDashboard();

    if (result.success) {
      sendResponse(res, 200, true, result.data);
    } else {
      sendResponse(res, 500, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

// POST endpoint for creating trends (additional endpoint)
router.post('/:eventId/trend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validation = validate(createTrendSchema, req.body);
    if (!validation.valid) {
      return sendResponse(res, 400, false, undefined, validation.errors.map(e => e.message).join(', '));
    }

    const result = await trendService.createTrend(validation.data);

    if (result.success) {
      logger.info('Trend created via API', { eventId: req.params.eventId });
      sendResponse(res, 201, true, result.data);
    } else {
      sendResponse(res, 400, false, undefined, result.error);
    }
  } catch (error) {
    next(error);
  }
});

export default router;