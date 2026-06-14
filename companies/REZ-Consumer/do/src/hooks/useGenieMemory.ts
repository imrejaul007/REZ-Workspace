/**
 * useGenieMemory - HOJAI Genie Integration for DO App
 *
 * Personal AI Memory - Remember preferences, recall "usual", learn over time
 *
 * Usage:
 * ```typescript
 * import { useGenieMemory } from '@/hooks/useGenieMemory';
 *
 * function MyComponent() {
 *   const {
 *     remember,
 *     recall,
 *     getUsual,
 *     getFoodPreferences,
 *     isLoading
 *   } = useGenieMemory(userId);
 *
 *   // Remember food preference
 *   await remember('cuisine', 'Italian');
 *
 *   // Get user's "usual"
 *   const usual = await getUsual();
 *   // { merchant: 'La Pinoz', cuisine: 'Italian', amount: 1200 }
 *
 *   // Recall memories
 *   const memories = await recall('Italian restaurants');
 * }
 * ```
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ============================================
// CONFIG
// ============================================

const GENIE_API_KEY = process.env.EXPO_PUBLIC_HOJAI_GENIE_API_KEY || '';
const GENIE_BASE_URL = process.env.EXPO_PUBLIC_HOJAI_GENIE_URL || 'http://localhost:4703';

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
  dietary?: string;
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

export interface GenieOptions {
  enabled?: boolean;
  onRemember?: (memory: Memory) => void;
  onError?: (error: string) => void;
}

// ============================================
// DEFAULT OPTIONS
// ============================================

const DEFAULT_OPTIONS: Required<GenieOptions> = {
  enabled: true,
  onRemember: () => {},
  onError: () => {},
};

// ============================================
// API CLIENT
// ============================================

const genieClient = axios.create({
  baseURL: GENIE_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': GENIE_API_KEY,
  },
});

// ============================================
// HOOK
// ============================================

export function useGenieMemory(userId: string, options: GenieOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const queryClient = useQueryClient();

  // State
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // INTERNAL HELPERS
  // ============================================

  /**
   * Make API request with error handling
   */
  const apiRequest = async <T>(
    method: 'get' | 'post' | 'put' | 'delete',
    endpoint: string,
    data?: unknown
  ): Promise<T | null> => {
    try {
      const response = await genieClient.request<T>({
        method,
        url: endpoint,
        params: method === 'get' ? data : undefined,
        data: method !== 'get' ? data : undefined,
      });
      setError(null);
      return response.data;
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      opts.onError(errorMessage);
      console.warn('[Genie] API Error:', errorMessage);
      return null;
    }
  };

  // ============================================
  // REMEMBER (Store Memories)
  // ============================================

  /**
   * Remember a memory
   */
  const rememberMutation = useMutation(
    async (input: MemoryInput): Promise<Memory | null> => {
      return apiRequest<Memory>('post', '/api/memory/remember', {
        userId,
        ...input,
        source: 'do-app',
      });
    },
    {
      onSuccess: (data) => {
        if (data) {
          // Invalidate relevant queries
          queryClient.invalidateQueries(['genie-memories', userId]);
          queryClient.invalidateQueries(['genie-usual', userId]);
          queryClient.invalidateQueries(['genie-preferences', userId]);
          opts.onRemember(data);
        }
      },
    }
  );

  /**
   * Remember a memory (mutation trigger)
   */
  const remember = useCallback(
    async (input: MemoryInput): Promise<Memory | null> => {
      return rememberMutation.mutateAsync(input);
    },
    [rememberMutation]
  );

  /**
   * Remember food preference
   */
  const rememberFood = useCallback(
    async (food: string): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Food preference: ${food}`,
        tags: ['food', 'preference', food.toLowerCase()],
        importance: 7,
        metadata: { category: 'food', value: food },
      });
    },
    [remember]
  );

  /**
   * Remember cuisine preference
   */
  const rememberCuisine = useCallback(
    async (cuisine: string): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Cuisine preference: ${cuisine}`,
        tags: ['cuisine', 'preference', cuisine.toLowerCase()],
        importance: 8,
        metadata: { category: 'cuisine', value: cuisine },
      });
    },
    [remember]
  );

  /**
   * Remember dietary restriction
   */
  const rememberDietary = useCallback(
    async (restriction: string): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Dietary restriction: ${restriction}`,
        tags: ['dietary', 'restriction', restriction.toLowerCase()],
        importance: 9, // High importance - health related
        metadata: { category: 'dietary', value: restriction },
      });
    },
    [remember]
  );

  /**
   * Remember favorite restaurant
   */
  const rememberFavoriteRestaurant = useCallback(
    async (
      name: string,
      details?: {
        cuisine?: string;
        averageBill?: number;
        visitCount?: number;
      }
    ): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Favorite restaurant: ${name}`,
        tags: ['restaurant', 'favorite', name.toLowerCase(), details?.cuisine || ''].filter(Boolean),
        importance: 9,
        metadata: details,
      });
    },
    [remember]
  );

  /**
   * Remember a booking
   */
  const rememberBooking = useCallback(
    async (booking: {
      merchantName: string;
      date: string;
      time?: string;
      partySize?: number;
      amount?: number;
      type?: string;
    }): Promise<Memory | null> => {
      return remember({
        type: 'booking',
        content: `Booked ${booking.merchantName} for ${booking.date} at ${booking.time || 'TBD'}`,
        tags: ['booking', booking.merchantName.toLowerCase(), booking.type || 'restaurant'],
        importance: 8,
        metadata: booking,
      });
    },
    [remember]
  );

  /**
   * Remember a transaction
   */
  const rememberTransaction = useCallback(
    async (transaction: {
      merchantName: string;
      amount: number;
      category?: string;
      items?: string[];
    }): Promise<Memory | null> => {
      return remember({
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
    },
    [remember]
  );

  /**
   * Remember price preference
   */
  const rememberPriceRange = useCallback(
    async (range: string, maxAmount?: number): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Price range: ${range}`,
        tags: ['budget', 'price', 'preference'],
        importance: 7,
        metadata: { range, maxAmount },
      });
    },
    [remember]
  );

  /**
   * Remember time preference
   */
  const rememberTimePreference = useCallback(
    async (time: string): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Preferred time: ${time}`,
        tags: ['time', 'preference', 'booking'],
        importance: 6,
        metadata: { time },
      });
    },
    [remember]
  );

  /**
   * Remember party size preference
   */
  const rememberPartySize = useCallback(
    async (size: number): Promise<Memory | null> => {
      return remember({
        type: 'preference',
        content: `Preferred party size: ${size}`,
        tags: ['party_size', 'preference', 'occasion'],
        importance: 5,
        metadata: { partySize: size },
      });
    },
    [remember]
  );

  // ============================================
  // RECALL (Retrieve Memories)
  // ============================================

  /**
   * Recall memories by query
   */
  const recall = useCallback(
    async (query: string, recallOptions?: { type?: MemoryType; limit?: number }): Promise<MemoryRecall> => {
      // Try API first
      const result = await apiRequest<MemoryRecall>('get', '/api/memory/recall', {
        userId,
        query,
        type: recallOptions?.type,
        limit: recallOptions?.limit || 10,
      });

      if (result) {
        return result;
      }

      // Return empty if API fails
      return { memories: [], total: 0, confidence: 0 };
    },
    [userId]
  );

  /**
   * Get food preferences
   */
  const getFoodPreferences = useCallback(async (): Promise<Memory[]> => {
    const result = await recall('food', { type: 'preference', limit: 20 });
    return result.memories;
  }, [recall]);

  /**
   * Get cuisine preferences
   */
  const getCuisinePreferences = useCallback(async (): Promise<Memory[]> => {
    const result = await recall('cuisine', { type: 'preference', limit: 20 });
    return result.memories;
  }, [recall]);

  /**
   * Get dietary restrictions
   */
  const getDietaryRestrictions = useCallback(async (): Promise<Memory[]> => {
    const result = await recall('dietary', { type: 'preference', limit: 10 });
    return result.memories;
  }, [recall]);

  /**
   * Get favorite restaurants
   */
  const getFavoriteRestaurants = useCallback(async (): Promise<Memory[]> => {
    const result = await recall('favorite', { type: 'preference', limit: 10 });
    return result.memories;
  }, [recall]);

  /**
   * Get "usual" order
   */
  const getUsual = useCallback(async (): Promise<UsualOrder | null> => {
    // Try API first
    const result = await apiRequest<UsualOrder>('get', '/api/memory/usual', {
      userId,
      type: 'order',
    });

    if (result) {
      return result;
    }

    // Fallback: analyze transactions
    const transactions = await recall('spent', { type: 'transaction', limit: 20 });

    if (transactions.memories.length === 0) {
      return null;
    }

    // Analyze patterns
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
  }, [userId, recall]);

  /**
   * Get booking pattern
   */
  const getBookingPattern = useCallback(async (): Promise<BookingPattern | null> => {
    const bookings = await recall('booked', { type: 'booking', limit: 30 });

    if (bookings.memories.length === 0) {
      return null;
    }

    // Analyze patterns
    const timeCounts: Record<string, number> = {};
    const sizeCounts: Record<number, number> = {};
    const cuisineCounts: Record<string, number> = {};
    let totalSpend = 0;

    bookings.memories.forEach((b) => {
      // Extract time from content
      const timeMatch = b.content.match(/\d{1,2}\s*(?:am|pm)/i);
      if (timeMatch) {
        timeCounts[timeMatch[0]] = (timeCounts[timeMatch[0]] || 0) + 1;
      }

      if (b.metadata?.partySize) {
        sizeCounts[b.metadata.partySize] =
          (sizeCounts[b.metadata.partySize] || 0) + 1;
      }

      if (b.metadata?.amount) {
        totalSpend += b.metadata.amount;
      }

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
  }, [recall]);

  /**
   * Get spending summary
   */
  const getSpendingSummary = useCallback(
    async (days: number = 30): Promise<SpendingSummary> => {
      const transactions = await recall('spent', {
        type: 'transaction',
        limit: 100,
      });

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

      const topMerchant = Object.entries(merchantCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      const topCategory = Object.entries(categoryCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      return {
        totalSpent,
        transactionCount: transactions.memories.length,
        topMerchant: topMerchant?.[0],
        topCategory: topCategory?.[0],
        averageTransaction: Math.round(totalSpent / transactions.memories.length),
      };
    },
    [recall]
  );

  /**
   * Get conversation context
   */
  const getContext = useCallback(async (): Promise<{
    preferences: Memory[];
    recentActivity: Memory[];
    usual: UsualOrder | null;
    bookingPattern: BookingPattern | null;
  }> => {
    const [preferences, recentActivity, usual, bookingPattern] = await Promise.all([
      recall('preference', { type: 'preference', limit: 10 }),
      recall('', { limit: 10 }),
      getUsual(),
      getBookingPattern(),
    ]);

    return {
      preferences: preferences.memories,
      recentActivity: recentActivity.memories,
      usual,
      bookingPattern,
    };
  }, [recall, getUsual, getBookingPattern]);

  // ============================================
  // LEARN FROM EVENT
  // ============================================

  /**
   * Learn from booking event
   */
  const learnFromBooking = useCallback(
    async (booking: {
      merchantName: string;
      cuisine?: string;
      time?: string;
      partySize?: number;
      amount?: number;
    }): Promise<void> => {
      await Promise.all([
        rememberBooking(booking),
        booking.cuisine ? rememberCuisine(booking.cuisine) : Promise.resolve(),
        booking.time ? rememberTimePreference(booking.time) : Promise.resolve(),
        booking.partySize
          ? rememberPartySize(booking.partySize)
          : Promise.resolve(),
      ]);
    },
    [rememberBooking, rememberCuisine, rememberTimePreference, rememberPartySize]
  );

  /**
   * Learn from transaction event
   */
  const learnFromTransaction = useCallback(
    async (transaction: {
      merchantName: string;
      amount: number;
      category?: string;
      items?: string[];
    }): Promise<void> => {
      await Promise.all([
        rememberTransaction(transaction),
        rememberPriceRange(
          transaction.amount < 500
            ? 'budget'
            : transaction.amount < 1500
            ? 'mid'
            : 'premium',
          transaction.amount
        ),
      ]);
    },
    [rememberTransaction, rememberPriceRange]
  );

  // ============================================
  // CLEAR MEMORIES
  // ============================================

  /**
   * Clear all memories of a type
   */
  const clearType = useCallback(
    async (type: MemoryType): Promise<void> => {
      await apiRequest('delete', '/api/memory/clear', { userId, type });
      queryClient.invalidateQueries(['genie-memories', userId]);
    },
    [userId]
  );

  /**
   * Delete a specific memory
   */
  const deleteMemory = useCallback(
    async (memoryId: string): Promise<void> => {
      await apiRequest('delete', `/api/memory/${memoryId}`);
      queryClient.invalidateQueries(['genie-memories', userId]);
    },
    [userId]
  );

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isLoading: rememberMutation.isPending,
    error,

    // Remember (mutations)
    remember,
    rememberFood,
    rememberCuisine,
    rememberDietary,
    rememberFavoriteRestaurant,
    rememberBooking,
    rememberTransaction,
    rememberPriceRange,
    rememberTimePreference,
    rememberPartySize,

    // Recall (queries)
    recall,
    getUsual,
    getBookingPattern,
    getSpendingSummary,
    getContext,
    getFoodPreferences,
    getCuisinePreferences,
    getDietaryRestrictions,
    getFavoriteRestaurants,

    // Learn
    learnFromBooking,
    learnFromTransaction,

    // Delete
    clearType,
    deleteMemory,
  };
}

// ============================================
// QUERIES (React Query hooks for convenience)
// ============================================

export function useGenieUsual(userId: string) {
  return useQuery({
    queryKey: ['genie-usual', userId],
    queryFn: async () => {
      const genie = new (require('./useGenieMemory').useGenieMemory)(userId);
      return genie.getUsual();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGeniePreferences(userId: string) {
  return useQuery({
    queryKey: ['genie-preferences', userId],
    queryFn: async () => {
      const genie = new (require('./useGenieMemory').useGenieMemory)(userId);
      return genie.getContext();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default useGenieMemory;
