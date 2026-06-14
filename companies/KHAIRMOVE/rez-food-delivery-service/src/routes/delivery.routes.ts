import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { DeliveryAssignmentService } from '../services/DeliveryAssignmentService';
import { DeliveryPerson, DriverStatus } from '../models/DeliveryPerson';
import { DeliveryOrder, OrderStatus } from '../models/DeliveryOrder';
import { config } from '../config';

const router = Router();

// Validation schemas
const registerDriverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  email: z.string().email().optional(),
  vehicleType: z.enum(['bicycle', 'scooter', 'motorcycle', 'car']),
  vehicleNumber: z.string().optional(),
  zones: z.array(z.string()).min(1),
  bankDetails: z
    .object({
      accountNumber: z.string().min(8),
      ifsc: z.string().min(8),
      holderName: z.string().min(1),
    })
    .optional(),
});

const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const completeDeliverySchema = z.object({
  otp: z.string().length(4).optional(), // OTP can be sent in body
});

export function createDeliveryRoutes(assignmentService: DeliveryAssignmentService): Router {
  // Assign driver to order
  router.post('/assign/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const result = await assignmentService.assignDriverToOrder(orderId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Auto-assign all pending orders
  router.post('/assign/auto', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assigned = await assignmentService.autoAssignAvailableOrders();

      res.json({
        success: true,
        data: { assigned },
        message: `Auto-assigned ${assigned} orders`,
      });
    } catch (error) {
      next(error);
    }
  });

  // Reassign driver
  router.post('/reassign/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const result = await assignmentService.reassignDriver(orderId, reason || 'Manual reassignment');

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  // Complete delivery with OTP verification
  router.post('/complete/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { otp } = completeDeliverySchema.parse(req.body);

      const result = await assignmentService.completeDelivery(orderId, otp || '');

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Delivery completed successfully',
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

  // Register new driver
  router.post('/driver/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = registerDriverSchema.parse(req.body);

      // Generate driver ID
      const driverId = `DRV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const driver = new DeliveryPerson({
        driverId,
        ...validatedData,
        status: DriverStatus.OFFLINE,
        rating: 5.0,
        totalDeliveries: 0,
        todayDeliveries: 0,
        todayEarnings: 0,
        totalEarnings: 0,
        isActive: true,
      });

      await driver.save();

      res.status(201).json({
        success: true,
        data: {
          driverId: driver.driverId,
          name: driver.name,
          phone: driver.phone,
        },
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

  // Get driver by ID
  router.get('/driver/:driverId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const driver = await DeliveryPerson.findOne({ driverId });

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      res.json({
        success: true,
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  });

  // Update driver status
  router.patch('/driver/:driverId/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const { status } = req.body;

      if (!Object.values(DriverStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status',
        });
      }

      const driver = await DeliveryPerson.findOneAndUpdate(
        { driverId },
        { $set: { status } },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      res.json({
        success: true,
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  });

  // Update driver location
  router.post('/driver/:driverId/location', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const { lat, lng } = locationUpdateSchema.parse(req.body);

      const driver = await DeliveryPerson.findOneAndUpdate(
        { driverId },
        {
          $set: {
            currentLocation: { lat, lng, updatedAt: new Date() },
          },
        },
        { new: true }
      );

      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      res.json({
        success: true,
        data: driver.currentLocation,
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

  // Get available drivers for zone
  router.get('/drivers/available', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { zone } = req.query;

      const query: Record<string, unknown> = {
        status: DriverStatus.AVAILABLE,
        isActive: true,
      };

      if (zone) {
        query.zones = zone;
      }

      const drivers = await DeliveryPerson.find(query);

      res.json({
        success: true,
        data: drivers,
        count: drivers.length,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get driver earnings
  router.get('/driver/:driverId/earnings', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driverId } = req.params;
      const { period } = req.query;

      const driver = await DeliveryPerson.findOne({ driverId });
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
      }

      // Calculate earnings breakdown
      const earnings = {
        today: driver.todayEarnings,
        total: driver.totalEarnings,
        deliveriesToday: driver.todayDeliveries,
        totalDeliveries: driver.totalDeliveries,
        rating: driver.rating,
        incentiveBonus: driver.todayDeliveries > 0 && driver.todayDeliveries % 5 === 0
          ? config.driverEarnings.incentiveBonus
          : 0,
      };

      res.json({
        success: true,
        data: earnings,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get delivery zone info
  router.get('/zones', async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: config.deliveryZones,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get surge pricing status
  router.get('/surge', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rushMultiplier = getRushHourMultiplier();
      const currentHour = new Date().getHours();
      let rushType: string | null = null;

      if (currentHour >= config.rushHours.lunch.start && currentHour < config.rushHours.lunch.end) {
        rushType = 'lunch';
      } else if (currentHour >= config.rushHours.dinner.start && currentHour < config.rushHours.dinner.end) {
        rushType = 'dinner';
      }

      res.json({
        success: true,
        data: {
          rushActive: rushType !== null,
          rushType,
          rushMultiplier,
          surgeMultiplier: config.surgeMultiplier,
          threshold: config.surgeThreshold,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function getRushHourMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= config.rushHours.lunch.start && hour < config.rushHours.lunch.end) {
    return config.rushHours.lunch.multiplier;
  }
  if (hour >= config.rushHours.dinner.start && hour < config.rushHours.dinner.end) {
    return config.rushHours.dinner.multiplier;
  }
  return 1.0;
}

export default router;
