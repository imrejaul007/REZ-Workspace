/**
 * REZ Consumer App - AI/Intelligence Services
 * ReZ Intelligence for Menu Personalization
 */

// =============================================================================
// Environment Configuration
// =============================================================================

const INTENT_SERVICE = process.env.EXPO_PUBLIC_INTENT_SERVICE || 'https://rez-intent-predictor.rezapp.com';
const ANALYTICS_SERVICE = process.env.EXPO_PUBLIC_ANALYTICS_SERVICE || 'https://REZ-analytics-orchestrator.rezapp.com';
const SEGMENTS_SERVICE = process.env.EXPO_PUBLIC_SEGMENTS_SERVICE || 'https://REZ-realtime-segments.rezapp.com';

// =============================================================================
// HTTP Client
// =============================================================================

async function fetchAI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${INTENT_SERVICE}${endpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'AI service timeout' };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}

// =============================================================================
// Types
// =============================================================================

export interface TrendingItem {
  itemId: string;
  name: string;
  rank: number;
  ordersToday: number;
  ordersThisWeek: number;
  velocity: number;
  trend: 'rising' | 'stable' | 'falling';
  confidence: number;
}

export interface ScarcityStatus {
  itemId: string;
  status: 'available' | 'low' | 'scarce' | 'soldout';
  quantity: number;
  velocity: number;
  lastOrdered: string;
}

export interface PersonalizedRecommendation {
  itemId: string;
  name: string;
  price: number;
  image?: string;
  score: number;
  reason: 'taste' | 'history' | 'similar' | 'trending' | 'seasonal' | 'location';
}

export interface PairingItem {
  itemId: string;
  name: string;
  price: number;
  image?: string;
  confidence: number;
  type: 'frequently_bought' | 'goes_well' | 'alternative';
}

// =============================================================================
// Intent Service
// =============================================================================

export const IntentService = {
  async captureEvent(
    userId: string,
    event: {
      type: 'view' | 'search' | 'add_cart' | 'remove_cart' | 'checkout_start' | 'order';
      itemId?: string;
      storeSlug?: string;
    }
  ) {
    return fetchAI('/api/intent/capture', {
      method: 'POST',
      body: JSON.stringify({ userId, ...event }),
    });
  },

  async getActiveIntents(userId: string) {
    return fetchAI(`/api/intent/active/${userId}`);
  },

  async getCommerceMemory(userId: string) {
    return fetchAI(`/api/commerce-memory/${userId}`);
  },

  async sendNudge(
    userId: string,
    channel: 'push' | 'whatsapp' | 'sms',
    intentKey?: string
  ) {
    return fetchAI('/api/intent/nudge/send', {
      method: 'POST',
      body: JSON.stringify({ userId, channel, intentKey }),
    });
  },
};

// =============================================================================
// Demand Service
// =============================================================================

export const DemandService = {
  async getTrending(storeSlug: string, limit = 10) {
    return fetchAI<{ items: TrendingItem[] }>(
      `/api/demand-signals/${storeSlug}?limit=${limit}`
    );
  },

  async getPopular(
    storeSlug: string,
    period: 'today' | 'week' | 'month' = 'week',
    limit = 10
  ) {
    return fetchAI<{ items: TrendingItem[] }>(
      `/api/demand-signals/${storeSlug}/popular?period=${period}&limit=${limit}`
    );
  },
};

// =============================================================================
// Scarcity Service
// =============================================================================

export const ScarcityService = {
  async getStockStatus(storeSlug: string) {
    return fetchAI<{ items: ScarcityStatus[] }>(`/api/scarcity/${storeSlug}`);
  },

  async getItemStatus(itemId: string) {
    return fetchAI<ScarcityStatus>(`/api/scarcity/item/${itemId}`);
  },
};

// =============================================================================
// Personalization Service
// =============================================================================

export const PersonalizationService = {
  async getRecommendations(
    userId: string,
    storeSlug: string,
    context: 'browse' | 'cart' | 'checkout' = 'browse',
    limit = 10
  ) {
    return fetchAI<{ items: PersonalizedRecommendation[] }>(
      '/api/personalization/recommendations',
      {
        method: 'POST',
        body: JSON.stringify({ userId, storeSlug, context, limit }),
      }
    );
  },

  async getTasteProfile(userId: string) {
    return fetchAI(`/api/personalization/taste/${userId}`);
  },

  async getRankedMenu(
    userId: string,
    storeSlug: string,
    items: Array<{ id: string; category: string; price: number }>
  ) {
    return fetchAI('/api/personalization/rank', {
      method: 'POST',
      body: JSON.stringify({ userId, storeSlug, items }),
    });
  },
};

// =============================================================================
// Similarity Service
// =============================================================================

export const SimilarityService = {
  async findSimilar(itemId: string, storeSlug: string, limit = 5) {
    return fetchAI<{ items: PairingItem[] }>('/api/similar', {
      method: 'POST',
      body: JSON.stringify({ itemId, storeSlug, limit }),
    });
  },

  async getPairs(itemId: string, storeSlug: string, limit = 4) {
    return fetchAI<{ items: PairingItem[] }>('/api/pairs', {
      method: 'POST',
      body: JSON.stringify({ itemId, storeSlug, limit }),
    });
  },

  async getAlternatives(
    itemId: string,
    storeSlug: string,
    filter?: { maxPrice?: number; dietary?: string[] }
  ) {
    return fetchAI<{ items: PairingItem[] }>('/api/alternatives', {
      method: 'POST',
      body: JSON.stringify({ itemId, storeSlug, filter }),
    });
  },
};

// =============================================================================
// Insight Service
// =============================================================================

export const InsightService = {
  async getUpsellOpportunities(cartItems: string[], storeSlug: string) {
    return fetchAI('/api/insights/upsell', {
      method: 'POST',
      body: JSON.stringify({ cartItems, storeSlug }),
    });
  },

  async getTimeSuggestions(storeSlug: string) {
    return fetchAI(`/api/insights/time/${storeSlug}`);
  },
};

// =============================================================================
// Recovery Service
// =============================================================================

export const RecoveryService = {
  async getAbandonedCart(userId: string) {
    return fetchAI(`/api/recovery/cart/${userId}`);
  },

  async sendRecoveryNudge(
    userId: string,
    channel: 'push' | 'whatsapp' | 'sms',
    offer?: { discount?: number; freeDelivery?: boolean }
  ) {
    return fetchAI('/api/recovery/nudge', {
      method: 'POST',
      body: JSON.stringify({ userId, channel, offer }),
    });
  },
};

// =============================================================================
// Exports
// =============================================================================

export const ReZIntelligence = {
  intent: IntentService,
  demand: DemandService,
  scarcity: ScarcityService,
  personalization: PersonalizationService,
  similarity: SimilarityService,
  insight: InsightService,
  recovery: RecoveryService,
};

export default ReZIntelligence;
