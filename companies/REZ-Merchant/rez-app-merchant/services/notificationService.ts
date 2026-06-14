import { apiClient } from './apiClient';
import { MerchantOrder, OrderStatus } from '../types/order';

/**
 * RABTUL: Notification service URL
 */
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'https://rez-notifications-service.onrender.com';

/**
 * RABTUL: Internal headers for notification service calls
 */
const INTERNAL_HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN || '',
};

/**
 * Push notification payload structure
 */
export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | 'order_alert' | 'promo';
  badge?: number;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Notification delivery status
 */
export interface NotificationDeliveryStatus {
  notificationId: string;
  userId: string;
  status: 'sent' | 'delivered' | 'failed' | 'read';
  timestamp: Date;
  error?: string;
}

/**
 * Order notification data
 */
export interface OrderNotificationData {
  type: 'new_order' | 'order_update' | 'order_cancelled' | 'order_ready' | 'driver_assigned';
  orderId: string;
  orderNumber: string;
  storeId?: string;
  customerId?: string;
  priority?: 'urgent' | 'normal';
}

/**
 * RABTUL: Merchant Notification Service
 * Handles all push notification operations for merchant app via RABTUL notification service
 */
export class MerchantNotificationService {
  private apiClient: typeof apiClient;

  constructor(apiClientInstance?: typeof apiClient) {
    this.apiClient = apiClientInstance || apiClient;
  }

  /**
   * RABTUL: Send push notification via RABTUL notification service
   */
  private async sendPush(payload: PushNotificationPayload): Promise<string> {
    // Try RABTUL notification service first
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/send`, {
        method: 'POST',
        headers: INTERNAL_HEADERS,
        body: JSON.stringify({
          userId: payload.userId,
          channel: 'PUSH',
          notification: {
            title: payload.title,
            body: payload.body,
            data: payload.data,
            sound: payload.sound || 'default',
            badge: payload.badge || 0,
            priority: payload.priority || 'normal',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        return data.notificationId || data.id || 'RABTUL-' + Date.now();
      }
    } catch {
      // Fall through to local API client
    }
    clearTimeout(timer);

    // Fallback to local API client
    const response = await this.apiClient.post('/notifications/push', {
      userId: payload.userId,
      notification: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
        sound: payload.sound || 'default',
        badge: payload.badge || 0,
        priority: payload.priority || 'normal',
      },
    });

    return response.data.notificationId;
  }

  /**
   * Send new order alert to merchant
   */
  async sendOrderAlert(order: MerchantOrder): Promise<string> {
    const notificationData: OrderNotificationData = {
      type: 'new_order',
      orderId: order._id,
      orderNumber: order.orderNumber,
      storeId: order.storeId,
      priority: order.priority === 'urgent' ? 'urgent' : 'normal',
    };

    const payload: PushNotificationPayload = {
      userId: order.merchant.userId,
      title: 'New Order',
      body: `Order #${order.orderNumber} received${order.totalAmount ? ` - $${order.totalAmount.toFixed(2)}` : ''}`,
      data: notificationData,
      sound: 'order_alert',
      badge: 1,
      priority: order.priority === 'urgent' ? 'high' : 'high',
    };

