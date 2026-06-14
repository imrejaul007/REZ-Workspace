import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import orderService from '../services/orderService';
import trackingService from '../services/trackingService';
import routingService from '../services/routingService';
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
 * @route GET /api/track/:orderId
 * @desc Get tracking information for an order
 */
router.get(
  '/:orderId',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const tracking = await orderService.getTracking(req.params.orderId);

    if (!tracking) {
      throw new AppError('Order not found', 404);
    }

    res.json({
      success: true,
      data: tracking
    });
  })
);

/**
 * @route GET /api/track/:orderId/live
 * @desc Get live tracking data (real-time via polling)
 */
router.get(
  '/:orderId/live',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const liveTracking = await routingService.getLiveTracking(req.params.orderId);

    if (!liveTracking) {
      // Try to get current state
      const tracking = await trackingService.getTrackingState(req.params.orderId);
      if (!tracking) {
        throw new AppError('Order not found', 404);
      }

      return res.json({
        success: true,
        data: {
          orderId: tracking.orderId,
          status: tracking.status,
          estimatedDelivery: tracking.estimatedDelivery,
          riderLocation: tracking.riderLocation,
          eta: tracking.eta,
          lastUpdated: new Date()
        }
      });
    }

    res.json({
      success: true,
      data: {
        orderId: req.params.orderId,
        currentLocation: liveTracking.currentLocation,
        eta: liveTracking.eta,
        destination: liveTracking.destination,
        progress: liveTracking.progress
      }
    });
  })
);

/**
 * @route GET /api/track/:orderId/history
 * @desc Get tracking history for an order
 */
router.get(
  '/:orderId/history',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const events = await trackingService.getTrackingHistory(req.params.orderId);

    res.json({
      success: true,
      data: {
        orderId: req.params.orderId,
        events,
        total: events.length
      }
    });
  })
);

/**
 * @route POST /api/track/:orderId/location
 * @desc Update rider location (for rider app)
 */
router.post(
  '/:orderId/location',
  [
    param('orderId').notEmpty().withMessage('Order ID is required'),
    query('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    query('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    query('riderId').notEmpty().withMessage('Rider ID is required'),
    query('heading').optional().isFloat({ min: 0, max: 360 }).toFloat(),
    query('speed').optional().isFloat({ min: 0 }).toFloat()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, riderId, heading, speed } = req.query;

    await trackingService.updateLocation(
      req.params.orderId,
      riderId as string,
      {
        lat: parseFloat(lat as string),
        lng: parseFloat(lng as string)
      }
    );

    res.json({
      success: true,
      data: {
        orderId: req.params.orderId,
        location: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        },
        updatedAt: new Date()
      }
    });
  })
);

/**
 * @route GET /api/track/eta
 * @desc Calculate ETA between two points
 */
router.get(
  '/eta',
  [
    query('fromLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid from latitude'),
    query('fromLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid from longitude'),
    query('toLat').isFloat({ min: -90, max: 90 }).withMessage('Invalid to latitude'),
    query('toLng').isFloat({ min: -180, max: 180 }).withMessage('Invalid to longitude')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { fromLat, fromLng, toLat, toLng } = req.query;

    const route = await routingService.calculateDistance(
      { lat: parseFloat(fromLat as string), lng: parseFloat(fromLng as string) },
      { lat: parseFloat(toLat as string), lng: parseFloat(toLng as string) },
      { traffic: true }
    );

    res.json({
      success: true,
      data: {
        distance: {
          meters: Math.round(route.distance),
          kilometers: Math.round(route.distance / 1000 * 10) / 10
        },
        duration: {
          seconds: Math.round(route.duration),
          minutes: Math.round(route.duration / 60),
          formatted: `${Math.floor(route.duration / 60)} min ${Math.round(route.duration % 60)} sec`
        },
        steps: route.steps
      }
    });
  })
);

/**
 * @route POST /api/track/:orderId/simulate
 * @desc Simulate rider movement (for testing)
 */
router.post(
  '/:orderId/simulate',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    await trackingService.simulateRiderMovement(req.params.orderId);

    res.json({
      success: true,
      message: 'Simulation started',
      data: {
        orderId: req.params.orderId
      }
    });
  })
);

export default router;
