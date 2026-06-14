// @ts-nocheck
/**
 * Socket.IO real-time client service for the REZ consumer app.
 *
 * Provides a module-level singleton that wraps the SocketContext for use in
 * non-React contexts (stores, services, background tasks). The actual socket
 * lifecycle is managed by SocketProvider — this service exposes convenience
 * listeners for the three consumer-facing real-time events.
 *
 * Backend reference: rez-backend-master/src/config/socketSetup.ts
 * - Connects to `user-{userId}` room automatically on JWT auth
 * - Events emitted: order:status_updated, cashback:*, streak:*
 *
 * Transport: websocket first, polling fallback (matches backend config).
 * Auth: JWT token injected via socket.handshake.auth.token on every connect.
 */

import { Platform } from 'react-native';
import {
  CashbackCreditedPayload,
  StreakMilestonePayload,
  OrderStatusUpdatePayload,
  CashbackCreditedCallback,
  StreakMilestoneCallback,
  OrderStatusUpdateCallback,
} from '@/types/socket.types';

// Lazy import — socket.io-client is ~100KB, deferred until first use.
type Socket = import('socket.io-client').Socket;
let getSocketConstructor: (() => Promise<typeof import('socket.io-client')>) | null = null;

// ── URL resolution ─────────────────────────────────────────────────────────────

function resolveSocketUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!raw) {
    if (__DEV__) {
      logger.warn('[SocketService] EXPO_PUBLIC_API_BASE_URL not set — socket disabled');
    }
    return null;
  }

  let base = raw.replace(/\/api\/?$/, '');

  // Android emulator: host machine is 10.0.2.2, not localhost
  if (__DEV__ && Platform.OS === 'android' && (base.includes('localhost') || base.includes('127.0.0.1'))) {
    base = base.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return base;
}

// ── Exponential back-off helpers ──────────────────────────────────────────────

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

function getBackoffDelay(attempt: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
}

// ── Singleton state ────────────────────────────────────────────────────────────

interface SocketServiceState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

type StateListener = (state: SocketServiceState) => void;

class SocketServiceImpl {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private explicitlyDisconnected = false;

  // Subscription sets (function references) — cleaned up on disconnect
  private orderListeners = new Set<OrderStatusUpdateCallback>();
  private cashbackListeners = new Set<CashbackCreditedCallback>();
  private streakListeners = new Set<StreakMilestoneCallback>();
  private stateListeners = new Set<StateListener>();

  // ── Public: initialize / connect ───────────────────────────────────────────

  /** Call after user login with the current JWT token and userId. */
  async connect(userId: string, token: string): Promise<void> {
    if (!getSocketConstructor) {
      getSocketConstructor = async () => {
        const mod = await import('socket.io-client');
        return mod;
      };
    }

    this.userId = userId;
    this.token = token;
    this.explicitlyDisconnected = false;

    const url = resolveSocketUrl();
    if (!url) return;

    // Disconnect existing socket before re-creating
    this.destroySocket();

    try {
      const { io } = await getSocketConstructor();

      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });

