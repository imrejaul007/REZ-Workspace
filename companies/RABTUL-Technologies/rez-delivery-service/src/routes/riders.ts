import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Rider from '../models/Rider';
import assignmentService from '../services/assignmentService';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route POST /api/riders
 * @desc Register a new rider
 */
router.post(
  '/',
  [
    body('name').notEmpty().trim().withMessage('Name is required'),
    body('phone').isMobilePhone('en-IN').withMessage('Invalid phone number'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('vehicleType').isIn(['bike', 'scooter', 'cycle']).withMessage('Invalid vehicle type'),
    body('vehicleNumber').optional().trim().notEmpty(),
    body('zones').isArray({ min: 1 }).withMessage('At least one zone is required'),
    body('shift.start').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid start time (HH:mm)'),
    body('shift.end').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid end time (HH:mm)')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = new Rider({
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      vehicleType: req.body.vehicleType,
      vehicleNumber: req.body.vehicleNumber,
      zones: req.body.zones,
      shift: req.body.shift,
      status: 'offline'
    });

    await rider.save();

    res.status(201).json({
      success: true,
      data: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        status: rider.status
      }
    });
  })
);

/**
 * @route GET /api/riders
 * @desc Get all riders with filters
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['available', 'busy', 'offline']),
    query('zone').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const filter: unknown = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.zone) {
      filter.zones = req.query.zone;
    }

    const limit = req.query.limit || 50;
    const skip = req.query.skip || 0;

    const [riders, total] = await Promise.all([
      Rider.find(filter)
        .select('-__v')
        .sort({ rating: -1, totalDeliveries: -1 })
        .skip(skip)
        .limit(limit),
      Rider.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        riders,
        pagination: { total, limit, skip }
      }
    });
  })
);

/**
 * @route GET /api/riders/available
 * @desc Get available riders near a location
 */
router.get(
  '/available',
  [
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('radius').optional().isFloat({ min: 0.1, max: 50 }).toFloat()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius || 5; // Default 5km

    const riders = await Rider.findNearby(lng, lat, radius);

    res.json({
      success: true,
      data: {
        riders,
        searchLocation: { lat, lng },
        radius
      }
    });
  })
);

/**
 * @route GET /api/riders/leaderboard
 * @desc Get rider leaderboard
 */
router.get(
  '/leaderboard',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit || 10;
    const leaderboard = await Rider.getLeaderboard(limit);

    res.json({
      success: true,
      data: leaderboard
    });
  })
);

/**
 * @route GET /api/riders/:riderId
 * @desc Get rider by ID
 */
router.get(
  '/:riderId',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await Rider.findById(req.params.riderId);

    if (!rider) {
      throw new AppError('Rider not found', 404);
    }

    res.json({
      success: true,
      data: rider
    });
  })
);

/**
 * @route PATCH /api/riders/:riderId/location
 * @desc Update rider location
 */
router.patch(
  '/:riderId/location',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await Rider.findById(req.params.riderId);

    if (!rider) {
      throw new AppError('Rider not found', 404);
    }

    await rider.updateLocation(req.body.lat, req.body.lng);

    res.json({
      success: true,
      data: {
        riderId: rider._id,
        location: {
          lat: req.body.lat,
          lng: req.body.lng
        },
        updatedAt: new Date()
      }
    });
  })
);

/**
 * @route PATCH /api/riders/:riderId/status
 * @desc Update rider status
 */
router.patch(
  '/:riderId/status',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID'),
    body('status').isIn(['available', 'busy', 'offline']).withMessage('Invalid status')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await Rider.findById(req.params.riderId);

    if (!rider) {
      throw new AppError('Rider not found', 404);
    }

    await rider.setStatus(req.body.status);

    res.json({
      success: true,
      data: {
        riderId: rider._id,
        status: rider.status,
        updatedAt: new Date()
      }
    });
  })
);

/**
 * @route POST /api/riders/:riderId/assign/:orderId
 * @desc Assign rider to an order
 */
router.post(
  '/:riderId/assign/:orderId',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID'),
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.assignRider(
      req.params.orderId,
      req.params.riderId
    );

    res.json({
      success: true,
      data: assignment
    });
  })
);

/**
 * @route POST /api/riders/:riderId/reassign/:orderId
 * @desc Reassign rider to a different order
 */
router.post(
  '/:riderId/reassign/:orderId',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID'),
    param('orderId').notEmpty().withMessage('Order ID is required'),
    body('reason').optional().isString()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const assignment = await assignmentService.reassignRider(
      req.params.orderId,
      req.body.newRiderId,
      req.body.reason
    );

    res.json({
      success: true,
      data: assignment
    });
  })
);

/**
 * @route POST /api/riders/:riderId/complete/:orderId
 * @desc Mark delivery as complete
 */
router.post(
  '/:riderId/complete/:orderId',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID'),
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    await assignmentService.completeDelivery(req.params.orderId);

    res.json({
      success: true,
      data: {
        orderId: req.params.orderId,
        completedAt: new Date()
      }
    });
  })
);

/**
 * @route GET /api/riders/:riderId/stats
 * @desc Get rider statistics
 */
router.get(
  '/:riderId/stats',
  [
    param('riderId').isMongoId().withMessage('Invalid rider ID')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const rider = await Rider.findById(req.params.riderId);

    if (!rider) {
      throw new AppError('Rider not found', 404);
    }

    res.json({
      success: true,
      data: {
        riderId: rider._id,
        name: rider.name,
        stats: {
          totalDeliveries: rider.totalDeliveries,
          completedDeliveries: rider.completedDeliveries,
          cancelledDeliveries: rider.cancelledDeliveries,
          rating: rider.rating,
          averageDeliveryTime: rider.metrics.averageDeliveryTime,
          onTimeRate: rider.metrics.onTimeRate,
          earnings: rider.earnings
        }
      }
    });
  })
);

/**
 * @route GET /api/riders/stats/overview
 * @desc Get overall rider statistics
 */
router.get(
  '/stats/overview',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await assignmentService.getAssignmentStats();

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;
