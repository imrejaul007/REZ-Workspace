/**
 * REZ DOOH Real-time Targeting Feed
 *
 * Connects Event Bus intelligence to DOOH screens for real-time targeting
 *
 * This service:
 * 1. Listens to events from Event Bus
 * 2. Enriches with intelligence (intent, segments, predictions)
 * 3. Targets users near DOOH screens
 * 4. Sends targeted ads in real-time
 *
 * Port: 4064
 */

import axios from 'axios';

// ============================================================================
// Service URLs
// ============================================================================

const EVENT_BUS_URL = process.env.EVENT_BUS_URL || 'http://localhost:4025';
const INTENT_SERVICE_URL = process.env.INTENT_SERVICE_URL || 'http://localhost:4018';
const DECISION_ENGINE_URL = process.env.DECISION_ENGINE_URL || 'http://localhost:4128';
const DOOH_SERVICE_URL = process.env.DOOH_SERVICE_URL || 'https://rez-dooh-service.onrender.com';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-token';

// ============================================================================
// Types
// ============================================================================

export interface DOOHTargetingContext {
  screenId: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  screenType: 'cab_tablet' | 'retail_kiosk' | 'elevator_screen' | 'billboard_led' | 'restaurant_order';
  nearbyUsers?: {
    userId: string;
    distance: number;
    lastSeen: string;
  }[];
}

export interface TargetedAd {
  screenId: string;
  campaignId: string;
  adId: string;
  adContent: {
    title: string;
    description?: string;
    imageUrl?: string;
    callToAction?: string;
    deeplink?: string;
  };
  targeting: {
    reason: string;
    confidence: number;
    userSegments: string[];
    predictedIntent?: string;
  };
  displayDuration: number;
  expiresAt: string;
}

export interface TargetingRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    screenType?: string[];
    locationRadius?: number;
    timeOfDay?: { start: number; end: number };
    dayOfWeek?: number[];
    userSegments?: string[];
    predictedIntent?: string[];
  };
  targetingType: 'behavioral' | 'contextual' | 'predictive' | 'demographic';
  bidAdjustment: number;
  active: boolean;
}

// ============================================================================
// DOOH Targeting Feed Service
// ============================================================================

class DOOHTargetingFeedService {
  private eventBus: EventBusClient;
  private targetingRules: TargetingRule[] = [];
  private screenCache: Map<string, DOOHTargetingContext> = new Map();
  private userSegmentCache: Map<string, string[]> = new Map();

  constructor() {
    this.eventBus = new EventBusClient();
    this.initializeTargetingRules();
    this.subscribeToEvents();
  }

  // ============================================
  // Event Subscription
  // ============================================

  private subscribeToEvents(): void {
    // Subscribe to relevant events for targeting

    // Engagement events - for intent signals
    this.eventBus.subscribe('engagement.search.performed', async (event) => {
      await this.handleSearchEvent(event);
    });

    this.eventBus.subscribe('engagement.product.viewed', async (event) => {
      await this.handleProductViewed(event);
    });

    this.eventBus.subscribe('engagement.qr.scanned', async (event) => {
      await this.handleQRScan(event);
    });

    // Commerce events - for purchase intent
    this.eventBus.subscribe('commerce.cart.updated', async (event) => {
      await this.handleCartEvent(event);
    });

    this.eventBus.subscribe('commerce.order.created', async (event) => {
      await this.handleOrderEvent(event);
    });

    // Location events - for proximity targeting
    this.eventBus.subscribe('location.user.nearby', async (event) => {
      await this.handleLocationEvent(event);
    });

    // DOOH events - for attribution
    this.eventBus.subscribe('dooh.ad.impression', async (event) => {
      await this.handleDOOHImpression(event);
    });
  }

  // ============================================
  // Event Handlers
  // ============================================

  private async handleSearchEvent(event): Promise<void> {
    const userId = event.userId;
    const query = event.data?.query || '';

    // Get user segments
    const segments = await this.getUserSegments(userId);

    // Predict intent from search
    const intent = await this.predictIntent(userId, query);

    // Update user context
    this.updateUserContext(userId, {
      segments,
      intent,
      lastSignal: { type: 'search', query, timestamp: event.timestamp }
    });

    // Trigger targeting for nearby screens
    await this.targetNearbyScreens(userId, {
      reason: 'search_intent',
      intent,
      segments
    });
  }

  private async handleProductViewed(event): Promise<void> {
    const userId = event.userId;
    const productId = event.data?.productId;
    const category = event.data?.category;

    // Get user segments
    const segments = await this.getUserSegments(userId);

    // Update intent
    const intent = `product_${category || 'general'}`;

    this.updateUserContext(userId, {
      segments,
      intent,
      lastSignal: { type: 'product_view', productId, category, timestamp: event.timestamp }
    });

    // Target nearby screens
    await this.targetNearbyScreens(userId, {
      reason: 'product_interest',
      intent,
      segments
    });
  }

