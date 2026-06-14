import { Types } from 'mongoose';
import { logger } from '../config/logger';

/**
 * Voice item representation for kitchen announcements.
 */
export interface VoiceOrderItem {
  productId?: string | Types.ObjectId;
  name: string;
  quantity: number;
  price?: number;
  notes?: string;
  variant?: string;
}

/**
 * Order data for voice announcements.
 */
export interface OrderAnnouncement {
  orderId: string;
  orderNumber: string;
  items: VoiceOrderItem[];
  storeId: string;
  customerName?: string;
  priority?: 'normal' | 'rush' | 'vip';
  notes?: string;
  estimatedTime?: number; // minutes
}

/**
 * Announcement types for different order stages.
 */
export type AnnouncementType = 'new_order' | 'order_ready' | 'order_rush' | 'order_cancelled' | 'order_updated';

/**
 * Voice KDS Service for text-to-speech kitchen announcements.
 * Converts order data into speakable announcements for kitchen displays.
 */
export class VoiceKDS {
  private speakRate: number;
  private speakPitch: number;
  private voiceId: string | null;

  constructor(options?: {
    speakRate?: number;
    speakPitch?: number;
    voiceId?: string;
  }) {
    this.speakRate = options?.speakRate ?? 1.0;
    this.speakPitch = options?.speakPitch ?? 1.0;
    this.voiceId = options?.voiceId ?? null;
  }

  /**
   * Generate announcement text for a new order.
   */
  announce(order: OrderAnnouncement): string {
    const { items, orderNumber, customerName, priority, notes } = order;

    const itemList = this.formatItems(items);
    const priorityPrefix = this.getPriorityPrefix(priority);

    let announcement = `${priorityPrefix}New order ${orderNumber}: ${itemList}`;

    if (customerName) {
      announcement += `. For ${customerName}`;
    }

    if (notes) {
      announcement += `. Note: ${notes}`;
    }

    return announcement;
  }

  /**
   * Generate announcement for order ready pickup.
   */
  announceOrderReady(order: OrderAnnouncement): string {
    const { orderNumber, customerName } = order;

    if (customerName) {
      return `Order ${orderNumber} is ready. Please pick up, ${customerName}`;
    }

    return `Order ${orderNumber} is ready for pickup`;
  }

  /**
   * Generate announcement for rush/priority orders.
   */
  announceRush(order: OrderAnnouncement): string {
    const { items, orderNumber, estimatedTime } = order;
    const itemList = this.formatItems(items);

    let announcement = `Rush order ${orderNumber}: ${itemList}`;

    if (estimatedTime && estimatedTime > 0) {
      announcement += `. Target: ${estimatedTime} minutes`;
    }

    return announcement;
  }

  /**
   * Generate announcement for cancelled orders.
   */
  announceCancelled(order: OrderAnnouncement): string {
    return `Order ${order.orderNumber} has been cancelled`;
  }

  /**
   * Generate announcement for updated orders.
   */
  announceUpdated(order: OrderAnnouncement): string {
    const { items, orderNumber, notes } = order;
    const itemList = this.formatItems(items);

    let announcement = `Order ${orderNumber} updated: ${itemList}`;

    if (notes) {
      announcement += `. New note: ${notes}`;
    }

    return announcement;
  }

  /**
   * Generate announcement by type.
   */
  announceByType(order: OrderAnnouncement, type: AnnouncementType): string {
    switch (type) {
      case 'new_order':
        return this.announce(order);
      case 'order_ready':
        return this.announceOrderReady(order);
      case 'order_rush':
        return this.announceRush(order);
      case 'order_cancelled':
        return this.announceCancelled(order);
      case 'order_updated':
        return this.announceUpdated(order);
      default:
        return this.announce(order);
    }
  }

  /**
   * Format items for speech output.
   * Groups same items together and handles pluralization.
   */
  private formatItems(items: VoiceOrderItem[]): string {
    if (!items || items.length === 0) {
      return 'no items';
    }

    const formattedItems = items.map(item => {
      const qty = item.quantity;
      const name = item.name;
      const variant = item.variant ? `, ${item.variant}` : '';

      if (qty === 1) {
        return `1 ${name}${variant}`;
      }

      // Handle pluralization for common items
      const pluralizedName = this.pluralize(name, qty);
      return `${qty} ${pluralizedName}${variant}`;
    });

    if (formattedItems.length === 1) {
      return formattedItems[0];
    }

    if (formattedItems.length === 2) {
      return `${formattedItems[0]} and ${formattedItems[1]}`;
    }

    const lastItem = formattedItems.pop();
    return `${formattedItems.join(', ')}, and ${lastItem}`;
  }

  /**
   * Simple pluralization for common food items.
   */
  private pluralize(word: string, count: number): string {
    if (count === 1) return word;

    // Words ending in 'y' (consonant + y)
    if (word.endsWith('y') && !['a', 'e', 'i', 'o', 'u'].includes(word[word.length - 2])) {
      return word.slice(0, -1) + 'ies';
    }

    // Words ending in 's', 'x', 'z', 'ch', 'sh'
    if (word.endsWith('s') || word.endsWith('x') || word.endsWith('z') ||
        word.endsWith('ch') || word.endsWith('sh')) {
      return word + 'es';
    }

    // Words ending in 'f' or 'fe'
    if (word.endsWith('f')) {
      return word.slice(0, -1) + 'ves';
    }
    if (word.endsWith('fe')) {
      return word.slice(0, -2) + 'ves';
    }

    // Default: just add 's'
    return word + 's';
  }

  /**
   * Get priority prefix for announcements.
   */
  private getPriorityPrefix(priority?: 'normal' | 'rush' | 'vip'): string {
    switch (priority) {
      case 'rush':
        return 'Urgent. Rush.';
      case 'vip':
        return 'VIP order.';
      default:
        return '';
    }
  }

