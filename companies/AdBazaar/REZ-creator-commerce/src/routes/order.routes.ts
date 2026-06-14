import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderService, creatorService } from '../services';
import { logger } from '../services/logger.service';
import { OrderStatus } from '../types';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  creatorId: z.string().min(1),
  productId: z.string().min(1),
  customerId: z.string().min(1),
  quantity: z.number().int().min(1).optional(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().min(1),
    country: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']).optional(),
  notes: z.string().optional(),
});

// Error handler wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ============================================
// ORDER ROUTES (Nested under creators)
// ============================================

/**
 * GET /api/creators/:creatorId/orders
 * List orders for a creator
 */
router.get('/creators/:creatorId/orders', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as OrderStatus | undefined;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await orderService.getByCreator(creatorId, {
    page,
    limit,
    status,
  });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/creators/:creatorId/orders/stats
 * Get order stats for a creator
 */
router.get('/creators/:creatorId/orders/stats', asyncHandler(async (req: Request, res: Response) => {
  const { creatorId } = req.params;

  // Verify creator exists
  const creator = await creatorService.getById(creatorId);
  if (!creator) {
    res.status(404).json({
      success: false,
      error: 'Creator not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const stats = await orderService.getCreatorStats(creatorId);

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString(),
  });
}));

// ============================================
// ORDER ROUTES (Direct)
// ============================================

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/orders', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createOrderSchema.parse(req.body);

  try {
    const order = await orderService.create(validatedData);

    logger.info(`Order created via API: ${order._id}`);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * GET /api/orders/:id
 * Get order by ID
 */
router.get('/orders/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await orderService.getById(id);
  if (!order) {
    res.status(404).json({
      success: false,
      error: 'Order not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/orders/number/:orderNumber
 * Get order by order number
 */
router.get('/orders/number/:orderNumber', asyncHandler(async (req: Request, res: Response) => {
  const { orderNumber } = req.params;

  const order = await orderService.getByOrderNumber(orderNumber);
  if (!order) {
    res.status(404).json({
      success: false,
      error: 'Order not found',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * PUT /api/orders/:id
 * Update order
 */
router.put('/orders/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateOrderSchema.parse(req.body);

  try {
    const order = await orderService.updateStatus(id, validatedData);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Order updated via API: ${id}`);

    res.json({
      success: true,
      data: order,
      message: 'Order updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/orders/:id/process
 * Process order (pending -> processing)
 */
router.patch('/orders/:id/process', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await orderService.processOrder(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Order processed via API: ${id}`);

    res.json({
      success: true,
      data: order,
      message: 'Order processed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/orders/:id/complete
 * Complete order (processing -> completed)
 */
router.patch('/orders/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const order = await orderService.completeOrder(id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Order completed via API: ${id}`);

    res.json({
      success: true,
      data: order,
      message: 'Order completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/orders/:id/cancel
 * Cancel order
 */
router.patch('/orders/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const order = await orderService.cancelOrder(id, reason);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Order cancelled via API: ${id}`);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * PATCH /api/orders/:id/refund
 * Refund order
 */
router.patch('/orders/:id/refund', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const order = await orderService.refundOrder(id, reason);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`Order refunded via API: ${id}`);

    res.json({
      success: true,
      data: order,
      message: 'Order refunded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}));

/**
 * GET /api/orders/customer/:customerId
 * Get orders by customer
 */
router.get('/orders/customer/:customerId', asyncHandler(async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await orderService.getByCustomer(customerId, { page, limit });

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    timestamp: new Date().toISOString(),
  });
}));

export default router;