import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { placeService, searchService, audienceService } from '../services/index.js';
import {
  authMiddleware,
  asyncHandler,
  validateBody,
  validateQuery,
} from '../middleware/index.js';
import { ApiResponse, PaginatedResponse, IPlace } from '../types/index.js';

const router = Router();

// Validation schemas
const CreatePlaceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum([
    'mall',
    'airport',
    'hospital',
    'hotel',
    'school',
    'office',
    'restaurant',
    'retail',
    'event_venue',
    'transit',
  ]),
  category: z.string().min(1),
  address: z.object({
    street: z.string().min(1),
    area: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().default('India'),
  }),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  attributes: z.object({
    size: z.enum(['small', 'medium', 'large']).optional(),
    ratings: z.number().min(0).max(5).optional(),
    visitorCount: z.number().int().positive().optional(),
    operatingHours: z.string().optional(),
    priceRange: z.string().optional(),
  }).optional(),
  audienceProfile: z.object({
    demographics: z.object({
      ageGroups: z.record(z.string(), z.number().min(0).max(100)),
      genderSplit: z.record(z.string(), z.number().min(0).max(100)),
      incomeLevel: z.enum(['low', 'middle', 'upper-middle', 'high']),
    }),
    visitorPatterns: z.object({
      peakHours: z.array(z.string()),
      busyDays: z.array(z.string()),
      seasonalTrends: z.array(z.string()),
    }),
    commonPurposes: z.array(z.string()),
  }).optional(),
  advertising: z.object({
    availableFormats: z.array(z.string()),
    pricing: z.object({
      cpm: z.number().positive(),
      minBudget: z.number().positive(),
    }),
    targetingOptions: z.array(z.string()),
  }).optional(),
  nearbyPlaces: z.array(z.string()).optional(),
}).strict();

const UpdatePlaceSchema = CreatePlaceSchema.partial();

const ListPlacesQuerySchema = z.object({
  type: z.enum([
    'mall',
    'airport',
    'hospital',
    'hotel',
    'school',
    'office',
    'restaurant',
    'retail',
    'event_venue',
    'transit',
  ]).optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  size: z.enum(['small', 'medium', 'large']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict();

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  type: z.enum([
    'mall',
    'airport',
    'hospital',
    'hotel',
    'school',
    'office',
    'restaurant',
    'retail',
    'event_venue',
    'transit',
  ]).optional(),
  city: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
}).strict();

const NearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().positive().max(50000).default(5000),
  type: z.enum([
    'mall',
    'airport',
    'hospital',
    'hotel',
    'school',
    'office',
    'restaurant',
    'retail',
    'event_venue',
    'transit',
  ]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict();

/**
 * POST /api/places - Create a new place
 */
router.post(
  '/',
  authMiddleware,
  validateBody(CreatePlaceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const place = await placeService.createPlace(req.body);

    const response: ApiResponse<IPlace> = {
      success: true,
      data: place,
      message: 'Place created successfully',
    };

    res.status(201).json(response);
  })
);

/**
 * GET /api/places - List places with filters
 */
router.get(
  '/',
  validateQuery(ListPlacesQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as z.infer<typeof ListPlacesQuerySchema>;

    const filters = {
      type: query.type,
      category: query.category,
      city: query.city,
      state: query.state,
      status: query.status,
      minRating: query.minRating,
      size: query.size,
    };

    const result = await placeService.listPlaces(filters, query.page, query.limit);

    const response: ApiResponse<PaginatedResponse<IPlace>> = {
      success: true,
      data: result,
    };

    res.json(response);
  })
);

/**
 * GET /api/places/search - Search places by query
 */
router.get(
  '/search',
  validateQuery(SearchQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as z.infer<typeof SearchQuerySchema>;

    const result = await searchService.searchPlaces({
      q: query.q,
      type: query.type,
      city: query.city,
      limit: query.limit,
      offset: query.offset,
    });

    const response: ApiResponse<PaginatedResponse<IPlace>> = {
      success: true,
      data: result,
    };

    res.json(response);
  })
);

/**
 * GET /api/places/nearby - Find nearby places
 */
router.get(
  '/nearby',
  validateQuery(NearbyQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as z.infer<typeof NearbyQuerySchema>;

    const places = await searchService.findNearby({
      lat: query.lat,
      lng: query.lng,
      radius: query.radius,
      type: query.type,
      limit: query.limit,
    });

    const response: ApiResponse<IPlace[]> = {
      success: true,
      data: places,
    };

    res.json(response);
  })
);

/**
 * GET /api/places/:id - Get place details
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const place = await placeService.getPlaceById(id);

    if (!place) {
      res.status(404).json({
        success: false,
        error: 'Place not found',
      });
      return;
    }

    const response: ApiResponse<IPlace> = {
      success: true,
      data: place,
    };

    res.json(response);
  })
);

/**
 * PUT /api/places/:id - Update place
 */
router.put(
  '/:id',
  authMiddleware,
  validateBody(UpdatePlaceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const place = await placeService.updatePlace(id, req.body);

    if (!place) {
      res.status(404).json({
        success: false,
        error: 'Place not found',
      });
      return;
    }

    const response: ApiResponse<IPlace> = {
      success: true,
      data: place,
      message: 'Place updated successfully',
    };

    res.json(response);
  })
);

/**
 * DELETE /api/places/:id - Delete place
 */
router.delete(
  '/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await placeService.deletePlace(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Place not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Place deleted successfully',
    });
  })
);

/**
 * GET /api/places/:id/audience - Get estimated audience at location
 */
router.get(
  '/:id/audience',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const estimate = await audienceService.getAudienceEstimate(id);

    if (!estimate) {
      res.status(404).json({
        success: false,
        error: 'Place not found',
      });
      return;
    }

    const response: ApiResponse<typeof estimate> = {
      success: true,
      data: estimate,
    };

    res.json(response);
  })
);

/**
 * GET /api/places/categories - List all categories
 */
router.get(
  '/info/categories',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await placeService.getStatistics();

    res.json({
      success: true,
      data: stats.topCategories,
    });
  })
);

/**
 * GET /api/places/stats - Get place statistics
 */
router.get(
  '/info/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await placeService.getStatistics();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  })
);

export default router;