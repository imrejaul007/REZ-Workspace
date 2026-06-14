/**
 * WebSocket Manager - Comprehensive Real-time Communication
 *
 * Provides a unified WebSocket connection manager for:
 * - Orders: {merchantId} - order updates
 * - Customers: {merchantId} - customer updates
 * - Inventory: {merchantId} - stock alerts
 * - Notifications: {merchantId} - push notifications
 *
 * Supports reconnection, heartbeat, and multiple channel subscriptions.
 */

import { io, Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';

// WebSocket base URLs (tries order-service first, then backend)
const WS_BASE_URLS = [
  process.env.EXPO_PUBLIC_ORDER_WS_URL || 'wss://rez-order-service.onrender.com',
  process.env.EXPO_PUBLIC_WS_URL || 'wss://rez-backend-8dfu.onrender.com',
];

// Configuration
const DEFAULT_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;
const HEARTBEAT_INTERVAL = 30000;
const CONNECTION_TIMEOUT = 10000;

// Message types
export type ChannelType = 'orders' | 'customers' | 'inventory' | 'notifications';

export interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: unknown;
  timestamp?: string;
  [key: string]: unknown;
}

export interface OrderUpdate {
  type: 'new_order' | 'order_updated' | 'order_cancelled' | 'order_status_changed';
  orderId?: string;
  order?: {
    _id: string;
    orderId: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
    status: string;
    paymentStatus?: string;
    paymentMethod?: string;
    createdAt: string;
    updatedAt?: string;
  };
  status?: string;
  timestamp?: string;
}

export interface CustomerUpdate {
  type: 'new_customer' | 'customer_updated' | 'customer_loyalty_changed';
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    totalOrders?: number;
    loyaltyPoints?: number;
    lastVisit?: string;
    createdAt: string;
  };
  timestamp?: string;
}

export interface InventoryAlert {
  type: 'low_stock' | 'out_of_stock' | 'stock_updated' | 'restock_alert';
  productId?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    currentStock: number;
    lowStockThreshold: number;
    category?: string;
    image?: string;
  };
  previousStock?: number;
  timestamp?: string;
}

export interface NotificationMessage {
  type: 'push' | 'system' | 'alert' | 'reminder';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timestamp?: string;
}

// Callback types
export type OrderCallback = (update: OrderUpdate) => void;
export type CustomerCallback = (update: CustomerUpdate) => void;
export type InventoryCallback = (alert: InventoryAlert) => void;
export type NotificationCallback = (notification: NotificationMessage) => void;
export type ConnectionCallback = () => void;
export type ErrorCallback = (error: Error) => void;
export type MessageCallback = (message: WebSocketMessage) => void;

export interface ChannelSubscription {
  channel: string;
  callback: MessageCallback;
  eventName: string;
}

class WebSocketManager {
  private socket: Socket | null = null;
  private merchantId: string | null = null;
  private subscriptions: Map<string, ChannelSubscription[]> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  private isConnecting: boolean = false;
  private currentBaseUrlIndex: number = 0;

  // Connection state callbacks
  private onConnectCallbacks: Set<ConnectionCallback> = new Set();
  private onDisconnectCallbacks: Set<ConnectionCallback> = new Set();
  private onErrorCallbacks: Set<ErrorCallback> = new Set();

  // Get current WebSocket URL
  private getCurrentUrl(): string {
    return WS_BASE_URLS[this.currentBaseUrlIndex];
  }

  /**
   * Connect to WebSocket server with merchant ID
   */
  connect(merchantId: string, token?: string): void {
    if (this.socket?.connected && this.merchantId === merchantId) {
      logger.debug('[WebSocketManager] Already connected to merchant:', merchantId);
      return;
    }

    // Disconnect existing connection if merchant ID changed
    if (this.merchantId && this.merchantId !== merchantId) {
      logger.debug('[WebSocketManager] Merchant ID changed, disconnecting...');
      this.disconnect();
    }

    this.merchantId = merchantId;
    this.reconnectAttempts = 0;

    this.establishConnection(token);
  }

