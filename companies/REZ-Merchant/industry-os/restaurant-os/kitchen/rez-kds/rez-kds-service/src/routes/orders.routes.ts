import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orderDisplayService, OrderDisplayDTO } from '../services/OrderDisplayService';
import { StationType, OrderStatus, PriorityLevel } from '../config';

const router = Router();

// Validation schemas
const CreateOrderSchema = z.object({
  orderId: z.string().optional(),
  orderNumber: z.string().min(1),
  source: z.enum(['pos', 'online', 'kiosk']).default('pos'),
  items: z.array(z.object({
    itemId: z.string().min(1),
    name: z.string().min(1),
    quantity: z.number().min(1).default(1),
    modifiers: z.array(z.string()).optional(),
    notes: z.string().optional(),
    station: z.enum(Object.values(StationType) as [string, ...string[]])
  })).min(1),
  tableNumber: z.string().optional(),
  serverName: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  priority: z.number().min(1).max(5).optional(),
  priorityReason: z.string().optional()
});

const UpdatePrioritySchema = z.object({
  priority: z.number().min(1).max(5),
  reason: z.string().optional()
});

const BumpItemSchema = z.object({
  itemId: z.string().min(1)
});

// Error handling wrapper
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Create new order
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const validation = CreateOrderSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors
    });
    return;
  }

  const order = await orderDisplayService.createOrder(validation.data);

  res.status(201).json({
    success: true,
    data: order
  });
}));

// Get all active orders (optionally filtered by station)
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const station = req.query.station as StationType | undefined;

  let orders: OrderDisplayDTO[];

  if (station && Object.values(StationType).includes(station)) {
    orders = await orderDisplayService.getOrdersForStation(station);
  } else {
    // Get orders for all active stations
    const allStations = Object.values(StationType);
    const allOrders: OrderDisplayDTO[] = [];
    for (const s of allStations) {
      const stationOrders = await orderDisplayService.getOrdersForStation(s);
      allOrders.push(...stationOrders);
    }
    // Deduplicate
    orders = allOrders.filter((order, index, self) =>
      index === self.findIndex(o => o.orderId === order.orderId)
    ).sort((a, b) => b.priority - a.priority);
  }

  res.json({
    success: true,
    data: orders,
    meta: {
      count: orders.length,
      timestamp: new Date().toISOString()
    }
  });
}));

// Get order by ID
router.get('/:orderId', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = await orderDisplayService.getOrder(orderId);

  if (!order) {
    res.status(404).json({
      error: 'Order not found',
      orderId
    });
    return;
  }

  res.json({
    success: true,
    data: order
  });
}));

// Bump order (mark as being worked on)
router.post('/:orderId/bump', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { station } = req.body as { station?: StationType };

  if (!station || !Object.values(StationType).includes(station)) {
    res.status(400).json({
      error: 'Valid station is required',
      validStations: Object.values(StationType)
    });
    return;
  }

  const order = await orderDisplayService.bumpOrder(orderId, station);

  if (!order) {
    res.status(404).json({
      error: 'Order not found',
      orderId
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    message: `Order ${order.orderNumber} bumped at ${station}`
  });
}));

// Complete specific item
router.post('/:orderId/items/:itemId/complete', asyncHandler(async (req: Request, res: Response) => {
  const { orderId, itemId } = req.params;
  const order = await orderDisplayService.completeItem(orderId, itemId);

  if (!order) {
    res.status(404).json({
      error: 'Order or item not found',
      orderId,
      itemId
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    message: 'Item completed'
  });
}));

// Mark order as complete
router.post('/:orderId/complete', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = await orderDisplayService.markOrderComplete(orderId);

  if (!order) {
    res.status(404).json({
      error: 'Order not found',
      orderId
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    message: 'Order completed'
  });
}));

// Update order priority
router.patch('/:orderId/priority', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const validation = UpdatePrioritySchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors
    });
    return;
  }

  const { priority, reason } = validation.data;
  const order = await orderDisplayService.updatePriority(orderId, priority, reason);

  if (!order) {
    res.status(404).json({
      error: 'Order not found',
      orderId
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    message: `Priority updated to ${order.priorityLabel}`
  });
}));

// Recall order (bring back to active queue)
router.post('/:orderId/recall', asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = await orderDisplayService.recallOrder(orderId);

  if (!order) {
    res.status(404).json({
      error: 'Order not found',
      orderId
    });
    return;
  }

  res.json({
    success: true,
    data: order,
    message: 'Order recalled to active queue'
  });
}));

// Get order history
router.get('/history/list', asyncHandler(async (req: Request, res: Response) => {
  const {
    startDate,
    endDate,
    station,
    status,
    limit = '50',
    offset = '0'
  } = req.query;

  const filters = {
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    station: station as StationType | undefined,
    status: status as OrderStatus | undefined,
    limit: parseInt(limit as string, 10),
    offset: parseInt(offset as string, 10)
  };

  const result = await orderDisplayService.getOrderHistory(filters);

  res.json({
    success: true,
    data: result.orders,
    meta: {
      total: result.total,
      limit: filters.limit,
      offset: filters.offset
    }
  });
}));

export default router;
