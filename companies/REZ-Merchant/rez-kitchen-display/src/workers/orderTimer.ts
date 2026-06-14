import { TimerEvent } from '../types';

/**
 * Timer callback type
 */
export type TimerCallback = (event: TimerEvent) => void;

/**
 * Order timer configuration
 */
interface TimerConfig {
  tickIntervalMs: number;
  delayCheckIntervalMs: number;
  delayThresholdMs: number;
  warningThresholdMs: number;
}

/**
 * Default timer configuration
 */
const DEFAULT_CONFIG: TimerConfig = {
  tickIntervalMs: 1000, // 1 second
  delayCheckIntervalMs: 10000, // 10 seconds
  delayThresholdMs: 15 * 60 * 1000, // 15 minutes
  warningThresholdMs: 12 * 60 * 1000, // 12 minutes (3 min before delay)
};

/**
 * Order timer state
 */
interface OrderTimerState {
  orderId: string;
  startTime: Date;
  lastElapsed: number;
  warned: boolean;
}

/**
 * Order timer worker for tracking cooking times
 * This worker runs in the main process and checks order times periodically
 */
export class OrderTimer {
  private callback: TimerCallback;
  private config: TimerConfig;
  private orderTimers: Map<string, OrderTimerState> = new Map();
  private tickInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private tickCount: number = 0;

  constructor(callback: TimerCallback, config?: Partial<TimerConfig>) {
    this.callback = callback;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the timer worker
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.tickCount = 0;

    // Start tick interval
    this.tickInterval = setInterval(() => {
      this.tick();
    }, this.config.tickIntervalMs);

    console.log('[OrderTimer] Started');
  }

  /**
   * Stop the timer worker
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }

    this.orderTimers.clear();
    console.log('[OrderTimer] Stopped');
  }

  /**
   * Main tick function - runs every tickIntervalMs
   */
  private tick(): void {
    this.tickCount++;

    // Process all tracked orders
    for (const [orderId, state] of this.orderTimers) {
      const elapsed = Date.now() - state.startTime.getTime();

      // Emit tick event every 10 seconds (to update display)
      if (this.tickCount % 10 === 0) {
        this.emitEvent({
          type: 'tick',
          orderId,
          elapsedTime: elapsed,
        });
      }

      // Check for delay warning (3 minutes before threshold)
      if (!state.warned && elapsed >= this.config.warningThresholdMs) {
        this.emitEvent({
          type: 'delay_warning',
          orderId,
          elapsedTime: elapsed,
          message: `Order ${orderId} is taking longer than expected`,
        });
        state.warned = true;
      }

      state.lastElapsed = elapsed;
    }

    // Periodic cleanup of old timers
    if (this.tickCount % 60 === 0) {
      this.cleanup();
    }
  }

  /**
   * Emit timer event
   */
  private emitEvent(event: TimerEvent): void {
    try {
      this.callback(event);
    } catch (error) {
      console.error('[OrderTimer] Error in callback:', error);
    }
  }

  /**
   * Register a new order with the timer
   */
  registerOrder(orderId: string, createdAt: Date): void {
    if (this.orderTimers.has(orderId)) {
      return;
    }

    this.orderTimers.set(orderId, {
      orderId,
      startTime: createdAt,
      lastElapsed: 0,
      warned: false,
    });

    console.log(`[OrderTimer] Registered order ${orderId}`);
  }

  /**
   * Start tracking time for an order (when cooking starts)
   */
  startOrderTimer(orderId: string): void {
    const state = this.orderTimers.get(orderId);
    if (state) {
      // Reset the start time to now
      state.startTime = new Date();
      state.warned = false;
      state.lastElapsed = 0;
      console.log(`[OrderTimer] Started timing order ${orderId}`);
    }
  }

  /**
   * Unregister an order from the timer
   */
  unregisterOrder(orderId: string): void {
    const deleted = this.orderTimers.delete(orderId);
    if (deleted) {
      console.log(`[OrderTimer] Unregistered order ${orderId}`);

      this.emitEvent({
        type: 'order_completed',
        orderId,
        elapsedTime: 0,
      });
    }
  }

  /**
   * Get elapsed time for an order in milliseconds
   */
  getElapsedTime(orderId: string): number {
    const state = this.orderTimers.get(orderId);
    if (!state) {
      return 0;
    }
    return Date.now() - state.startTime.getTime();
  }

  /**
   * Get elapsed time formatted as MM:SS
   */
  getFormattedTime(orderId: string): string {
    const elapsed = this.getElapsedTime(orderId);
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get all active order timers
   */
  getActiveTimers(): Map<string, OrderTimerState> {
    return new Map(this.orderTimers);
  }

  /**
   * Cleanup stale timers (old completed orders)
   */
  private cleanup(): void {
    const threshold = 60 * 60 * 1000; // 1 hour
    const now = Date.now();

    for (const [orderId, state] of this.orderTimers) {
      const age = now - state.startTime.getTime();
      if (age > threshold) {
        this.orderTimers.delete(orderId);
        console.log(`[OrderTimer] Cleaned up stale timer for order ${orderId}`);
      }
    }
  }

  /**
   * Check if an order is overdue
   */
  isOverdue(orderId: string): boolean {
    const elapsed = this.getElapsedTime(orderId);
    return elapsed > this.config.delayThresholdMs;
  }

  /**
   * Get time remaining until delay threshold
   */
  getTimeUntilDelay(orderId: string): number {
    const elapsed = this.getElapsedTime(orderId);
    return Math.max(0, this.config.delayThresholdMs - elapsed);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TimerConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[OrderTimer] Configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): TimerConfig {
    return { ...this.config };
  }
}

/**
 * Helper to format milliseconds as MM:SS or HH:MM:SS
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Helper to calculate progress percentage
 */
export function calculateProgress(elapsed: number, estimated: number): number {
  if (estimated <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((elapsed / estimated) * 100));
}
