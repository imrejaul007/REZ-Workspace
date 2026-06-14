import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

const router = Router();

// Logger for this module
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Delivery type enum
export enum DeliveryType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  SCHEDULED = 'scheduled'
}

// Order item schema
const OrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).max(100).optional(),
  totalPrice: z.number().positive()
});

// Address schema
const AddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(10).max(15),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(4).max(10),
  country: z.string().default('India'),
  landmark: z.string().optional()
});

// Create order schema
const CreateOrderSchema = z.object({
  userId: z.string(),
  items: z.array(OrderItemSchema).min(1),
  deliveryAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  paymentMethod: z.enum(['wallet', 'card', 'upi', 'cod']),
  deliveryType: z.nativeEnum(DeliveryType).default(DeliveryType.STANDARD),
  scheduledDeliveryDate: z.string().datetime().optional(),
  promoCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  tipAmount: z.number().min(0).optional()
});

// Update order schema
const UpdateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  deliveryAddress: AddressSchema.optional(),
  notes: z.string().max(500).optional()
});

// Cancel order schema
const CancelOrderSchema = z.object({
  reason: z.string().min(1).max(500),
  refundRequested: z.boolean().default(true)
});

// Types
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;

// Order interface
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tipAmount: number;
  discount: number;
  promoCode?: string;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  deliveryAddress: Address;
  billingAddress?: Address;
  deliveryType: DeliveryType;
  scheduledDeliveryDate?: string;
  notes?: string;
  trackingHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    message: string;
  }>;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  deliveredAt?: string;
}

// In-memory order storage (replace with database in production)
const orders: Order[] = [];

