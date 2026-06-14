/**
 * REZ Merchant Copilot Integration
 *
 * Connects merchant orders to AI insights and routes notifications to AI alerts.
 * This module bridges orders, notifications, and the copilot insights service.
 */

import { apiClient } from './client';
import { copilotInsightsService, AgentInsight } from './copilotInsights';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface OrderForCopilot {
  orderId: string;
  merchantId: string;
  storeId?: string;
  customerId?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  createdAt: string;
  completedAt?: string;
  channel: 'qr' | 'pos' | 'delivery' | 'dine_in';
  customerTier?: 'standard' | 'silver' | 'gold' | 'platinum';
}

export interface NotificationForCopilot {
  notificationId: string;
  type: 'new_order' | 'low_stock' | 'payment_received' | 'customer_feedback' | 'system_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
  createdAt: string;
  merchantId: string;
}

export interface CopilotAlert {
  id: string;
  type: 'order_insight' | 'notification_alert' | 'action_recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  source: 'order' | 'notification' | 'system';
  sourceId?: string;
  actions?: Array<{
    label: string;
    action: string;
    route?: string;
  }>;
  timestamp: string;
}

// ─── Merchant Copilot Service ──────────────────────────────────────────────────

class MerchantCopilotService {
  private readonly basePath = 'merchant/copilot';

  /**
   * Sync order to copilot for insights
   */
  async syncOrder(
    order: OrderForCopilot
  ): Promise<{ success: boolean; insights?: AgentInsight[] }> {
    try {
      // Send order data to copilot insights
      const response = await apiClient.post(`${this.basePath}/orders/sync`, {
        orderId: order.orderId,
        merchantId: order.merchantId,
        storeId: order.storeId,
        customerId: order.customerId,
        status: order.status,
        total: order.total,
        items: order.items,
        channel: order.channel,
        customerTier: order.customerTier,
        createdAt: order.createdAt,
      });

      if (response.success) {
        return {
          success: true,
          insights: response.data?.insights,
        };
      }
      return { success: false };
    } catch (error) {
      console.error('[MerchantCopilot] Order sync failed:', error);
      return { success: false };
    }
  }

