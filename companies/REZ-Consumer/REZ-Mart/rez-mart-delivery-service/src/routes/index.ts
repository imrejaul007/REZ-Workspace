import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  Delivery,
  CreateDeliveryInputSchema,
  AssignDriverInputSchema,
  RateDeliveryInputSchema,
  generateDeliveryId,
  calculateDistance,
  calculateDeliveryFee,
  isValidStatusTransition,
  type DeliveryStatus,
} from '../models/index.js';

const router = Router();

// Validation error handler
const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ============================================
// CREATE DELIVERY
// ============================================

router.post(
  '/',
  validateRequest(CreateDeliveryInputSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = CreateDeliveryInputSchema.parse(req.body);

    // Calculate distance if not provided
    let distance = input.distance;
    if (!distance && input.pickupLocation && input.deliveryLocation) {
      distance = calculateDistance(
        input.pickupLocation.lat,
        input.pickupLocation.lng,
        input.deliveryLocation.lat,
        input.deliveryLocation.lng
      );
    }

    // Calculate fee if not provided
    let fee = input.fee;
    if (!fee && distance !== undefined) {
      fee = calculateDeliveryFee(distance);
    }

    // Calculate estimated time if not provided
    let estimatedTime = input.estimatedTime;
    if (!estimatedTime && distance !== undefined) {
      // Rough estimate: 5 minutes per km + 5 minutes base
      estimatedTime = Math.ceil(distance * 5 + 5);
    }

    const delivery = new Delivery({
      deliveryId: generateDeliveryId(),
      orderId: input.orderId,
      storeId: input.storeId,
      pickupLocation: input.pickupLocation,
      deliveryLocation: input.deliveryLocation,
      distance,
      fee,
      estimatedTime,
      status: 'pending',
      tips: 0,
    });

    await delivery.save();

    res.status(201).json({
      success: true,
      data: delivery,
      message: 'Delivery created successfully',
    });
  })
);

// ============================================
// LIST ALL DELIVERIES
// ============================================

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = '1',
      limit = '20',
      status,
      storeId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};
    if (status) {
      filter.status = status;
    }
    if (storeId) {
      filter.storeId = storeId;
    }

    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortBy as string]: sortDirection };

    const [deliveries, total] = await Promise.all([
      Delivery.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Delivery.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + deliveries.length < total,
      },
    });
  })
);

// ============================================
// GET DELIVERY BY ID
// ============================================

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const delivery = await Delivery.findOne({
      $or: [{ deliveryId: id }, { _id: id }],
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: delivery,
    });
  })
);

// ============================================
// GET DELIVERY BY ORDER ID
// ============================================

router.get(
  '/order/:orderId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    const deliveries = await Delivery.find({ orderId }).sort({ createdAt: -1 });

    if (deliveries.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No deliveries found for this order',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: deliveries,
      count: deliveries.length,
    });
  })
);

// ============================================
// GET DELIVERIES BY DRIVER
// ============================================

router.get(
  '/driver/:driverId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { driverId } = req.params;
    const { status, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = { driverId };
    if (status) {
      filter.status = status;
    }

    const [deliveries, total] = await Promise.all([
      Delivery.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Delivery.countDocuments(filter),
    ]);

    if (deliveries.length === 0) {
      res.status(404).json({
        success: false,
        error: 'No deliveries found for this driver',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ============================================
// ASSIGN DRIVER TO DELIVERY
// ============================================

router.patch(
  '/:id/assign',
  validateRequest(AssignDriverInputSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { driverId, estimatedTime } = AssignDriverInputSchema.parse(req.body);

    const delivery = await Delivery.findOne({
      $or: [{ deliveryId: id }, { _id: id }],
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    if (delivery.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `Cannot assign driver to delivery with status: ${delivery.status}`,
      });
      return;
    }

    delivery.driverId = driverId;
    if (estimatedTime) {
      delivery.estimatedTime = estimatedTime;
    }
    delivery.status = 'assigned';

    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Driver assigned successfully',
    });
  })
);

// ============================================
// MARK DELIVERY AS PICKED UP
// ============================================

router.patch(
  '/:id/pickup',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const delivery = await Delivery.findOne({
      $or: [{ deliveryId: id }, { _id: id }],
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    if (!isValidStatusTransition(delivery.status as DeliveryStatus, 'picked_up')) {
      res.status(400).json({
        success: false,
        error: `Cannot mark delivery as picked up from status: ${delivery.status}`,
      });
      return;
    }

    delivery.status = 'picked_up';
    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery marked as picked up',
    });
  })
);

// ============================================
// MARK DELIVERY AS DELIVERED
// ============================================

router.patch(
  '/:id/deliver',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { tips } = req.body;

    const delivery = await Delivery.findOne({
      $or: [{ deliveryId: id }, { _id: id }],
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    if (!isValidStatusTransition(delivery.status as DeliveryStatus, 'delivered')) {
      res.status(400).json({
        success: false,
        error: `Cannot mark delivery as delivered from status: ${delivery.status}`,
      });
      return;
    }

    delivery.status = 'delivered';

    // Calculate actual delivery time
    const createdAt = delivery.createdAt;
    const deliveredAt = new Date();
    delivery.actualTime = Math.round((deliveredAt.getTime() - createdAt.getTime()) / (1000 * 60));

    if (tips !== undefined) {
      delivery.tips = tips;
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery completed successfully',
      summary: {
        deliveryTime: delivery.actualTime,
        estimatedTime: delivery.estimatedTime,
        onTime: delivery.actualTime !== undefined && delivery.estimatedTime !== undefined
          ? delivery.actualTime <= delivery.estimatedTime
          : null,
      },
    });
  })
);

// ============================================
// CANCEL DELIVERY
// ============================================

router.patch(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;

    const delivery = await Delivery.findOne({
      $or: [{ deliveryId: id }, { _id: id }],
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    if (!isValidStatusTransition(delivery.status as DeliveryStatus, 'cancelled')) {
      res.status(400).json({
        success: false,
        error: `Cannot cancel delivery with status: ${delivery.status}`,
      });
      return;
    }

    delivery.status = 'cancelled';
    if (reason) {
      delivery.feedback = `Cancellation reason: ${reason}`;
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery cancelled successfully',
    });
  })
);

// ============================================
// RATE DELIVERY
// ============================================

router.patch(
  '/:id/rate',
  validateRequest(RateDeliveryInputSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { rating, feedback } = RateDeliveryInputSchema.parse(req.body);

    const delivery = await Delivery.findOne({
      $or: [{ deliveryId: id }, { _id: id }],
    });

    if (!delivery) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found',
      });
      return;
    }

    if (delivery.status !== 'delivered') {
      res.status(400).json({
        success: false,
        error: 'Can only rate delivered orders',
      });
      return;
    }

    delivery.rating = rating;
    if (feedback) {
      delivery.feedback = feedback;
    }

    await delivery.save();

    res.status(200).json({
      success: true,
      data: delivery,
      message: 'Delivery rated successfully',
    });
  })
);

// ============================================
// GET DELIVERY STATISTICS
// ============================================

router.get(
  '/stats/overview',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { storeId } = req.query;

    const filter: Record<string, unknown> = {};
    if (storeId) {
      filter.storeId = storeId;
    }

    const stats = await Delivery.getStats(storeId as string | undefined);

    res.status(200).json({
      success: true,
      data: stats,
    });
  })
);

export default router;