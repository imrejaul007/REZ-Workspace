import { Router, Request, Response } from 'express';
import { body, param, query, validationResult, header } from 'express-validator';
import aggregatorService from '../services/aggregatorService';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';
import logger from '../config/logger';
import crypto from 'crypto';

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
 * @route POST /api/aggregators/webhook/swiggy
 * @desc Handle Swiggy webhook
 */
router.post(
  '/webhook/swiggy',
  [
    header('x-swiggy-signature').optional().isString(),
    body('event').notEmpty().withMessage('Event type is required'),
    body('data').optional().isObject()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-swiggy-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature if provided
    if (signature && process.env.SWIGGY_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SWIGGY_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid Swiggy webhook signature');
        throw new AppError('Invalid signature', 401);
      }
    }

    const result = await aggregatorService.handleSwiggyWebhook(req.body);

    res.json({
      success: result.success,
      orderId: result.orderId,
      event: result.event
    });
  })
);

/**
 * @route POST /api/aggregators/webhook/zomato
 * @desc Handle Zomato webhook
 */
router.post(
  '/webhook/zomato',
  [
    header('x-zomato-signature').optional().isString(),
    body('event').notEmpty().withMessage('Event type is required'),
    body('data').optional().isObject()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-zomato-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature if provided
    if (signature && process.env.ZOMATO_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.ZOMATO_WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Invalid Zomato webhook signature');
        throw new AppError('Invalid signature', 401);
      }
    }

    const result = await aggregatorService.handleZomatoWebhook(req.body);

    res.json({
      success: result.success,
      orderId: result.orderId,
      event: result.event
    });
  })
);

/**
 * @route POST /api/aggregators/webhook/ondc
 * @desc Handle ONDC webhook/ACK
 */
router.post(
  '/webhook/ondc',
  [
    body('context').optional().isObject(),
    body('message').optional().isObject()
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await aggregatorService.handleONDCWebhook(req.body);

    // Always return ACK to ONDC
    res.json({
      message: {
        ack: {
          status: result.success ? 'ACK' : 'NACK'
        }
      }
    });
  })
);

/**
 * @route POST /api/aggregators/orders
 * @desc Create order from aggregator (for testing/manual entry)
 */
router.post(
  '/orders',
  [
    body('source').isIn(['swiggy', 'zomato', 'ondc']).withMessage('Invalid source'),
    body('sourceOrderId').notEmpty().withMessage('Source order ID is required'),
    body('merchantId').notEmpty().withMessage('Merchant ID is required'),
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('customerPhone').isMobilePhone('en-IN').withMessage('Invalid phone number'),
    body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('orderValue').isFloat({ min: 0 }).withMessage('Order value must be non-negative')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    // This would typically create an order through the order service
    // For now, we just acknowledge receipt
    logger.info('Received aggregator order', {
      source: req.body.source,
      sourceOrderId: req.body.sourceOrderId
    });

    res.status(201).json({
      success: true,
      message: 'Order received',
      data: {
        source: req.body.source,
        sourceOrderId: req.body.sourceOrderId,
        receivedAt: new Date()
      }
    });
  })
);

/**
 * @route GET /api/aggregators/orders/:source/:sourceOrderId
 * @desc Get order from aggregator
 */
router.get(
  '/orders/:source/:sourceOrderId',
  [
    param('source').isIn(['swiggy', 'zomato', 'ondc']).withMessage('Invalid source'),
    param('sourceOrderId').notEmpty().withMessage('Source order ID is required')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    // This would fetch from the aggregator API
    logger.info('Fetching aggregator order', {
      source: req.params.source,
      sourceOrderId: req.params.sourceOrderId
    });

    res.json({
      success: true,
      data: {
        source: req.params.source,
        sourceOrderId: req.params.sourceOrderId,
        message: 'Order data would be fetched from aggregator API'
      }
    });
  })
);

/**
 * @route PATCH /api/aggregators/orders/:source/:sourceOrderId/status
 * @desc Update order status on aggregator
 */
router.patch(
  '/orders/:source/:sourceOrderId/status',
  [
    param('source').isIn(['swiggy', 'zomato', 'ondc']).withMessage('Invalid source'),
    param('sourceOrderId').notEmpty().withMessage('Source order ID is required'),
    body('status')
      .isIn(['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'])
      .withMessage('Invalid status')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Updating aggregator order status', {
      source: req.params.source,
      sourceOrderId: req.params.sourceOrderId,
      status: req.body.status
    });

    res.json({
      success: true,
      data: {
        source: req.params.source,
        sourceOrderId: req.params.sourceOrderId,
        status: req.body.status,
        updatedAt: new Date()
      }
    });
  })
);

/**
 * @route POST /api/aggregators/orders/:source/:sourceOrderId/cancel
 * @desc Cancel order on aggregator
 */
router.post(
  '/orders/:source/:sourceOrderId/cancel',
  [
    param('source').isIn(['swiggy', 'zomato', 'ondc']).withMessage('Invalid source'),
    param('sourceOrderId').notEmpty().withMessage('Source order ID is required'),
    body('reason').optional().isString().withMessage('Reason must be a string')
  ],
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Cancelling aggregator order', {
      source: req.params.source,
      sourceOrderId: req.params.sourceOrderId,
      reason: req.body.reason
    });

    res.json({
      success: true,
      data: {
        source: req.params.source,
        sourceOrderId: req.params.sourceOrderId,
        cancelled: true,
        cancelledAt: new Date()
      }
    });
  })
);

/**
 * @route GET /api/aggregators/status
 * @desc Get aggregator integration status
 */
router.get(
  '/status',
  asyncHandler(async (req: Request, res: Response) => {
    const status = {
      swiggy: {
        configured: !!(process.env.SWIGGY_API_URL && process.env.SWIGGY_API_KEY),
        webhookConfigured: !!process.env.SWIGGY_WEBHOOK_SECRET
      },
      zomato: {
        configured: !!(process.env.ZOMATO_API_URL && process.env.ZOMATO_API_KEY),
        webhookConfigured: !!process.env.ZOMATO_WEBHOOK_SECRET
      },
      ondc: {
        configured: !!(process.env.ONDC_API_URL),
        bppId: process.env.ONDC_BPP_ID || null
      }
    };

    res.json({
      success: true,
      data: status
    });
  })
);

export default router;
