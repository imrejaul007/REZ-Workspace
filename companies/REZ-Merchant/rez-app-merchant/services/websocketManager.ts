/**
 * WebSocket Manager Service
 * Singleton Socket.IO connection manager for real-time updates
 */

import { io, Socket } from 'socket.io-client';
import { logger } from '@/utils/logger';

const SOCKET_URL = process.env.EXPO_PUBLIC_WS_URL || 'wss://rez-api.onrender.com';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectDelayMax = 10000;
  private subscribedRooms: Set<string> = new Set();
  private subscribedCallbacks: Map<string, Set<(...args: unknown[]) => void>> = new Map();

  /**
   * Connect to WebSocket server
   */
  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: this.reconnectDelayMax,
    });

    this.socket.on('connect', () => {
      logger.info('[Socket] Connected', { socketId: this.socket?.id });
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      // Re-subscribe to all rooms and callbacks on reconnect
      this.resubscribeAll();
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('[Socket] Disconnected', { reason });
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      logger.info('[Socket] Reconnecting', { attempt });
      this.reconnectAttempts = attempt;
      // Exponential backoff with jitter
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 1.5 + Math.random() * 1000,
        this.reconnectDelayMax
      );
    });

    this.socket.on('reconnect', (attempt: number) => {
      logger.info('[Socket] Reconnected', { attempt });
      // Re-subscribe to all rooms
      this.resubscribeAll();
    });

    this.socket.on('reconnect_failed', () => {
      logger.error('[Socket] Reconnection failed after max attempts');
      // Could emit a global event or show notification here
      this.emit('connection:failed');
    });

    this.socket.on('connect_error', (error: Error) => {
      this.reconnectAttempts++;
      logger.error('[Socket] Connection error', { message: error.message });
    });

    this.socket.on('error', (error: Error) => {
      logger.error('[Socket] Error', { error });
    });

    return this.socket;
  }

  /**
   * Emit a global event for connection failures
   */
  private emit(event: string): void {
    this.socket?.emit(event);
  }

  /**
   * Rejoin all previously subscribed rooms and restore callbacks after reconnection
   */
  private resubscribeAll(): void {
    // Rejoin all rooms
    this.subscribedRooms.forEach((room) => {
      if (room.startsWith('kitchen:')) {
        const storeId = room.replace('kitchen:', '');
        this.socket?.emit('join:kitchen', { storeId });
        logger.info('[Socket] Rejoined kitchen room', { storeId });
      }
    });

    // Re-register all tracked callbacks
    this.subscribedCallbacks.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
        logger.info('[Socket] Restored callback', { event });
      });
    });
  }

  /**
   * Track subscribed room for reconnection
   */
  private trackRoom(room: string): void {
    this.subscribedRooms.add(room);
  }

  /**
   * Untrack unsubscribed room
   */
  private untrackRoom(room: string): void {
    this.subscribedRooms.delete(room);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Get current socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Join kitchen room for real-time updates
   */
  joinKitchen(storeId: string): void {
    const room = `kitchen:${storeId}`;
    this.socket?.emit('join:kitchen', { storeId });
    this.trackRoom(room);
    logger.info('[Socket] Joined kitchen room', { storeId });
  }

  /**
   * Leave kitchen room
   */
  leaveKitchen(storeId: string): void {
    const room = `kitchen:${storeId}`;
    this.socket?.emit('leave:kitchen', { storeId });
    this.untrackRoom(room);
    logger.info('[Socket] Left kitchen room', { storeId });
  }

  /**
   * Update order status via WebSocket
   */
  updateOrderStatus(orderId: string, status: string, storeId: string): void {
    this.socket?.emit('order:update', { orderId, status, storeId });
  }

  /**
   * Subscribe to new orders
   */
  onNewOrder(callback: (order: unknown) => void): () => void {
    this.socket?.on('order:new', callback);
    this.trackCallback('order:new', callback);
    return () => {
      this.socket?.off('order:new', callback);
      this.untrackCallback('order:new', callback);
    };
  }

  /**
   * Subscribe to order updates
   */
  onOrderUpdated(callback: (order: unknown) => void): () => void {
    this.socket?.on('order:updated', callback);
    this.trackCallback('order:updated', callback);
    return () => {
      this.socket?.off('order:updated', callback);
      this.untrackCallback('order:updated', callback);
    };
  }

  /**
   * Subscribe to order completed
   */
  onOrderCompleted(callback: (orderId: string) => void): () => void {
    this.socket?.on('order:completed', callback);
    this.trackCallback('order:completed', callback);
    return () => {
      this.socket?.off('order:completed', callback);
      this.untrackCallback('order:completed', callback);
    };
  }

  /**
   * Subscribe to kitchen stats updates
   */
  onKitchenStats(callback: (stats: unknown) => void): () => void {
    this.socket?.on('kitchen:stats', callback);
    this.trackCallback('kitchen:stats', callback);
    return () => {
      this.socket?.off('kitchen:stats', callback);
      this.untrackCallback('kitchen:stats', callback);
    };
  }

  /**
   * Track callback for reconnection restoration
   */
  private trackCallback(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.subscribedCallbacks.has(event)) {
      this.subscribedCallbacks.set(event, new Set());
    }
    this.subscribedCallbacks.get(event)!.add(callback);
  }

  /**
   * Untrack callback
   */
  private untrackCallback(event: string, callback: (...args: unknown[]) => void): void {
    this.subscribedCallbacks.get(event)?.delete(callback);
  }
}

// Singleton instance
export const socketManager = new SocketManager();
