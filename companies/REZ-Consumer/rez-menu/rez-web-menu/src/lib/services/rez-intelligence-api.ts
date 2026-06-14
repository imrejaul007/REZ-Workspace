/**
 * ReZ Intelligence API Client
 * AI/ML services for Menu Personalization
 *
 * Services: Intent Capture, Demand Signals, Scarcity, Personalization, Vector Similarity
 */

const INTELLIGENCE_SERVICES = {
  intent: process.env.NEXT_PUBLIC_INTENT_SERVICE_URL || 'https://rez-intent-predictor.rezapp.com',
  analytics: process.env.NEXT_PUBLIC_ANALYTICS_SERVICE_URL || 'https://REZ-analytics-orchestrator.rezapp.com',
  segments: process.env.NEXT_PUBLIC_SEGMENTS_SERVICE_URL || 'https://REZ-realtime-segments.rezapp.com',
} as const

type IntelligenceService = keyof typeof INTELLIGENCE_SERVICES

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface IntentEvent {
  type: 'view' | 'search' | 'add_cart' | 'remove_cart' | 'checkout_start' | 'checkout_complete' | 'order' | 'cancel'
  itemId?: string
  category?: string
  storeSlug?: string
  metadata?: Record<string, unknown>
  timestamp?: string
}

export interface TrendingItem {
  itemId: string
  name: string
  rank: number
  ordersToday: number
  ordersThisWeek: number
  velocity: number
  trend: 'rising' | 'stable' | 'falling'
  confidence: number
}

export interface ScarcityStatus {
  itemId: string
  status: 'available' | 'low' | 'scarce' | 'soldout'
  quantity: number
  velocity: number
  lastOrdered: string
  estimatedStockout?: string
}

export interface PersonalizedRecommendation {
  itemId: string
  name: string
  price: number
  image?: string
  score: number
  reason: 'taste' | 'history' | 'similar' | 'trending' | 'seasonal' | 'location'
  reasonText?: string
}

export interface PairingItem {
  itemId: string
  name: string
  price: number
  image?: string
  confidence: number
  type: 'frequently_bought' | 'goes_well' | 'alternative'
}

export interface UserAffinity {
  userId: string
  diningAffinity: number
  travelAffinity: number
  retailAffinity: number
  dominantCategory: 'dining' | 'travel' | 'retail'
  preferredPriceRange: 'budget' | 'moderate' | 'expensive'
  dietaryPreferences: string[]
  spiceTolerance?: 'mild' | 'medium' | 'hot'
}

