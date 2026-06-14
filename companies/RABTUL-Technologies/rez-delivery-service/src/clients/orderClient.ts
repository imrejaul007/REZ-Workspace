/**
 * Order Service Client for Delivery Service
 * Provides typed access to the order service API
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

// Types
export interface Order {
  _id: string;
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryOrderRequest {
  orderId: string;
  merchantId: string;
  storeId: string;
  customerId: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  items: Order['items'];
  total: number;
  notes?: string;
}

export class OrderClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ORDER_SERVICE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': INTERNAL_SERVICE_TOKEN,
        'x-internal-service': 'rez-delivery-service',
      },
    });
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data;
  }

  /**
   * Get orders for a store
   */
  async getStoreOrders(storeId: string, status?: string): Promise<Order[]> {
    const response = await this.client.get('/orders', {
      params: { storeId, status },
    });
    return response.data.orders || response.data;
  }

  /**
   * Get delivery-ready orders
   */
  async getDeliveryReadyOrders(storeId: string): Promise<Order[]> {
    const response = await this.client.get('/orders/delivery/ready', {
      params: { storeId },
    });
    return response.data.orders || response.data;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: string,
    metadata?: Record<string, unknown>
  ): Promise<Order> {
    const response = await this.client.patch(`/orders/${orderId}/status`, {
      status,
      ...metadata,
    });
    return response.data;
  }

  /**
   * Assign delivery to order
   */
  async assignDelivery(
    orderId: string,
    driverId: string,
    estimatedPickup: Date,
    estimatedDelivery: Date
  ): Promise<Order> {
    const response = await this.client.post(`/orders/${orderId}/delivery`, {
      driverId,
      estimatedPickup: estimatedPickup.toISOString(),
      estimatedDelivery: estimatedDelivery.toISOString(),
    });
    return response.data;
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    orderId: string,
    status: string,
    location?: { lat: number; lng: number }
  ): Promise<Order> {
    const response = await this.client.patch(`/orders/${orderId}/delivery/status`, {
      status,
      location,
    });
    return response.data;
  }

  /**
   * Get order with delivery info
   */
  async getOrderWithDelivery(orderId: string): Promise<{
    order: Order;
    delivery?: {
      driverId: string;
      status: string;
      estimatedPickup: Date;
      estimatedDelivery: Date;
      currentLocation?: { lat: number; lng: number };
    };
  }> {
    const response = await this.client.get(`/orders/${orderId}/delivery`);
    return response.data;
  }

  /**
   * Notify order ready for pickup (to KDS)
   */
  async notifyOrderReady(orderId: string, storeId: string): Promise<void> {
    await this.client.post(`/orders/${orderId}/notify-ready`, {
      storeId,
      channel: 'kds',
    });
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
      console.error(`[OrderClient] Health check failed: ${errorMessage}`);
      return {
        healthy: false,
        error: errorMessage,
        latency: Date.now() - start,
      };
    }
  }
}

// Singleton instance
let orderClient: OrderClient | null = null;

export function getOrderClient(): OrderClient {
  if (!orderClient) {
    orderClient = new OrderClient();
  }
  return orderClient;
}

export default OrderClient;
