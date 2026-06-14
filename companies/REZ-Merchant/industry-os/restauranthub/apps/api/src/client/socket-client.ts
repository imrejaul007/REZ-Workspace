import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface SocketClientConfig {
  baseURL: string;
  auth?: {
    token?: string;
  };
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

export interface OrderUpdate {
  orderId: string;
  status: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
}

export interface MessageData {
  recipientId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE';
  metadata?;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  data?;
  createdAt: string;
}

export class RestoPapaSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private config: Required<SocketClientConfig>;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(config: SocketClientConfig) {
    super();
    
    this.config = {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
      ...config,
      auth: config.auth || {},
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        this.once('connected', resolve);
        this.once('error', reject);
        return;
      }

      this.isConnecting = true;

      try {
        this.socket = io(this.config.baseURL, {
          auth: this.config.auth,
          timeout: this.config.timeout,
          reconnection: this.config.reconnection,
          reconnectionAttempts: this.config.reconnectionAttempts,
          reconnectionDelay: this.config.reconnectionDelay,
        });

        this.setupEventHandlers();

        this.socket.once('connect', () => {
          this.isConnecting = false;
          this.emit('connected');
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        });

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.emit('disconnected');
  }

  updateAuth(token: string): void {
    this.config.auth.token = token;
    
    if (this.socket?.connected) {
      this.socket.auth = { token };
      this.socket.disconnect().connect();
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Order-related events
  subscribeToOrderUpdates(orderId?: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    
    if (orderId) {
      this.socket.emit('joinOrderRoom', orderId);
    } else {
      this.socket.emit('subscribeToOrders');
    }
  }

  unsubscribeFromOrderUpdates(orderId?: string): void {
    if (!this.socket) return;
    
    if (orderId) {
      this.socket.emit('leaveOrderRoom', orderId);
    } else {
      this.socket.emit('unsubscribeFromOrders');
    }
  }

  // Restaurant-related events
  subscribeToRestaurantUpdates(restaurantId: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('joinRestaurantRoom', restaurantId);
  }

  unsubscribeFromRestaurantUpdates(restaurantId: string): void {
    if (!this.socket) return;
    this.socket.emit('leaveRestaurantRoom', restaurantId);
  }

  // Messaging
  sendMessage(messageData: MessageData): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('sendMessage', messageData);
  }

  subscribeToMessages(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('subscribeToMessages');
  }

  // Notifications
  subscribeToNotifications(): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('subscribeToNotifications');
  }

  markNotificationAsRead(notificationId: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('markNotificationRead', notificationId);
  }

  // Kitchen display updates (for restaurant staff)
  subscribeToKitchenUpdates(restaurantId: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('subscribeToKitchen', restaurantId);
  }

  updateOrderInKitchen(orderId: string, status: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('kitchenOrderUpdate', { orderId, status });
  }

  // Driver tracking (for delivery orders)
  subscribeToDriverTracking(orderId: string): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('trackDriver', orderId);
  }

  updateDriverLocation(orderId: string, location: { lat: number; lng: number }): void {
    if (!this.socket) throw new Error('Socket not connected');
    this.socket.emit('driverLocationUpdate', { orderId, location });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.emit('disconnected', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, manual reconnection needed
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.emit('connectionError', error);
      this.scheduleReconnect();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.emit('reconnected', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      this.emit('reconnectionError', error);
    });

    this.socket.on('reconnect_failed', () => {
      this.emit('reconnectionFailed');
    });

    // Business events
    this.socket.on('orderUpdate', (data: OrderUpdate) => {
      this.emit('orderUpdate', data);
    });

    this.socket.on('newMessage', (data) => {
      this.emit('newMessage', data);
    });

    this.socket.on('notification', (data: NotificationData) => {
      this.emit('notification', data);
    });

    this.socket.on('restaurantStatusUpdate', (data) => {
      this.emit('restaurantStatusUpdate', data);
    });

    this.socket.on('menuItemUpdate', (data) => {
      this.emit('menuItemUpdate', data);
    });

    this.socket.on('kitchenOrderUpdate', (data) => {
      this.emit('kitchenOrderUpdate', data);
    });

    this.socket.on('driverLocationUpdate', (data) => {
      this.emit('driverLocationUpdate', data);
    });

    this.socket.on('paymentUpdate', (data) => {
      this.emit('paymentUpdate', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      this.emit('socketError', error);
    });

    // Authentication events
    this.socket.on('authError', (error) => {
      this.emit('authError', error);
    });

    this.socket.on('authenticated', () => {
      this.emit('authenticated');
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect().catch((error) => {
          this.emit('reconnectionError', error);
        });
      }
    }, this.config.reconnectionDelay);
  }

  // Utility methods
  getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    id?: string;
  } {
    return {
      connected: this.socket?.connected || false,
      connecting: this.isConnecting,
      ...(this.socket?.id && { id: this.socket.id }),
    };
  }

  // Typed event listeners — implementation uses `string` so TS resolves overloads correctly
  override on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }
}

// Default socket client instance
export let socketClient: RestoPapaSocketClient;

export function createSocketClient(config: SocketClientConfig): RestoPapaSocketClient {
  socketClient = new RestoPapaSocketClient(config);
  return socketClient;
}

export function getSocketClient(): RestoPapaSocketClient {
  if (!socketClient) {
    throw new Error('Socket client not initialized. Call createSocketClient() first.');
  }
  return socketClient;
}