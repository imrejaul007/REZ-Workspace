/**
 * Order Service Integration Module
 * Handles REZ-merchant-copilot → rez-order-service integrations
 *
 * Integrations:
 * - Receive new orders on merchant dashboard
 * - Create alerts for order issues
 * - Track order status changes
 */

import axios from 'axios';

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'https://rez-order-service.onrender.com';
const MERCHANT_COPILOT_URL = process.env.MERCHANT_COPILOT_URL || 'http://localhost:4022';
const SUPPORT_COPILOT_URL = process.env.SUPPORT_COPILOT_URL || 'http://localhost:4033';

const logger = {
  info: (msg: string, data?) => console.log(`[ORDER-INTEGRATION] ${msg}`, data || ''),
  warn: (msg: string, data?) => console.warn(`[ORDER-INTEGRATION] ${msg}`, data || ''),
  error: (msg: string, data?) => console.error(`[ORDER-INTEGRATION] ${msg}`, data || ''),
};

interface Order {
  id: string;
  orderId: string;
  userId: string;
  merchantId: string;
  items: unknown[];
  total: number;
  status: string;
  deliveryAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderAlert {
  id: string;
  type: 'new_order' | 'issue' | 'cancellation' | 'refund_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderId: string;
  merchantId: string;
  message: string;
  data;
  createdAt: Date;
  acknowledged: boolean;
}

/**
 * Get all orders for a merchant
 */
export async function getMerchantOrders(merchantId: string, limit: number = 50): Promise<Order[]> {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/merchant/${merchantId}`, {
      params: { limit },
      timeout: 5000,
    });

    logger.info('Merchant orders fetched', { merchantId, count: response.data.orders?.length || 0 });

    return response.data.orders || [];
  } catch (error) {
    logger.warn('Failed to fetch merchant orders', { merchantId, error: error.message });
    return [];
  }
}

/**
 * Get recent orders (for dashboard display)
 */
export async function getRecentOrders(merchantId: string, limit: number = 10): Promise<Order[]> {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/merchant/${merchantId}/recent`, {
      params: { limit },
      timeout: 5000,
    });

    return response.data.orders || [];
  } catch (error) {
    logger.warn('Failed to fetch recent orders', { merchantId, error: error.message });
    return [];
  }
}

/**
 * Get orders by status
 */
export async function getOrdersByStatus(
  merchantId: string,
  status: string
): Promise<Order[]> {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/merchant/${merchantId}/status/${status}`, {
      timeout: 5000,
    });

    return response.data.orders || [];
  } catch (error) {
    logger.warn('Failed to fetch orders by status', { merchantId, status, error: error.message });
    return [];
  }
}

/**
 * Get order analytics for merchant
 */
export async function getOrderAnalytics(merchantId: string): Promise<unknown> {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/merchant/${merchantId}/analytics`, {
      timeout: 5000,
    });

    return response.data;
  } catch (error) {
    logger.warn('Failed to fetch order analytics', { merchantId, error: error.message });
    return null;
  }
}

/**
 * Create alert for new order (for merchant dashboard)
 */
export async function createNewOrderAlert(order: Order): Promise<OrderAlert | null> {
  const alert: OrderAlert = {
    id: `alert-${Date.now()}`,
    type: 'new_order',
    priority: 'high',
    orderId: order.id || order.orderId,
    merchantId: order.merchantId,
    message: `New order received! Order #${order.id || order.orderId} - Total: $${order.total.toFixed(2)}`,
    data: {
      orderId: order.id || order.orderId,
      items: order.items,
      total: order.total,
      customerId: order.userId,
      deliveryAddress: order.deliveryAddress,
    },
    createdAt: new Date(),
    acknowledged: false,
  };

  logger.info('New order alert created', { orderId: alert.orderId, merchantId: alert.merchantId });

  return alert;
}

/**
 * Create alert for order issue
 */
