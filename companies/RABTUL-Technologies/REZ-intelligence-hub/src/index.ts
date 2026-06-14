import logger from './utils/logger';

/**
 * REZ Intelligence Hub
 *
 * Central integration layer that wires all intelligence services together
 *
 * Connects:
 * - Event Bus
 * - Central Intent Service
 * - Feature Store
 * - Decision Engine
 * - Commerce Graph
 * - Realtime Profile
 * - ML Observability
 */

import axios from 'axios';
import { EventEmitter } from 'events';

// ============================================
// Service URLs
// ============================================

export const INTELLIGENCE_SERVICES = {
  EVENT_BUS: process.env.EVENT_BUS_URL || 'http://localhost:4025',
  INTENT: process.env.INTENT_SERVICE_URL || 'http://localhost:4018',
  FEATURE_STORE: process.env.FEATURE_STORE_URL || 'http://localhost:4127',
  DECISION: process.env.DECISION_ENGINE_URL || 'http://localhost:4128',
  GRAPH: process.env.GRAPH_SERVICE_URL || 'http://localhost:4129',
  PROFILE: process.env.PROFILE_SERVICE_URL || 'http://localhost:4013',
  OBSERVABILITY: process.env.OBSERVABILITY_URL || 'http://localhost:4130',

  // External services
  CDP: process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com',
  FRAUD: process.env.FRAUD_URL || 'https://REZ-fraud-agent.onrender.com',
  SIGNAL: process.env.SIGNAL_URL || 'https://REZ-signal-aggregator.onrender.com',
  SEGMENTS: process.env.SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com',
  IDENTITY: process.env.IDENTITY_URL || 'https://REZ-identity-graph.onrender.com',
};

const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'your-internal-token';

// ============================================
// Types
// ============================================