  private async handleQRScan(event): Promise<void> {
    const userId = event.userId;
    const merchantId = event.data?.merchantId;
    const qrType = event.data?.qrType;

    // Strong purchase intent signal
    const intent = qrType === 'payment' ? 'ready_to_pay' : `qr_scan_${qrType}`;

    this.updateUserContext(userId, {
      intent,
      merchantId,
      lastSignal: { type: 'qr_scan', qrType, merchantId, timestamp: event.timestamp }
    });

    // Target merchant's nearby DOOH screens
    if (merchantId) {
      await this.targetMerchantNearbyScreens(merchantId, userId, intent);
    }
  }

  private async handleCartEvent(event): Promise<void> {
    const userId = event.userId;
    const cartId = event.data?.cartId;
    const total = event.data?.total;

    // High purchase intent
    const intent = 'cart_abandonment_risk';

    this.updateUserContext(userId, {
      intent,
      cartValue: total,
      lastSignal: { type: 'cart_update', cartId, total, timestamp: event.timestamp }
    });

    // If cart value is high, target with urgency
    if (total > 500) {
      await this.targetNearbyScreens(userId, {
        reason: 'high_cart_value',
        intent,
        urgency: 'high'
      });
    }
  }

  private async handleOrderEvent(event): Promise<void> {
    const userId = event.userId;
    const orderId = event.data?.orderId;
    const merchantId = event.data?.merchantId;

    // Update intent
    const intent = 'recent_purchase';

    this.updateUserContext(userId, {
      intent,
      merchantId,
      lastSignal: { type: 'order', orderId, timestamp: event.timestamp }
    });

    // Target with cross-sell / next purchase intent
    await this.targetNearbyScreens(userId, {
      reason: 'post_purchase',
      intent: 'cross_sell'
    });
  }

  private async handleLocationEvent(event): Promise<void> {
    const userId = event.userId;
    const location = event.data?.location;
    const nearbyScreens = event.data?.screens || [];

    if (nearbyScreens.length > 0) {
      // User is near DOOH screens - target them!
      await this.targetScreensForUser(userId, nearbyScreens, location);
    }
  }

  private async handleDOOHImpression(event): Promise<void> {
    const userId = event.userId;
    const screenId = event.data?.screenId;
    const campaignId = event.data?.campaignId;

    // Track impression for attribution
    await this.trackImpression(userId, screenId, campaignId);
  }

  // ============================================
  // Targeting Logic
  // ============================================

  private async targetNearbyScreens(
    userId: string,
    context: {
      reason: string;
      intent?: string;
      segments?: string[];
      urgency?: 'high' | 'medium' | 'low';
    }
  ): Promise<void> {
    // Get nearby screens based on user's last known location
    const nearbyScreens = await this.getNearbyScreens(userId);

    // Select best ads for each screen
    await this.targetScreensForUser(userId, nearbyScreens, context);
  }

  private async targetScreensForUser(
    userId: string,
    screens: DOOHTargetingContext[],
    targetingContext: unknown
  ): Promise<void> {
    for (const screen of screens) {
      // Get targeted ad for this screen
      const targetedAd = await this.getTargetedAd(screen, {
        ...targetingContext,
        userId
      });

      if (targetedAd) {
        // Send ad to DOOH service
        await this.sendAdToScreen(screen.screenId, targetedAd);
      }
    }
  }

  private async targetMerchantNearbyScreens(
    merchantId: string,
    userId: string,
    intent: string
  ): Promise<void> {
    // Find screens near this merchant
    const screens = await this.findScreensNearMerchant(merchantId);

    if (screens.length > 0) {
      await this.targetScreensForUser(userId, screens, {
        reason: 'near_merchant',
        intent,
        merchantId
      });
    }
  }

  private async getTargetedAd(
    screen: DOOHTargetingContext,
    context: {
      userId: string;
      reason: string;
      intent?: string;
      segments?: string[];
      urgency?: 'high' | 'medium' | 'low';
    }
  ): Promise<TargetedAd | null> {
    try {
      // Call Decision Engine for ad selection
      const response = await axios.post(
        `${DECISION_ENGINE_URL}/api/decide`,
        {
          type: 'ad_selection',
          context: {
            userId: context.userId,
            screenId: screen.screenId,
            screenType: screen.screenType,
            location: screen.location,
            userIntent: context.intent,
            userSegments: context.segments || [],
            nearbyMerchantId: screen.nearbyUsers?.[0]?.userId
          }
        },
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );

      if (response.data?.decisions?.[0]) {
        const decision = response.data.decisions[0];
        return {
          screenId: screen.screenId,
          campaignId: decision.campaignId,
          adId: decision.adId,
          adContent: decision.adContent,
          targeting: {
            reason: context.reason,
            confidence: decision.reasoning?.confidence || 0.8,
            userSegments: context.segments || [],
            predictedIntent: context.intent
          },
          displayDuration: this.getDisplayDuration(screen.screenType),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
        };
      }

      return null;
    } catch (e) {
      console.error('Failed to get targeted ad:', e);
      return null;
    }
  }

  private getDisplayDuration(screenType: string): number {
    const durations: Record<string, number> = {
      'cab_tablet': 30,
      'retail_kiosk': 15,
      'elevator_screen': 10,
      'billboard_led': 60,
      'restaurant_order': 20
    };
    return durations[screenType] || 15;
  }

