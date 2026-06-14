import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TrackingService } from '../services/TrackingService';
import { TrackingEventType } from '../models/Tracking';

const router = Router();

const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  orderId: z.string().optional(),
});

const trackingEventSchema = z.object({
  type: z.enum([
    'order_created',
    'order_confirmed',
    'order_preparing',
    'order_ready',
    'driver_assigned',
    'driver_en_route_pickup',
    'driver_arrived_pickup',
    'order_picked_up',
    'order_in_transit',
    'driver_arrived_dropoff',
    'delivery_completed',
    'delivery_cancelled',
  ]),
  note: z.string().optional(),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export function createTrackingRoutes(trackingService: TrackingService): Router {
  // Get tracking for an order
  router.get('/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const tracking = await trackingService.getTracking(orderId);

      if (!tracking) {
        return res.status(404).json({
          success: false,
          error: 'Tracking not found',
        });
      }

      res.json({
        success: true,
        data: tracking,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get tracking history
  router.get('/:orderId/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const history = await trackingService.getTrackingHistory(orderId);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get driver's current location
  router.get('/driver/:driverId/location', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const location = await trackingService.getDriverLocation(driverId);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Driver location not found',
        });
      }

      res.json({
        success: true,
        data: location,
      });
    } catch (error) {
      next(error);
    }
  });

  // Update driver location (called by driver app)
  router.post('/driver/:driverId/location', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const validatedData = locationUpdateSchema.parse(req.body);

      await trackingService.updateDriverLocation({
        driverId,
        ...validatedData,
        timestamp: new Date(),
      });

      res.json({
        success: true,
        message: 'Location updated',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  });

  // Add tracking event
  router.post('/:orderId/event', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const validatedData = trackingEventSchema.parse(req.body);

      await trackingService.addTrackingEvent(
        orderId,
        validatedData.type as TrackingEventType,
        validatedData.note,
        validatedData.location
      );

      res.json({
        success: true,
        message: 'Event added',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }
      next(error);
    }
  });

  // Get tracking by driver
  router.get('/driver/:driverId/active', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const trackings = await trackingService.getTrackingByDriver(driverId);

      res.json({
        success: true,
        data: trackings,
        count: trackings.length,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default router;
