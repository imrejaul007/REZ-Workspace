/**
 * Genie Memory Client - DO App Backend
 *
 * Connect DO backend to HOJAI Genie memory services
 *
 * Usage:
 * ```typescript
 * import { GenieMemoryClient, genieMemory } from './genieMemoryClient';
 *
 * // Remember a transaction
 * await genieMemory.rememberTransaction('user-123', {
 *   merchantName: 'La Pinoz',
 *   amount: 1200,
 *   category: 'restaurant'
 * });
 *
 * // Get user's "usual"
 * const usual = await genieMemory.getUsual('user-123');
 * // { merchant: 'La Pinoz', cuisine: 'Italian', amount: 1200 }
 *
 * // Recall memories
 * const memories = await genieMemory.recall('user-123', 'Italian restaurants');
 * ```
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// CONFIG
// ============================================

const GENIE_BASE_URL = process.env.HOJAI_GENIE_URL || 'http://localhost:4703';
const GENIE_API_KEY = process.env.HOJAI_GENIE_API_KEY || '';

// ============================================
// TYPES
// ============================================

export type MemoryType =
  | 'preference'
  | 'fact'
  | 'event'
  | 'transaction'
  | 'booking'
  | 'relationship'
  | 'context'
  | 'location'
  | 'note';

export interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  tags: string[];
  importance: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
}

export interface MemoryInput {
  type: MemoryType;
  content: string;
  tags?: string[];
  importance?: number;
  metadata?: Record<string, unknown>;
  tier?: 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
}

export interface MemoryRecall {
  memories: Memory[];
  total: number;
  confidence: number;
}

export interface UsualOrder {
  merchant?: string;
  cuisine?: string;
  amount?: number;
  time?: string;
  partySize?: number;
  dietary?: string[];
}

export interface BookingPattern {
  preferredTime?: string;
  preferredPartySize?: number;
  preferredCuisine?: string;
  averageSpend?: number;
}

export interface SpendingSummary {
  totalSpent: number;
  transactionCount: number;
  topMerchant?: string;
  topCategory?: string;
  averageTransaction: number;
}

// ============================================
// TYPE TAGS
// ============================================

const TYPE_TAGS: Record<MemoryType, string[]> = {
  preference: ['preference', 'user'],
  fact: ['fact', 'knowledge'],
  event: ['event', 'activity'],
  transaction: ['transaction', 'purchase'],
  relationship: ['relationship', 'people'],
  context: ['context', 'conversation'],
  booking: ['booking', 'reservation'],
  location: ['location', 'place'],
  note: ['note', 'reminder'],
};

// ============================================
// LOCAL CACHE (Fallback)
// ============================================

class LocalMemoryCache {
  private memories: Map<string, Memory[]> = new Map();

  remember(userId: string, input: MemoryInput): Memory {
    const memory: Memory = {
      id: `local_${Date.now()}_${uuidv4()}`,
      userId,
      type: input.type,
      content: input.content,
      tags: input.tags || TYPE_TAGS[input.type] || [],
      importance: input.importance || 5,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
    };

    const userMemories = this.memories.get(userId) || [];
    userMemories.push(memory);
    this.memories.set(userId, userMemories);

    return memory;
  }

  recall(userId: string, query: string, options?: { type?: MemoryType; limit?: number }): MemoryRecall {
    let memories = this.memories.get(userId) || [];

    if (options?.type) {
      memories = memories.filter((m) => m.type === options.type);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      memories = memories.filter(
        (m) =>
          m.content.toLowerCase().includes(lowerQuery) ||
          m.tags.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort by importance and access count
    memories.sort((a, b) => {
      const scoreA = a.importance * 10 + a.accessCount;
      const scoreB = b.importance * 10 + b.accessCount;
      return scoreB - scoreA;
    });

    const limited = memories.slice(0, options?.limit || 10);

    return {
      memories: limited,
      total: memories.length,
      confidence: 0.7,
    };
  }

  getUsual(userId: string): UsualOrder | null {
    const transactions = this.recall(userId, '', { type: 'transaction', limit: 50 });

    if (transactions.memories.length === 0) {
      return null;
    }

    const merchantCounts: Record<string, number> = {};
    const cuisineCounts: Record<string, number> = {};
    let totalAmount = 0;

    transactions.memories.forEach((m) => {
      if (m.metadata?.merchantName) {
        merchantCounts[m.metadata.merchantName] =
          (merchantCounts[m.metadata.merchantName] || 0) + m.accessCount;
      }
      if (m.metadata?.category && m.metadata.category !== 'general') {
        cuisineCounts[m.metadata.category] =
          (cuisineCounts[m.metadata.category] || 0) + 1;
      }
      if (m.metadata?.amount) {
        totalAmount += m.metadata.amount;
      }
    });

    const topMerchant = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0];
    const topCuisine = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      merchant: topMerchant?.[0],
      cuisine: topCuisine?.[0],
      amount:
        transactions.memories.length > 0
          ? Math.round(totalAmount / transactions.memories.length)
          : undefined,
    };
  }
}

// ============================================
// CLIENT
// ============================================

export class GenieMemoryClient {
  private client: AxiosInstance;
  private localCache: LocalMemoryCache;
  private enabled: boolean;

  constructor() {
    this.client = axios.create({
      baseURL: GENIE_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': GENIE_API_KEY,
        'X-Service': 'do-app-backend',
      },
    });

    this.localCache = new LocalMemoryCache();
    this.enabled = !!GENIE_API_KEY;

    // Warn in production if no API key configured
    if (process.env.NODE_ENV === 'production' && !GENIE_API_KEY) {
      console.warn(
        '[GenieMemory] WARNING: Running in production without HOJAI_GENIE_API_KEY. ' +
        'Set HOJAI_GENIE_API_KEY environment variable for secure Genie access. ' +
        'Falling back to local cache which is not persistent across restarts.'
      );
    }
  }

  private log(message: string, data?: unknown): void {
    if (this.enabled) {
      console.log(`[GenieMemory] ${message}`, data || '');
    }
  }

  // ============================================
  // REMEMBER (Store)
  // ============================================

  /**
   * Remember a memory
   */
  async remember(userId: string, input: MemoryInput): Promise<Memory> {
    const memory: MemoryInput = {
      ...input,
      tags: input.tags || TYPE_TAGS[input.type] || [],
      importance: input.importance || 5,
    };

    if (!this.enabled) {
      this.log('Using local cache for remember');
      return this.localCache.remember(userId, memory);
    }

    try {
      const response = await this.client.post('/api/memory/remember', {
        userId,
        ...memory,
        source: 'do-app-backend',
      });

      return {
        id: response.data.id || `mem_${Date.now()}`,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: 0,
        ...response.data,
        ...memory,
      };
    } catch (error) {
      this.log('Remember failed, using local cache', error);
      return this.localCache.remember(userId, memory);
    }
  }

  /**
   * Remember a transaction
   */
  async rememberTransaction(
    userId: string,
    transaction: {
      merchantName: string;
      amount: number;
      category?: string;
      items?: string[];
    }
  ): Promise<Memory> {
    return this.remember(userId, {
      type: 'transaction',
      content: `Spent ₹${transaction.amount} at ${transaction.merchantName}`,
      tags: [
        'transaction',
        'purchase',
        transaction.merchantName.toLowerCase(),
        transaction.category || 'general',
      ],
      importance: 6,
      metadata: transaction,
    });
  }

  /**
   * Remember a booking
   */
  async rememberBooking(
    userId: string,
    booking: {
      merchantName: string;
      date: string;
      time?: string;
      partySize?: number;
      amount?: number;
      type?: string;
    }
  ): Promise<Memory> {
    return this.remember(userId, {
      type: 'booking',
      content: `Booked ${booking.merchantName} for ${booking.date}${booking.time ? ` at ${booking.time}` : ''}`,
      tags: [
        'booking',
        'reservation',
        booking.merchantName.toLowerCase(),
        booking.type || 'restaurant',
      ],
      importance: 8,
      metadata: booking,
    });
  }

  /**
   * Remember a preference
   */
  async rememberPreference(
    userId: string,
    category: string,
    key: string,
    value: unknown
  ): Promise<Memory> {
    return this.remember(userId, {
      type: 'preference',
      content: `${key}: ${JSON.stringify(value)}`,
      tags: ['preference', category, key],
      importance: 7,
      metadata: { category, key, value },
    });
  }

  /**
   * Remember food preference
   */
  async rememberFoodPreference(userId: string, food: string): Promise<Memory> {
    return this.remember(userId, {
      type: 'preference',
      content: `Food preference: ${food}`,
      tags: ['food', 'preference', food.toLowerCase()],
      importance: 7,
      metadata: { category: 'food', value: food },
    });
  }

  /**
   * Remember cuisine preference
   */
  async rememberCuisinePreference(userId: string, cuisine: string): Promise<Memory> {
    return this.remember(userId, {
      type: 'preference',
      content: `Cuisine preference: ${cuisine}`,
      tags: ['cuisine', 'preference', cuisine.toLowerCase()],
      importance: 8,
      metadata: { category: 'cuisine', value: cuisine },
    });
  }

  /**
   * Remember favorite restaurant
   */
  async rememberFavoriteRestaurant(
    userId: string,
    name: string,
    details?: {
      cuisine?: string;
      averageBill?: number;
      visitCount?: number;
    }
  ): Promise<Memory> {
    return this.remember(userId, {
      type: 'preference',
      content: `Favorite restaurant: ${name}`,
      tags: ['restaurant', 'favorite', name.toLowerCase(), details?.cuisine || ''].filter(Boolean),
      importance: 9,
      metadata: details,
    });
  }

  /**
   * Remember dietary restriction
   */
  async rememberDietaryRestriction(userId: string, restriction: string): Promise<Memory> {
    return this.remember(userId, {
      type: 'preference',
      content: `Dietary restriction: ${restriction}`,
      tags: ['dietary', 'restriction', restriction.toLowerCase()],
      importance: 9, // Health related - high importance
      metadata: { category: 'dietary', value: restriction },
    });
  }

  // ============================================
  // RECALL (Retrieve)
  // ============================================

  /**
   * Recall memories
   */
  async recall(
    userId: string,
    query: string,
    options?: { type?: MemoryType; limit?: number }
  ): Promise<MemoryRecall> {
    if (!this.enabled) {
      this.log('Using local cache for recall');
      return this.localCache.recall(userId, query, options);
    }

    try {
      const response = await this.client.get('/api/memory/recall', {
        params: {
          userId,
          query,
          type: options?.type,
          limit: options?.limit || 10,
        },
      });

      return {
        memories: response.data.memories || [],
        total: response.data.total || 0,
        confidence: 0.9,
      };
    } catch (error) {
      this.log('Recall failed, using local cache', error);
      return this.localCache.recall(userId, query, options);
    }
  }

  /**
   * Get user's "usual" order
   */
  async getUsual(userId: string): Promise<UsualOrder | null> {
    if (!this.enabled) {
      return this.localCache.getUsual(userId);
    }

    try {
      const response = await this.client.get('/api/memory/usual', {
        params: { userId, type: 'order' },
      });

      return response.data;
    } catch (error) {
      this.log('GetUsual failed, using local cache', error);
      return this.localCache.getUsual(userId);
    }
  }

  /**
   * Get booking pattern
   */
  async getBookingPattern(userId: string): Promise<BookingPattern | null> {
    const bookings = await this.recall(userId, '', { type: 'booking', limit: 30 });

    if (bookings.memories.length === 0) {
      return null;
    }

    const timeCounts: Record<string, number> = {};
    const sizeCounts: Record<number, number> = {};
    const cuisineCounts: Record<string, number> = {};
    let totalSpend = 0;

    bookings.memories.forEach((b) => {
      // Extract time
      const timeMatch = b.content.match(/\d{1,2}\s*(?:am|pm)/i);
      if (timeMatch) {
        timeCounts[timeMatch[0]] = (timeCounts[timeMatch[0]] || 0) + 1;
      }

      // Party size
      if (b.metadata?.partySize) {
        sizeCounts[b.metadata.partySize] = (sizeCounts[b.metadata.partySize] || 0) + 1;
      }

      // Spend
      if (b.metadata?.amount) {
        totalSpend += b.metadata.amount;
      }

      // Cuisine from tags
      b.tags?.forEach((tag) => {
        if (!['booking', 'restaurant'].includes(tag)) {
          cuisineCounts[tag] = (cuisineCounts[tag] || 0) + 1;
        }
      });
    });

    const topTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0];
    const topSize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0];
    const topCuisine = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      preferredTime: topTime?.[0],
      preferredPartySize: topSize ? parseInt(topSize[0]) : undefined,
      preferredCuisine: topCuisine?.[0],
      averageSpend:
        bookings.memories.length > 0
          ? Math.round(totalSpend / bookings.memories.length)
          : undefined,
    };
  }

  /**
   * Get spending summary
   */
  async getSpendingSummary(userId: string, days: number = 30): Promise<SpendingSummary> {
    const transactions = await this.recall(userId, '', { type: 'transaction', limit: 100 });

    if (transactions.memories.length === 0) {
      return {
        totalSpent: 0,
        transactionCount: 0,
        averageTransaction: 0,
      };
    }

    let totalSpent = 0;
    const merchantCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    transactions.memories.forEach((t) => {
      if (t.metadata?.amount) {
        totalSpent += t.metadata.amount;
      }
      if (t.metadata?.merchantName) {
        merchantCounts[t.metadata.merchantName] =
          (merchantCounts[t.metadata.merchantName] || 0) + 1;
      }
      if (t.metadata?.category) {
        categoryCounts[t.metadata.category] =
          (categoryCounts[t.metadata.category] || 0) + 1;
      }
    });

    const topMerchant = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalSpent,
      transactionCount: transactions.memories.length,
      topMerchant: topMerchant?.[0],
      topCategory: topCategory?.[0],
      averageTransaction: Math.round(totalSpent / transactions.memories.length),
    };
  }

  /**
   * Get timeline
   */
  async getTimeline(userId: string, limit: number = 50): Promise<Memory[]> {
    const result = await this.recall(userId, '', { limit });

    return result.memories.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // ============================================
  // LEARN FROM EVENTS
  // ============================================

  /**
   * Learn from booking event
   */
  async learnFromBooking(
    userId: string,
    booking: {
      merchantName: string;
      cuisine?: string;
      time?: string;
      partySize?: number;
      amount?: number;
    }
  ): Promise<void> {
    await Promise.all([
      this.rememberBooking(userId, {
        merchantName: booking.merchantName,
        date: new Date().toISOString().split('T')[0],
        time: booking.time,
        partySize: booking.partySize,
        amount: booking.amount,
      }),
      booking.cuisine ? this.rememberCuisinePreference(userId, booking.cuisine) : Promise.resolve(),
    ]);
  }

  /**
   * Learn from transaction event
   */
  async learnFromTransaction(
    userId: string,
    transaction: {
      merchantName: string;
      amount: number;
      category?: string;
    }
  ): Promise<void> {
    await this.rememberTransaction(userId, transaction);
  }

  // ============================================
  // DELETE
  // ============================================

  /**
   * Delete a memory
   */
  async delete(userId: string, memoryId: string): Promise<void> {
    if (!this.enabled) {
      // Local deletion not implemented
      return;
    }

    try {
      await this.client.delete(`/api/memory/${memoryId}`, {
        params: { userId },
      });
    } catch (error) {
      this.log('Delete failed', error);
    }
  }

  /**
   * Clear all memories of a type
   */
  async clearType(userId: string, type: MemoryType): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      await this.client.delete('/api/memory/clear', {
        params: { userId, type },
      });
    } catch (error) {
      this.log('Clear type failed', error);
    }
  }

  // ============================================
  // HEALTH
  // ============================================

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled) {
      return true; // Local cache always available
    }

    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const genieMemory = new GenieMemoryClient();
export default GenieMemoryClient;