  private async sendAdToScreen(screenId: string, ad: TargetedAd): Promise<void> {
    try {
      await axios.post(
        `${DOOH_SERVICE_URL}/api/screens/${screenId}/ad`,
        ad,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 3000
        }
      );
    } catch (e) {
      console.error(`Failed to send ad to screen ${screenId}:`, e);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private async getUserSegments(userId: string): Promise<string[]> {
    // Check cache first
    const cached = this.userSegmentCache.get(userId);
    if (cached && Date.now() - (cached['cachedAt'] as unknown) < 5 * 60 * 1000) {
      return cached;
    }

    try {
      const response = await axios.get(
        `${INTENT_SERVICE_URL}/api/segments/${userId}`,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 2000
        }
      );
      const segments = response.data?.segments || [];
      this.userSegmentCache.set(userId, segments);
      return segments;
    } catch (e) {
      return [];
    }
  }

  private async predictIntent(userId: string, query: string): Promise<string> {
    try {
      const response = await axios.post(
        `${INTENT_SERVICE_URL}/api/intent/predict`,
        { userId, query },
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 2000
        }
      );
      return response.data?.primaryIntent || 'general';
    } catch (e) {
      return 'general';
    }
  }

  private async getNearbyScreens(userId: string): Promise<DOOHTargetingContext[]> {
    // Get user's last location from cache
    const userContext = this.userContextCache.get(userId);
    if (!userContext?.location) return [];

    // Find screens near user
    // In production, this would query a spatial index
    try {
      const response = await axios.get(
        `${DOOH_SERVICE_URL}/api/screens/nearby`,
        {
          params: {
            lat: userContext.location.lat,
            lng: userContext.location.lng,
            radius: 100 // meters
          },
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 2000
        }
      );
      return response.data?.screens || [];
    } catch (e) {
      return [];
    }
  }

  private async findScreensNearMerchant(merchantId: string): Promise<DOOHTargetingContext[]> {
    try {
      const response = await axios.get(
        `${DOOH_SERVICE_URL}/api/screens/merchant/${merchantId}`,
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 2000
        }
      );
      return response.data?.screens || [];
    } catch (e) {
      return [];
    }
  }

  private async trackImpression(
    userId: string,
    screenId: string,
    campaignId: string
  ): Promise<void> {
    try {
      await axios.post(
        `${EVENT_BUS_URL}/api/events`,
        {
          type: 'dooh.ad.targeted_impression',
          userId,
          screenId,
          campaignId,
          timestamp: new Date().toISOString()
        },
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 2000
        }
      );
    } catch (e) {
      // Ignore tracking errors
    }
  }

  private updateUserContext(userId: string, context): void {
    const existing = this.userContextCache.get(userId) || {};
    this.userContextCache.set(userId, {
      ...existing,
      ...context,
      updatedAt: new Date().toISOString()
    });
  }

  private initializeTargetingRules(): void {
    this.targetingRules = [
      {
        id: 'rule_1',
        name: 'High Intent Search',
        priority: 100,
        conditions: {
          userSegments: ['high_intent', 'ready_to_buy']
        },
        targetingType: 'behavioral',
        bidAdjustment: 1.5,
        active: true
      },
      {
        id: 'rule_2',
        name: 'Cart Abandonment',
        priority: 90,
        conditions: {
          predictedIntent: ['cart_abandonment_risk', 'checkout_risk']
        },
        targetingType: 'predictive',
        bidAdjustment: 2.0,
        active: true
      },
      {
        id: 'rule_3',
        name: 'Nearby Merchant',
        priority: 80,
        conditions: {
          locationRadius: 200
        },
        targetingType: 'contextual',
        bidAdjustment: 1.3,
        active: true
      },
      {
        id: 'rule_4',
        name: 'Dinner Time',
        priority: 70,
        conditions: {
          timeOfDay: { start: 18, end: 21 }
        },
        targetingType: 'contextual',
        bidAdjustment: 1.2,
        active: true
      }
    ];
  }

  private userContextCache: Map<string, unknown> = new Map();
}

// ============================================================================
// Event Bus Client (Simple)
// ============================================================================

class EventBusClient {
  private baseUrl: string;
  private handlers: Map<string, Function[]> = new Map();

  constructor() {
    this.baseUrl = EVENT_BUS_URL;
  }

  async subscribe(eventType: string, handler: Function): Promise<void> {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);

    // In production, this would set up WebSocket subscription
    // For now, we poll periodically
    this.pollForEvents(eventType);
  }

  private async pollForEvents(eventType: string): Promise<void> {
    // Simple polling - in production use WebSocket
    setInterval(async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/api/events/type/${eventType}`, {
          params: { limit: 10 },
          timeout: 2000
        });

        const events = response.data?.events || [];
        const handlers = this.handlers.get(eventType) || [];

        for (const event of events) {
          for (const handler of handlers) {
            try {
              handler(event);
            } catch (e) {
              console.error('Event handler error:', e);
            }
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 5000); // Poll every 5 seconds
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const doohTargetingFeed = new DOOHTargetingFeedService();
export default doohTargetingFeed;