  private establishConnection(token?: string): void {
    if (this.isConnecting) {
      logger.debug('[WebSocketManager] Connection already in progress');
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getCurrentUrl();

    logger.debug('[WebSocketManager] Connecting to:', wsUrl);

    // Build connection options
    const options: Record<string, unknown> = {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: DEFAULT_RECONNECT_DELAY,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: CONNECTION_TIMEOUT,
      query: {
        merchantId: this.merchantId,
      },
    };

    // Add auth token if provided
    if (token) {
      options.auth = { token };
    }

    try {
      this.socket = io(wsUrl, options);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          logger.warn('[WebSocketManager] Connection timeout, trying next URL');
          this.handleConnectionFailure();
        }
      }, CONNECTION_TIMEOUT);

      this.setupSocketListeners();
    } catch (error) {
      logger.error('[WebSocketManager] Failed to create socket:', error);
      this.isConnecting = false;
      this.handleConnectionFailure();
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      logger.debug('[WebSocketManager] Connected successfully');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.currentBaseUrlIndex = 0; // Reset to primary URL

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Resubscribe to all channels
      this.resubscribeAll();

      // Start heartbeat
      this.startHeartbeat();

      // Notify listeners
      this.onConnectCallbacks.forEach((cb) => cb());
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      logger.error('[WebSocketManager] Connection error:', error.message);
      this.isConnecting = false;

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      // Notify error listeners
      this.onErrorCallbacks.forEach((cb) => cb(error));

      // Try next URL or attempt reconnection
      this.handleConnectionFailure();
    });

    // Disconnected
    this.socket.on('disconnect', (reason: string) => {
      logger.debug('[WebSocketManager] Disconnected:', reason);
      this.stopHeartbeat();

      this.onDisconnectCallbacks.forEach((cb) => cb());

      // Auto-reconnect if not intentionally disconnected
      if (reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      logger.debug('[WebSocketManager] Reconnect attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
    });

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      logger.error('[WebSocketManager] Reconnection failed after max attempts');
      this.handleConnectionFailure();
    });

    // Handle order updates
    this.socket.on('order:new', (data: OrderUpdate) => {
      this.emitToSubscribers('orders', { type: 'new_order', ...data });
    });

    this.socket.on('order:updated', (data: OrderUpdate) => {
      this.emitToSubscribers('orders', { type: 'order_updated', ...data });
    });

    this.socket.on('order:cancelled', (data: OrderUpdate) => {
      this.emitToSubscribers('orders', { type: 'order_cancelled', ...data });
    });

    this.socket.on('order:status_changed', (data: OrderUpdate) => {
      this.emitToSubscribers('orders', { type: 'order_status_changed', ...data });
    });

    // Handle customer updates
    this.socket.on('customer:new', (data: CustomerUpdate) => {
      this.emitToSubscribers('customers', { type: 'new_customer', ...data });
    });

    this.socket.on('customer:updated', (data: CustomerUpdate) => {
      this.emitToSubscribers('customers', { type: 'customer_updated', ...data });
    });

    this.socket.on('customer:loyalty_changed', (data: CustomerUpdate) => {
      this.emitToSubscribers('customers', { type: 'customer_loyalty_changed', ...data });
    });

    // Handle inventory alerts
    this.socket.on('inventory:low_stock', (data: InventoryAlert) => {
      this.emitToSubscribers('inventory', { type: 'low_stock', ...data });
    });

    this.socket.on('inventory:out_of_stock', (data: InventoryAlert) => {
      this.emitToSubscribers('inventory', { type: 'out_of_stock', ...data });
    });

    this.socket.on('inventory:stock_updated', (data: InventoryAlert) => {
      this.emitToSubscribers('inventory', { type: 'stock_updated', ...data });
    });

    this.socket.on('inventory:restock_alert', (data: InventoryAlert) => {
      this.emitToSubscribers('inventory', { type: 'restock_alert', ...data });
    });

    // Handle notifications
    this.socket.on('notification:push', (data: NotificationMessage) => {
      this.emitToSubscribers('notifications', { type: 'push', ...data });
    });

    this.socket.on('notification:system', (data: NotificationMessage) => {
      this.emitToSubscribers('notifications', { type: 'system', ...data });
    });

    this.socket.on('notification:alert', (data: NotificationMessage) => {
      this.emitToSubscribers('notifications', { type: 'alert', ...data });
    });

    // Handle acknowledgment
    this.socket.on('ack', (data: { success: boolean; messageId?: string }) => {
      logger.debug('[WebSocketManager] Message ack:', data);
    });

    // Handle error from server
    this.socket.on('error', (error: { message: string; code?: string }) => {
      logger.error('[WebSocketManager] Server error:', error);
      this.onErrorCallbacks.forEach((cb) => cb(new Error(error.message)));
    });
  }

  private handleConnectionFailure(): void {
    // Try next URL in the list
    if (this.currentBaseUrlIndex < WS_BASE_URLS.length - 1) {
      this.currentBaseUrlIndex++;
      logger.debug('[WebSocketManager] Trying alternate URL:', this.getCurrentUrl());
      this.disconnect();
      this.establishConnection();
    } else {
      this.currentBaseUrlIndex = 0;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.warn('[WebSocketManager] Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      DEFAULT_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      30000
    );

    logger.debug(`[WebSocketManager] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.merchantId) {
        this.establishConnection();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    logger.debug('[WebSocketManager] Disconnecting...');

    // Clear timers
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear subscriptions
    this.subscriptions.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current merchant ID
   */
  getMerchantId(): string | null {
    return this.merchantId;
  }

  /**
   * Subscribe to a channel
   * Supported channels:
   * - orders:{merchantId} - order updates
   * - customers:{merchantId} - customer updates
   * - inventory:{merchantId} - stock alerts
   * - notifications:{merchantId} - push notifications
   */
  subscribe(channel: string, callback: MessageCallback): () => void {
    const fullChannel = this.getFullChannelName(channel);

    logger.debug('[WebSocketManager] Subscribing to channel:', fullChannel);

    // Join the room on server
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { channel: fullChannel });
    }

    // Store subscription
    const subscription: ChannelSubscription = {
      channel: fullChannel,
      callback,
      eventName: this.getEventName(channel),
    };

    const existing = this.subscriptions.get(fullChannel) || [];
    this.subscriptions.set(fullChannel, [...existing, subscription]);

    // Return unsubscribe function
    return () => this.unsubscribe(channel, callback);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channel: string, callback?: MessageCallback): void {
    const fullChannel = this.getFullChannelName(channel);

    logger.debug('[WebSocketManager] Unsubscribing from channel:', fullChannel);

    if (callback) {
      // Remove specific callback
      const existing = this.subscriptions.get(fullChannel) || [];
      const filtered = existing.filter((sub) => sub.callback !== callback);
      this.subscriptions.set(fullChannel, filtered);

      // Leave room if no more subscriptions
      if (filtered.length === 0 && this.socket?.connected) {
        this.socket.emit('unsubscribe', { channel: fullChannel });
      }
    } else {
      // Remove all subscriptions for channel
      this.subscriptions.delete(fullChannel);
      if (this.socket?.connected) {
        this.socket.emit('unsubscribe', { channel: fullChannel });
      }
    }
  }

  /**
   * Subscribe to orders channel with typed callback
   */
  subscribeToOrders(callback: OrderCallback): () => void {
    return this.subscribe('orders', (message) => {
      callback(message as OrderUpdate);
    });
  }

  /**
   * Subscribe to customers channel with typed callback
   */
  subscribeToCustomers(callback: CustomerCallback): () => void {
    return this.subscribe('customers', (message) => {
      callback(message as CustomerUpdate);
    });
  }

  /**
   * Subscribe to inventory channel with typed callback
   */
  subscribeToInventory(callback: InventoryCallback): () => void {
    return this.subscribe('inventory', (message) => {
      callback(message as InventoryAlert);
    });
  }

  /**
   * Subscribe to notifications channel with typed callback
   */
  subscribeToNotifications(callback: NotificationCallback): () => void {
    return this.subscribe('notifications', (message) => {
      callback(message as NotificationMessage);
    });
  }

  private getFullChannelName(channel: string): string {
    // If already has merchantId, return as-is
    if (channel.includes(':')) {
      return channel;
    }

    // Add merchantId if we have one
    if (this.merchantId) {
      return `${channel}:${this.merchantId}`;
    }

    return channel;
  }

  private getEventName(channel: string): string {
    const baseChannel = channel.split(':')[0];
    return `${baseChannel}:update`;
  }

  private emitToSubscribers(channel: string, data: WebSocketMessage): void {
    const subscriptions = this.subscriptions.get(channel) || [];

    logger.debug(`[WebSocketManager] Emitting to ${subscriptions.length} subscribers for ${channel}`);

    subscriptions.forEach((sub) => {
      try {
        sub.callback(data);
      } catch (error) {
        logger.error('[WebSocketManager] Error in subscription callback:', error);
      }
    });
  }

  private resubscribeAll(): void {
    const channels = Array.from(this.subscriptions.keys());

    logger.debug('[WebSocketManager] Resubscribing to channels:', channels);

    channels.forEach((channel) => {
      if (this.socket?.connected) {
        this.socket.emit('subscribe', { channel });
      }
    });
  }

  /**
   * Add connection state listener
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.onConnectCallbacks.add(callback);
    return () => this.onConnectCallbacks.delete(callback);
  }

  /**
   * Add disconnection listener
   */
  onDisconnect(callback: ConnectionCallback): () => void {
    this.onDisconnectCallbacks.add(callback);
    return () => this.onDisconnectCallbacks.delete(callback);
  }

  /**
   * Add error listener
   */
  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.add(callback);
    return () => this.onErrorCallbacks.delete(callback);
  }

  /**
   * Send a message through the socket
   */
  emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      logger.warn('[WebSocketManager] Cannot emit - not connected');
      return;
    }

    this.socket.emit(event, {
      ...data,
      merchantId: this.merchantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get reconnection status
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    if (this.merchantId) {
      this.disconnect();
      this.connect(this.merchantId);
    }
  }

  /**
   * Get the underlying socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  // Kitchen-specific methods

  /**
   * Join a kitchen room for a specific store
   * @param storeId The store ID to join
   */
  joinKitchen(storeId: string): void {
    if (!this.socket?.connected) {
      logger.warn('[WebSocketManager] Cannot join kitchen - not connected');
      return;
    }

    logger.debug('[WebSocketManager] Joining kitchen room:', storeId);
    this.socket.emit('kitchen:join', { storeId });
  }

  /**
   * Leave a kitchen room
   * @param storeId The store ID to leave
   */
  leaveKitchen(storeId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    logger.debug('[WebSocketManager] Leaving kitchen room:', storeId);
    this.socket.emit('kitchen:leave', { storeId });
  }

  /**
   * Update order status in kitchen
   * @param orderId The order ID
   * @param status The new status
   * @param storeId The store ID
   */
  updateOrderStatus(orderId: string, status: string, storeId: string): void {
    if (!this.socket?.connected) {
      logger.warn('[WebSocketManager] Cannot update order status - not connected');
      return;
    }

    logger.debug('[WebSocketManager] Updating order status:', { orderId, status, storeId });
    this.socket.emit('kitchen:updateStatus', { orderId, status, storeId });
  }

  /**
   * Listen for new kitchen orders
   */
  onNewOrder(callback: (order: unknown) => void): () => void {
    const handler = (data: unknown) => {
      logger.debug('[WebSocketManager] New order received:', data);
      callback(data);
    };

    this.socket?.on('kitchen:newOrder', handler);

    return () => {
      this.socket?.off('kitchen:newOrder', handler);
    };
  }

  /**
   * Listen for kitchen order updates
   */
  onOrderUpdated(callback: (order: unknown) => void): () => void {
    const handler = (data: unknown) => {
      logger.debug('[WebSocketManager] Order updated:', data);
      callback(data);
    };

    this.socket?.on('kitchen:orderUpdated', handler);

    return () => {
      this.socket?.off('kitchen:orderUpdated', handler);
    };
  }

  /**
   * Listen for kitchen order completions
   */
  onOrderCompleted(callback: (orderId: string) => void): () => void {
    const handler = (data: { orderId: string }) => {
      logger.debug('[WebSocketManager] Order completed:', data.orderId);
      callback(data.orderId);
    };

    this.socket?.on('kitchen:orderCompleted', handler);

    return () => {
      this.socket?.off('kitchen:orderCompleted', handler);
    };
  }
}

// Create and export singleton instance
export const websocketManager = new WebSocketManager();

// Export class for testing or multiple instances
export default WebSocketManager;
