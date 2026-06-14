/**
 * Order Webhooks Routes
 * Handles incoming order updates from rez-order-service
 *
 * Events:
 * - order.created: New order received
 * - order.status_changed: Order status updated
 * - order.cancelled: Order cancelled
 * - order.issue_reported: Issue reported with order
 * - order.refund_requested: Refund requested
 */

import express, { Request, Response } from 'express';
import logger from './utils/logger';
import {
  getRecentOrders,
  getOrderCountsByStatus,
  createNewOrderAlert,
  createOrderIssueAlert,
  createCancellationAlert,
  createRefundAlert,
  notifyNewOrder,
  addActiveAlert,
  acknowledgeAlert,
} from '../services/orderServiceIntegration';
import { logMerchantEvent } from '../services/liveDataService';

const router = express.Router();

/**
 * POST /api/webhooks/order-updates
 * Main webhook endpoint for all order updates
 */
router.post('/order-updates', async (req: Request, res: Response) => {
  try {
    const { type, data, timestamp } = req.body;

    logger.info([ORDER-WEBHOOK] Received event: ${type}`, { timestamp });

    switch (type) {
      case 'order.created':
        await handleNewOrder(data);
        break;

      case 'order.status_changed':
        await handleStatusChange(data);
        break;

      case 'order.cancelled':
        await handleCancellation(data);
        break;

      case 'order.issue_reported':
        await handleIssueReported(data);
        break;

      case 'order.refund_requested':
        await handleRefundRequested(data);
        break;

      default:
        logger.info(`[ORDER-WEBHOOK] Unknown event type: ${type}`);
    }

    res.json({ success: true, received: type });
  } catch (error) {
    console.error('[ORDER-WEBHOOK] Error processing webhook', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/webhooks/new-order
 * Legacy endpoint for new order notifications
 */
router.post('/new-order', async (req: Request, res: Response) => {
  try {
    const { order } = req.body;

    if (!order) {
      return res.status(400).json({ error: 'Order data required' });
    }

    // Create alert for new order
    const alert = await createNewOrderAlert(order);
    if (alert) {
      addActiveAlert(alert);
    }

    // Log event
    await logMerchantEvent('order.new', {
      merchantId: order.merchantId,
      orderId: order.id,
      total: order.total,
      itemCount: order.items?.length || 0,
    });

    res.json({ success: true, alertId: alert?.id });
  } catch (error) {
    console.error('[NEW-ORDER-WEBHOOK] Error', error);
    res.status(500).json({ error: 'Failed to process new order' });
  }
});

/**
 * POST /api/webhooks/order-issue
 * Legacy endpoint for order issue notifications
 */
router.post('/order-issue', async (req: Request, res: Response) => {
  try {
    const { alert } = req.body;

    if (!alert) {
      return res.status(400).json({ error: 'Alert data required' });
    }

    addActiveAlert(alert);

    // Log event
    await logMerchantEvent('order.issue', {
      merchantId: alert.merchantId,
      orderId: alert.orderId,
      issueType: alert.type,
      priority: alert.priority,
    });

    res.json({ success: true, alertId: alert.id });
  } catch (error) {
    console.error('[ORDER-ISSUE-WEBHOOK] Error', error);
    res.status(500).json({ error: 'Failed to process order issue' });
  }
});

/**
 * GET /api/orders/recent
 * Get recent orders for dashboard
 */
router.get('/orders/recent/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const orders = await getRecentOrders(merchantId, limit);

    res.json({
      success: true,
      orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('[ORDERS-RECENT] Error', error);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

/**
 * GET /api/orders/counts/:merchantId
 * Get order counts by status
 */
router.get('/orders/counts/:merchantId', async (req: Request, res: Response) => {
  try {
    const { merchantId } = req.params;

    const counts = await getOrderCountsByStatus(merchantId);

    res.json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error('[ORDERS-COUNTS] Error', error);
    res.status(500).json({ error: 'Failed to fetch order counts' });
  }
});

/**
 * POST /api/alerts/:alertId/acknowledge
 * Acknowledge an alert
 */
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    await acknowledgeAlert(alertId);

    res.json({ success: true, alertId });
  } catch (error) {
    console.error('[ALERT-ACK] Error', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// ============================================================
// Event Handlers
// ============================================================

async function handleNewOrder(data) {
  const { order } = data;

  if (!order) return;

  logger.info(`[NEW-ORDER] Processing order: ${order.id || order.orderId}`);

  // Create alert
  const alert = await createNewOrderAlert(order);
  if (alert) {
    addActiveAlert(alert);
  }

  // Log event
  await logMerchantEvent('order.new', {
    merchantId: order.merchantId,
    orderId: order.id || order.orderId,
    total: order.total,
    itemCount: order.items?.length || 0,
  });

  // Notify merchant dashboard (in production, this would use WebSocket/SSE)
  await notifyNewOrder(order);

  logger.info(`[NEW-ORDER] Alert created for merchant: ${order.merchantId}`);
}

async function handleStatusChange(data) {
  const { orderId, merchantId, oldStatus, newStatus, updatedBy } = data;

  logger.info(`[STATUS-CHANGE] Order ${orderId}: ${oldStatus} -> ${newStatus}`);

  // Log event
  await logMerchantEvent('order.status_changed', {
    merchantId,
    orderId,
    oldStatus,
    newStatus,
    updatedBy,
  });

  // Create alert for important status changes
  if (newStatus === 'cancelled') {
    const alert = await createCancellationAlert(
      { id: orderId, orderId: orderId, merchantId, userId: '', items: [], total: 0, status: 'cancelled', createdAt: '', updatedAt: '' },
      'Status changed to cancelled'
    );
    if (alert) {
      addActiveAlert(alert);
    }
  }

  if (newStatus === 'preparing' && oldStatus === 'confirmed') {
    // Order is being prepared - could trigger customer notification
    logger.info(`[STATUS-CHANGE] Merchant started preparing order ${orderId}`);
  }
}

async function handleCancellation(data) {
  const { order, reason } = data;

  if (!order) return;

  logger.info(`[CANCELLATION] Order ${order.id || order.orderId} cancelled`);

  // Create alert
  const alert = await createCancellationAlert(order, reason);
  addActiveAlert(alert);

  // Log event
  await logMerchantEvent('order.cancelled', {
    merchantId: order.merchantId,
    orderId: order.id || order.orderId,
    reason,
  });
}

async function handleIssueReported(data) {
  const { orderId, merchantId, issueType, description, reportedBy } = data;

  logger.info(`[ISSUE-REPORTED] Order ${orderId}: ${issueType}`);

  // Create alert
  const alert = await createOrderIssueAlert(orderId, merchantId, issueType, description);
  addActiveAlert(alert);

  // Log event
  await logMerchantEvent('order.issue_reported', {
    merchantId,
    orderId,
    issueType,
    reportedBy,
  });
}

async function handleRefundRequested(data) {
  const { orderId, merchantId, amount, reason, requestedBy } = data;

  logger.info(`[REFUND-REQUESTED] Order ${orderId}: $${amount}`);

  // Create alert (high priority)
  const alert = await createRefundAlert(orderId, merchantId, amount, reason);
  addActiveAlert(alert);

  // Log event
  await logMerchantEvent('order.refund_requested', {
    merchantId,
    orderId,
    amount,
    reason,
    requestedBy,
  });
}

export default router;