export async function createOrderIssueAlert(
  orderId: string,
  merchantId: string,
  issueType: string,
  issueDetails: string
): Promise<OrderAlert> {
  const priorityMap: Record<string, 'medium' | 'high' | 'urgent'> = {
    'food_quality': 'high',
    'wrong_item': 'high',
    'missing_item': 'high',
    'late_delivery': 'medium',
    'refund_request': 'urgent',
    'customer_complaint': 'high',
  };

  const alert: OrderAlert = {
    id: `alert-issue-${Date.now()}`,
    type: 'issue',
    priority: priorityMap[issueType] || 'medium',
    orderId,
    merchantId,
    message: `Order Issue: ${issueType} - ${issueDetails}`,
    data: {
      issueType,
      issueDetails,
      reportedAt: new Date().toISOString(),
    },
    createdAt: new Date(),
    acknowledged: false,
  };

  logger.warn('Order issue alert created', { orderId, merchantId, issueType });

  return alert;
}

/**
 * Create alert for cancellation
 */
export async function createCancellationAlert(
  order: Order,
  reason?: string
): Promise<OrderAlert> {
  const alert: OrderAlert = {
    id: `alert-cancel-${Date.now()}`,
    type: 'cancellation',
    priority: 'medium',
    orderId: order.id || order.orderId,
    merchantId: order.merchantId,
    message: `Order #${order.id || order.orderId} was cancelled${reason ? `: ${reason}` : ''}`,
    data: {
      orderId: order.id || order.orderId,
      reason,
      cancelledAt: new Date().toISOString(),
      refundStatus: 'pending',
    },
    createdAt: new Date(),
    acknowledged: false,
  };

  logger.info('Cancellation alert created', { orderId: alert.orderId, merchantId: alert.merchantId });

  return alert;
}

/**
 * Create alert for refund request
 */
export async function createRefundAlert(
  orderId: string,
  merchantId: string,
  amount: number,
  reason: string
): Promise<OrderAlert> {
  const alert: OrderAlert = {
    id: `alert-refund-${Date.now()}`,
    type: 'refund_request',
    priority: 'urgent',
    orderId,
    merchantId,
    message: `Refund requested for Order #${orderId}: $${amount.toFixed(2)} - Reason: ${reason}`,
    data: {
      orderId,
      refundAmount: amount,
      reason,
      requestedAt: new Date().toISOString(),
    },
    createdAt: new Date(),
    acknowledged: false,
  };

  logger.warn('Refund alert created', { orderId, merchantId, amount });

  return alert;
}

/**
 * Notify merchant dashboard of new order via webhook
 */
export async function notifyNewOrder(order: Order): Promise<boolean> {
  try {
    await axios.post(`${MERCHANT_COPILOT_URL}/api/webhooks/new-order`, {
      type: 'new_order',
      order: {
        id: order.id || order.orderId,
        userId: order.userId,
        items: order.items,
        total: order.total,
        status: order.status,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
      },
      timestamp: new Date().toISOString(),
    }, { timeout: 5000 });

    logger.info('New order notification sent to dashboard', { orderId: order.id });

    return true;
  } catch (error) {
    logger.warn('Failed to notify dashboard of new order', { error: error.message });
    return false;
  }
}

/**
 * Notify merchant dashboard of order issue
 */
