/**
 * Orders Routes
 *
 * Endpoints for order processing
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { rateLimiters } from '../middleware/rateLimiter';
import { orderService } from '../services/OrderService';
import { logger } from '../config/logger';

const log = (msg: string, meta?) => logger.info(`[orders-routes] ${msg}`, meta);
const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
  customizations: z.array(z.object({
    name: z.string(),
    priceModifier: z.number(),
  })).optional(),
  specialInstructions: z.string().optional(),
});

const deliveryAddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().default('India'),
  pincode: z.string().min(1),
  instructions: z.string().optional(),
});

const createOrderSchema = z.object({
  restaurantId: z.string(),
  branchId: z.string(),
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  items: z.array(orderItemSchema).min(1),
  customerName: z.string().optional(),
  customerPhone: z.string().min(10),
  customerEmail: z.string().email().optional(),
  specialInstructions: z.string().optional(),
  tableId: z.string().optional(),
  guestCount: z.number().positive().optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled']).optional(),
  specialInstructions: z.string().optional(),
  cancellationReason: z.string().optional(),
});

// ─── Public Routes ────────────────────────────────────────────────────────────

/**
 * Get order by order number
 * GET /api/orders/number/:orderNumber
 */
router.get('/number/:orderNumber', optionalAuth, async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderByNumber(req.params.orderNumber);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    log('Get order error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order' });
  }
});

/**
 * Get AI recommendations for order
 * GET /api/orders/recommendations
 */
router.get('/recommendations', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      res.status(400).json({ success: false, message: 'restaurantId is required' });
      return;
    }

    const recommendations = await orderService.getRecommendations(
      req.user!.sub,
      restaurantId as string
    );

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    log('Get recommendations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
});

// ─── Protected Routes ───────────────────────────────────────────────────────────

/**
 * Create order
 * POST /api/orders
 */
router.post('/', rateLimiters.order, authenticateToken, async (req: Request, res: Response) => {
  try {
    const input = createOrderSchema.parse(req.body);

    const order = await orderService.createOrder({
      ...input,
      userId: req.user!.sub,
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    });
  } catch (error) {
    log('Create order error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    if (error.message.includes('not found') || error.message.includes('not available')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

/**
 * Get order by ID
 * GET /api/orders/:orderId
 */
router.get('/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrder(req.params.orderId);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Check ownership
    if (order.userId !== req.user!.sub && req.user!.role !== 'admin' && req.user!.role !== 'restaurant_owner') {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.json({ success: true, data: order });
  } catch (error) {
    log('Get order error:', error);
    res.status(500).json({ success: false, message: 'Failed to get order' });
  }
});

/**
 * Update order
 * PUT /api/orders/:orderId
 */
router.put('/:orderId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const input = updateOrderSchema.parse(req.body);

    const order = await orderService.updateOrder(req.params.orderId, input);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
    });
  } catch (error) {
    log('Update order error:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Invalid data', errors: error.errors });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update order' });
  }
});

/**
 * Cancel order
 * POST /api/orders/:orderId/cancel
 */
router.post('/:orderId/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const order = await orderService.cancelOrder(req.params.orderId, reason);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    log('Cancel order error:', error);
    if (error.message.includes('cannot be cancelled')) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
});

/**
 * Get my orders
 * GET /api/orders/my/list
 */
router.get('/my/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;

    const orders = await orderService.getUserOrders(
      req.user!.sub,
      limit ? parseInt(limit as string, 10) : 20
    );

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    log('Get my orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

/**
 * Get active orders for branch
 * GET /api/orders/branch/:branchId/active
 */
router.get('/branch/:branchId/active', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await orderService.getActiveOrders(req.params.branchId);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    log('Get active orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to get orders' });
  }
});

/**
 * Get order statistics
 * GET /api/orders/branch/:branchId/stats
 */
router.get('/branch/:branchId/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { date } = req.query;

    const stats = await orderService.getOrderStats(
      req.params.branchId,
      date ? new Date(date as string) : new Date()
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    log('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get stats' });
  }
});

/**
 * Update order status
 * PATCH /api/orders/:orderId/status
 */
router.patch('/:orderId/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'status is required' });
      return;
    }

    const order = await orderService.updateStatus(req.params.orderId, status);

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Order status updated',
    });
  } catch (error) {
    log('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

export default router;
