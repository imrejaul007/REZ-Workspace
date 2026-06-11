import io, { Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api';
import { storageService } from './storage';
import { logger } from '../utils/logger';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private connectionUrl: string;
  // BUG-026: Callback to notify the UI when reconnection attempts are exhausted.
  private onConnectionLostCallback: (() => void) | null = null;

  constructor() {
    this.connectionUrl = API_CONFIG.SOCKET_URL;
  }

  async connect(): Promise<void> {
    if ((this.socket && this.socket.connected) || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      const token = await storageService.getAuthToken();

      this.socket = io(this.connectionUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        auth: token ? { token } : undefined,
        timeout: API_CONFIG.SOCKET_TIMEOUT,
      });

      this.setupEventListeners();

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, API_CONFIG.SOCKET_TIMEOUT);

        if (this.socket && this.socket.connected) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        this.socket?.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        this.socket?.once('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      this.isConnected = true;
      logger.info('[Admin Socket] Connected successfully');
    } catch (error) {
      this.isConnected = false;

      logger.error('[Admin Socket] Connection failed:', error);

      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      logger.info('[Admin Socket] Disconnected');
    }
  }

  // BUG-026: Allow callers to register a handler for connection exhaustion.
  onConnectionLost(callback: () => void): void {
    this.onConnectionLostCallback = callback;
  }

  isSocketConnected(): boolean {
    return this.isConnected && (this.socket ? this.socket.connected : false);
  }

  /** Returns the raw Socket.IO instance (or null before connect is called). */
  getSocket(): Socket | null {
    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected = true;
      logger.info('[Admin Socket] Connected');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      logger.info('[Admin Socket] Disconnected');
    });

    this.socket.on('connect_error', (error: any) => {
      logger.error('[Admin Socket] Connection error:', error);
    });

    // BUG-026: Fire the "connection lost" callback when socket.io exhausts all
    // reconnection attempts so the UI can show a persistent "Connection lost" banner.
    this.socket.io.on('reconnect_failed', () => {
      logger.warn('[Admin Socket] All reconnection attempts exhausted — connection lost');
      this.isConnected = false;
      if (this.onConnectionLostCallback) {
        this.onConnectionLostCallback();
      }
    });

    this.socket.on('error', (error: any) => {
      logger.error('[Admin Socket] Error:', error);
    });
  }

  // ── Backend-emitted events ─────────────────────────────────
  // The backend emits 'job:failure' to the 'admin' room (via jobTracker.ts).
  // It also emits 'sla:breach' (slaMonitorJob.ts), 'anomaly:alert'
  // (anomalyDetectionJob.ts), and various ORDER_* alerts via
  // orderSocketService.emitToAdmin().
  //
  // NOTE: The following events are NOT currently emitted by the backend and
  // need backend implementation before they will deliver data:
  //   - gmv:update          (no backend emitter exists)
  //   - merchant:alert      (no backend emitter exists)
  //   - fraud:alert         (no backend emitter exists — anomaly:alert is
  //                          the closest equivalent, emitted to 'admin-room')
  //   - queue:backlog       (no backend emitter exists)
  //   - merchant:live       (no backend emitter exists)
  // Listeners for these dead events have been removed to avoid confusion.
  // Re-add them once the corresponding backend emitters are wired up.

  onNewOrder(
    callback: (data: { orderId: string; merchantName: string; amount: number }) => void
  ): () => void {
    if (!this.socket) {
      logger.warn('[Admin Socket] Socket not initialized');
      return () => {};
    }

    // Backend emits 'order:created' (OrderSocketService) to order-specific rooms
    // and 'web-order:new' (webOrderingRoutes) to merchant rooms when a new web
    // order is placed.  The admin dashboard listens on 'order:created' which is
    // the canonical order-creation event emitted by the backend.
    this.socket.on('order:created', callback);

    return () => {
      this.socket?.off('order:created', callback);
    };
  }

  onJobFailure(
    callback: (data: {
      name: string;
      error: string;
      consecutiveFailures: number;
      timestamp: string;
    }) => void
  ): () => void {
    if (!this.socket) {
      logger.warn('[Admin Socket] Socket not initialized');
      return () => {};
    }

    this.socket.on('job:failure', callback);

    return () => {
      this.socket?.off('job:failure', callback);
    };
  }

  onSLABreach(
    callback: (data: {
      orderId: string;
      type: string;
      elapsed: number;
      threshold: number;
      timestamp: string;
    }) => void
  ): () => void {
    if (!this.socket) {
      logger.warn('[Admin Socket] Socket not initialized');
      return () => {};
    }

    // Emitted by slaMonitorJob.ts to the 'admin' room
    this.socket.on('sla:breach', callback);

    return () => {
      this.socket?.off('sla:breach', callback);
    };
  }

  onAnomalyAlert(
    callback: (data: { type: string; severity: string; message: string; timestamp: string }) => void
  ): () => void {
    if (!this.socket) {
      logger.warn('[Admin Socket] Socket not initialized');
      return () => {};
    }

    // Emitted by anomalyDetectionJob.ts to the 'admin-room' room
    this.socket.on('anomaly:alert', callback);

    return () => {
      this.socket?.off('anomaly:alert', callback);
    };
  }

  onOrderAlert(
    callback: (data: {
      type: string;
      orderId?: string;
      message: string;
      severity?: string;
      timestamp: string;
    }) => void
  ): () => void {
    if (!this.socket) {
      logger.warn('[Admin Socket] Socket not initialized');
      return () => {};
    }

    // Emitted by orderAlerts.ts / orderLifecycleJobs.ts to the 'admin' room
    this.socket.on('ORDER_ALERT', callback);
    this.socket.on('ORDER_STUCK_ALERT', callback);
    this.socket.on('ORDER_RECONCILIATION_ALERT', callback);
    this.socket.on('MERCHANT_CREDIT_FAILED', callback);
    this.socket.on('PAYMENT_AMOUNT_MISMATCH', callback);

    return () => {
      this.socket?.off('ORDER_ALERT', callback);
      this.socket?.off('ORDER_STUCK_ALERT', callback);
      this.socket?.off('ORDER_RECONCILIATION_ALERT', callback);
      this.socket?.off('MERCHANT_CREDIT_FAILED', callback);
      this.socket?.off('PAYMENT_AMOUNT_MISMATCH', callback);
    };
  }

  emit(event: string, data?: any): void {
    if (!this.socket) {
      logger.warn('[Admin Socket] Socket not initialized');
      return;
    }

    this.socket.emit(event, data);
  }
}

export const socketService = new SocketService();
export default socketService;
