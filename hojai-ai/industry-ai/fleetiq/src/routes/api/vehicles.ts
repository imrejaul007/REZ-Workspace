/**
 * FLEETIQ - Vehicle Routes
 * CRUD operations for vehicles
 */

import { Router, Request, Response } from 'express';
import { Vehicle } from '../../models';
import { authenticate } from '../../middleware/auth';
import { validate, schemas } from '../../middleware/validation';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { triggerWebhook, syncToHOJAI } from '../../utils/webhook';

const router = Router();

// ============================================
// GET ALL VEHICLES
// ============================================

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, type, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate('driverId', 'name phone rating')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query)
    ]);

    res.json({
      success: true,
      vehicles,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  })
);

// ============================================
// GET SINGLE VEHICLE
// ============================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('driverId', 'name phone rating status tripsCompleted');

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    res.json({
      success: true,
      vehicle
    });
  })
);

// ============================================
// CREATE VEHICLE
// ============================================

router.post(
  '/',
  authenticate,
  validate(schemas.createVehicle, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleData = req.body;

    const vehicle = await Vehicle.create({
      ...vehicleData,
      status: vehicleData.status || 'available',
      fuelLevel: vehicleData.fuelLevel || 100
    });

    logger.info('Vehicle created', { vehicleId: vehicle._id, registrationNumber: vehicle.registrationNumber });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('fleetiq.vehicle.registered', { vehicleId: vehicle._id.toString(), registrationNumber: vehicle.registrationNumber, type: vehicle.type });
    await syncToHOJAI('vehicle', 'registered', { vehicleId: vehicle._id.toString(), registrationNumber: vehicle.registrationNumber, type: vehicle.type });

    res.status(201).json({
      success: true,
      vehicle,
      message: 'Vehicle created successfully'
    });
  })
);

// ============================================
// UPDATE VEHICLE
// ============================================

router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    logger.info('Vehicle updated', { vehicleId: vehicle._id });

    res.json({
      success: true,
      vehicle,
      message: 'Vehicle updated successfully'
    });
  })
);

// ============================================
// UPDATE VEHICLE LOCATION
// ============================================

router.patch(
  '/:id/location',
  authenticate,
  validate(schemas.updateVehicleLocation, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { location: req.body },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    logger.debug('Vehicle location updated', {
      vehicleId: vehicle._id,
      location: vehicle.location
    });

    res.json({
      success: true,
      vehicle,
      message: 'Location updated successfully'
    });
  })
);

// ============================================
// UPDATE VEHICLE STATUS
// ============================================

router.patch(
  '/:id/status',
  authenticate,
  validate(schemas.updateVehicleStatus, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    logger.info('Vehicle status updated', {
      vehicleId: vehicle._id,
      status: vehicle.status
    });

    res.json({
      success: true,
      vehicle,
      message: `Status updated to ${vehicle.status}`
    });
  })
);

// ============================================
// DELETE VEHICLE
// ============================================

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }

    logger.info('Vehicle deleted', { vehicleId: vehicle._id });

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  })
);

// ============================================
// GET VEHICLE STATS
// ============================================

router.get(
  '/stats/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [total, available, onTrip, maintenance, idle] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'available' }),
      Vehicle.countDocuments({ status: 'on-trip' }),
      Vehicle.countDocuments({ status: 'maintenance' }),
      Vehicle.countDocuments({ status: 'idle' })
    ]);

    const fuelStats = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          avgFuelLevel: { $avg: '$fuelLevel' },
          minFuelLevel: { $min: '$fuelLevel' },
          maxFuelLevel: { $max: '$fuelLevel' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          available,
          'on-trip': onTrip,
          maintenance,
          idle
        },
        fuel: {
          average: Math.round(fuelStats[0]?.avgFuelLevel || 0),
          minimum: fuelStats[0]?.minFuelLevel || 0,
          maximum: fuelStats[0]?.maxFuelLevel || 0
        }
      }
    });
  })
);

export default router;