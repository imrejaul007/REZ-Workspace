import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import orderService, { CreateOrderInput, UpdateStatusInput } from '../services/orderService';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AppError as AppErrorClass } from '../middleware/errorHandler';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * @route POST /api/orders
 * @desc Create a new delivery order
 */
router.post(
  '/',
  [
    body('source').isIn(['swiggy', 'zomato', 'own', 'website']).withMessage('Invalid source'),
    body('merchantId').notEmpty().withMessage('Merchant ID is required'),
    body('customer.name').notEmpty().withMessage('Customer name is required'),
    body('customer.phone').isMobilePhone('en-IN').withMessage('Invalid phone number'),
    body('customer.address.street').notEmpty().withMessage('Street address is required'),
    body('customer.address.city').notEmpty().withMessage('City is required'),
    body('customer.address.state').notEmpty().withMessage('State is required'),
    body('customer.address.postalCode').notEmpty().withMessage('Postal code is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be non-negative')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const input: CreateOrderInput = {
      source: req.body.source,
      sourceOrderId: req.body.sourceOrderId,
      merchantId: req.body.merchantId,
      customer: req.body.customer,
      items: req.body.items,
      deliveryFee: req.body.deliveryFee,
      platformFee: req.body.platformFee,
      discount: req.body.discount,
      paymentMethod: req.body.paymentMethod,
      specialInstructions: req.body.specialInstructions
    };

    const order = await orderService.createOrder(input);

    res.status(201).json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        estimatedDelivery: order.estimatedDelivery,
        totalAmount: order.totalAmount
      }
    });
  })
);

/**
 * @route GET /api/orders/:orderId
 * @desc Get order by ID
 */
router.get(
  '/:orderId',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getOrderById(req.params.orderId);

    if (!order) {
      throw new AppErrorClass('Order not found', 404);
    }

    res.json({
      success: true,
      data: order
    });
  })
);

/**
 * @route PATCH /api/orders/:orderId/status
 * @desc Update order status
 */
router.patch(
  '/:orderId/status',
  [
    param('orderId').notEmpty().withMessage('Order ID is required'),
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'])
      .withMessage('Invalid status'),
    body('note').optional().isString().withMessage('Note must be a string'),
    body('riderId').optional().isMongoId().withMessage('Invalid rider ID')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const input: UpdateStatusInput = {
      orderId: req.params.orderId,
      status: req.body.status,
      note: req.body.note,
      riderId: req.body.riderId
    };

    const order = await orderService.updateStatus(input);

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        statusHistory: order.statusHistory
      }
    });
  })
);

/**
 * @route GET /api/orders/merchant/:merchantId
 * @desc Get orders by merchant
 */
router.get(
  '/merchant/:merchantId',
  [
    param('merchantId').notEmpty().withMessage('Merchant ID is required'),
    query('status').optional().isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('skip').optional().isInt({ min: 0 }).toInt(),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { orders, total } = await orderService.getOrdersByMerchant(
      req.params.merchantId,
      {
        status: req.query.status as string,
        limit: req.query.limit as number,
        skip: req.query.skip as number,
        startDate: req.query.startDate as Date,
        endDate: req.query.endDate as Date
      }
    );

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          limit: req.query.limit || 50,
          skip: req.query.skip || 0
        }
      }
    });
  })
);

/**
 * @route POST /api/orders/:orderId/cancel
 * @desc Cancel an order
 */
router.post(
  '/:orderId/cancel',
  [
    param('orderId').notEmpty().withMessage('Order ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.cancelOrder(
      req.params.orderId,
      req.body.reason
    );

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        cancelledAt: order.statusHistory[order.statusHistory.length - 1].timestamp
      }
    });
  })
);

/**
 * @route GET /api/orders/:orderId/stats
 * @desc Get order statistics
 */
router.get(
  '/stats/overview',
  [
    query('merchantId').optional().isString(),
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await orderService.getOrderStats(
      req.query.merchantId as string,
      req.query.startDate as Date,
      req.query.endDate as Date
    );

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @route POST /api/orders/sync/:orderId
 * @desc Sync order with aggregator
 */
router.post(
  '/sync/:orderId',
  [
    param('orderId').notEmpty().withMessage('Order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.syncWithAggregator(req.params.orderId);

    if (!order) {
      throw new AppErrorClass('Order not found', 404);
    }

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        status: order.status,
        syncedAt: new Date()
      }
    });
  })
);

export default router;
