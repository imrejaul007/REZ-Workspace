/**
 * FLEETIQ - Driver Routes
 * CRUD operations for drivers
 */

import { Router, Request, Response } from 'express';
import { Driver } from '../../models';
import { authenticate } from '../../middleware/auth';
import { validate, schemas } from '../../middleware/validation';
import { asyncHandler, NotFoundError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

const router = Router();

// ============================================
// GET ALL DRIVERS
// ============================================

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, minRating } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (minRating) query.rating = { $gte: Number(minRating) };

    const drivers = await Driver.find(query)
      .populate('currentVehicleId', 'registrationNumber type')
      .sort({ rating: -1 })
      .lean();

    res.json({
      success: true,
      drivers,
      total: drivers.length
    });
  })
);

// ============================================
// GET SINGLE DRIVER
// ============================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await Driver.findById(req.params.id)
      .populate('currentVehicleId', 'registrationNumber type status location');

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    res.json({
      success: true,
      driver
    });
  })
);

// ============================================
// CREATE DRIVER
// ============================================

router.post(
  '/',
  authenticate,
  validate(schemas.createDriver, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const driverData = req.body;

    const driver = await Driver.create({
      ...driverData,
      status: driverData.status || 'available',
      rating: 5.0,
      tripsCompleted: 0,
      totalDistance: 0,
      totalTrips: 0,
      averageRating: 5.0
    });

    logger.info('Driver created', { driverId: driver._id, name: driver.name });

    res.status(201).json({
      success: true,
      driver,
      message: 'Driver created successfully'
    });
  })
);

// ============================================
// UPDATE DRIVER
// ============================================

router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    logger.info('Driver updated', { driverId: driver._id });

    res.json({
      success: true,
      driver,
      message: 'Driver updated successfully'
    });
  })
);

// ============================================
// UPDATE DRIVER RATING
// ============================================

router.patch(
  '/:id/rating',
  authenticate,
  validate(schemas.updateDriverRating, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { rating: req.body.rating },
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // Update average rating
    const allRatings = await Driver.find({}, 'rating').lean();
    const avgRating = allRatings.reduce((sum, d) => sum + d.rating, 0) / allRatings.length;
    await Driver.findByIdAndUpdate(req.params.id, { averageRating: avgRating });

    logger.info('Driver rating updated', { driverId: driver._id, rating: driver.rating });

    res.json({
      success: true,
      driver,
      averageRating: avgRating,
      message: `Rating updated to ${driver.rating}`
    });
  })
);

// ============================================
// UPDATE DRIVER STATUS
// ============================================

router.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;

    if (!['available', 'on-trip', 'off-duty'].includes(status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid status',
        code: 'INVALID_STATUS'
      });
      return;
    }

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    logger.info('Driver status updated', { driverId: driver._id, status });

    res.json({
      success: true,
      driver,
      message: `Status updated to ${status}`
    });
  })
);

// ============================================
// DELETE DRIVER
// ============================================

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await Driver.findByIdAndDelete(req.params.id);

    if (!driver) {
      throw new NotFoundError('Driver');
    }

    logger.info('Driver deleted', { driverId: driver._id });

    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });
  })
);

// ============================================
// GET DRIVER PERFORMANCE
// ============================================

router.get(
  '/:id/performance',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      throw new NotFoundError('Driver');
    }

    // Get performance metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const Trip = (await import('../../models')).Trip;
    const recentTrips = await Trip.find({
      driverId: req.params.id,
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalDistance = recentTrips.reduce((sum, t) => sum + t.distance, 0);
    const completedTrips = recentTrips.filter(t => t.status === 'completed').length;

    res.json({
      success: true,
      performance: {
        driverId: driver._id,
        name: driver.name,
        overallRating: driver.rating,
        totalTrips: driver.tripsCompleted,
        recentTrips: recentTrips.length,
        completedRecentTrips: completedTrips,
        totalDistance: driver.totalDistance,
        recentDistance: totalDistance,
        averageRating: driver.averageRating,
        status: driver.status
      }
    });
  })
);

// ============================================
// GET DRIVER STATS
// ============================================

router.get(
  '/stats/summary',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [total, available, onTrip, offDuty] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ status: 'available' }),
      Driver.countDocuments({ status: 'on-trip' }),
      Driver.countDocuments({ status: 'off-duty' })
    ]);

    const ratingStats = await Driver.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          minRating: { $min: '$rating' },
          maxRating: { $max: '$rating' }
        }
      }
    ]);

    const topDrivers = await Driver.find()
      .sort({ rating: -1 })
      .limit(5)
      .select('name rating tripsCompleted')
      .lean();

    res.json({
      success: true,
      stats: {
        total,
        byStatus: {
          available,
          'on-trip': onTrip,
          'off-duty': offDuty
        },
        rating: {
          average: Math.round(ratingStats[0]?.avgRating * 10) / 10 || 0,
          minimum: ratingStats[0]?.minRating || 0,
          maximum: ratingStats[0]?.maxRating || 0
        },
        topDrivers
      }
    });
  })
);

export default router;