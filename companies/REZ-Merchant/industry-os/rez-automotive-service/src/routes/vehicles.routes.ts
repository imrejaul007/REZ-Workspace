import { Router, Request, Response } from 'express';
import vehicleService, { CreateVehicleData, UpdateVehicleData } from '../services/vehicleService';
import { asyncHandler } from '../middleware/errorHandler';
import { validate } from '../middleware/validation';
import { createVehicleSchema, updateVehicleSchema, vehicleSearchSchema } from '../middleware/validation';
import { authenticate, requireMerchantAccess } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/vehicles
 * List all vehicles with pagination and filters
 */
router.get(
  '/',
  validate(vehicleSearchSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      merchantId,
      make,
      model,
      yearMin,
      yearMax,
      fuelType,
      transmission,
      status,
      priceMin,
      priceMax,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query as any;

    const result = await vehicleService.search({
      merchantId,
      make,
      model,
      year: (yearMin || yearMax) ? { min: yearMin, max: yearMax } : undefined,
      fuelType,
      transmission,
      status,
      priceRange: (priceMin || priceMax) ? { min: priceMin, max: priceMax } : undefined,
      search,
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/v1/vehicles/search
 * Search vehicles with text query
 */
router.get(
  '/search',
  validate(vehicleSearchSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const { search, merchantId, page = 1, limit = 20 } = req.query as any;

    const result = await vehicleService.search({
      search,
      merchantId,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/v1/vehicles/merchant/:merchantId
 * Get vehicles for a specific merchant
 */
router.get(
  '/merchant/:merchantId',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const { status, page = 1, limit = 20 } = req.query as any;

    const result = await vehicleService.getByMerchant(merchantId, {
      status,
      page: Number(page),
      limit: Number(limit),
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  })
);

/**
 * GET /api/v1/vehicles/stats/:merchantId
 * Get vehicle statistics for merchant
 */
router.get(
  '/stats/:merchantId',
  requireMerchantAccess,
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.params;
    const stats = await vehicleService.getStatistics(merchantId);

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/v1/vehicles/ready-for-sale
 * Get vehicles ready for sale (all docs valid)
 */
router.get(
  '/ready-for-sale',
  asyncHandler(async (req: Request, res: Response) => {
    const { merchantId } = req.query as any;
    const vehicles = await vehicleService.getReadyForSale(merchantId);

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  })
);

/**
 * GET /api/v1/vehicles/:vehicleId
 * Get vehicle by ID
 */
router.get(
  '/:vehicleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const vehicle = await vehicleService.getById(vehicleId);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
    });
  })
);

/**
 * GET /api/v1/vehicles/reg/:registrationNumber
 * Get vehicle by registration number
 */
router.get(
  '/reg/:registrationNumber',
  asyncHandler(async (req: Request, res: Response) => {
    const { registrationNumber } = req.params;
    const vehicle = await vehicleService.getByRegistrationNumber(registrationNumber);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
    });
  })
);

/**
 * GET /api/v1/vehicles/vin/:vin
 * Get vehicle by VIN
 */
router.get(
  '/vin/:vin',
  asyncHandler(async (req: Request, res: Response) => {
    const { vin } = req.params;
    const vehicle = await vehicleService.getByVin(vin);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
    });
  })
);

/**
 * POST /api/v1/vehicles
 * Create new vehicle
 */
router.post(
  '/',
  validate(createVehicleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await vehicleService.create(req.body as CreateVehicleData);

    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully',
    });
  })
);

/**
 * PUT /api/v1/vehicles/:vehicleId
 * Update vehicle
 */
router.put(
  '/:vehicleId',
  validate(updateVehicleSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const vehicle = await vehicleService.update(vehicleId, req.body as UpdateVehicleData);

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Vehicle updated successfully',
    });
  })
);

/**
 * PATCH /api/v1/vehicles/:vehicleId/status
 * Update vehicle status (sold/reserved/available)
 */
router.patch(
  '/:vehicleId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const { status, customerId, customerName, customerPhone } = req.body;

    let vehicle;

    if (status === 'sold') {
      if (!customerId || !customerName || !customerPhone) {
        res.status(400).json({
          success: false,
          error: 'Customer details required for sold status',
        });
        return;
      }
      vehicle = await vehicleService.markAsSold(vehicleId, customerId, customerName, customerPhone);
    } else if (status === 'reserved') {
      vehicle = await vehicleService.reserve(vehicleId);
    } else {
      vehicle = await vehicleService.update(vehicleId, { status });
    }

    if (!vehicle) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      data: vehicle,
      message: `Vehicle marked as ${status}`,
    });
  })
);

/**
 * DELETE /api/v1/vehicles/:vehicleId
 * Delete vehicle
 */
router.delete(
  '/:vehicleId',
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId } = req.params;
    const deleted = await vehicleService.delete(vehicleId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Vehicle not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  })
);

export default router;