import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services';
import { authMiddleware, validateBody } from '../middleware';
import logger from '../utils/logger';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  productId: z.string().min(1),
  userId: z.string().min(1),
  quantity: z.number().int().positive().max(100),
  totalAmount: z.number().positive(),
  shippingAddress: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().optional().default('India'),
  }),
  notes: z.string().max(1000).optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  trackingNumber: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

const listOrdersQuerySchema = z.object({
  userId: z.string().optional(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  productId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional().transform((v) => (v ? parseInt(v) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)),
  sort: z.string().optional().default('-createdAt'),
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post(
  '/',
  authMiddleware,
  validateBody(createOrderSchema),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.createOrder({
        productId: req.body.productId,
        userId: req.body.userId,
        quantity: req.body.quantity,
        totalAmount: req.body.totalAmount,
        shippingAddress: req.body.shippingAddress,
        notes: req.body.notes,
      });

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error) {
      logger.error('Failed to create order', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        error: 'Failed to create order',
      });
    }
  }
);

/**
 * GET /api/orders
 * List orders with filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = listOrdersQuerySchema.parse(req.query);

    const filters = {
      userId: query.userId,
      status: query.status,
      productId: query.productId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const result = await orderService.listOrders(filters, {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
    });

    res.json({
      success: true,
      data: result.orders,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        total: result.total,
      },
    });
  } catch (error) {
    logger.error('Failed to list orders', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to list orders',
    });
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const stats = await orderService.getOrderStats(userId as string | undefined);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to get order statistics', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get order statistics',
    });
  }
});

/**
 * GET /api/orders/user/:userId
 * Get orders by user ID
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getOrdersByUser(req.params.userId);

    res.json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    logger.error('Failed to get user orders', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.userId,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get user orders',
    });
  }
});

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrder(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    logger.error('Failed to get order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get order',
    });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status
 */
router.patch(
  '/:id/status',
  authMiddleware,
  validateBody(updateOrderStatusSchema),
  async (req: Request, res: Response) => {
    try {
      const order = await orderService.updateOrderStatus(req.params.id, {
        status: req.body.status,
        trackingNumber: req.body.trackingNumber,
        notes: req.body.notes,
      });

      if (!order) {
        res.status(404).json({
          success: false,
          error: 'Order not found',
        });
        return;
      }

      res.json({
        success: true,
        data: order,
        message: 'Order status updated successfully',
      });
    } catch (error) {
      logger.error('Failed to update order status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        orderId: req.params.id,
      });
      res.status(500).json({
        success: false,
        error: 'Failed to update order status',
      });
    }
  }
);

/**
 * POST /api/orders/:id/cancel
 * Cancel an order
 */
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const order = await orderService.cancelOrder(req.params.id, reason);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    logger.error('Failed to cancel order', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orderId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
});

export default router;