import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderService } from '../services/OrderService';
import { DeliveryOrder, OrderStatus, OrderType } from '../models/DeliveryOrder';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  customerId: z.string().min(1),
  restaurantId: z.string().min(1),
  orderType: z.enum(['takeaway', 'delivery']),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      name: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().positive(),
      notes: z.string().optional(),
    })
  ),
  customerPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  restaurantAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
  deliveryAddress: z
    .object({
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      coordinates: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      }),
    })
    .optional(),
  pickupTime: z.string().datetime().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'assigned',
    'picked_up',
    'in_transit',
    'arrived',
    'delivered',
    'cancelled',
  ]),
  note: z.string().optional(),
});

const verifyOTPSchema = z.object({
  otp: z.string().length(4),
});

export function createOrderRoutes(orderService: OrderService): Router {
  // Create new order
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const pickupTime = validatedData.pickupTime ? new Date(validatedData.pickupTime) : undefined;

      // Cast orderType from zod enum to our OrderType enum
      const orderType = validatedData.orderType === 'takeaway' 
        ? OrderType.TAKEAWAY 
        : OrderType.DELIVERY;

      const result = await orderService.createOrder({
        customerId: validatedData.customerId,
        restaurantId: validatedData.restaurantId,
        orderType,
        items: validatedData.items,
        customerPhone: validatedData.customerPhone,
        restaurantAddress: validatedData.restaurantAddress,
        deliveryAddress: validatedData.deliveryAddress,
        pickupTime,
      });

      res.status(201).json({
        success: true,
        data: {
          orderId: result.order.orderId,
          status: result.order.status,
          estimatedDeliveryTime: result.estimatedDeliveryTime,
          deliveryFee: result.deliveryFee,
          surgeFee: result.surgeFee,
          totalAmount: result.order.totalAmount,
          otp: result.order.otp, // Include OTP only for delivery orders
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

  // Get order by ID
  router.get('/:orderId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const order = await orderService.getOrder(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get orders by customer
  router.get('/customer/:customerId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const orders = await orderService.getOrdersByCustomer(customerId, limit);

      res.json({
        success: true,
        data: orders,
        count: orders.length,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get orders by restaurant
  router.get('/restaurant/:restaurantId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { restaurantId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as OrderStatus | undefined;

      let orders;
      if (status) {
        orders = await orderService.getOrdersByStatus(status, limit);
      } else {
        orders = await orderService.getOrdersByRestaurant(restaurantId, limit);
      }

      res.json({
        success: true,
        data: orders,
        count: orders.length,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get pending orders for assignment
  router.get('/status/pending', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const orders = await orderService.getOrdersByStatus(OrderStatus.READY_FOR_PICKUP, limit);

      res.json({
        success: true,
        data: orders,
        count: orders.length,
      });
    } catch (error) {
      next(error);
    }
  });

  // Update order status
  router.patch('/:orderId/status', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { status, note } = updateStatusSchema.parse(req.body);

      const order = await orderService.updateOrderStatus(orderId, status as OrderStatus, note);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
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

  // Verify OTP
  router.post('/:orderId/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { otp } = verifyOTPSchema.parse(req.body);

      const isValid = await orderService.verifyOTP(orderId, otp);

      res.json({
        success: isValid,
        verified: isValid,
        message: isValid ? 'OTP verified successfully' : 'Invalid OTP',
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

  // Cancel order
  router.post('/:orderId/cancel', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await orderService.cancelOrder(orderId, reason || 'Cancelled by user');

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        data: order,
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export default router;