      this.attachListeners();
    } catch (err) {
      this.emitError(`Failed to create socket: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Call on user logout — disconnects and clears all listeners. */
  disconnect(): void {
    this.explicitlyDisconnected = true;
    this.destroySocket();
    this.clearAllListeners();
    this.emitState({ connected: false, reconnecting: false, error: null });
  }

  // ── Public: subscribe to real-time events ───────────────────────────────────

  /**
   * Listen for order status updates.
   * The backend emits `order:status_updated` (and sub-events like `order:confirmed`,
   * `order:preparing`, etc.) to the `user-{userId}` room after the socket is
   * connected and authenticated.
   *
   * @returns Unsubscribe function — call on component unmount.
   */
  onOrderStatusUpdate(callback: OrderStatusUpdateCallback): () => void {
    this.orderListeners.add(callback);
    return () => this.orderListeners.delete(callback);
  }

  /**
   * Listen for cashback credited events.
   * The backend emits `cashback:credited` to `user-{userId}` when cashback
   * is awarded after order completion (via earningsSocketService).
   *
   * @returns Unsubscribe function.
   */
  onCashbackCredited(callback: CashbackCreditedCallback): () => void {
    this.cashbackListeners.add(callback);
    return () => this.cashbackListeners.delete(callback);
  }

  /**
   * Listen for streak milestone events.
   * The backend emits `streak:milestone` to `user-{userId}` when a user
   * reaches a daily streak milestone via the gamification service.
   *
   * @returns Unsubscribe function.
   */
  onStreakMilestone(callback: StreakMilestoneCallback): () => void {
    this.streakListeners.add(callback);
    return () => this.streakListeners.delete(callback);
  }

  /**
   * Subscribe to connection state changes.
   *
   * @returns Unsubscribe function.
   */
  onStateChange(callback: StateListener): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  /** Current connection state. */
  getState(): SocketServiceState {
    return {
      connected: this.socket?.connected ?? false,
      reconnecting: !this.socket?.connected && this.reconnectAttempt > 0,
      error: null,
    };
  }

  // ── Private: lifecycle ─────────────────────────────────────────────────────

  private attachListeners(): void {
    const sock = this.socket;
    if (!sock) return;

    sock.on('connect', () => {
      this.reconnectAttempt = 0;
      this.emitState({ connected: true, reconnecting: false, error: null });
    });

    sock.on('disconnect', (reason: string) => {
      // 'io server disconnect' means server closed the connection — client should not
      // auto-reconnect in this case (intentional server-side disconnect).
      const shouldReconnect = reason !== 'io server disconnect';
      this.emitState({ connected: false, reconnecting: shouldReconnect, error: null });
      if (shouldReconnect) {
        this.scheduleReconnect();
      }
    });

    sock.on('connect_error', (err: Error) => {
      this.emitError(err.message);
      this.scheduleReconnect();
    });

    sock.on('reconnect_attempt', (attempt: number) => {
      this.reconnectAttempt = attempt;
      this.emitState({ connected: false, reconnecting: true, error: null });
    });

    sock.on('reconnect_failed', () => {
      this.emitError('Failed to reconnect after maximum attempts');
      this.emitState({ connected: false, reconnecting: false, error: 'reconnect_failed' });
    });

    // ── Consumer-facing event listeners ──────────────────────────────────────
    sock.on('order:status_updated', (payload: OrderStatusUpdatePayload) => {
      this.orderListeners.forEach((cb) => {
        try { cb(payload); } catch { /* non-critical */ }
      });
    });

    // Sub-events for specific status transitions
    ['order:confirmed', 'order:preparing', 'order:ready', 'order:dispatched',
     'order:out_for_delivery', 'order:delivered', 'order:cancelled'].forEach((ev) => {
      sock.on(ev, (payload: OrderStatusUpdatePayload) => {
        this.orderListeners.forEach((cb) => {
          try { cb(payload); } catch { /* non-critical */ }
        });
      });
    });

    sock.on('cashback:credited', (payload: CashbackCreditedPayload) => {
      this.cashbackListeners.forEach((cb) => {
        try { cb(payload); } catch { /* non-critical */ }
      });
    });

    sock.on('streak:milestone', (payload: StreakMilestonePayload) => {
      this.streakListeners.forEach((cb) => {
        try { cb(payload); } catch { /* non-critical */ }
      });
    });
  }

  private scheduleReconnect(): void {
    if (this.explicitlyDisconnected || this.socket?.connected) return;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const delay = getBackoffDelay(this.reconnectAttempt);
    this.reconnectTimer = setTimeout(() => {
      if (!this.explicitlyDisconnected && this.userId && this.token) {
        this.connect(this.userId, this.token);
      }
    }, delay);
  }

  private destroySocket(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private clearAllListeners(): void {
    this.orderListeners.clear();
    this.cashbackListeners.clear();
    this.streakListeners.clear();
    this.reconnectAttempt = 0;
  }

  private emitState(state: SocketServiceState): void {
    this.stateListeners.forEach((cb) => {
      try { cb(state); } catch { /* non-critical */ }
    });
  }

  private emitError(msg: string): void {
    this.emitState({ connected: false, reconnecting: false, error: msg });
  }
}

// ── Module-level singleton ─────────────────────────────────────────────────────

/**
 * Real-time Socket.IO client singleton for the consumer app.
 *
 * Usage:
 * ```
 * // After user login
 * await socketService.connect(userId, accessToken);
 *
 * // Subscribe in a component or store
 * const unsub = socketService.onOrderStatusUpdate((payload) => {
 *   dispatch({ type: 'UPDATE_ORDER', payload });
 * });
 *
 * // Cleanup on logout
 * socketService.disconnect();
 * ```
 */
export const socketService: SocketServiceImpl = new SocketServiceImpl();

export type { SocketServiceState };