    return this.sendPush(payload);
  }

  /**
   * Send order status update to customer
   */
  async sendStatusUpdate(order: MerchantOrder): Promise<string> {
    const statusMessages: Record<OrderStatus, string> = {
      pending: 'Order is pending',
      confirmed: 'Order has been confirmed',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready for pickup',
      out_for_delivery: 'Your order is on the way',
      delivered: 'Your order has been delivered',
      cancelled: 'Order has been cancelled',
      refunded: 'Order has been refunded',
    };

    const notificationData: OrderNotificationData = {
      type: 'order_update',
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customer?.userId,
    };

    const payload: PushNotificationPayload = {
      userId: order.customer?.userId || '',
      title: 'Order Update',
      body: `Order #${order.orderNumber}: ${statusMessages[order.status] || order.status}`,
      data: notificationData,
      sound: 'default',
    };

    return this.sendPush(payload);
  }

  /**
   * Send order cancellation notification
   */
  async sendOrderCancellation(order: MerchantOrder, reason?: string): Promise<string> {
    const notificationData: OrderNotificationData = {
      type: 'order_cancelled',
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customer?.userId,
    };

    const payload: PushNotificationPayload = {
      userId: order.customer?.userId || '',
      title: 'Order Cancelled',
      body: reason
        ? `Order #${order.orderNumber} has been cancelled: ${reason}`
        : `Order #${order.orderNumber} has been cancelled`,
      data: notificationData,
      sound: 'default',
    };

    return this.sendPush(payload);
  }

  /**
   * Send order ready notification
   */
  async sendOrderReady(order: MerchantOrder): Promise<string> {
    const notificationData: OrderNotificationData = {
      type: 'order_ready',
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customer?.userId,
      storeId: order.storeId,
    };

    const payload: PushNotificationPayload = {
      userId: order.customer?.userId || '',
      title: 'Order Ready',
      body: `Order #${order.orderNumber} is ready for pickup!`,
      data: notificationData,
      sound: 'order_alert',
    };

    return this.sendPush(payload);
  }

  /**
   * Send driver assigned notification
   */
  async sendDriverAssigned(order: MerchantOrder, driverName: string): Promise<string> {
    const notificationData: OrderNotificationData = {
      type: 'driver_assigned',
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customer?.userId,
    };

    const payload: PushNotificationPayload = {
      userId: order.customer?.userId || '',
      title: 'Driver Assigned',
      body: `${driverName} is picking up your order #${order.orderNumber}`,
      data: notificationData,
      sound: 'default',
    };

    return this.sendPush(payload);
  }

  /**
   * RABTUL: Send bulk notification to multiple users via RABTUL notification service
   */
  async sendBulkNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    // Try RABTUL notification service first
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/notifications/bulk`, {
        method: 'POST',
        headers: INTERNAL_HEADERS,
        body: JSON.stringify({
          userIds,
          channel: 'PUSH',
          notification: {
            title,
            body,
            data,
            sound: 'default',
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const result = await res.json();
        return result.notificationIds || result.ids || userIds.map(() => 'RABTUL-' + Date.now());
      }
    } catch {
      // Fall through to local API client
    }

    // Fallback to local API client - send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const response = await this.apiClient.post('/notifications/bulk-push', {
        userIds: batch,
        notification: {
          title,
          body,
          data,
          sound: 'default',
        },
      });
      notificationIds.push(...response.data.notificationIds);
    }

    return notificationIds;
  }

  /**
   * Get notification delivery status
   */
  async getDeliveryStatus(notificationId: string): Promise<NotificationDeliveryStatus> {
    const response = await this.apiClient.get(`/notifications/${notificationId}/status`);
    return {
      notificationId: response.data.notificationId,
      userId: response.data.userId,
      status: response.data.status,
      timestamp: new Date(response.data.timestamp),
      error: response.data.error,
    };
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(token: string, platform: 'ios' | 'android'): Promise<void> {
    await this.apiClient.post('/notifications/device-token', {
      token,
      platform,
      appType: 'merchant',
    });
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(token: string): Promise<void> {
    await this.apiClient.delete(`/notifications/device-token/${token}`);
  }

  /**
   * Handle order lifecycle notifications
   */
  async handleOrderNotification(order: MerchantOrder, event: 'created' | 'updated' | 'cancelled'): Promise<void> {
    switch (event) {
      case 'created':
        await this.sendOrderAlert(order);
        break;
      case 'updated':
        await this.sendStatusUpdate(order);
        break;
      case 'cancelled':
        await this.sendOrderCancellation(order);
        break;
    }
  }
}

// Export singleton instance
export const merchantNotificationService = new MerchantNotificationService();

export default merchantNotificationService;
