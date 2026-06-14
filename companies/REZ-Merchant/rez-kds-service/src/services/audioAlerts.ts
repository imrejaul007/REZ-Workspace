/**
 * KDS Audio Alerts & Touch Optimization Service
 * Enhanced Kitchen Display System with audio and gestures
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { EventEmitter } from 'events';

// ── Audio Types ──────────────────────────────────────────────────────────────

export type AlertSound =
  | 'new_order'      // New order arrived
  | 'rush_order'     // Priority/rush order
  | 'vip_order'      // VIP customer
  | 'allergy_alert'  // Contains allergens
  | 'time_warning'   // Order taking too long
  | 'time_critical'  // Order severely delayed
  | 'order_bumped'   // Order completed
  | 'partial_bump'   // Some items done
  | 'recall'         // Recall order
  | 'station_called'; // Another station calling

export interface AudioConfig {
  enabled: boolean;
  volume: number; // 0-100
  sounds: Partial<Record<AlertSound, SoundSettings>>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
  };
}

export interface SoundSettings {
  enabled: boolean;
  file?: string; // Custom sound file
  frequency?: number; // Hz for synthesized
  duration?: number; // ms
  pattern?: 'single' | 'double' | 'triple' | 'long';
  repeat?: number;
}

// ── Order Priority ──────────────────────────────────────────────────────────

export type OrderPriority = 'normal' | 'rush' | 'vip' | 'allergy';

export interface KDSOrder {
  id: string;
  orderNumber: string;
  items: KDSItem[];
  priority: OrderPriority;
  status: 'pending' | 'in_progress' | 'ready';
  createdAt: Date;
  startedAt?: Date;
  estimatedReadyAt?: Date;
  actualReadyAt?: Date;
  prepTimeMinutes: number;
  elapsedMinutes: number;
  tableNumber?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  customerNotes?: string;
  allergyNotes?: string[];
  rush?: boolean;
  vip?: boolean;
  modifiers: string[];
}

export interface KDSItem {
  id: string;
  name: string;
  quantity: number;
  station: string;
  status: 'pending' | 'cooking' | 'done';
  notes?: string;
  modifiers: string[];
  prepTimeMinutes: number;
  imageUrl?: string;
}

// ── Gesture Types ──────────────────────────────────────────────────────────

export type GestureType =
  | 'tap'           // Select item
  | 'double_tap'    // Bump item
  | 'long_press'    // Show details
  | 'swipe_left'    // Bump station
  | 'swipe_right'   // Recall
  | 'swipe_up'      // Priority bump
  | 'swipe_down'    // Hold order
  | 'pinch'         // Zoom (for details)
  | 'rotate';       // Change view

export interface TouchEvent {
  gesture: GestureType;
  itemId?: string;
  orderId?: string;
  station?: string;
  position: { x: number; y: number };
  timestamp: Date;
}

// ── Audio Service ──────────────────────────────────────────────────────────

class KDSAudioService extends EventEmitter {
  private audioContext: AudioContext | null = null;
  private config: AudioConfig;
  private isEnabled: boolean = true;

  constructor() {
    super();
    this.config = this.getDefaultConfig();
  }

  /**
   * Initialize audio context
   */
  async initialize(): Promise<void> {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[KDS Audio] Initialized');
    }
  }

  /**
   * Get default audio configuration
   */
  private getDefaultConfig(): AudioConfig {
    return {
      enabled: true,
      volume: 70,
      sounds: {
        new_order: {
          enabled: true,
          frequency: 880,
          duration: 200,
          pattern: 'single',
        },
        rush_order: {
          enabled: true,
          frequency: 1200,
          duration: 150,
          pattern: 'triple',
        },
        vip_order: {
          enabled: true,
          frequency: 660,
          duration: 300,
          pattern: 'double',
        },
        allergy_alert: {
          enabled: true,
          frequency: 440,
          duration: 500,
          pattern: 'long',
          repeat: 3,
        },
        time_warning: {
          enabled: true,
          frequency: 550,
          duration: 100,
          pattern: 'double',
        },
        time_critical: {
          enabled: true,
          frequency: 330,
          duration: 200,
          pattern: 'long',
          repeat: 5,
        },
        order_bumped: {
          enabled: true,
          frequency: 1000,
          duration: 50,
          pattern: 'single',
        },
        partial_bump: {
          enabled: true,
          frequency: 800,
          duration: 50,
          pattern: 'double',
        },
        recall: {
          enabled: true,
          frequency: 600,
          duration: 200,
          pattern: 'triple',
        },
        station_called: {
          enabled: true,
          frequency: 700,
          duration: 100,
          pattern: 'double',
        },
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00',
      },
    };
  }

  /**
   * Update audio configuration
   */
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Enable/disable audio
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('enabled:changed', enabled);
  }

  /**
   * Set volume (0-100)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(100, volume));
  }

  /**
   * Check if in quiet hours
   */
  private isQuietHours(): boolean {
    if (!this.config.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const { start, end } = this.config.quietHours;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Play alert sound
   */
  async playAlert(alertType: AlertSound): Promise<void> {
    if (!this.isEnabled || !this.audioContext || !this.config.enabled) return;
    if (this.isQuietHours() && alertType !== 'allergy_alert') return;

    const soundConfig = this.config.sounds[alertType];
    if (!soundConfig?.enabled) return;

    const volume = this.config.volume / 100;
    const { frequency, duration, pattern, repeat } = soundConfig;

    const repeatCount = repeat || 1;
    const patternDurations: { [key: string]: number } = {
      single: 1,
      double: 2,
      triple: 3,
      long: 1,
    };

    const times = patternDurations[pattern || 'single'] * repeatCount;

    for (let i = 0; i < times; i++) {
      await this.playTone(frequency || 880, duration || 200, volume);
      if (i < times - 1) {
        await this.delay(pattern === 'long' ? 100 : 100);
      }
    }
  }

  /**
   * Play a single tone
   */
  private playTone(frequency: number, durationMs: number, volume: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.value = volume * 0.5;

      // Envelope for smooth sound
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + durationMs / 1000);

      oscillator.start(now);
      oscillator.stop(now + durationMs / 1000);

      oscillator.onended = () => resolve();
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Play custom sound file
   */
  async playCustomSound(filePath: string): Promise<void> {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const response = await fetch(filePath);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      gainNode.gain.value = this.config.volume / 100;

      source.start();
    } catch (error) {
      console.error('[KDS Audio] Failed to play custom sound:', error);
    }
  }

  /**
   * Test sound
   */
  async testSound(): Promise<void> {
    await this.playAlert('new_order');
    await this.delay(500);
    await this.playAlert('rush_order');
    await this.delay(500);
    await this.playAlert('order_bumped');
  }
}

