import logger from './utils/logger';

/**
 * KDS (Kitchen Display System) Client for Delivery Service
 * Provides typed access to the KDS API for kitchen communication
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const KDS_SERVICE_URL = process.env.KDS_SERVICE_URL || 'http://localhost:3008';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
export interface KDSOrderItem {
  productId: string;
  name: string;
  quantity: number;
  notes?: string;
  modifications?: string[];
}

export interface KDSOrder {
  orderId: string;
  displayId: string;
  storeId: string;
  items: KDSOrderItem[];
  priority: 'normal' | 'rush' | 'vip';
  status: 'pending' | 'acknowledged' | 'preparing' | 'ready' | 'completed';
  estimatedPrepTime?: number; // in minutes
  createdAt: Date;
  readyAt?: Date;
}

export interface KDSUpdate {
  orderId: string;
  status: 'preparing' | 'ready';
  timestamp: Date;
}

export class KDSClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: KDS_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
        'x-internal-service': 'rez-delivery-service',
      },
    });
  }

  /**
   * Send order to KDS
   */
  async sendOrderToKDS(order: {
    orderId: string;
    storeId: string;
    items: KDSOrderItem[];
    priority?: 'normal' | 'rush' | 'vip';
    notes?: string;
  }): Promise<KDSOrder> {
    const response = await this.client.post('/orders', {
      ...order,
      displayId: `D-${order.orderId}`,
    });
    return response.data;
  }

  /**
   * Get KDS order status
   */
  async getKDSOrderStatus(displayId: string): Promise<KDSOrder> {
    const response = await this.client.get(`/orders/${displayId}`);
    return response.data;
  }

  /**
   * Update KDS order status
   */
  async updateKDSOrderStatus(
    displayId: string,
    status: 'preparing' | 'ready'
  ): Promise<KDSOrder> {
    const response = await this.client.patch(`/orders/${displayId}/status`, {
      status,
    });
    return response.data;
  }

  /**
   * Mark order as ready for pickup
   */
  async markOrderReady(displayId: string): Promise<KDSOrder> {
    return this.updateKDSOrderStatus(displayId, 'ready');
  }

  /**
   * Get pending orders for a store
   */
  async getPendingOrders(storeId: string): Promise<KDSOrder[]> {
    const response = await this.client.get('/orders', {
      params: { storeId, status: 'pending,acknowledged,preparing' },
    });
    return response.data.orders || response.data;
  }

  /**
   * Get ready orders for pickup
   */
  async getReadyOrders(storeId: string): Promise<KDSOrder[]> {
    const response = await this.client.get('/orders', {
      params: { storeId, status: 'ready' },
    });
    return response.data.orders || response.data;
  }

  /**
   * Cancel order in KDS
   */
  async cancelKDSOrder(displayId: string, reason?: string): Promise<void> {
    await this.client.delete(`/orders/${displayId}`, {
      data: { reason },
    });
  }

  /**
   * Register for real-time updates via WebSocket
   */
  subscribeToUpdates(
    storeId: string,
    callback: (update: KDSUpdate) => void
  ): { unsubscribe: () => void } {
    // Note: In production, this would establish a WebSocket connection
    // For now, we return a mock unsubscribe function
    logger.info(`[KDSClient] Subscribed to updates for store ${storeId}`);

    return {
      unsubscribe: () => {
        logger.info(`[KDSClient] Unsubscribed from updates for store ${storeId}`);
      },
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.client.get('/health');
      return {
        healthy: response.data.status === 'ok' || response.data.status === 'healthy',
        latency: Date.now() - start,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KDSClient] Health check failed: ${errorMessage}`);
      return {
        healthy: false,
        error: errorMessage,
        latency: Date.now() - start,
      };
    }
  }
}

// Singleton instance
let kdsClient: KDSClient | null = null;

export function getKDSClient(): KDSClient {
  if (!kdsClient) {
    kdsClient = new KDSClient();
  }
  return kdsClient;
}

export default KDSClient;
