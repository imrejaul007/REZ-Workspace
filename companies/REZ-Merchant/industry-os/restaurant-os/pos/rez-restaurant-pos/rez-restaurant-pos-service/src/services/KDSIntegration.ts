import logger from './utils/logger';

import { v4 as uuidv4 } from 'uuid';

export interface KDSOrderItem {
  id: string;
  name: string;
  quantity: number;
  station: string;
  status: 'pending' | 'preparing' | 'ready';
  modifiers?: string[];
  notes?: string;
}

export interface KDSOrder {
  orderId: string;
  orderNumber: string;
  items: KDSOrderItem[];
  status: 'new' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
  priority: 'normal' | 'rush';
  tableNumber?: string;
  customerName?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  createdAt: Date;
  updatedAt: Date;
}

export interface KDSStation {
  id: string;
  name: string;
  categories: string[];
  color: string;
  activeOrders: number;
}

export interface KDSStats {
  totalOrders: number;
  newOrders: number;
  inProgress: number;
  readyOrders: number;
  avgWaitTime: number;
}

const KDS_SERVICE_URL = process.env.KDS_SERVICE_URL || 'http://localhost:4014';

interface WebSocketClient {
  send(data: string): void;
  close(): void;
  onopen: (() => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onclose: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
}

interface WebSocketModule {
  new (url: string): WebSocketClient;
}

export class KDSIntegration {
  private storeId: string;
  private merchantId: string;
  private socket: WebSocketClient | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isBrowser: boolean;

  constructor(merchantId: string, storeId: string) {
    this.merchantId = merchantId;
    this.storeId = storeId;
    this.isBrowser = typeof window !== 'undefined';
  }

  // Connect to KDS WebSocket for real-time updates
  async connect(): Promise<void> {
    if (!this.isBrowser) {
      logger.info('[KDS] Skipping WebSocket connect in non-browser environment');
      return;
    }

    try {
      const WebSocketClass = await this.getWebSocketClass();
      if (!WebSocketClass) {
        logger.warn('[KDS] WebSocket not available');
        return;
      }

      this.socket = new WebSocketClass(`ws://localhost:4014`) as WebSocketClient;

      this.socket.onopen = () => {
        logger.info('[KDS] Connected to KDS service');
        this.socket?.send(JSON.stringify({
          type: 'join-store',
          storeId: this.storeId
        }));
      };

      this.socket.onmessage = (event: { data: string }) => {
        try {
          const data = JSON.parse(event.data);
          const listeners = this.listeners.get(data.type);
          if (listeners) {
            listeners.forEach(cb => cb(data));
          }
        } catch (e) {
          logger.error('[KDS] Failed to parse message:', e);
        }
      };

      this.socket.onclose = () => {
        logger.info('[KDS] Disconnected from KDS service');
        this.scheduleReconnect();
      };

      this.socket.onerror = (error: unknown) => {
        logger.error('[KDS] WebSocket error:', error);
      };
    } catch (error) {
      logger.error('[KDS] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      logger.info('[KDS] Attempting reconnection...');
      this.connect();
    }, 5000);
  }

  private async getWebSocketClass(): Promise<WebSocketModule | null> {
    if (!this.isBrowser) return null;
    return WebSocket as unknown as WebSocketModule;
  }

  // Disconnect from KDS
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.socket?.close();
    this.socket = null;
  }

  // Subscribe to KDS events
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Create order for KDS
  async createOrder(orderData: {
    items: Array<{
      name: string;
      quantity: number;
      station: string;
      modifiers?: string[];
      notes?: string;
    }>;
    tableNumber?: string;
    customerName?: string;
    orderType?: 'dine_in' | 'takeaway' | 'delivery';
    priority?: 'normal' | 'rush';
  }): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${KDS_SERVICE_URL}/api/v1/kds/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: this.merchantId,
          storeId: this.storeId,
          ...orderData
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create KDS order: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS order creation timed out');
      }
      throw error;
    }
  }

  // Get all active orders
  async getOrders(): Promise<KDSOrder[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders?storeId=${encodeURIComponent(this.storeId)}`,
        {
          headers: { 'x-store-id': this.storeId },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get KDS orders');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS get orders timed out');
      }
      throw error;
    }
  }

  // Get orders for a specific station
  async getOrdersByStation(station: string): Promise<KDSOrder[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/stations/${encodeURIComponent(station)}/orders?storeId=${encodeURIComponent(this.storeId)}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get station orders');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS get station orders timed out');
      }
      throw error;
    }
  }

  // Update item status
  async updateItemStatus(
    orderId: string,
    itemId: string,
    status: 'pending' | 'preparing' | 'ready'
  ): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(itemId)}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to update item status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS update item status timed out');
      }
      throw error;
    }
  }

  // Bump order (mark ready)
  async bumpOrder(orderId: string): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders/${encodeURIComponent(orderId)}/bump`,
        { method: 'POST', signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to bump order');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS bump order timed out');
      }
      throw error;
    }
  }

  // Complete order
  async completeOrder(orderId: string): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders/${encodeURIComponent(orderId)}/complete`,
        { method: 'POST', signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to complete order');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS complete order timed out');
      }
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(orderId: string, reason?: string): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders/${encodeURIComponent(orderId)}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS cancel order timed out');
      }
      throw error;
    }
  }

  // Recall order
  async recallOrder(orderId: string): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders/${encodeURIComponent(orderId)}/recall`,
        { method: 'POST', signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to recall order');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS recall order timed out');
      }
      throw error;
    }
  }

  // Add note to order item
  async addNote(orderId: string, itemId: string, note: string): Promise<KDSOrder> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/orders/${encodeURIComponent(orderId)}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, note }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS add note timed out');
      }
      throw error;
    }
  }

  // Get KDS stats
  async getStats(): Promise<KDSStats> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${KDS_SERVICE_URL}/api/v1/kds/stats?storeId=${encodeURIComponent(this.storeId)}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to get KDS stats');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('KDS get stats timed out');
      }
      throw error;
    }
  }

  // Get all stations
  async getStations(): Promise<KDSStation[]> {
    return [
      { id: 'grill', name: 'Grill', categories: ['grill', 'bbq', 'tandoor'], color: '#EF4444', activeOrders: 0 },
      { id: 'fry', name: 'Fry', categories: ['fry', 'fried', 'crispy'], color: '#F59E0B', activeOrders: 0 },
      { id: 'saute', name: 'Sauté', categories: ['curry', 'saute', 'gravy'], color: '#10B981', activeOrders: 0 },
      { id: 'dessert', name: 'Dessert', categories: ['dessert', 'sweet', 'ice cream'], color: '#8B5CF6', activeOrders: 0 },
      { id: 'beverage', name: 'Beverage', categories: ['drink', 'beverage', 'shake'], color: '#3B82F6', activeOrders: 0 },
    ];
  }
}

// Helper to create KDS integration instance
export function createKDSIntegration(merchantId: string, storeId: string): KDSIntegration {
  return new KDSIntegration(merchantId, storeId);
}