// Helper functions
function generateOrderNumber(): string {
  const prefix = 'RM';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function calculateOrderTotals(items: OrderItem[], deliveryType: DeliveryType, promoCode?: string): {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Tax calculation (GST 18%)
  const tax = Math.round(subtotal * 0.18 * 100) / 100;

  // Delivery fee based on type
  let deliveryFee = 0;
  switch (deliveryType) {
    case DeliveryType.EXPRESS:
      deliveryFee = 99;
      break;
    case DeliveryType.SCHEDULED:
      deliveryFee = 49;
      break;
    case DeliveryType.STANDARD:
    default:
      deliveryFee = subtotal >= 500 ? 0 : 40; // Free delivery for orders >= 500
  }

  // Discount calculation (placeholder)
  let discount = 0;
  if (promoCode === 'FIRST50') {
    discount = Math.round(subtotal * 0.5 * 100) / 100;
  } else if (promoCode === 'SAVE10') {
    discount = Math.round(subtotal * 0.1 * 100) / 100;
  }

  const total = Math.round((subtotal + tax + deliveryFee - discount) * 100) / 100;

  return { subtotal, tax, deliveryFee, discount, total };
}

// Auth middleware (extract user from request)
const authMiddleware = (req: Request, res: Response, next: Function): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  // Extract userId from JWT (placeholder - integrate with RABTUL Auth)
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT_SECRET environment variable required' });
      return;
    }
    const jwt = require('jsonwebtoken');
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, jwtSecret);
    (req as any).userId = decoded.userId || decoded.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * POST /orders
 * Create a new order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateOrderSchema.parse(req.body);

    // Calculate totals
    const totals = calculateOrderTotals(
      validatedData.items,
      validatedData.deliveryType,
      validatedData.promoCode
    );

    const now = new Date().toISOString();
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (validatedData.deliveryType === DeliveryType.EXPRESS ? 1 : 3));

    const order: Order = {
      id: uuidv4(),
      orderNumber: generateOrderNumber(),
      userId: validatedData.userId,
      items: validatedData.items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      deliveryFee: totals.deliveryFee,
      tipAmount: validatedData.tipAmount || 0,
      discount: totals.discount,
      promoCode: validatedData.promoCode,
      total: totals.total + (validatedData.tipAmount || 0),
      currency: 'INR',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: validatedData.paymentMethod,
      deliveryAddress: validatedData.deliveryAddress,
      billingAddress: validatedData.billingAddress,
      deliveryType: validatedData.deliveryType,
      scheduledDeliveryDate: validatedData.scheduledDeliveryDate,
      notes: validatedData.notes,
      trackingHistory: [{
        status: OrderStatus.PENDING,
        timestamp: now,
        message: 'Order placed successfully'
      }],
      estimatedDelivery: estimatedDelivery.toISOString(),
      createdAt: now,
      updatedAt: now
    };

    orders.push(order);
    logger.info(`Order created: ${order.orderNumber} for user: ${order.userId}`);

    res.status(201).json({
      order,
      message: 'Order created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders
 * Get all orders for a user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const status = req.query.status as OrderStatus;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (!userId) {
      res.status(400).json({ error: 'userId query parameter required' });
      return;
    }

    let filtered = orders.filter(o => o.userId === userId);

    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedOrders = filtered.slice(startIndex, startIndex + pageSize);

    res.json({
      orders: paginatedOrders,
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders/:id
 * Get a specific order by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = orders.find(o => o.id === id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders/orderNumber/:orderNumber
 * Get order by order number
 */
router.get('/orderNumber/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;

    const order = orders.find(o => o.orderNumber === orderNumber);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({ order });
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /orders/:id
 * Update order status or details
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateOrderSchema.parse(req.body);

    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = orders[orderIndex];

    // Validate status transition
    if (validatedData.status && validatedData.status !== order.status) {
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
        [OrderStatus.SHIPPED]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.CANCELLED],
        [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.DELIVERED]: [],
        [OrderStatus.CANCELLED]: [],
        [OrderStatus.REFUNDED]: []
      };

      if (!validTransitions[order.status].includes(validatedData.status)) {
        res.status(400).json({
          error: `Invalid status transition from ${order.status} to ${validatedData.status}`
        });
        return;
      }

      // Add to tracking history
      order.trackingHistory.push({
        status: validatedData.status,
        timestamp: new Date().toISOString(),
        message: getStatusMessage(validatedData.status)
      });

      // Update timestamps
      if (validatedData.status === OrderStatus.DELIVERED) {
        order.deliveredAt = new Date().toISOString();
      }

      order.status = validatedData.status;
    }

    // Update delivery address
    if (validatedData.deliveryAddress) {
      order.deliveryAddress = validatedData.deliveryAddress;
    }

    if (validatedData.notes) {
      order.notes = validatedData.notes;
    }

    order.updatedAt = new Date().toISOString();
    orders[orderIndex] = order;

    logger.info(`Order updated: ${order.orderNumber}, status: ${order.status}`);

    res.json({ order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /orders/:id/cancel
 * Cancel an order
 */
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = CancelOrderSchema.parse(req.body);

    const orderIndex = orders.findIndex(o => o.id === id);

    if (orderIndex === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const order = orders[orderIndex];

    // Check if order can be cancelled
    const cancellableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) {
      res.status(400).json({
        error: `Order cannot be cancelled in ${order.status} status`
      });
      return;
    }

    // Update order
    const now = new Date().toISOString();
    order.status = OrderStatus.CANCELLED;
    order.paymentStatus = validatedData.refundRequested ? PaymentStatus.REFUNDED : order.paymentStatus;
    order.cancelledAt = now;
    order.cancellationReason = validatedData.reason;
    order.updatedAt = now;

    order.trackingHistory.push({
      status: OrderStatus.CANCELLED,
      timestamp: now,
      message: `Order cancelled: ${validatedData.reason}`
    });

    orders[orderIndex] = order;

    logger.info(`Order cancelled: ${order.orderNumber}, reason: ${validatedData.reason}`);

    res.json({
      order,
      message: 'Order cancelled successfully',
      refundStatus: validatedData.refundRequested ? 'processing' : 'not_requested'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    logger.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders/:id/tracking
 * Get order tracking information
 */
router.get('/:id/tracking', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = orders.find(o => o.id === id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingHistory: order.trackingHistory,
      estimatedDelivery: order.estimatedDelivery,
      deliveryAddress: order.deliveryAddress
    });
  } catch (error) {
    logger.error('Error fetching tracking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function for status messages
function getStatusMessage(status: OrderStatus): string {
  const messages: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Order placed',
    [OrderStatus.CONFIRMED]: 'Order confirmed by seller',
    [OrderStatus.PROCESSING]: 'Order is being prepared',
    [OrderStatus.SHIPPED]: 'Order has been shipped',
    [OrderStatus.OUT_FOR_DELIVERY]: 'Order is out for delivery',
    [OrderStatus.DELIVERED]: 'Order delivered successfully',
    [OrderStatus.CANCELLED]: 'Order has been cancelled',
    [OrderStatus.REFUNDED]: 'Refund has been processed'
  };
  return messages[status] || 'Status updated';
}

export default router;
