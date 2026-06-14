/**
 * OfflineOrderQueue — buffers socket order events during network disconnection
 * and replays them on reconnect so no events are silently lost.
 *
 * Key behaviors:
 * - Events are stored in AsyncStorage keyed by enqueue timestamp so FIFO order is preserved
 * - Queue is bounded to MAX_QUEUE_SIZE (100) to prevent memory bloat
 * - Events older than MAX_EVENT_AGE_MS (1 hour) are discarded on each operation
 * - On reconnect: replay all buffered events in insertion order, then clear
 * - On fresh connect: clear the queue (server sends fresh initial state)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OrderEvent } from '../../types/orders';
import { devLog, devWarn } from '../../utils/devLog';

const QUEUE_KEY = 'offline_order_queue';
const MAX_QUEUE_SIZE = 500;
const MAX_EVENT_AGE_MS = 60 * 60 * 1000; // 1 hour

export interface QueuedEvent {
  /** Monotonic timestamp used as storage key — also serves as insertion order */
  enqueuedAt: number;
  event: OrderEvent;
}

class OfflineOrderQueue {
  private isBuffering = false;
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener(): void {
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const wasBuffering = this.isBuffering;
      this.isBuffering = !(state.isConnected ?? false);

      if (wasBuffering && !this.isBuffering) {
        devLog('[OrderQueue] Network back online — call replayBufferedEvents() to flush');
      }
    });
  }

  /** Returns true when the device is offline and buffering should be active. */
  isOffline(): boolean {
    return this.isBuffering;
  }

  async enqueue(event: OrderEvent): Promise<void> {
    if (!this.isBuffering) return;

    try {
      const queue = await this.loadQueue();

      // Discard events older than MAX_EVENT_AGE_MS
      const cutoff = Date.now() - MAX_EVENT_AGE_MS;
      const filtered = queue.filter((q) => q.enqueuedAt >= cutoff);

      const entry: QueuedEvent = {
        enqueuedAt: Date.now(),
        event,
      };

      filtered.push(entry);

      // Enforce max size — drop oldest if over limit
      const overflow = filtered.length - MAX_QUEUE_SIZE;
      if (overflow > 0) {
        devWarn(`[OrderQueue] Dropping ${overflow} oldest events (queue limit: ${MAX_QUEUE_SIZE})`);
        filtered.splice(0, overflow);
      }

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
      devLog(
        `[OrderQueue] Buffered event: ${event.type} for order ${event.orderId} (queue size: ${filtered.length})`
      );
    } catch (error) {
      devWarn('[OrderQueue] Failed to enqueue event:', error);
    }
  }

  /**
   * Returns all buffered events sorted by enqueue timestamp (FIFO), with
   * expired events (< 1 hour old) already stripped.
   */
  async dequeueAll(): Promise<OrderEvent[]> {
    try {
      const queue = await this.loadQueue();
      const cutoff = Date.now() - MAX_EVENT_AGE_MS;
      const valid = queue.filter((q) => q.enqueuedAt >= cutoff);
      valid.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
      return valid.map((q) => q.event);
    } catch (error) {
      devWarn('[OrderQueue] Failed to dequeue events:', error);
      return [];
    }
  }

  /** Clears the entire queue. */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
      devLog('[OrderQueue] Queue cleared');
    } catch (error) {
      devWarn('[OrderQueue] Failed to clear queue:', error);
    }
  }

  /** Returns the current number of buffered events (expired events excluded). */
  async getCount(): Promise<number> {
    try {
      const queue = await this.loadQueue();
      const cutoff = Date.now() - MAX_EVENT_AGE_MS;
      return queue.filter((q) => q.enqueuedAt >= cutoff).length;
    } catch {
      return 0;
    }
  }

  private async loadQueue(): Promise<QueuedEvent[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? (JSON.parse(raw) as QueuedEvent[]) : [];
    } catch {
      return [];
    }
  }

  /** Fetches current network state synchronously (for callers that need immediate awareness). */
  async isDeviceOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch {
      return true;
    }
  }

  /** Cleanup — call when socket service is torn down. */
  destroy(): void {
    this.netInfoUnsubscribe?.();
    this.netInfoUnsubscribe = null;
  }
}

export const offlineOrderQueue = new OfflineOrderQueue();
export default offlineOrderQueue;
