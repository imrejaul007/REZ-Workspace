/**
 * Order Service Integration for Delivery Service
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
   * Get orders ready for delivery
   */
  async getDeliveryReadyOrders(storeId: string): Promise<{
    orders: Array<{
      orderId: string;
      customerId: string;
      total: number;
      deliveryAddress: OrderClient extends { getDeliveryReadyOrders(id: string): Promise<infer T> } ? T extends Array<infer U> ? U['deliveryAddress'] : never : never;
    }>;
  }> {
    try {
      const orders = await this.client.getDeliveryReadyOrders(storeId);
      return {
        orders: orders.map((o) => ({
          orderId: o.orderId,
          customerId: o.customerId,
          total: o.total,
          deliveryAddress: o.deliveryAddress,
        })),
      };
    } catch (error) {
      logger.error('[OrderIntegration] Error getting delivery ready orders:', error);
      return { orders: [] };
    }
  }

  /**
   * Assign delivery to order
   */
  async assignDelivery(
    orderId: string,
    driverId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const estimatedPickup = new Date();
      estimatedPickup.setMinutes(estimatedPickup.getMinutes() + 15);

      const estimatedDelivery = new Date();
      estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 45);

      await this.client.assignDelivery(orderId, driverId, estimatedPickup, estimatedDelivery);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    orderId: string,
    status: string,
    location?: { lat: number; lng: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.updateDeliveryStatus(orderId, status, location);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
