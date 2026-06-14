/**
 * Order Service Integration for Analytics V2
 * Manages connection to the order service
 */

import { getOrderClient, OrderClient } from '../clients/orderClient';

export interface OrderIntegrationConfig {
  serviceUrl: string;
  timeout: number;
  retries: number;
}

const defaultConfig: OrderIntegrationConfig = {
  serviceUrl: process.env.ORDER_SERVICE_URL || 'http://localhost:3001',
  timeout: 10000,
  retries: 3,
};

/**
 * Order Integration class
 * Provides high-level integration with the order service
 */
export class OrderIntegration {
  private client: OrderClient;
  private config: OrderIntegrationConfig;

  constructor(config: Partial<OrderIntegrationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.client = getOrderClient();
  }

  /**
   * Get the order client instance
   */
  getClient(): OrderClient {
    return this.client;
  }

  /**
   * Health check for the order service
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const start = Date.now();
    try {
      const healthy = await this.client.healthCheck();
      return {
        healthy,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync orders for analytics
   */
  async syncOrders(
    merchantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const orders = await this.client.getOrders({
        merchantId,
        startDate,
        endDate,
        limit: 1000,
      });

      for (const order of orders) {
        try {
          // Process order for analytics
          // This is where you'd integrate with your analytics pipeline
          synced++;
        } catch (error) {
          errors.push(`Order ${order._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { synced, errors };
  }

  /**
   * Get order metrics for dashboard
   */
  async getOrderMetrics(merchantId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    try {
      const stats = await this.client.getOrderStats(merchantId, startOfDay, now);

      return {
        totalOrders: stats.totalOrders,
        pendingOrders: stats.byStatus['pending'] || 0,
        completedOrders: stats.byStatus['delivered'] || 0,
        cancelledOrders: (stats.byStatus['cancelled'] || 0) + (stats.byStatus['failed'] || 0),
        averageOrderValue: stats.averageOrderValue,
      };
    } catch (error) {
      console.error('[OrderIntegration] Error getting metrics:', error);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageOrderValue: 0,
      };
    }
  }
}

// Singleton instance
let orderIntegration: OrderIntegration | null = null;

export function getOrderIntegration(): OrderIntegration {
  if (!orderIntegration) {
    orderIntegration = new OrderIntegration();
  }
  return orderIntegration;
}

export default OrderIntegration;
