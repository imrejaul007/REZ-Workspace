import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orderService } from '../services/OrderService';
import { OrderStatus, PaymentStatus, OrderType } from '../models/Order';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation schemas
const createOrderSchema = z.object({
  orderType: z.nativeEnum(OrderType),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  customerEmail: z.string().email().optional(),
  items: z.array(z.object({
    medicineId: z.string().min(1),
    quantity: z.number().int().positive(),
    prescriptionId: z.string().optional()
  })).min(1),
  shippingAddress: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default('India'),
    phone: z.string().min(1),
    instructions: z.string().optional()
  }).optional(),
  prescriptionId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'INSURANCE', 'CORPORATE_BILLING']).optional(),
  notes: z.string().optional()
});

const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  pharmacistNotes: z.string().optional(),
  trackingNumber: z.string().optional(),
  cancellationReason: z.string().optional(),
  cancelledBy: z.string().optional()
});

const processPaymentSchema = z.object({
  method: z.enum(['CASH', 'CARD', 'UPI', 'INSURANCE', 'CORPORATE_BILLING']),
  transactionId: z.string().optional(),
  insuranceId: z.string().optional()
});

const querySchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  orderType: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

/**
 * POST /api/orders - Create a new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const order = await orderService.createOrder(validatedData);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/orders - Get orders with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = querySchema.parse(req.query);

    const filters: unknown = {};
    if (query.status) filters.status = query.status as OrderStatus;
    if (query.paymentStatus) filters.paymentStatus = query.paymentStatus as PaymentStatus;
    if (query.orderType) filters.orderType = query.orderType as OrderType;
    if (query.fromDate) filters.fromDate = new Date(query.fromDate);
    if (query.toDate) filters.toDate = new Date(query.toDate);
    if (query.page) filters.page = parseInt(query.page);
    if (query.limit) filters.limit = parseInt(query.limit);

    const result = await orderService.getOrders(filters);

    res.json({
      success: true,
      data: {
        orders: result.orders,
        total: result.total
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/orders/stats - Get order statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = await orderService.getOrderStats(days);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/orders/daily-report - Get daily sales report
 */
router.get('/daily-report', async (req: Request, res: Response) => {
  try {
    const date = req.query.date
      ? new Date(req.query.date as string)
      : new Date();

    const report = await orderService.getDailySalesReport(date);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/orders/customer/:customerId - Get orders by customer
 */
router.get('/customer/:customerId', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await orderService.getOrdersByCustomer(req.params.customerId, page, limit);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/orders/:id - Get order by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/orders/number/:orderNumber - Get order by order number
 */
router.get('/number/:orderNumber', async (req: Request, res: Response) => {
  try {
    const order = await orderService.getOrderByNumber(req.params.orderNumber);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/orders/:id - Update order
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validatedData = updateOrderSchema.parse(req.body);
    const order = await orderService.updateOrderStatus({
      orderId: req.params.id,
      ...validatedData
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/orders/:id/cancel - Cancel order
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason, cancelledBy } = req.body;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Cancellation reason is required'
      });
      return;
    }

    const order = await orderService.cancelOrder(req.params.id, reason, cancelledBy || 'SYSTEM');

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/orders/:id/payment - Process payment
 */
router.post('/:id/payment', async (req: Request, res: Response) => {
  try {
    const validatedData = processPaymentSchema.parse(req.body);
    const order = await orderService.processPayment(req.params.id, validatedData);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
});

export default router;
