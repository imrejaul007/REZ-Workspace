import { Router, Request, Response } from 'express';
import { verifyWebhookSignature } from '../middleware';
import { orderService } from '../services';
import { config } from '../config';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/webhooks/instagram
 * Webhook verification endpoint for Facebook
 */
router.get('/instagram', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify webhook setup
  if (mode === 'subscribe' && token === config.webhook.verifyToken) {
    logger.info('Webhook verified successfully');
    res.status(200).send(challenge);
    return;
  }

  logger.warn('Webhook verification failed', { mode, token });
  res.status(403).json({
    success: false,
    error: 'Webhook verification failed',
  });
});

/**
 * POST /api/webhooks/instagram
 * Handle Instagram/Facebook webhook events
 */
router.post(
  '/instagram',
  verifyWebhookSignature,
  async (req: Request, res: Response) => {
    try {
      const { object, entry } = req.body;

      // Handle Instagram Shopping events
      if (object === 'instagram_shopping') {
        for (const item of entry) {
          for (const change of item.changes || []) {
            await handleShoppingChange(change);
          }
        }
      }

      // Handle commerce order updates
      if (object === 'commerce_orders') {
        for (const item of entry) {
          for (const order of item.changes || []) {
            await handleOrderUpdate(order);
          }
        }
      }

      // Acknowledge receipt
      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Webhook processing error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.status(500).json({
        success: false,
        error: 'Webhook processing failed',
      });
    }
  }
);

/**
 * Handle shopping-related webhook changes
 */
async function handleShoppingChange(change: {
  field: string;
  value: {
    product_id?: string;
    action?: string;
    status?: string;
    [key: string]: unknown;
  };
}): Promise<void> {
  const { field, value } = change;

  switch (field) {
    case 'products':
      logger.info('Product webhook received', {
        productId: value.product_id,
        action: value.action,
      });
      // Handle product sync events
      break;

    case 'product_feeds':
      logger.info('Product feed webhook received', {
        action: value.action,
      });
      // Handle product feed sync events
      break;

    default:
      logger.info('Unknown shopping webhook', { field, value });
  }
}

/**
 * Handle order-related webhook changes
 */
async function handleOrderUpdate(change: {
  field: string;
  value: {
    order_id?: string;
    status?: string;
    tracking_number?: string;
    [key: string]: unknown;
  };
}): Promise<void> {
  const { field, value } = change;

  if (field === 'orders' && value.order_id) {
    logger.info('Order webhook received', {
      orderId: value.order_id,
      status: value.status,
    });

    // Map Instagram status to internal status
    const statusMap: Record<string, string> = {
      initiated: 'pending',
      created: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      refunded: 'cancelled',
    };

    const newStatus = statusMap[value.status?.toLowerCase() || ''];
    if (newStatus) {
      // Find order by Instagram order ID and update
      const order = await orderService.getOrderByInstagramId(value.order_id);
      if (order) {
        await orderService.updateOrderStatus(order.id, {
          status: newStatus as 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
          trackingNumber: value.tracking_number as string | undefined,
        });
      }
    }
  }
}

export default router;