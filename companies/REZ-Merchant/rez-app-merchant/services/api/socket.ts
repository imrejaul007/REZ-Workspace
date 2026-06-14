import { io, Socket } from 'socket.io-client';
import { storageService } from '../storage';
import { offlineOrderQueue } from './orderQueue';
import { API_CONFIG } from '../../config/api';
import { devLog, devWarn } from '../../utils/devLog';
import { logger } from '../../utils/logger';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketConnectionState,
  SocketStats,
} from '../../types/socket';

const SOCKET_URL = API_CONFIG.SOCKET_URL;
const SOCKET_TIMEOUT = API_CONFIG.SOCKET_TIMEOUT;

class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionState: SocketConnectionState = 'disconnected';
  private stats: SocketStats = {
    connectionUptime: 0,
    messagesReceived: 0,
    messagesSent: 0,
    reconnectionCount: 0,
    averageLatency: 0,
    subscriptionCount: 0,
  };
  private listeners: Map<string, Function[]> = new Map();
  private connectionStartTime: number = 0;
  private pingInterval: unknown = null;
  private latencyMeasurements: number[] = [];
  private hasConnectedBefore = false;
  // G-MA-C07/C11: Buffer outbound emits that arrive while the socket is
  // disconnected so SocketContext.emit() has somewhere to park them. Flushed
  // on the next successful 'connect'.
  private eventQueue: Array<{ event: string; args: unknown[] }> = [];

  // Initialize socket connection
  async connect(): Promise<void> {
    // Don't create a new socket if one is already connected or connecting
    if (this.socket?.connected || this.connectionState === 'connecting') {
      return;
    }

    // Clean up any existing socket before creating a new one
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    try {
      const token = await storageService.getAuthToken();
      if (!token) {
        // Silently fail if no token - WebSocket is optional
        this.connectionState = 'disconnected';
        return;
      }

      devLog(`📡 [Socket] Attempting to connect to: ${SOCKET_URL}`);

      this.connectionState = 'connecting';

      // PERF-4 + PERF-8:
      //   - Native RN has real WebSocket — drop the 'polling' fallback so a
      //     shaky connection surfaces as a real disconnect instead of
      //     silently degrading to long-polling (≈25KB/heartbeat, high power
      //     draw). Keep polling as a graceful fallback on web.
      //   - FIXED: Increased reconnection attempts from 3 to 10 for mobile reliability
      //   - Mobile networks experience brief disconnects; 3 attempts was insufficient
      const isWeb =
        typeof window !== 'undefined' &&
        typeof (window as unknown as { document: unknown }).document !== 'undefined';
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
        transports: isWeb ? ['websocket', 'polling'] : ['websocket'],
        timeout: SOCKET_TIMEOUT,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10, // FIXED: Was 3, increased for mobile reliability
        reconnectionDelayMax: 60000, // FIXED: Was 30000, extended max delay
        autoConnect: true,
      });

      // Connection timeout guard: if the socket hasn't connected within 10 seconds,
      // log a warning. This helps diagnose misconfigured EXPO_PUBLIC_SOCKET_URL
      // (e.g. pointing at rez-merchant-service instead of the monolith).
      const connectionTimeoutMs = 10000;
      const connectionTimeout = setTimeout(() => {
        if (this.connectionState !== 'connected') {
          const msg = `[Socket] Connection timeout after ${connectionTimeoutMs}ms — check EXPO_PUBLIC_SOCKET_URL points to the monolith (not rez-merchant-service). Current URL: ${SOCKET_URL}`;
          devWarn(msg);
          // Also log in production so operators can catch misconfigured env vars
          logger.warn(msg);
        }
      }, connectionTimeoutMs);

      // Clear the timeout once the socket connects or errors
      this.socket.once('connect', () => clearTimeout(connectionTimeout));
      this.socket.once('connect_error', () => clearTimeout(connectionTimeout));

      this.setupEventListeners();
      this.connectionStartTime = Date.now();

      // CRIT-05 FIX: Startup handshake validation.
      // After connecting, send a ping and wait for pong within 5 seconds.
      // If no pong arrives, the socket is connected but not receiving — likely
      // pointing at the wrong server (e.g. rez-merchant-service instead of monolith).
      // Gracefully disable socket-dependent features rather than running degraded.
      this.socket.once('connect', () => {
        const handshakeStart = Date.now();
        const handshakeTimeout = setTimeout(() => {
          const msg = `[Socket] Handshake timeout — no pong within 5s. Socket may be connected to the wrong server (expected monolith Socket.IO). Disabling socket features.`;
          devWarn(msg);
          logger.warn(msg);
          // Emit a degraded-mode event so consuming components can fall back to polling
          this.emitToListeners('connection-status', 'degraded');
        }, 5000);

        this.socket!.once('pong', () => {
          clearTimeout(handshakeTimeout);
          const latency = Date.now() - handshakeStart;
          devLog(`✅ [Socket] Handshake OK — pong received in ${latency}ms`);
        });

        // Emit ping — the server responds with 'pong'
        (this.socket as unknown as Socket<ServerToClientEvents, ClientToServerEvents>).emit(
          'ping',
          Date.now()
        );
      });
    } catch (error) {
      // Silently handle connection errors - WebSocket is optional
      devWarn('⚠️ [Socket] Connection failed (non-critical):', error);
      this.connectionState = 'error';
      // Don't throw - allow app to continue without WebSocket
    }
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.connectionState = 'disconnected';
    this.stats.connectionUptime = Date.now() - this.connectionStartTime;
  }

  // Setup socket event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      devLog('🟢 [Socket] Connected successfully');
      this.connectionState = 'connected';
      this.startPingInterval();

      if (!this.hasConnectedBefore) {
        // Fresh connect — server sends initial state, no replay needed
        this.hasConnectedBefore = true;
        offlineOrderQueue.clear();
      }

      this.emitToListeners('connection-status', 'connected');
      // G-MA-C07/C11: Drain any emits that were buffered while disconnected.
      this.flushQueue();
      // Re-join merchant dashboard on every connect (handles initial connect + reconnects)
      // G-MA-H14/H19/H41: Also re-subscribe to all socket rooms so events flow again.
      this.resubscribeAll().catch((err) => {
        devWarn('[Socket] Dashboard join failed:', err);
        this.emitToListeners('connection-error', 'Failed to join merchant dashboard');
      });
    });

    this.socket.on('disconnect', (reason) => {
      devLog('🔴 [Socket] Disconnected:', reason);
      this.connectionState = 'disconnected';
      this.stopPingInterval();
      this.emitToListeners('connection-status', 'disconnected');
    });

    this.socket.on('connect_error', (error) => {
      const msg = `[Socket] Connection error — URL: ${SOCKET_URL} — ${error.message || error}`;
      devWarn('⚠️', msg);
      // Log in production too so misconfigured EXPO_PUBLIC_SOCKET_URL is visible
      logger.warn('[Socket] connect_error (non-critical):', msg);
      this.connectionState = 'error';
      this.emitToListeners('connection-error', error);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.socket as unknown).on('reconnect', (attemptNumber: number) => {
      devLog('🟡 [Socket] Reconnected after', attemptNumber, 'attempts');
      this.stats.reconnectionCount++;
      this.stats.lastReconnectionAt = new Date().toISOString();
      this.emitToListeners('reconnected', attemptNumber);
      // REZ-025: replay buffered order events that arrived during disconnection
      this.replayBufferedOrderEvents();
      // G-MA-H14/H19/H41: Re-establish all socket room subscriptions after reconnect.
      // Server clears room memberships on disconnect, so without this the merchant
      // receives no events until the app fully reloads.
      this.resubscribeAll().catch((err) => {
        devWarn('[Socket] Reconnect resubscription failed:', err);
      });
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.socket as unknown).on('reconnect_attempt', (attemptNumber: number) => {
      // Only log first attempt to reduce spam
      if (attemptNumber === 1) {
        devLog('🟡 [Socket] Attempting reconnection...');
      }
      this.connectionState = 'reconnecting';
      this.emitToListeners('reconnecting', attemptNumber);
    });

    // Dashboard data events
    this.socket.on('initial-dashboard-data', (data) => {
      devLog('📊 Received initial dashboard data');
      this.stats.messagesReceived++;
      this.emitToListeners('initial-dashboard-data', data);
    });

    this.socket.on('metrics-updated', (data) => {
      devLog('📈 Metrics updated');
      this.stats.messagesReceived++;
      this.emitToListeners('metrics-updated', data);
    });

    this.socket.on('overview-updated', (data) => {
      devLog('📋 Overview updated');
      this.stats.messagesReceived++;
      this.emitToListeners('overview-updated', data);
    });

    // Real-time events
    this.socket.on('order-event', (event) => {
      devLog('🛒 Order event:', event.type);
      this.stats.messagesReceived++;
      // REZ-025: buffer event if device is offline so it can be replayed on reconnect
      if (offlineOrderQueue.isOffline()) {
        offlineOrderQueue
          .enqueue(event)
          .catch((e) => console.warn('[OfflineQueue] Failed to enqueue order event:', e));
      } else {
        this.emitToListeners('order-event', event);
      }
    });

    this.socket.on('cashback-event', (event) => {
      devLog('💰 Cashback event:', event.type);
      this.stats.messagesReceived++;
      this.emitToListeners('cashback-event', event);
    });

    this.socket.on('product-event', (event) => {
      devLog('📦 Product event:', event.type);
      this.stats.messagesReceived++;
      this.emitToListeners('product-event', event);
    });

    // System notifications
    this.socket.on('system-notification', (notification) => {
      devLog('🔔 System notification:', notification.type);
      this.stats.messagesReceived++;
      this.emitToListeners('system-notification', notification);
    });

    // Live metrics (emitted every 30s to metrics-${merchantId} subscribers)
    this.socket.on('live-metrics', (data) => {
      this.stats.messagesReceived++;
      this.emitToListeners('live-metrics', data);
    });

    // Dashboard-level event wrapper (order/cashback/product events routed via dashboard room)
    this.socket.on('dashboard-event', (event) => {
      this.stats.messagesReceived++;
      // Re-emit with the typed event name so specific listeners also fire
      const typeToEvent: Record<string, string> = {
        order_created: 'order-event',
        order_updated: 'order-event',
        cashback_created: 'cashback-event',
        cashback_updated: 'cashback-event',
        product_updated: 'product-event',
        metrics_updated: 'metrics-updated',
      };
      const typedEvent = typeToEvent[event?.type];
      if (typedEvent) this.emitToListeners(typedEvent, event);
      this.emitToListeners('dashboard-event', event);
    });

    // Bulk operation events
    this.socket.on('bulk-operation-progress', (data) => {
      devLog('⚙️ Bulk operation progress:', data.progress.percentage + '%');
      this.stats.messagesReceived++;
      this.emitToListeners('bulk-operation-progress', data);
    });

    this.socket.on('bulk-operation-completed', (data) => {
      devLog('✅ Bulk operation completed:', data.type);
      this.stats.messagesReceived++;
      this.emitToListeners('bulk-operation-completed', data);
    });

    // Web QR order events (from web-ordering channel)
    this.socket.on('web-order:new', async (data) => {
      devLog('🌐 [Socket] New web QR order:', data.orderNumber);
      this.stats.messagesReceived++;
      // REZ-025: buffer web QR orders when offline
      if (offlineOrderQueue.isOffline()) {
        const merchantId = (await storageService.getMerchantId()) || '';
        offlineOrderQueue
          .enqueue({
            id: data.orderId,
            orderId: data.orderId,
            type: 'created',
            data: { id: data.orderId, orderNumber: data.orderNumber } as unknown as Parameters<
              typeof offlineOrderQueue.enqueue
            >[0]['data'],
            timestamp: new Date().toISOString(),
            merchantId,
          })
          .catch((e) => console.warn('[Socket] emitToListeners failed:', e));
        return;
      }
      this.emitToListeners('web-order:new', data);
    });

    this.socket.on('web-order:cancelled', (data) => {
      devLog('🌐 [Socket] Web QR order cancelled:', data.orderNumber);
      this.stats.messagesReceived++;
      this.emitToListeners('web-order:cancelled', data);
    });

    this.socket.on('web-order:status-update', (data) => {
      devLog('🌐 [Socket] Web QR order status update:', data.orderNumber, '→', data.status);
      this.stats.messagesReceived++;
      this.emitToListeners('web-order:status-update', data);
    });

    this.socket.on('parcel-request', (data) => {
      devLog('🌐 [Socket] Parcel request:', data.orderNumber);
      this.stats.messagesReceived++;
      this.emitToListeners('parcel-request', data);
    });

    this.socket.on('waiter-call', (data) => {
      devLog('🌐 [Socket] Waiter call:', data.tableNumber, data.reason);
      this.stats.messagesReceived++;
      this.emitToListeners('waiter-call', data);
    });

    // Merchant account status changes (from admin actions: approve/reject/suspend/reactivate)
    this.socket.on('merchant-status-changed', (data) => {
      devLog('🏪 [Socket] Merchant status changed:', data.status);
      this.stats.messagesReceived++;
      this.emitToListeners('merchant-status-changed', data);
    });

    this.socket.on('merchant_approved', (data) => {
      devLog('🏪 [Socket] Merchant approved');
      this.stats.messagesReceived++;
      this.emitToListeners('merchant_approved', data);
    });

    this.socket.on('merchant_rejected', (data) => {
      devLog('🏪 [Socket] Merchant rejected:', data.reason);
      this.stats.messagesReceived++;
      this.emitToListeners('merchant_rejected', data);
    });

    this.socket.on('merchant_suspended', (data) => {
      devLog('🏪 [Socket] Merchant suspended:', data.reason);
      this.stats.messagesReceived++;
      this.emitToListeners('merchant_suspended', data);
    });

    this.socket.on('merchant_reactivated', (data) => {
      devLog('🏪 [Socket] Merchant reactivated');
      this.stats.messagesReceived++;
      this.emitToListeners('merchant_reactivated', data);
    });

    // Feature flag changes (from admin toggle — instant propagation)
    this.socket.on('feature-flag-changed', (data) => {
      devLog('🏴 [Socket] Feature flag changed:', data.flagKey, '→', data.enabled);
      this.stats.messagesReceived++;
      this.emitToListeners('feature-flag-changed', data);
    });

    // Stuck order alerts (from background job — orders not progressing)
    this.socket.on('ORDER_STUCK_ALERT', (data) => {
      devLog('🚨 [Socket] Stuck order alert:', data.type, data.orderNumber);
      this.stats.messagesReceived++;
      this.emitToListeners('ORDER_STUCK_ALERT', data);
    });

    // Coin redemption notification
    this.socket.on(
      'payment:coins_redeemed',
      (data: {
        billId: string;
        userId: string;
        coinsUsed: number;
        rupeeValue: number;
        billAmount: number;
        timestamp: string;
      }) => {
        devLog('💰 Coins redeemed:', data.coinsUsed, 'coins = ₹' + data.rupeeValue);
        this.stats.messagesReceived++;
        this.emitToListeners('payment:coins_redeemed', data);
      }
    );

    // MISS-01/03: Refund events from payment-service via monolith Socket.IO
    this.socket.on(
      'refund-event',
      (data: {
        id: string;
        orderId: string;
        orderNumber?: string;
        paymentId: string;
        refundId: string;
        amount: number;
        status: 'refund_processed' | 'refund_failed' | 'refund_disputed';
        timestamp: string;
      }) => {
        devLog('💸 Refund event:', data.status, 'amount:', data.amount);
        this.stats.messagesReceived++;
        this.emitToListeners('refund-event', data);
      }
    );

    // MISS-02: Settlement credited event from wallet-service via monolith Socket.IO
    this.socket.on(
      'wallet-event',
      (data: {
        id: string;
        orderId: string;
        orderNumber?: string;
        amount: number;
        platformFee: number;
        netAmount: number;
        transactionId: string;
        type: 'settlement_credited';
        timestamp: string;
      }) => {
        devLog('🏦 Wallet event:', data.type, 'amount:', data.amount);
        this.stats.messagesReceived++;
        this.emitToListeners('wallet-event', data);
      }
    );

    // Ping/pong for latency measurement
    this.socket.on('pong', (timestamp) => {
      const latency = Date.now() - timestamp;
      this.latencyMeasurements.push(latency);

      // Keep only last 10 measurements
      if (this.latencyMeasurements.length > 10) {
        this.latencyMeasurements.shift();
      }

      // Calculate average latency
      this.stats.averageLatency =
        this.latencyMeasurements.reduce((a, b) => a + b, 0) / this.latencyMeasurements.length;
    });

    // Error handling
    this.socket.on('error', (error) => {
      devWarn('⚠️ [Socket] Error (non-critical):', error);
      this.emitToListeners('socket-error', error);
    });
  }

  // Join merchant dashboard for real-time updates
  async joinMerchantDashboard(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('join-merchant-dashboard', merchantId);
    this.stats.messagesSent++;
    devLog('📊 Joined merchant dashboard for real-time updates');
  }

  // G-MA-H14/H19/H41: Public version of resubscribeAll so callers (e.g. SocketContext)
  // can force a re-subscription at any time.
  async forceResubscribeAll(): Promise<void> {
    await this.resubscribeAll();
  }

  // G-MA-H14/H19/H41: Re-subscribe to all channels after a reconnect.
  // Without this, the socket reuses the same connection but the server-side
  // room subscriptions were cleared on disconnect, so the merchant misses all
  // subsequent events until a full page reload.
  async resubscribeAll(): Promise<void> {
    await this.joinMerchantDashboard();
    await this.subscribeToMetrics();
    await this.subscribeToOrders();
    await this.subscribeToCashback();
    await this.subscribeToProducts();
    await this.subscribeToNotifications();
  }

  async leaveMerchantDashboard(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('leave-merchant-dashboard', merchantId);
    this.stats.messagesSent++;
    devLog('📊 Left merchant dashboard');
  }

  async subscribeToMetrics(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('subscribe-metrics', merchantId);
    this.stats.messagesSent++;
    this.stats.subscriptionCount++;
  }

  async subscribeToOrders(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('subscribe-orders', merchantId);
    this.stats.messagesSent++;
    this.stats.subscriptionCount++;
  }

  async subscribeToCashback(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('subscribe-cashback', merchantId);
    this.stats.messagesSent++;
    this.stats.subscriptionCount++;
  }

  async subscribeToProducts(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('subscribe-products', merchantId);
    this.stats.messagesSent++;
    this.stats.subscriptionCount++;
  }

  async subscribeToNotifications(): Promise<void> {
    const merchantId = await storageService.getMerchantId();
    if (!merchantId || !this.socket) return;
    this.socket.emit('subscribe-notifications', merchantId);
    this.stats.messagesSent++;
    this.stats.subscriptionCount++;
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      // Remove all listeners for this event
      this.listeners.delete(event);
      return;
    }
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Remove all listeners for an event
  offAll(event: string): void {
    this.listeners.delete(event);
  }

  // Emit an event to the server
  emit(event: string, ...args: unknown[]): void {
    if (this.socket && this.socket.connected) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.socket as unknown).emit(event, ...(args as unknown[]));
      this.stats.messagesSent++;
    } else {
      devWarn(`[Socket] Cannot emit "${event}" — socket not connected`);
    }
  }

  private emitToListeners(event: string, data): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          if (__DEV__) logger.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  // Ping for connection testing
  private startPingInterval(): void {
    // G-MA-H12: Clear any pre-existing interval before starting a new one so
    // reconnects don't accumulate multiple timers (each reconnect previously
    // added another setInterval, causing ping storms).
    this.stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping', Date.now());
        this.stats.messagesSent++;
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // G-MA-C07: Expose the underlying socket.io client so thin wrappers
  // (e.g. SocketContext.emit) can check readiness before emitting.
  public getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  // G-MA-C11: Queue an emit that arrived while the socket was disconnected.
  // Buffer is capped to prevent unbounded memory growth if the socket never
  // reconnects.
  public queueEvent(event: string, ...args: unknown[]): void {
    this.eventQueue.push({ event, args });
    if (this.eventQueue.length > 100) this.eventQueue.shift();
  }

  // G-MA-C07/C11: Drain the buffered events after a (re)connect.
  private flushQueue(): void {
    if (!this.socket?.connected) return;
    while (this.eventQueue.length > 0) {
      const q = this.eventQueue.shift()!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.emit(q.event as unknown, ...(q.args as unknown[]));
      this.stats.messagesSent++;
    }
  }

  // REZ-025: replay buffered order events that arrived during disconnection
  private async replayBufferedOrderEvents(): Promise<void> {
    const events = await offlineOrderQueue.dequeueAll();
    if (events.length === 0) return;

    devLog(`[Socket] Replaying ${events.length} buffered order event(s)`);
    for (const event of events) {
      this.emitToListeners('order-event', event);
    }
    devLog('[Socket] Buffered order events replayed and queue cleared');
  }

  // Get connection state
  getConnectionState(): SocketConnectionState {
    return this.connectionState;
  }

  // Get connection statistics
  getStats(): SocketStats {
    return {
      ...this.stats,
      connectionUptime:
        this.connectionState === 'connected'
          ? Date.now() - this.connectionStartTime
          : this.stats.connectionUptime,
    };
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Auto-reconnect logic
  async ensureConnection(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }
}

// Create and export singleton instance
export const socketService = new SocketService();
export default socketService;
