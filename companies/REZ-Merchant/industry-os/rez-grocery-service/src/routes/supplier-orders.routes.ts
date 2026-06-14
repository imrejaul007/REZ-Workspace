import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { SupplierOrder, SupplierOrderStatus, Product, ProductStatus } from '../models';
import { authenticateToken } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation Schemas
const createSupplierOrderSchema = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  supplierName: z.string().min(1, 'Supplier name is required'),
  supplierContact: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierEmail: z.string().email().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    name: z.string().min(1, 'Product name is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit: z.string().min(1, 'Unit is required'),
    rate: z.number().nonnegative('Rate must be non-negative'),
    amount: z.number().nonnegative().optional()
  })).min(1, 'At least one item is required'),
  deliveryDate: z.string().transform(s => new Date(s)),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  createdBy: z.string().optional()
});

const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(SupplierOrderStatus),
  notes: z.string().optional(),
  receivedBy: z.string().optional(),
  actualDeliveryDate: z.string().transform(s => new Date(s)).optional()
});

const addOrderItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string().optional(),
    name: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    rate: z.number().nonnegative(),
    amount: z.number().nonnegative().optional()
  })).min(1)
});

const receiveItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    receivedQuantity: z.number().int().min(0)
  })).min(1)
});

const searchQuerySchema = z.object({
  merchantId: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

/**
 * POST /api/supplier-orders - Create a new supplier order
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createSupplierOrderSchema.parse(req.body);

    // Calculate amounts for items
    const items = validatedData.items.map(item => ({
      ...item,
      amount: item.amount || (item.quantity * item.rate)
    }));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);

    const orderId = `SO-${uuidv4().substring(0, 8).toUpperCase()}`;

    const order = new SupplierOrder({
      orderId,
      ...validatedData,
      items,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      status: SupplierOrderStatus.PENDING
    });

    await order.save();

    logger.info(`Supplier order created: ${orderId}`);

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
      logger.error('Error creating supplier order:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/supplier-orders - List supplier orders with filters
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = searchQuerySchema.parse(req.query);

    const filter: Record<string, unknown> = {};

    if (query.merchantId) {
      filter.merchantId = query.merchantId;
    }

    if (query.supplierId) {
      filter.supplierId = query.supplierId;
    }

    if (query.status) {
      filter.status = query.status as SupplierOrderStatus;
    }

    if (query.startDate || query.endDate) {
      filter.deliveryDate = {};
      if (query.startDate) {
        (filter.deliveryDate as Record<string, Date>).$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        (filter.deliveryDate as Record<string, Date>).$lte = new Date(query.endDate);
      }
    }

    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      SupplierOrder.find(filter)
        .sort({ deliveryDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupplierOrder.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
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
      logger.error('Error listing supplier orders:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * GET /api/supplier-orders/pending - Get pending orders for a supplier
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const supplierId = req.query.supplierId as string;
    const merchantId = req.query.merchantId as string;

    const filter: Record<string, unknown> = {
      status: { $in: [SupplierOrderStatus.PENDING, SupplierOrderStatus.CONFIRMED, SupplierOrderStatus.SHIPPED] }
    };

    if (supplierId) filter.supplierId = supplierId;
    if (merchantId) filter.merchantId = merchantId;

    const orders = await SupplierOrder.find(filter)
      .sort({ deliveryDate: 1 });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length
      }
    });
  } catch (error) {
    logger.error('Error getting pending orders:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/supplier-orders/due - Get orders due for delivery
 */
router.get('/due', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;
    const daysAhead = parseInt(req.query.days as string) || 3;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const orders = await SupplierOrder.find({
      merchantId,
      status: { $in: [SupplierOrderStatus.CONFIRMED, SupplierOrderStatus.SHIPPED] },
      deliveryDate: { $lte: futureDate }
    }).sort({ deliveryDate: 1 });

    res.json({
      success: true,
      data: {
        orders,
        count: orders.length,
        daysAhead
      }
    });
  } catch (error) {
    logger.error('Error getting due orders:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/supplier-orders/:id - Get supplier order by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await SupplierOrder.findOne({ orderId: req.params.id });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error getting supplier order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/supplier-orders/:id - Update supplier order
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const order = await SupplierOrder.findOne({ orderId: req.params.id });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
      return;
    }

    // Cannot update delivered or cancelled orders
    if (order.status === SupplierOrderStatus.DELIVERED || order.status === SupplierOrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        error: 'Cannot update delivered or cancelled orders'
      });
      return;
    }

    const { items, ...updates } = req.body;

    if (items) {
      // Recalculate totals if items are updated
      const newItems = items.map((item: { productId?: string; name: string; quantity: number; unit: string; rate: number; amount?: number }) => ({
        ...item,
        amount: item.amount || (item.quantity * item.rate)
      }));

      const subtotal = newItems.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);

      (order as unknown as Record<string, unknown>).items = newItems;
      (order as unknown as Record<string, unknown>).subtotal = subtotal;
      (order as unknown as Record<string, unknown>).total = subtotal - (order.discount || 0) + (order.tax || 0);
    }

    Object.assign(order, updates);
    await order.save();

    logger.info(`Supplier order updated: ${req.params.id}`);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error updating supplier order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/supplier-orders/:id/status - Update order status
 */
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const validatedData = updateOrderStatusSchema.parse(req.body);

    const order = await SupplierOrder.findOne({ orderId: req.params.id });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
      return;
    }

    // Validate status transition
    const validTransitions: Record<SupplierOrderStatus, SupplierOrderStatus[]> = {
      [SupplierOrderStatus.PENDING]: [SupplierOrderStatus.CONFIRMED, SupplierOrderStatus.CANCELLED],
      [SupplierOrderStatus.CONFIRMED]: [SupplierOrderStatus.SHIPPED, SupplierOrderStatus.CANCELLED],
      [SupplierOrderStatus.SHIPPED]: [SupplierOrderStatus.DELIVERED, SupplierOrderStatus.CANCELLED],
      [SupplierOrderStatus.DELIVERED]: [],
      [SupplierOrderStatus.CANCELLED]: []
    };

    if (!validTransitions[order.status].includes(validatedData.status)) {
      res.status(400).json({
        success: false,
        error: `Invalid status transition from ${order.status} to ${validatedData.status}`,
        validTransitions: validTransitions[order.status]
      });
      return;
    }

    const previousStatus = order.status;
    order.status = validatedData.status;

    if (validatedData.notes) {
      order.notes = validatedData.notes;
    }

    if (validatedData.actualDeliveryDate) {
      order.actualDeliveryDate = validatedData.actualDeliveryDate;
    }

    if (validatedData.receivedBy) {
      order.receivedBy = validatedData.receivedBy;
    }

    // If delivered, set actual delivery date
    if (validatedData.status === SupplierOrderStatus.DELIVERED && !order.actualDeliveryDate) {
      order.actualDeliveryDate = new Date();
    }

    await order.save();

    logger.info(`Order status updated: ${req.params.id} - ${previousStatus} -> ${validatedData.status}`);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        previousStatus,
        newStatus: order.status,
        actualDeliveryDate: order.actualDeliveryDate
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/supplier-orders/:id/receive - Receive items in an order
 */
