import { Router, Request, Response } from 'express';
import { apartmentService, targetingService } from '../services/index.js';
import {
  authenticate,
  authorize,
  asyncHandler,
  validate,
} from '../middleware/index.js';
import {
  CreateApartmentSchema,
  UpdateApartmentSchema,
  ListApartmentsQuerySchema,
  NearbyQuerySchema,
  CreateTargetingConfigSchema,
} from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/apartments - Register apartment complex
router.post(
  '/',
  authorize('admin', 'advertiser'),
  validate(CreateApartmentSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const apartment = await apartmentService.create(req.body);

    res.status(201).json({
      success: true,
      data: apartment,
      message: 'Apartment registered successfully',
    });
  })
);

// GET /api/apartments - List apartments with filters
router.get(
  '/',
  validate(ListApartmentsQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await apartmentService.list(req.query as Parameters<typeof apartmentService.list>[0]);

    res.json({
      success: true,
      ...result,
    });
  })
);

// GET /api/apartments/nearby - Find nearby apartments
router.get(
  '/nearby',
  validate(NearbyQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius, limit, incomeLevel, minResidents } = req.query as {
      lat: number;
      lng: number;
      radius: number;
      limit: number;
      incomeLevel?: string;
      minResidents?: number;
    };

    const apartments = await apartmentService.findNearby(
      lat,
      lng,
      radius,
      limit,
      { incomeLevel, minResidents }
    );

    res.json({
      success: true,
      data: apartments,
      count: apartments.length,
    });
  })
);

// GET /api/apartments/:id - Get apartment details
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const apartment = await apartmentService.getById(req.params.id);

    if (!apartment) {
      res.status(404).json({
        success: false,
        error: 'Apartment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: apartment,
    });
  })
);

// PUT /api/apartments/:id - Update apartment
router.put(
  '/:id',
  authorize('admin', 'advertiser'),
  validate(UpdateApartmentSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const apartment = await apartmentService.update(req.params.id, req.body);

    if (!apartment) {
      res.status(404).json({
        success: false,
        error: 'Apartment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: apartment,
      message: 'Apartment updated successfully',
    });
  })
);

// DELETE /api/apartments/:id - Delete apartment
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const deleted = await apartmentService.delete(req.params.id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Apartment not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Apartment deleted successfully',
    });
  })
);

// GET /api/apartments/:id/residents - Get resident count/stats
router.get(
  '/:id/residents',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await apartmentService.getResidentStats(req.params.id);

    if (!stats) {
      res.status(404).json({
        success: false,
        error: 'Apartment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: stats,
    });
  })
);

// POST /api/apartments/:id/target - Create targeting config
router.post(
  '/:id/target',
  authorize('admin', 'advertiser'),
  validate(CreateTargetingConfigSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const config = await targetingService.createConfig(
      req.params.id,
      req.body
    );

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'Apartment not found',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: config,
      message: 'Targeting configuration created successfully',
    });
  })
);

// GET /api/apartments/:id/target - Get targeting config
router.get(
  '/:id/target',
  asyncHandler(async (req: Request, res: Response) => {
    const config = await targetingService.getConfig(req.params.id);

    if (!config) {
      res.status(404).json({
        success: false,
        error: 'Targeting configuration not found',
      });
      return;
    }

    res.json({
      success: true,
      data: config,
    });
  })
);

// GET /api/apartments/:id/reach - Get estimated reach
router.get(
  '/:id/reach',
  asyncHandler(async (req: Request, res: Response) => {
    const reach = await targetingService.getEstimatedReach(req.params.id);

    if (!reach) {
      res.status(404).json({
        success: false,
        error: 'Apartment not found',
      });
      return;
    }

    res.json({
      success: true,
      data: reach,
    });
  })
);

// GET /api/apartments/stats/income-level - Get count by income level
router.get(
  '/stats/income-level',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await apartmentService.getCountByIncomeLevel();

    res.json({
      success: true,
      data: stats,
    });
  })
);

// GET /api/apartments/stats/total-residents - Get total residents
router.get(
  '/stats/total-residents',
  asyncHandler(async (_req: Request, res: Response) => {
    const total = await apartmentService.getTotalResidents();

    res.json({
      success: true,
      data: { totalResidents: total },
    });
  })
);

export default router;