  /**
   * Generate SSML markup for enhanced TTS.
   * Returns XML-formatted text for speech synthesis engines that support SSML.
   */
  generateSSML(announcement: string, options?: {
    emphasis?: boolean;
    speed?: number;
  }): string {
    const speedMultiplier = options?.speed ?? this.speakRate;

    let ssml = '<?xml version="1.0" encoding="UTF-8"?>';
    ssml += '<speak version="1.1" xmlns="http://www.w3.org/2001/10/synthesis">';
    ssml += '<prosody rate="';

    if (speedMultiplier < 0.8) {
      ssml += 'slow';
    } else if (speedMultiplier > 1.2) {
      ssml += 'fast';
    } else {
      ssml += 'medium';
    }

    ssml += '" pitch="';

    if (this.speakPitch < 0.9) {
      ssml += 'low';
    } else if (this.speakPitch > 1.1) {
      ssml += 'high';
    } else {
      ssml += 'medium';
    }

    ssml += '">';

    // Wrap in emphasis if requested
    if (options?.emphasis) {
      ssml += `<emphasis level="moderate">${this.escapeSSML(announcement)}</emphasis>`;
    } else {
      ssml += this.escapeSSML(announcement);
    }

    ssml += '</prosody></speak>';

    return ssml;
  }

  /**
   * Escape special SSML characters.
   */
  private escapeSSML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Speech options for Web Speech API compatibility.
   */
  getSpeechOptions(): { rate: number; pitch: number; volume: number; lang: string } {
    return {
      rate: this.speakRate,
      pitch: this.speakPitch,
      volume: 1.0,
      lang: 'en-US'
    };
  }

  /**
   * Batch announcement for multiple orders.
   */
  announceBatch(orders: OrderAnnouncement[]): string[] {
    return orders.map(order => this.announce(order));
  }

  /**
   * Summary announcement for multiple orders.
   */
  announceBatchSummary(orders: OrderAnnouncement[]): string {
    if (orders.length === 0) {
      return 'No pending orders';
    }

    const totalItems = orders.reduce((sum, order) => sum + order.items.length, 0);
    const rushCount = orders.filter(o => o.priority === 'rush').length;

    let summary = `${orders.length} orders with ${totalItems} items total`;

    if (rushCount > 0) {
      summary += `. ${rushCount} rush order${rushCount > 1 ? 's' : ''}`;
    }

    return summary;
  }
}

/**
 * KDS Status for kitchen display integration.
 */
export interface KDSStatus {
  orderId: string;
  orderNumber: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  voiceAnnounced: boolean;
  lastAnnouncement?: string;
}

/**
 * Voice KDS Manager for coordinating multiple kitchen stations.
 */
export class VoiceKDSManager {
  private stations: Map<string, VoiceKDS> = new Map();
  private orderStatuses: Map<string, KDSStatus> = new Map();
  private defaultKDS: VoiceKDS;

  constructor() {
    this.defaultKDS = new VoiceKDS();
  }

  /**
   * Register a kitchen station with custom settings.
   */
  registerStation(stationId: string, options?: ConstructorParameters<typeof VoiceKDS>[0]): void {
    this.stations.set(stationId, new VoiceKDS(options));
    logger.info(`[voiceKDS] Registered station: ${stationId}`);
  }

  /**
   * Unregister a kitchen station.
   */
  unregisterStation(stationId: string): void {
    this.stations.delete(stationId);
    logger.info(`[voiceKDS] Unregistered station: ${stationId}`);
  }

  /**
   * Get station KDS or default.
   */
  getStation(stationId?: string): VoiceKDS {
    if (stationId && this.stations.has(stationId)) {
      return this.stations.get(stationId)!;
    }
    return this.defaultKDS;
  }

  /**
   * Process and announce order to a station.
   */
  processOrder(order: OrderAnnouncement, stationId?: string): string {
    const kds = this.getStation(stationId);
    const announcement = kds.announce(order);

    // Update status
    this.orderStatuses.set(order.orderId, {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      status: 'pending',
      voiceAnnounced: true,
      lastAnnouncement: announcement
    });

    logger.info(`[voiceKDS] Announced order ${order.orderNumber} to station ${stationId || 'default'}`);

    return announcement;
  }

  /**
   * Update order status.
   */
  updateStatus(orderId: string, status: KDSStatus['status']): KDSStatus | null {
    const existing = this.orderStatuses.get(orderId);
    if (!existing) {
      logger.warn(`[voiceKDS] Order ${orderId} not found for status update`);
      return null;
    }

    const updated: KDSStatus = {
      ...existing,
      status,
      startedAt: status === 'preparing' ? new Date() : existing.startedAt,
      completedAt: status === 'completed' ? new Date() : existing.completedAt
    };

    this.orderStatuses.set(orderId, updated);
    return updated;
  }

  /**
   * Get all pending orders for a station.
   */
  getPendingOrders(stationId?: string): KDSStatus[] {
    return Array.from(this.orderStatuses.values())
      .filter(s => s.status === 'pending' || s.status === 'preparing');
  }

  /**
   * Clear completed orders older than specified duration.
   */
  cleanupOldOrders(maxAgeMinutes: number = 60): number {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let cleared = 0;

    const entries = Array.from(this.orderStatuses.entries());
    for (const [orderId, status] of entries) {
      if (status.status === 'completed' && status.completedAt && status.completedAt < cutoff) {
        this.orderStatuses.delete(orderId);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info(`[voiceKDS] Cleared ${cleared} old order statuses`);
    }

    return cleared;
  }
}

// Singleton instance for application-wide use
export const voiceKDS = new VoiceKDS();
export const voiceKDSManager = new VoiceKDSManager();