// ── Touch Gesture Service ──────────────────────────────────────────────────

class KDSTouchGestureService extends EventEmitter {
  private touchStartTime: number = 0;
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private touchHoldTimer: NodeJS.Timeout | null = null;
  private readonly SWIPE_THRESHOLD = 50; // pixels
  private readonly TAP_THRESHOLD = 10; // pixels
  private readonly HOLD_THRESHOLD = 500; // ms
  private readonly DOUBLE_TAP_THRESHOLD = 300; // ms

  private lastTapTime: number = 0;
  private lastTapPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
    super();
  }

  /**
   * Initialize touch listeners on element
   */
  initListeners(element: HTMLElement): void {
    element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    element.addEventListener('touchcancel', this.handleTouchCancel.bind(this));

    // Mouse fallback for development
    element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    element.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchStartTime = Date.now();
    this.touchStartPos = { x: touch.clientX, y: touch.clientY };

    // Start hold timer
    this.touchHoldTimer = setTimeout(() => {
      this.emit('gesture', {
        gesture: 'long_press',
        position: this.touchStartPos,
        timestamp: new Date(),
      } as TouchEvent);
    }, this.HOLD_THRESHOLD);
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();

    // Cancel hold if moved too much
    if (this.touchHoldTimer) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - this.touchStartPos.x);
      const dy = Math.abs(touch.clientY - this.touchStartPos.y);

      if (dx > this.TAP_THRESHOLD || dy > this.TAP_THRESHOLD) {
        clearTimeout(this.touchHoldTimer);
        this.touchHoldTimer = null;
      }
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();

    // Cancel hold timer
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartPos.x;
    const dy = touch.clientY - this.touchStartPos.y;
    const duration = Date.now() - this.touchStartTime;

    // Determine gesture
    const gesture = this.detectGesture(dx, dy, duration);

    if (gesture) {
      this.emit('gesture', {
        gesture,
        position: this.touchStartPos,
        timestamp: new Date(),
      } as TouchEvent);
    }
  }

  /**
   * Handle touch cancel
   */
  private handleTouchCancel(): void {
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
  }

  /**
   * Detect gesture from movement
   */
  private detectGesture(dx: number, dy: number, duration: number): GestureType | null {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const absMax = Math.max(absDx, absDy);

    // Check for double tap
    const timeSinceLastTap = Date.now() - this.lastTapTime;
    const posSinceLastTap = Math.abs(dx) + Math.abs(dy);

    if (timeSinceLastTap < this.DOUBLE_TAP_THRESHOLD && posSinceLastTap < this.TAP_THRESHOLD) {
      this.lastTapTime = 0;
      return 'double_tap';
    }

    this.lastTapTime = Date.now();
    this.lastTapPos = { x: dx, y: dy };

    // Not enough movement = tap
    if (absMax < this.TAP_THRESHOLD) {
      return 'tap';
    }

    // Determine swipe direction
    if (absDx > absDy) {
      // Horizontal swipe
      return dx > 0 ? 'swipe_right' : 'swipe_left';
    } else {
      // Vertical swipe
      return dy > 0 ? 'swipe_down' : 'swipe_up';
    }
  }

  /**
   * Mouse event handlers (for development)
   */
  private handleMouseDown(e: MouseEvent): void {
    this.touchStartTime = Date.now();
    this.touchStartPos = { x: e.clientX, y: e.clientY };

    this.touchHoldTimer = setTimeout(() => {
      this.emit('gesture', {
        gesture: 'long_press',
        position: this.touchStartPos,
        timestamp: new Date(),
      } as TouchEvent);
    }, this.HOLD_THRESHOLD);
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.touchHoldTimer) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }

    const dx = e.clientX - this.touchStartPos.x;
    const dy = e.clientY - this.touchStartPos.y;

    this.emit('gesture', {
      gesture: this.detectGesture(dx, dy, Date.now() - this.touchStartTime) || 'tap',
      position: this.touchStartPos,
      timestamp: new Date(),
    } as TouchEvent);
  }

  /**
   * Cleanup listeners
   */
  destroy(element: HTMLElement): void {
    element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
}