router.post('/:id/receive', async (req: Request, res: Response) => {
  try {
    const validatedData = receiveItemsSchema.parse(req.body);

    const order = await SupplierOrder.findOne({ orderId: req.params.id });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
      return;
    }

    if (order.status === SupplierOrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        error: 'Cannot receive items for cancelled order'
      });
      return;
    }

    const receivedItems: { productId: string; name: string; quantity: number; unit: string }[] = [];

    for (const received of validatedData.items) {
      const orderItem = order.items.find(item => item.productId === received.productId);

      if (!orderItem) {
        res.status(400).json({
          success: false,
          error: `Product ${received.productId} not found in order`
        });
        return;
      }

      // Update received quantity
      orderItem.receivedQuantity = (orderItem.receivedQuantity || 0) + received.receivedQuantity;

      // Update inventory if product exists
      if (received.productId) {
        const product = await Product.findOne({ productId: received.productId });

        if (product) {
          product.stock += received.receivedQuantity;
          await product.save();

          receivedItems.push({
            productId: received.productId,
            name: product.name,
            quantity: received.receivedQuantity,
            unit: orderItem.unit
          });
        }
      }
    }

    // Check if all items are fully received
    const allReceived = order.items.every(item =>
      (item.receivedQuantity || 0) >= item.quantity
    );

    if (allReceived && order.status !== SupplierOrderStatus.DELIVERED) {
      order.status = SupplierOrderStatus.DELIVERED;
      order.actualDeliveryDate = new Date();
    }

    await order.save();

    logger.info(`Items received for order ${req.params.id}: ${receivedItems.length} products`);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        receivedItems,
        orderStatus: order.status,
        completionPercentage: order.completionPercentage
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      logger.error('Error receiving items:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
});

/**
 * POST /api/supplier-orders/:id/cancel - Cancel a supplier order
 */
