/**
 * KDS Integration for Delivery Service
 * Manages connection to the Kitchen Display System
 */

import { getKDSClient, KDSClient, KDSOrder } from '../clients/kdsClient';

export interface KDSIntegrationConfig {
  serviceUrl: string;
  timeout: number;
  retries: number;
}

const defaultConfig: KDSIntegrationConfig = {
  serviceUrl: process.env.KDS_SERVICE_URL || 'http://localhost:3008',
  timeout: 10000,
  retries: 3,
};

/**
 * KDS Integration class
 * Provides high-level integration with the Kitchen Display System
 */
export class KDSIntegration {
  private client: KDSClient;
  private config: KDSIntegrationConfig;

  constructor(config: Partial<KDSIntegrationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.client = getKDSClient();
  }

  /**
   * Get the KDS client instance
   */
  getClient(): KDSClient {
    return this.client;
  }

  /**
   * Health check for the KDS service
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
   * Send order to kitchen
   */
  async sendToKitchen(order: {
    orderId: string;
    storeId: string;
    items: Array<{
      productId: string;
      name: string;
      quantity: number;
      notes?: string;
    }>;
    priority?: 'normal' | 'rush' | 'vip';
  }): Promise<{ success: boolean; kdsOrder?: KDSOrder; error?: string }> {
    try {
      const kdsOrder = await this.client.sendOrderToKDS(order);
      return { success: true, kdsOrder };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check order preparation status
   */
  async getPreparationStatus(displayId: string): Promise<{
    status: 'pending' | 'acknowledged' | 'preparing' | 'ready' | 'completed';
    readyAt?: Date;
  } | null> {
    try {
      const order = await this.client.getKDSOrderStatus(displayId);
      return {
        status: order.status,
        readyAt: order.readyAt ? new Date(order.readyAt) : undefined,
      };
    } catch (error) {
      logger.error('[KDSIntegration] Error getting preparation status:', error);
      return null;
    }
  }

  /**
   * Wait for order to be ready
   */
  async waitForOrderReady(
    displayId: string,
    timeoutMs: number = 60000,
    pollIntervalMs: number = 5000
  ): Promise<{ ready: boolean; timeWaited?: number; error?: string }> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getPreparationStatus(displayId);

      if (status?.status === 'ready' || status?.status === 'completed') {
        return { ready: true, timeWaited: Date.now() - startTime };
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    return {
      ready: false,
      timeWaited: Date.now() - startTime,
      error: 'Timeout waiting for order to be ready',
    };
  }

  /**
   * Get all pending orders for a store
   */
  async getPendingOrders(storeId: string): Promise<{
    orders: KDSOrder[];
    count: number;
  }> {
    try {
      const orders = await this.client.getPendingOrders(storeId);
      return {
        orders,
        count: orders.length,
      };
    } catch (error) {
      logger.error('[KDSIntegration] Error getting pending orders:', error);
      return { orders: [], count: 0 };
    }
  }

  /**
   * Get ready orders for pickup
   */
  async getReadyOrders(storeId: string): Promise<{
    orders: KDSOrder[];
    count: number;
  }> {
    try {
      const orders = await this.client.getReadyOrders(storeId);
      return {
        orders,
        count: orders.length,
      };
    } catch (error) {
      logger.error('[KDSIntegration] Error getting ready orders:', error);
      return { orders: [], count: 0 };
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToUpdates(
    storeId: string,
    onUpdate: (update: { orderId: string; status: string; timestamp: Date }) => void
  ): { unsubscribe: () => void } {
    return this.client.subscribeToUpdates(storeId, (update) => {
      onUpdate({
        orderId: update.orderId,
        status: update.status,
        timestamp: new Date(update.timestamp),
      });
    });
  }
}

// Singleton instance
let kdsIntegration: KDSIntegration | null = null;

export function getKDSIntegration(): KDSIntegration {
  if (!kdsIntegration) {
    kdsIntegration = new KDSIntegration();
  }
  return kdsIntegration;
}

export default KDSIntegration;