async function fetchAI<T>(
  service: IntelligenceService,
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = INTELLIGENCE_SERVICES[service]
  const url = `${baseUrl}${endpoint}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'AI service timeout' }
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Unknown error' }
  }
}

// INTENT SERVICE
export const IntentService = {
  async captureEvent(userId: string, event: IntentEvent): Promise<ApiResponse<{ eventId: string }>> {
    return fetchAI('intent', '/api/intent/capture', {
      method: 'POST',
      body: JSON.stringify({ userId, ...event, timestamp: event.timestamp || new Date().toISOString() }),
    })
  },

  async getActiveIntents(userId: string): Promise<ApiResponse<{ intents: Array<{ key: string; strength: number; createdAt: string; lastActive: string }> }>> {
    return fetchAI('intent', `/api/intent/active/${userId}`)
  },

  async getDormantIntents(userId: string): Promise<ApiResponse<{ intents: Array<{ key: string; strength: number; dormantDays: number; revivalScore: number }> }>> {
    return fetchAI('intent', `/api/intent/dormant/${userId}`)
  },

  async getCommerceMemory(userId: string): Promise<ApiResponse<UserAffinity>> {
    return fetchAI('intent', `/api/commerce-memory/${userId}`)
  },

  async sendNudge(userId: string, intentKey: string, channel: 'push' | 'whatsapp' | 'sms'): Promise<ApiResponse<{ nudgeId: string; sent: boolean }>> {
    return fetchAI('intent', '/api/intent/nudge/send', {
      method: 'POST',
      body: JSON.stringify({ userId, intentKey, channel }),
    })
  },
}

// DEMAND SERVICE
export const DemandService = {
  async getTrending(storeSlug: string, limit = 10): Promise<ApiResponse<{ items: TrendingItem[] }>> {
    return fetchAI('intent', `/api/demand-signals/${storeSlug}?limit=${limit}`)
  },

  async getDemandAlerts(storeSlug: string): Promise<ApiResponse<{ alerts: Array<{ itemId: string; name: string; spikePercent: number; reason: string }> }>> {
    return fetchAI('intent', `/api/demand-signals/${storeSlug}/alerts`)
  },

  async getPopular(storeSlug: string, period: 'today' | 'week' | 'month' = 'week', limit = 10): Promise<ApiResponse<{ items: TrendingItem[] }>> {
    return fetchAI('intent', `/api/demand-signals/${storeSlug}/popular?period=${period}&limit=${limit}`)
  },
}

// SCARCITY SERVICE
export const ScarcityService = {
  async getStockStatus(storeSlug: string): Promise<ApiResponse<{ items: ScarcityStatus[] }>> {
    return fetchAI('intent', `/api/scarcity/${storeSlug}`)
  },

  async getItemStatus(itemId: string): Promise<ApiResponse<ScarcityStatus>> {
    return fetchAI('intent', `/api/scarcity/item/${itemId}`)
  },

  async getLowStockAlerts(storeSlug: string): Promise<ApiResponse<{ alerts: ScarcityStatus[] }>> {
    return fetchAI('intent', `/api/scarcity/${storeSlug}/alerts`)
  },
}

// PERSONALIZATION SERVICE
export const PersonalizationService = {
  async getRecommendations(userId: string, storeSlug: string, context: 'browse' | 'cart' | 'checkout' = 'browse', limit = 10): Promise<ApiResponse<{ items: PersonalizedRecommendation[] }>> {
    return fetchAI('intent', '/api/personalization/recommendations', {
      method: 'POST',
      body: JSON.stringify({ userId, storeSlug, context, limit }),
    })
  },

  async getTasteProfile(userId: string): Promise<ApiResponse<{
    preferredCuisines: string[]
    spiceTolerance: 'mild' | 'medium' | 'hot'
    dietaryRestrictions: string[]
    priceRange: 'budget' | 'moderate' | 'expensive'
    favoriteItems: string[]
  }>> {
    return fetchAI('intent', `/api/personalization/taste/${userId}`)
  },

  async getRankedMenu(userId: string, storeSlug: string, items: Array<{ id: string; category: string; price: number }>): Promise<ApiResponse<{ ranked: Array<{ itemId: string; rank: number; score: number }> }>> {
    return fetchAI('intent', '/api/personalization/rank', {
      method: 'POST',
      body: JSON.stringify({ userId, storeSlug, items }),
    })
  },
}

// SIMILARITY SERVICE
export const SimilarityService = {
  async findSimilar(itemId: string, storeSlug: string, limit = 5): Promise<ApiResponse<{ items: PairingItem[] }>> {
    return fetchAI('intent', '/api/similar', {
      method: 'POST',
      body: JSON.stringify({ itemId, storeSlug, limit }),
    })
  },

  async getPairs(itemId: string, storeSlug: string, limit = 4): Promise<ApiResponse<{ items: PairingItem[] }>> {
    return fetchAI('intent', '/api/pairs', {
      method: 'POST',
      body: JSON.stringify({ itemId, storeSlug, limit }),
    })
  },

  async getAlternatives(itemId: string, storeSlug: string, filter?: { maxPrice?: number; dietary?: string[] }): Promise<ApiResponse<{ items: PairingItem[] }>> {
    return fetchAI('intent', '/api/alternatives', {
      method: 'POST',
      body: JSON.stringify({ itemId, storeSlug, filter }),
    })
  },
}

// INSIGHT SERVICE
export const InsightService = {
  async getUpsellOpportunities(cartItems: string[], storeSlug: string): Promise<ApiResponse<{ items: Array<{ itemId: string; name: string; price: number; confidence: number; upsellText: string }> }>> {
    return fetchAI('intent', '/api/insights/upsell', {
      method: 'POST',
      body: JSON.stringify({ cartItems, storeSlug }),
    })
  },

  async getWeatherSuggestions(storeSlug: string, weather: { temp: number; condition: string }): Promise<ApiResponse<{ items: Array<{ itemId: string; name: string; reason: string }> }>> {
    return fetchAI('intent', '/api/insights/weather', {
      method: 'POST',
      body: JSON.stringify({ storeSlug, weather }),
    })
  },

  async getTimeSuggestions(storeSlug: string): Promise<ApiResponse<{ suggestions: Array<{ period: string; items: string[] }> }>> {
    return fetchAI('intent', `/api/insights/time/${storeSlug}`)
  },
}

// RECOVERY SERVICE
export const RecoveryService = {
  async getAbandonedCart(userId: string): Promise<ApiResponse<UserAffinity & { abandonedItems: Array<{ itemId: string; name: string; price: number; quantity: number }> }>> {
    return fetchAI('intent', `/api/recovery/cart/${userId}`)
  },

  async sendRecoveryNudge(userId: string, channel: 'push' | 'whatsapp' | 'sms', offer?: { discount?: number; freeDelivery?: boolean }): Promise<ApiResponse<{ nudgeId: string; sent: boolean }>> {
    return fetchAI('intent', '/api/recovery/nudge', {
      method: 'POST',
      body: JSON.stringify({ userId, channel, offer }),
    })
  },

  async trackNudgeEngagement(nudgeId: string, action: 'delivered' | 'viewed' | 'clicked' | 'converted'): Promise<ApiResponse<{ tracked: boolean }>> {
    return fetchAI('intent', '/api/recovery/track', {
      method: 'POST',
      body: JSON.stringify({ nudgeId, action }),
    })
  },
}

// SEGMENT SERVICE
export const SegmentService = {
  async getUserSegments(userId: string): Promise<ApiResponse<{ segments: string[] }>> {
    return fetchAI('segments', `/api/segments/user/${userId}`)
  },

  async getSegmentMembers(segmentName: string): Promise<ApiResponse<{ count: number }>> {
    return fetchAI('segments', `/api/segments/${segmentName}/members`)
  },
}

// Export object for convenience
export const ReZIntelligence = {
  intent: IntentService,
  demand: DemandService,
  scarcity: ScarcityService,
  personalization: PersonalizationService,
  similarity: SimilarityService,
  insight: InsightService,
  recovery: RecoveryService,
  segments: SegmentService,
}

export default ReZIntelligence