router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason, cancelledBy } = req.body;

    const order = await SupplierOrder.findOne({ orderId: req.params.id });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
      return;
    }

    if (order.status === SupplierOrderStatus.DELIVERED) {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a delivered order'
      });
      return;
    }

    if (order.status === SupplierOrderStatus.CANCELLED) {
      res.status(400).json({
        success: false,
        error: 'Order is already cancelled'
      });
      return;
    }

    order.status = SupplierOrderStatus.CANCELLED;
    order.notes = reason || 'Order cancelled';
    (order as unknown as Record<string, unknown>).cancelledBy = cancelledBy || 'System';

    await order.save();

    logger.info(`Order cancelled: ${req.params.id} - Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.orderId,
        status: order.status,
        cancellationReason: reason
      }
    });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/supplier-orders/:id/track - Track order delivery
 */
router.get('/:id/track', async (req: Request, res: Response) => {
  try {
    const order = await SupplierOrder.findOne({ orderId: req.params.id });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Supplier order not found'
      });
      return;
    }

    // Get timeline
    const timeline = [
      {
        status: SupplierOrderStatus.PENDING,
        timestamp: order.createdAt,
        label: 'Order Created'
      }
    ];

    if (order.status !== SupplierOrderStatus.PENDING && order.status !== SupplierOrderStatus.CANCELLED) {
      timeline.push({
        status: SupplierOrderStatus.CONFIRMED,
        timestamp: order.updatedAt,
        label: 'Order Confirmed by Supplier'
      });
    }

    if (order.status === SupplierOrderStatus.SHIPPED || order.status === SupplierOrderStatus.DELIVERED) {
      timeline.push({
        status: SupplierOrderStatus.SHIPPED,
        timestamp: order.updatedAt,
        label: 'Order Shipped'
      });
    }

    if (order.status === SupplierOrderStatus.DELIVERED) {
      timeline.push({
        status: SupplierOrderStatus.DELIVERED,
        timestamp: order.actualDeliveryDate || order.updatedAt,
        label: 'Order Delivered'
      });
    }

    if (order.status === SupplierOrderStatus.CANCELLED) {
      timeline.push({
        status: SupplierOrderStatus.CANCELLED,
        timestamp: order.updatedAt,
        label: 'Order Cancelled'
      });
    }

    // Calculate delivery status
    const now = new Date();
    const daysUntilDelivery = Math.ceil(
      (order.deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let deliveryStatus: string;
    if (order.status === SupplierOrderStatus.DELIVERED) {
      deliveryStatus = 'DELIVERED';
    } else if (daysUntilDelivery < 0) {
      deliveryStatus = 'OVERDUE';
    } else if (daysUntilDelivery === 0) {
      deliveryStatus = 'DUE_TODAY';
    } else if (daysUntilDelivery <= 3) {
      deliveryStatus = 'DUE_SOON';
    } else {
      deliveryStatus = 'SCHEDULED';
    }

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        deliveryDate: order.deliveryDate,
        deliveryStatus,
        daysUntilDelivery,
        timeline,
        items: order.items,
        completionPercentage: order.completionPercentage
      }
    });
  } catch (error) {
    logger.error('Error tracking order:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/supplier-orders/stats/summary - Get order statistics
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const merchantId = req.query.merchantId as string;

    if (!merchantId) {
      res.status(400).json({
        success: false,
        error: 'merchantId is required'
      });
      return;
    }

    const stats = await SupplierOrder.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total' }
        }
      }
    ]);

    const summary = stats.reduce((acc, stat) => {
      acc[stat._id] = {
        count: stat.count,
        totalValue: stat.totalValue
      };
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>);

    // Get supplier performance
    const supplierStats = await SupplierOrder.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: '$supplierId',
          supplierName: { $first: '$supplierName' },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
          },
          totalValue: { $sum: '$total' },
          onTimeDeliveries: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'DELIVERED'] },
                    { $lte: ['$actualDeliveryDate', '$deliveryDate'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { totalOrders: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: summary,
        totalOrders: Object.values(summary).reduce((sum, s) => sum + s.count, 0),
        totalValue: Object.values(summary).reduce((sum, s) => sum + s.totalValue, 0),
        supplierStats: supplierStats.map(s => ({
          supplierId: s._id,
          supplierName: s.supplierName,
          totalOrders: s.totalOrders,
          deliveredOrders: s.deliveredOrders,
          onTimeDeliveryRate: s.totalOrders > 0 ? (s.onTimeDeliveries / s.deliveredOrders) * 100 : 0,
          totalValue: s.totalValue
        }))
      }
    });
  } catch (error) {
    logger.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;