export interface UnifiedContext {
  userId?: string;
  merchantId?: string;
  sessionId?: string;
  correlationId?: string;
  location?: { lat: number; lng: number; city?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface IntelligenceResult {
  success: boolean;
  data?;
  errors?: string[];
  latencyMs: number;
}

export interface PersonalizationResult extends IntelligenceResult {
  recommendations?: {
    id: string;
    type: string;
    score: number;
    reason: string;
  }[];
  segments?: string[];
}

export interface PredictionResult extends IntelligenceResult {
  predictions?: {
    intent?: string;
    confidence?: number;
    churnRisk?: number;
    ltv?: number;
    conversionLikelihood?: number;
  };
}

// ============================================
// Intelligence Hub
// ============================================

class IntelligenceHub extends EventEmitter {
  private serviceHealth: Map<string, boolean> = new Map();
  private requestQueue: unknown[] = [];
  private processing = false;

  constructor() {
    super();
    this.initializeHealthChecks();
    this.initializeEventListeners();
  }

  // ============================================
  // Health Checks
  // ============================================

  private async initializeHealthChecks(): Promise<void> {
    // Check service health every 30 seconds
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 30000);
  }

  private async checkServiceHealth(): Promise<void> {
    const services = Object.entries(INTELLIGENCE_SERVICES);

    for (const [name, url] of services) {
      try {
        const response = await axios.get(`${url}/health`, { timeout: 2000 });
        this.serviceHealth.set(name, response.status === 200);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[IntelligenceHub] Health check failed for ${name}: ${errorMessage}`);
        this.serviceHealth.set(name, false);
      }
    }
  }

  getServiceHealth(): Record<string, boolean> {
    return Object.fromEntries(this.serviceHealth);
  }

  // ============================================
  // Event Listeners - Wire services together
  // ============================================

  private initializeEventListeners(): void {
    // Commerce events → Update intent, features, profile
    this.on('commerce:*', async (event) => {
      await this.handleCommerceEvent(event);
    });

    // Identity events → Update graph, profile
    this.on('identity:*', async (event) => {
      await this.handleIdentityEvent(event);
    });

    // Engagement events → Update intent, features
    this.on('engagement:*', async (event) => {
      await this.handleEngagementEvent(event);
    });

    // Intelligence events → Update decisions
    this.on('intelligence:*', async (event) => {
      await this.handleIntelligenceEvent(event);
    });
  }

  private async handleCommerceEvent(event): Promise<void> {
    const { type, userId, merchantId, data } = event;

    // Update user intent
    if (userId) {
      await this.updateUserIntent(userId, type, data);
    }

    // Update graph relationships
    if (userId && merchantId) {
      await this.updateUserMerchantRelationship(userId, merchantId, type, data);
    }

    // Update features
    await this.updateFeatures(userId, type, data);

    // Emit for downstream consumers
    this.emit('commerce:processed', event);
  }

  private async handleIdentityEvent(event): Promise<void> {
    const { type, userId, data } = event;

    // Update user profile
    if (userId) {
      await this.updateUserProfile(userId, data);
    }

    // Update identity graph
    await this.updateIdentityGraph(userId, type, data);

    this.emit('identity:processed', event);
  }

  private async handleEngagementEvent(event): Promise<void> {
    const { type, userId, data } = event;

    // Update user intent
    if (userId) {
      await this.updateUserIntent(userId, type, data);
    }

    this.emit('engagement:processed', event);
  }

  private async handleIntelligenceEvent(event): Promise<void> {
    const { type, userId, data } = event;

    // Update user profile with predictions
    if (userId) {
      await this.updateUserPredictions(userId, type, data);
    }

    // Trigger decisions if needed
    if (type.includes('churn') || type.includes('intent')) {
      await this.triggerDecisions(userId, type, data);
    }

    this.emit('intelligence:processed', event);
  }

  // ============================================
  // Core Intelligence Methods
  // ============================================

  /**
   * Get complete intelligence for a user
   */
  async getUserIntelligence(context: UnifiedContext): Promise<{
    profile;
    intent;
    predictions;
    features;
    segments: string[];
  }> {
    const startTime = Date.now();

    if (!context.userId) {
      return {
        profile: null,
        intent: null,
        predictions: null,
        features: null,
        segments: []
      };
    }

    try {
      // Execute all calls in parallel
      const [profile, intent, predictions, features, segments] = await Promise.allSettled([
        this.getUserProfile(context.userId),
        this.getUserIntent(context.userId),
        this.getUserPredictions(context.userId),
        this.getUserFeatures(context.userId),
        this.getUserSegments(context.userId)
      ]);

      return {
        profile: profile.status === 'fulfilled' ? profile.value : null,
        intent: intent.status === 'fulfilled' ? intent.value : null,
        predictions: predictions.status === 'fulfilled' ? predictions.value : null,
        features: features.status === 'fulfilled' ? features.value : null,
        segments: segments.status === 'fulfilled' ? segments.value : []
      };
    } finally {
      const latencyMs = Date.now() - startTime;
      if (latencyMs > 500) {
        logger.warn(`[IntelligenceHub] Slow getUserIntelligence: ${latencyMs}ms`);
      }
    }
  }

  /**
   * Get personalization for user
   */
  async getPersonalization(context: UnifiedContext): Promise<PersonalizationResult> {
    const startTime = Date.now();

    try {
      const [recommendations, segments] = await Promise.allSettled([
        this.getRecommendations(context),
        this.getUserSegments(context.userId!)
      ]);

      return {
        success: true,
        recommendations: recommendations.status === 'fulfilled' ? recommendations.value : [],
        segments: segments.status === 'fulfilled' ? segments.value : [],
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Make a decision for user
   */
  async makeDecision(context: UnifiedContext, decisionType: string): Promise<IntelligenceResult> {
    const startTime = Date.now();

    try {
      // Call decision engine
      const response = await axios.post(
        `${INTELLIGENCE_SERVICES.DECISION}/api/decide`,
        {
          type: decisionType,
          context,
          options: { includeReasoning: true }
        },
        {
          headers: { 'X-Internal-Token': INTERNAL_TOKEN },
          timeout: 5000
        }
      );

      return {
        success: true,
        data: response.data,
        latencyMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message],
        latencyMs: Date.now() - startTime
      };
    }
  }

  // ============================================
  // Service Integration Methods
  // ============================================

  private async getUserProfile(userId: string): Promise<unknown> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.PROFILE}/api/profiles/${userId}`,
      { timeout: 2000 }
    );
    return response.data;
  }

  private async getUserIntent(userId: string): Promise<unknown> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.INTENT}/api/intent/${userId}`,
      { timeout: 2000 }
    );
    return response.data;
  }

  private async getUserPredictions(userId: string): Promise<unknown> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.INTENT}/api/predictions/${userId}`,
      { timeout: 2000 }
    );
    return response.data;
  }

  private async getUserFeatures(userId: string): Promise<unknown> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.FEATURE_STORE}/api/features/user/${userId}`,
      { timeout: 2000 }
    );
    return response.data;
  }

  private async getUserSegments(userId: string): Promise<string[]> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.SEGMENTS}/api/segments/${userId}`,
      { timeout: 2000 }
    );
    return response.data?.segments || [];
  }

  private async getRecommendations(context: UnifiedContext): Promise<unknown[]> {
    const response = await axios.post(
      `${INTELLIGENCE_SERVICES.INTENT}/api/recommendations`,
      context,
      { timeout: 3000 }
    );
    return response.data?.recommendations || [];
  }

  private async updateUserIntent(userId: string, eventType: string, data): Promise<void> {
    try {
      await axios.post(
        `${INTELLIGENCE_SERVICES.INTENT}/api/intent/capture`,
        { userId, eventType, data },
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to update intent:`, error);
    }
  }

  private async updateUserMerchantRelationship(userId: string, merchantId: string, eventType: string, data): Promise<void> {
    try {
      await axios.post(
        `${INTELLIGENCE_SERVICES.GRAPH}/api/relationships`,
        { userId, merchantId, eventType, data },
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to update graph:`, error);
    }
  }

  private async updateFeatures(userId: string, eventType: string, data): Promise<void> {
    try {
      await axios.post(
        `${INTELLIGENCE_SERVICES.FEATURE_STORE}/api/features/update`,
        { userId, eventType, data },
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to update features:`, error);
    }
  }

  private async updateUserProfile(userId: string, data): Promise<void> {
    try {
      await axios.patch(
        `${INTELLIGENCE_SERVICES.PROFILE}/api/profiles/${userId}`,
        data,
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to update profile:`, error);
    }
  }

  private async updateIdentityGraph(userId: string, eventType: string, data): Promise<void> {
    try {
      await axios.post(
        `${INTELLIGENCE_SERVICES.IDENTITY}/api/link`,
        { userId, eventType, data },
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to update identity graph:`, error);
    }
  }

  private async updateUserPredictions(userId: string, eventType: string, data): Promise<void> {
    try {
      await axios.post(
        `${INTELLIGENCE_SERVICES.PROFILE}/api/predictions/${userId}`,
        { eventType, data },
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to update predictions:`, error);
    }
  }

  private async triggerDecisions(userId: string | undefined, eventType: string, data): Promise<void> {
    if (!userId) return;

    try {
      await axios.post(
        `${INTELLIGENCE_SERVICES.DECISION}/api/trigger`,
        { userId, eventType, data },
        { timeout: 1000 }
      );
    } catch (error) {
      console.warn(`[IntelligenceHub] Failed to trigger decisions:`, error);
    }
  }

  // ============================================
  // Event Publishing
  // ============================================

  /**
   * Publish event to event bus
   */
  async publishEvent(event): Promise<string> {
    const response = await axios.post(
      `${INTELLIGENCE_SERVICES.EVENT_BUS}/api/events`,
      event,
      { timeout: 2000 }
    );
    return response.data.eventId;
  }

  /**
   * Publish commerce event
   */
  async publishCommerceEvent(type: string, data, context: UnifiedContext): Promise<string> {
    const event = {
      type: `commerce.${type}`,
      category: 'commerce',
      version: '1.0.0',
      source: 'intelligence-hub',
      data,
      ...context
    };

    const id = await this.publishEvent(event);

    // Emit for internal processing
    this.emit(`commerce:${type}`, event);

    return id;
  }

  /**
   * Publish intelligence event
   */
  async publishIntelligenceEvent(type: string, data, userId?: string): Promise<string> {
    const event = {
      type: `intelligence.${type}`,
      category: 'intelligence',
      version: '1.0.0',
      source: 'intelligence-hub',
      userId,
      data
    };

    const id = await this.publishEvent(event);

    // Emit for internal processing
    this.emit(`intelligence:${type}`, event);

    return id;
  }

  // ============================================
  // Graph Operations
  // ============================================

  /**
   * Get user network (linked users)
   */
  async getUserNetwork(userId: string): Promise<unknown[]> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.GRAPH}/api/users/${userId}/network`,
      { timeout: 3000 }
    );
    return response.data?.nodes || [];
  }

  /**
   * Get user merchants
   */
  async getUserMerchants(userId: string): Promise<unknown[]> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.GRAPH}/api/users/${userId}/merchants`,
      { timeout: 3000 }
    );
    return response.data?.merchants || [];
  }

  /**
   * Record purchase
   */
  async recordPurchase(userId: string, merchantId: string, orderData): Promise<void> {
    await axios.post(`${INTELLIGENCE_SERVICES.GRAPH}/api/purchases`, {
      userId,
      merchantId,
      ...orderData
    }, { timeout: 2000 });
  }

  // ============================================
  // DOOH Targeting
  // ============================================

  /**
   * Get DOOH targeting data for user
   */
  async getDOOHTargeting(userId: string): Promise<{
    segments: string[];
    scores: Record<string, number>;
    locationContext?;
  }> {
    const response = await axios.get(
      `${INTELLIGENCE_SERVICES.PROFILE}/api/dooh/${userId}`,
      { timeout: 2000 }
    );
    return response.data || { segments: ['general'], scores: { general: 1.0 } };
  }

  /**
   * Get ad decision for screen
   */
  async getAdDecision(screenId: string, userId?: string, context?): Promise<unknown> {
    const response = await axios.post(
      `${INTELLIGENCE_SERVICES.DECISION}/api/decide`,
      {
        type: 'ad_selection',
        context: { screenId, userId, ...context }
      },
      { timeout: 3000 }
    );
    return response.data?.decisions?.[0];
  }
}

// ============================================
// Singleton Export
// ============================================

export const intelligenceHub = new IntelligenceHub();
export default intelligenceHub;


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-intelligence-hub',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