export async function notifyOrderIssue(
  orderId: string,
  merchantId: string,
  issueType: string,
  details: string
): Promise<boolean> {
  try {
    const alert = await createOrderIssueAlert(orderId, merchantId, issueType, details);

    await axios.post(`${MERCHANT_COPILOT_URL}/api/webhooks/order-issue`, {
      type: 'order_issue',
      alert,
      timestamp: new Date().toISOString(),
    }, { timeout: 5000 });

    logger.info('Order issue notification sent', { orderId, issueType });

    return true;
  } catch (error) {
    logger.warn('Failed to notify dashboard of order issue', { error: error.message });
    return false;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  merchantId: string,
  newStatus: string
): Promise<{ success: boolean; order?: Order; error?: string }> {
  try {
    const response = await axios.patch(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}/status`,
      {
        status: newStatus,
        merchantId,
        updatedBy: 'merchant_copilot',
        timestamp: new Date().toISOString(),
      },
      { timeout: 5000 }
    );

    logger.info('Order status updated', { orderId, newStatus });

    return { success: true, order: response.data };
  } catch (error) {
    logger.error('Failed to update order status', { orderId, newStatus, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Acknowledge/resolve an alert
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  try {
    await axios.post(`${ORDER_SERVICE_URL}/api/alerts/${alertId}/acknowledge`, {
      acknowledgedAt: new Date().toISOString(),
    }, { timeout: 5000 });

    logger.info('Alert acknowledged', { alertId });
    return true;
  } catch (error) {
    logger.warn('Failed to acknowledge alert', { alertId, error: error.message });
    return false;
  }
}

/**
 * Create support ticket for escalated order issue
 */
export async function createSupportTicket(
  orderId: string,
  merchantId: string,
  issueType: string,
  description: string
): Promise<{ success: boolean; ticketId?: string }> {
  try {
    const response = await axios.post(`${SUPPORT_COPILOT_URL}/webhook/ticket`, {
      ticket_id: `MERCHANT-${issueType.toUpperCase()}-${orderId}-${Date.now()}`,
      user_id: 'merchant_system',
      category: 'merchant_order_issue',
      priority: 'high',
      content: `Merchant Order Issue Escalation\n\nOrder ID: ${orderId}\nMerchant ID: ${merchantId}\nIssue Type: ${issueType}\n\nDescription: ${description}`,
      metadata: {
        orderId,
        merchantId,
        issueType,
        source: 'merchant_copilot',
        escalatedBy: 'merchant_dashboard',
        createdAt: new Date().toISOString(),
      },
    }, { timeout: 5000 });

    logger.info('Support ticket created from merchant escalation', { orderId, ticketId: response.data.ticket_id });

    return { success: true, ticketId: response.data.ticket_id };
  } catch (error) {
    logger.error('Failed to create support ticket', { orderId, error: error.message });
    return { success: false };
  }
}

/**
 * Get pending alerts for merchant
 */
export async function getMerchantAlerts(
  merchantId: string,
  includeAcknowledged: boolean = false
): Promise<OrderAlert[]> {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/alerts/merchant/${merchantId}`, {
      params: { includeAcknowledged },
      timeout: 5000,
    });

    return response.data.alerts || [];
  } catch (error) {
    logger.warn('Failed to fetch merchant alerts', { merchantId, error: error.message });
    return [];
  }
}

/**
 * Get order count by status
 */
export async function getOrderCountsByStatus(merchantId: string): Promise<Record<string, number>> {
  try {
    const response = await axios.get(`${ORDER_SERVICE_URL}/api/orders/merchant/${merchantId}/counts`, {
      timeout: 5000,
    });

    return response.data.counts || {};
  } catch (error) {
    logger.warn('Failed to fetch order counts', { merchantId, error: error.message });
    return {};
  }
}

/**
 * Subscribe to real-time order updates (webhook registration)
 */
export async function subscribeToOrderUpdates(merchantId: string): Promise<boolean> {
  try {
    await axios.post(`${ORDER_SERVICE_URL}/api/webhooks/register`, {
      merchantId,
      webhookUrl: `${MERCHANT_COPILOT_URL}/api/webhooks/order-updates`,
      events: [
        'order.created',
        'order.status_changed',
        'order.cancelled',
        'order.issue_reported',
        'order.refund_requested',
      ],
    }, { timeout: 5000 });

    logger.info('Subscribed to order updates', { merchantId });
    return true;
  } catch (error) {
    logger.warn('Failed to subscribe to order updates', { merchantId, error: error.message });
    return false;
  }
}

// Store active alerts in memory (in production, use Redis or similar)
const activeAlerts: Map<string, OrderAlert[]> = new Map();

/**
 * Get active alerts for a merchant (in-memory)
 */
export function getActiveAlerts(merchantId: string): OrderAlert[] {
  return activeAlerts.get(merchantId) || [];
}

/**
 * Add alert to active alerts (in-memory)
 */
export function addActiveAlert(alert: OrderAlert): void {
  const alerts = activeAlerts.get(alert.merchantId) || [];
  alerts.push(alert);
  activeAlerts.set(alert.merchantId, alerts);
}

/**
 * Clear acknowledged alerts
 */
export function clearAcknowledgedAlerts(merchantId: string): void {
  const alerts = activeAlerts.get(merchantId) || [];
  const active = alerts.filter(a => !a.acknowledged);
  activeAlerts.set(merchantId, active);
}
