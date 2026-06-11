/**
 * FLEETIQ - Trip Routes
 * CRUD operations for trips
 */

import { Router, Request, Response } from 'express';
import { Trip, Vehicle, Driver } from '../../models';
import { authenticate } from '../../middleware/auth';
import { validate, schemas } from '../../middleware/validation';
import { asyncHandler, NotFoundError, ValidationError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';
import { triggerWebhook, syncToHOJAI } from '../../utils/webhook';

const router = Router();

// ============================================
// GET ALL TRIPS
// ============================================

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, driverId, vehicleId, page = 1, limit = 20 } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (driverId) query.driverId = driverId;
    if (vehicleId) query.vehicleId = vehicleId;

    const skip = (Number(page) - 1) * Number(limit);

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('vehicleId', 'registrationNumber type')
        .populate('driverId', 'name phone rating')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Trip.countDocuments(query)
    ]);

    res.json({
      success: true,
      trips,
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
// GET SINGLE TRIP
// ============================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicleId', 'registrationNumber type status location fuelLevel')
      .populate('driverId', 'name phone rating status');

    if (!trip) {
      throw new NotFoundError('Trip');
    }

    res.json({
      success: true,
      trip
    });
  })
);

// ============================================
// CREATE TRIP
// ============================================

router.post(
  '/',
  authenticate,
  validate(schemas.createTrip, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const { vehicleId, driverId, origin, destination, cargoWeight, urgency } = req.body;

    // Verify vehicle exists and is available
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle');
    }
    if (vehicle.status !== 'available') {
      throw new ValidationError('Vehicle is not available');
    }

    // Verify driver exists and is available
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new NotFoundError('Driver');
    }
    if (driver.status !== 'available') {
      throw new ValidationError('Driver is not available');
    }

    // Calculate distance (Haversine formula)
    const R = 6371;
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLng = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate time based on urgency
    const speedFactor = urgency === 'critical' ? 60 :
                        urgency === 'high' ? 50 :
                        urgency === 'medium' ? 40 : 35;
    const estimatedTime = Math.round(distance / speedFactor * 60);

    // Calculate estimated cost
    const baseRates = { truck: 15, van: 12, car: 8, bike: 5 };
    const baseRate = baseRates[vehicle.type as keyof typeof baseRates] || 10;
    const estimatedCost = Math.round(distance * baseRate + distance * 0.1);

    const trip = await Trip.create({
      vehicleId,
      driverId,
      origin,
      destination,
      distance: Math.round(distance * 100) / 100,
      estimatedTime,
      estimatedCost,
      urgency: urgency || 'medium',
      status: 'pending'
    });

    // Update vehicle and driver status
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'reserved' });
    await Driver.findByIdAndUpdate(driverId, { status: 'on-trip', currentVehicleId: vehicleId });

    logger.info('Trip created', { tripId: trip._id, vehicle: vehicle.registrationNumber, driver: driver.name });

    // Trigger webhook and sync to HOJAI
    await triggerWebhook('fleetiq.trip.started', { tripId: trip._id.toString(), vehicleId, driverId, origin, destination, distance: trip.distance });
    await syncToHOJAI('trip', 'started', { tripId: trip._id.toString(), vehicleId, driverId, origin, destination, distance: trip.distance });

    res.status(201).json({
      success: true,
      trip,
      message: 'Trip created successfully'
    });
  })
);

// ============================================
// UPDATE TRIP STATUS
// ============================================

router.patch(
  '/:id/status',
  authenticate,
  validate(schemas.updateTripStatus, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      throw new NotFoundError('Trip');
    }

    const { status } = req.body;
    const previousStatus = trip.status;

    // Handle status transitions
    if (status === 'in-progress' && previousStatus === 'pending') {
      trip.startTime = new Date();
    } else if (status === 'completed' && previousStatus === 'in-progress') {
      trip.endTime = new Date();
      trip.actualTime = trip.startTime
        ? Math.round((trip.endTime.getTime() - trip.startTime.getTime()) / 60000)
        : undefined;

      // Free up vehicle and driver
      await Vehicle.findByIdAndUpdate(trip.vehicleId, {
        status: 'available',
        location: trip.destination
      });
      await Driver.findByIdAndUpdate(trip.driverId, {
        status: 'available',
        currentVehicleId: undefined,
        $inc: { tripsCompleted: 1 }
      });
    } else if (status === 'cancelled') {
      // Free up vehicle and driver
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'available' });
      await Driver.findByIdAndUpdate(trip.driverId, {
        status: 'available',
        currentVehicleId: undefined
      });
    }

    trip.status = status;
    await trip.save();

    logger.info('Trip status updated', { tripId: trip._id, previousStatus, newStatus: status });

    res.json({
      success: true,
      trip,
      message: `Status updated to ${status}`
    });
  })
);

// ============================================
// UPDATE TRIP
// ============================================

router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const trip = await Trip.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!trip) {
      throw new NotFoundError('Trip');
    }

    logger.info('Trip updated', { tripId: trip._id });

    res.json({
      success: true,
      trip,
      message: 'Trip updated successfully'
    });
  })
);

// ============================================
// DELETE TRIP
// ============================================

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      throw new NotFoundError('Trip');
    }

    // Free up vehicle and driver if trip was active
    if (['pending', 'in-progress'].includes(trip.status)) {
      await Vehicle.findByIdAndUpdate(trip.vehicleId, { status: 'available' });
      await Driver.findByIdAndUpdate(trip.driverId, {
        status: 'available',
        currentVehicleId: undefined
      });
    }

    await Trip.findByIdAndDelete(req.params.id);

    logger.info('Trip deleted', { tripId: req.params.id });

    res.json({
      success: true,
      message: 'Trip deleted successfully'
    });
  })
);

// ============================================
// GET TRIP STATS
// ============================================

router.get(
  '/stats/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = 'week' } = req.query;

    const periodDays: Record<string, number> = { day: 1, week: 7, month: 30, quarter: 90 };
    const startDate = new Date(Date.now() - (periodDays[period as string] || 7) * 24 * 60 * 60 * 1000);

    const [total, completed, cancelled, activeTrips] = await Promise.all([
      Trip.countDocuments({ createdAt: { $gte: startDate } }),
      Trip.countDocuments({ status: 'completed', createdAt: { $gte: startDate } }),
      Trip.countDocuments({ status: 'cancelled', createdAt: { $gte: startDate } }),
      Trip.countDocuments({ status: 'in-progress' })
    ]);

    const costStats = await Trip.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$estimatedCost' },
          avgCost: { $avg: '$estimatedCost' },
          totalDistance: { $sum: '$distance' },
          avgDistance: { $avg: '$distance' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        period,
        total,
        completed,
        cancelled,
        active: activeTrips,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        costs: {
          total: costStats[0]?.totalCost || 0,
          average: Math.round(costStats[0]?.avgCost || 0)
        },
        distance: {
          total: Math.round(costStats[0]?.totalDistance || 0),
          average: Math.round(costStats[0]?.avgDistance || 0)
        }
      }
    });
  })
);

export default router;