  /**
   * Get order-related insights for a merchant
   */
  async getOrderInsights(
    merchantId: string,
    options?: {
      status?: OrderForCopilot['status'];
      limit?: number;
      since?: string;
    }
  ): Promise<AgentInsight[]> {
    try {
      const params = new URLSearchParams();
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.since) params.append('since', options.since);

      const queryString = params.toString();
      const url = queryString
        ? `${this.basePath}/orders/insights/${merchantId}?${queryString}`
        : `${this.basePath}/orders/insights/${merchantId}`;

      const response = await apiClient.get(url);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('[MerchantCopilot] Get order insights failed:', error);
      return [];
    }
  }

  /**
   * Process notification and generate AI alert
   */
  async processNotificationAlert(
    notification: NotificationForCopilot
  ): Promise<{ success: boolean; alert?: CopilotAlert; actions?: AIAction[] }> {
    try {
      // Analyze notification and generate AI-powered alert
      const response = await apiClient.post(`${this.basePath}/notifications/process`, {
        notificationId: notification.notificationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        severity: notification.severity,
        metadata: notification.metadata,
        merchantId: notification.merchantId,
      });

      if (response.success && response.data) {
        return {
          success: true,
          alert: response.data.alert,
          actions: response.data.actions,
        };
      }
      return { success: false };
    } catch (error) {
      console.error('[MerchantCopilot] Process notification failed:', error);
      return { success: false };
    }
  }

  /**
   * Get all active AI alerts for merchant dashboard
   */
  async getActiveAlerts(merchantId: string): Promise<CopilotAlert[]> {
    try {
      const response = await apiClient.get(`${this.basePath}/alerts/${merchantId}/active`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('[MerchantCopilot] Get alerts failed:', error);
      return [];
    }
  }

  /**
   * Acknowledge/dismiss an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`${this.basePath}/alerts/${alertId}/acknowledge`);
      return response.success;
    } catch (error) {
      console.error('[MerchantCopilot] Acknowledge alert failed:', error);
      return false;
    }
  }

  /**
   * Take action on an alert
   */
  async executeAlertAction(
    alertId: string,
    action: string
  ): Promise<{ success: boolean; result?: unknown }> {
    try {
      const response = await apiClient.post(`${this.basePath}/alerts/${alertId}/action`, {
        action,
      });
      return {
        success: response.success,
        result: response.data,
      };
    } catch (error) {
      console.error('[MerchantCopilot] Execute alert action failed:', error);
      return { success: false };
    }
  }

  /**
   * Get AI-generated recommendations based on orders
   */
  async getOrderRecommendations(
    merchantId: string,
    periodDays = 7
  ): Promise<
    Array<{
      type: 'pricing' | 'inventory' | 'marketing' | 'operations';
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      estimatedValue?: number;
    }>
  > {
    try {
      const response = await apiClient.get(
        `${this.basePath}/orders/recommendations/${merchantId}?period=${periodDays}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('[MerchantCopilot] Get recommendations failed:', error);
      return [];
    }
  }

  /**
   * Track customer behavior for personalization
   */
  async trackCustomerBehavior(
    merchantId: string,
    customerId: string,
    event: {
      type: 'order' | 'view' | 'cart_abandon' | 'return_visit';
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      await apiClient.post(`${this.basePath}/customers/track`, {
        merchantId,
        customerId,
        event: event.type,
        data: event.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Non-critical - silent failure
      console.debug('[MerchantCopilot] Customer tracking failed:', error);
    }
  }

  /**
   * Get demand signals from order patterns
   */
  async getDemandSignals(merchantId: string): Promise<
    Array<{
      category: string;
      demandCount: number;
      trend: 'rising' | 'stable' | 'declining';
      topProducts: string[];
    }>
  > {
    try {
      const response = await apiClient.get(`${this.basePath}/demand/${merchantId}`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('[MerchantCopilot] Get demand signals failed:', error);
      return [];
    }
  }
}

export const merchantCopilotService = new MerchantCopilotService();
export default merchantCopilotService;

// ─── Notification-to-Alert Integration ──────────────────────────────────────────

export interface NotificationAlertConfig {
  onNewOrder?: (order: OrderForCopilot) => void;
  onLowStock?: (alert: CopilotAlert) => void;
  onPaymentReceived?: (amount: number) => void;
  onCustomerFeedback?: (feedback: { rating: number; comment?: string }) => void;
}

export function createNotificationAlertBridge(merchantId: string, config: NotificationAlertConfig) {
  return {
    /**
     * Bridge a notification to AI alert
     */
    async bridgeNotification(notification: NotificationForCopilot): Promise<CopilotAlert | null> {
      // Process notification to generate alert
      const result = await merchantCopilotService.processNotificationAlert(notification);

      if (result.success && result.alert) {
        // Execute any recommended actions
        if (result.actions && result.actions.length > 0) {
          // First action is usually the recommended one
          const primaryAction = result.actions[0];
          if (primaryAction.action.startsWith('track:')) {
            // Handle tracking actions
            const trackingData = primaryAction.action.replace('track:', '');
            merchantCopilotService.trackCustomerBehavior(merchantId, notification.notificationId, {
              type: 'order' as const,
              data: { notificationType: notification.type, trackingData },
            });
          }
        }

        return result.alert;
      }

      return null;
    },

    /**
     * Sync order and get insights
     */
    async syncOrderForInsights(order: OrderForCopilot): Promise<AgentInsight[]> {
      // Sync order to copilot
      const result = await merchantCopilotService.syncOrder(order);

      // Call callback if configured
      if (config.onNewOrder && order.status === 'pending') {
        config.onNewOrder(order);
      }

      // Get related insights
      return merchantCopilotService.getOrderInsights(merchantId, {
        status: order.status,
        limit: 5,
      });
    },

    /**
     * Handle low stock notification
     */
    async handleLowStock(notification: NotificationForCopilot): Promise<CopilotAlert | null> {
      const result = await merchantCopilotService.processNotificationAlert(notification);

      if (result.success && result.alert) {
        config.onLowStock?.(result.alert);
        return result.alert;
      }

      return null;
    },

    /**
     * Handle payment received
     */
    async handlePaymentReceived(amount: number): Promise<void> {
      config.onPaymentReceived?.(amount);
    },

    /**
     * Handle customer feedback
     */
    async handleCustomerFeedback(rating: number, comment?: string): Promise<void> {
      config.onCustomerFeedback?.({ rating, comment });
    },
  };
}