// ── Enhanced KDS Service ──────────────────────────────────────────────────

class EnhancedKDSService extends EventEmitter {
  private io: SocketServer | null = null;
  private audioService: KDSAudioService;
  private touchService: KDSTouchGestureService;
  private orders: Map<string, KDSOrder> = new Map();
  private timingAlerts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.audioService = new KDSAudioService();
    this.touchService = new KDSTouchGestureService();

    // Forward touch events
    this.touchService.on('gesture', (event: TouchEvent) => {
      this.handleGesture(event);
    });

    // Forward audio events
    this.audioService.on('config:updated', (config) => {
      this.emit('config:updated', config);
    });
  }

  /**
   * Initialize service
   */
  async initialize(io: SocketServer): Promise<void> {
    this.io = io;
    await this.audioService.initialize();

    console.log('[Enhanced KDS] Service initialized');
  }

  /**
   * Initialize touch gestures on element
   */
  initTouchGestures(element: HTMLElement): void {
    this.touchService.initListeners(element);
  }

  /**
   * Receive new order
   */
  async receiveOrder(order: KDSOrder): Promise<void> {
    // Add to orders map
    this.orders.set(order.id, order);

    // Determine alert type
    let alertType: AlertSound = 'new_order';
    if (order.allergyNotes && order.allergyNotes.length > 0) {
      alertType = 'allergy_alert';
    } else if (order.rush || order.priority === 'rush') {
      alertType = 'rush_order';
    } else if (order.vip || order.priority === 'vip') {
      alertType = 'vip_order';
    }

    // Play audio alert
    await this.audioService.playAlert(alertType);

    // Broadcast to all KDS clients
    if (this.io) {
      this.io.to(`kds:${order.items[0]?.station || 'all'}`).emit('order:new', order);
    }

    // Start timing monitor
    this.startTimingMonitor(order);

    this.emit('order:received', order);
  }

  /**
   * Bump order (mark as complete)
   */
  async bumpOrder(orderId: string, station?: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order) return;

    // Play bump sound
    await this.audioService.playAlert('order_bumped');

    // Update order status
    if (station) {
      // Partial bump - bump specific station's items
      order.items.forEach((item) => {
        if (item.station === station) {
          item.status = 'done';
        }
      });

      const allDone = order.items.every((item) => item.status === 'done');
      if (allDone) {
        order.status = 'ready';
        order.actualReadyAt = new Date();
        this.orders.delete(orderId);
      }

      await this.audioService.playAlert('partial_bump');
    } else {
      // Full bump
      order.items.forEach((item) => {
        item.status = 'done';
      });
      order.status = 'ready';
      order.actualReadyAt = new Date();
      this.orders.delete(orderId);
    }

    // Clear timing monitor
    this.clearTimingMonitor(orderId);

    // Broadcast update
    if (this.io) {
      this.io.to(`kds:${station || 'all'}`).emit('order:bumped', { orderId, station });
    }

    this.emit('order:bumped', { orderId, station });
  }

  /**
   * Recall order
   */
  async recallOrder(orderId: string): Promise<void> {
    // Recall from bumped state
    await this.audioService.playAlert('recall');

    if (this.io) {
      this.io.emit('order:recalled', { orderId });
    }

    this.emit('order:recalled', { orderId });
  }

  /**
   * Handle gesture event
   */
  private async handleGesture(event: TouchEvent): Promise<void> {
    const { gesture, position } = event;

    // Find order/item at position
    const target = this.findTargetAtPosition(position);

    switch (gesture) {
      case 'tap':
        this.emit('gesture:tap', target);
        break;
      case 'double_tap':
        if (target?.orderId) {
          await this.bumpOrder(target.orderId, target.station);
        }
        break;
      case 'long_press':
        this.emit('gesture:hold', target);
        break;
      case 'swipe_left':
        if (target?.orderId) {
          await this.bumpOrder(target.orderId, target.station);
        }
        break;
      case 'swipe_right':
        if (target?.orderId) {
          await this.recallOrder(target.orderId);
        }
        break;
      case 'swipe_up':
        if (target?.orderId) {
          await this.bumpOrder(target.orderId);
        }
        break;
      case 'swipe_down':
        // Hold/delay order
        this.emit('gesture:delay', target);
        break;
    }

    this.emit('gesture', { gesture, target });
  }

  /**
   * Find order/item at position
   */
  private findTargetAtPosition(pos: { x: number; y: number }): { orderId: string; itemId?: string; station?: string } | null {
    // This would use DOM queries in frontend
    // Mock implementation
    return null;
  }

  /**
   * Start timing monitor for order
   */
  private startTimingMonitor(order: KDSOrder): void {
    const warningTime = order.prepTimeMinutes * 0.7 * 60 * 1000; // 70% of prep time
    const criticalTime = order.prepTimeMinutes * 1.3 * 60 * 1000; // 130% of prep time

    // Warning alert
    const warningTimer = setTimeout(async () => {
      await this.audioService.playAlert('time_warning');
      if (this.io) {
        this.io.emit('timing:warning', { orderId: order.id });
      }
    }, warningTime);

    // Critical alert
    const criticalTimer = setTimeout(async () => {
      await this.audioService.playAlert('time_critical');
      if (this.io) {
        this.io.emit('timing:critical', { orderId: order.id });
      }
    }, criticalTime);

    this.timingAlerts.set(`${order.id}:warning`, warningTimer);
    this.timingAlerts.set(`${order.id}:critical`, criticalTimer);
  }

  /**
   * Clear timing monitor
   */
  private clearTimingMonitor(orderId: string): void {
    const warning = this.timingAlerts.get(`${orderId}:warning`);
    const critical = this.timingAlerts.get(`${orderId}:critical`);

    if (warning) clearTimeout(warning);
    if (critical) clearTimeout(critical);

    this.timingAlerts.delete(`${orderId}:warning`);
    this.timingAlerts.delete(`${orderId}:critical`);
  }

  /**
   * Get audio service
   */
  getAudioService(): KDSAudioService {
    return this.audioService;
  }

  /**
   * Get touch service
   */
  getTouchService(): KDSTouchGestureService {
    return this.touchService;
  }

  /**
   * Shutdown
   */
  shutdown(): void {
    // Clear all timers
    this.timingAlerts.forEach((timer) => clearTimeout(timer));
    this.timingAlerts.clear();
  }
}

// ── Singleton Exports ──────────────────────────────────────────────────────

export const kdsAudioService = new KDSAudioService();
export const kdsTouchGestureService = new KDSTouchGestureService();
export const enhancedKDSService = new EnhancedKDSService();

export default enhancedKDSService;
