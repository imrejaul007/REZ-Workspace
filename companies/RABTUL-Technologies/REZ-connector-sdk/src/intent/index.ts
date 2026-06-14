/**
 * Intent Graph Connector - RABTUL Intent/ML Service Client
 *
 * Handles all intent analysis and prediction operations including:
 * - Event tracking
 * - User intent analysis
 * - Preference extraction
 * - Action prediction
 *
 * @example
 * ```typescript
 * import { IntentGraphConnector } from '@rez/connector-sdk/intent';
 *
 * const intent = new IntentGraphConnector({
 *   baseUrl: 'http://localhost:4018',
 *   internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN,
 * });
 *
 * // Track user behavior
 * await intent.trackEvent('user-123', 'product.viewed', { productId: 'prod-456' });
 *
 * // Get user intent
 * const { intent: userIntent, confidence } = await intent.getIntent('user-123');
 * ```
 */

import { BaseConnector } from '../core';
import {
  ApiError,
  TrackEventParams,
  IntentResponse,
  PreferencesResponse,
  PredictionResponse,
  TrackEventSchema,
  GetIntentSchema,
  GetPreferencesSchema,
  PredictSchema,
} from '../types';

// ============================================================================
// Connector Configuration
// ============================================================================

export interface IntentGraphConnectorConfig {
  /** Intent service URL (defaults to INTENT_SERVICE_URL env var or http://localhost:4018) */
  baseUrl?: string;
  /** Internal service token for inter-service communication */
  internalServiceToken?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Number of retry attempts (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

// ============================================================================
// Connector Class
// ============================================================================

export class IntentGraphConnector extends BaseConnector<IntentGraphConnectorConfig> {
  private static readonly SERVICE_NAME = 'intent';
  private static readonly DEFAULT_PORT = 4018;
  private static readonly ENV_VAR = 'INTENT_SERVICE_URL';

  constructor(config: IntentGraphConnectorConfig = {}) {
    const completeConfig: IntentGraphConnectorConfig = {
      baseUrl: config.baseUrl || process.env[IntentGraphConnector.ENV_VAR] || `http://localhost:${IntentGraphConnector.DEFAULT_PORT}`,
      internalServiceToken: config.internalServiceToken || process.env.INTERNAL_SERVICE_TOKEN,
      timeout: config.timeout ?? 30000,
      retries: config.retries ?? 3,
      debug: config.debug ?? false,
    };

    super(completeConfig, IntentGraphConnector.SERVICE_NAME);
  }

  // ============================================================================
  // Event Tracking
  // ============================================================================

  /**
   * Track a user event for intent analysis
   *
   * @param userId - User's unique identifier
   * @param event - Event name (e.g., 'product.viewed', 'search.performed')
   * @param properties - Additional event properties/context
   * @returns Success status
   *
   * @example
   * ```typescript
   * // Track product view
   * await intent.trackEvent('user-123', 'product.viewed', {
   *   productId: 'prod-456',
   *   category: 'electronics',
   *   price: 29999,
   *   brand: 'Samsung'
   * });
   *
   * // Track search behavior
   * await intent.trackEvent('user-123', 'search.performed', {
   *   query: 'wireless headphones',
   *   filters: { brand: 'Sony', maxPrice: 5000 },
   *   resultsCount: 42
   * });
   *
   * // Track purchase
   * await intent.trackEvent('user-123', 'order.completed', {
   *   orderId: 'order-789',
   *   totalAmount: 3500,
   *   itemsCount: 2
   * });
   * ```
   */
  async trackEvent(
    userId: string,
    event: string,
    properties?: Record<string, unknown>
  ): Promise<{ success: boolean } | null> {
    // Validate input with Zod
    const parsed = TrackEventSchema.safeParse({
      userId,
      event,
      properties,
      timestamp: new Date().toISOString(),
    });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<{ success: boolean }>(async () => {
      return this.http.post<{ success: boolean }>('/events/track', {
        userId,
        event,
        properties,
        timestamp: new Date().toISOString(),
      });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Track multiple events in batch
   *
   * @param events - Array of events to track
   * @returns Batch tracking results
   *
   * @example
   * ```typescript
   * await intent.trackBatch([
   *   { userId: 'user-1', event: 'page.viewed', properties: { page: '/home' } },
   *   { userId: 'user-1', event: 'button.clicked', properties: { button: 'signup' } },
   * ]);
   * ```
   */
  async trackBatch(events: Array<{
    userId: string;
    event: string;
    properties?: Record<string, unknown>;
    timestamp?: string;
  }>): Promise<{ success: boolean; tracked: number; failed: number } | null> {
    return this.safeCall(async () => {
      return this.http.post<{ tracked: number; failed: number }>('/events/track/batch', {
        events: events.map((e) => ({
          ...e,
          timestamp: e.timestamp || new Date().toISOString(),
        })),
      });
    });
  }

  /**
   * Track events from multiple users (user-scoped batching)
   *
   * @param userId - User's unique identifier
   * @param events - Array of events for this user
   * @returns Batch tracking results
   */
  async trackUserBatch(
    userId: string,
    events: Array<{
      event: string;
      properties?: Record<string, unknown>;
      timestamp?: string;
    }>
  ): Promise<{ success: boolean; tracked: number; failed: number } | null> {
    return this.safeCall(async () => {
      return this.http.post<{ tracked: number; failed: number }>(`/users/${userId}/events/batch`, {
        events: events.map((e) => ({
          ...e,
          timestamp: e.timestamp || new Date().toISOString(),
        })),
      });
    });
  }

  // ============================================================================
  // Intent Analysis
  // ============================================================================

  /**
   * Get user's current intent based on behavioral signals
   *
   * @param userId - User's unique identifier
   * @returns Intent analysis with confidence score and supporting signals
   *
   * @example
   * ```typescript
   * const { intent, confidence, signals } = await intent.getIntent('user-123');
   *
   * if (intent === 'ready_to_buy') {
   *   // Show purchase-related recommendations
   * }
   *
   * console.log(`User intent: ${intent} (${(confidence * 100).toFixed(0)}% confidence)`);
   * for (const signal of signals) {
   *   console.log(`  - ${signal.type}: ${signal.value} (weight: ${signal.weight})`);
   * }
   * ```
   */
  async getIntent(userId: string): Promise<IntentResponse | null> {
    // Validate input with Zod
    const parsed = GetIntentSchema.safeParse({ userId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<IntentResponse>(async () => {
      return this.http.get<IntentResponse>(`/users/${userId}/intent`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get intent with time range filter
   *
   * @param userId - User's unique identifier
   * @param timeRange - Time range for analysis (e.g., '1h', '24h', '7d', '30d')
   * @returns Intent analysis for the specified time range
   */
  async getIntentWithRange(
    userId: string,
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d'
  ): Promise<IntentResponse | null> {
    return this.safeCall(async () => {
      return this.http.get<IntentResponse>(`/users/${userId}/intent?range=${timeRange}`);
    });
  }

  /**
   * Get intent segments for a user
   *
   * @param userId - User's unique identifier
   * @returns User segments based on behavior patterns
   */
  async getSegments(userId: string): Promise<{
    segments: Array<{ name: string; score: number; confidence: number }>;
    primarySegment: string;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        segments: Array<{ name: string; score: number; confidence: number }>;
        primarySegment: string;
      }>(`/users/${userId}/segments`);
    });
  }

  // ============================================================================
  // Preferences
  // ============================================================================

  /**
   * Get user's inferred preferences
   *
   * @param userId - User's unique identifier
   * @returns User preferences across different categories
   *
   * @example
   * ```typescript
   * const { preferences, computedAt } = await intent.getPreferences('user-123');
   *
   * for (const pref of preferences) {
   *   console.log(`${pref.category}.${pref.key}: ${pref.value} (confidence: ${pref.confidence})`);
   * }
   * ```
   */
  async getPreferences(userId: string): Promise<PreferencesResponse | null> {
    // Validate input with Zod
    const parsed = GetPreferencesSchema.safeParse({ userId });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<PreferencesResponse>(async () => {
      return this.http.get<PreferencesResponse>(`/users/${userId}/preferences`);
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Get preferences for a specific category
   *
   * @param userId - User's unique identifier
   * @param category - Preference category (e.g., 'product', 'content', 'communication')
   * @returns Category-specific preferences
   */
  async getPreferencesByCategory(
    userId: string,
    category: string
  ): Promise<{
    preferences: Array<{ key: string; value: string | number | boolean; category: string; confidence: number }>;
    userId: string;
    computedAt: string;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        preferences: Array<{ key: string; value: string | number | boolean; category: string; confidence: number }>;
        userId: string;
        computedAt: string;
      }>(`/users/${userId}/preferences?category=${encodeURIComponent(category)}`);
    });
  }

  /**
   * Update explicit user preferences (overrides inferred ones)
   *
   * @param userId - User's unique identifier
   * @param preferences - Explicit preference values
   * @returns Updated preferences
   */
  async updateExplicitPreferences(
    userId: string,
    preferences: Array<{ key: string; value: string | number | boolean; category: string }>
  ): Promise<{ success: boolean; error?: ApiError }> {
    return this.safeCall(async () => {
      return this.http.put<{ updated: number }>(`/users/${userId}/preferences/explicit`, {
        preferences,
      });
    });
  }

  // ============================================================================
  // Prediction
  // ============================================================================

  /**
   * Predict probability of a user taking a specific action
   *
   * @param userId - User's unique identifier
   * @param action - Action to predict (e.g., 'purchase', 'churn', 'upgrade')
   * @returns Prediction with probability and contributing factors
   *
   * @example
   * ```typescript
   * // Predict purchase probability
   * const { probability, factors } = await intent.predict('user-123', 'purchase');
   * console.log(`Purchase probability: ${(probability * 100).toFixed(1)}%`);
   *
   * for (const factor of factors) {
   *   console.log(`  ${factor.key}: ${(factor.contribution * 100).toFixed(1)}%`);
   * }
   *
   * // Predict churn risk
   * const churn = await intent.predict('user-123', 'churn');
   * if (churn.probability > 0.7) {
   *   // Trigger retention campaign
   * }
   * ```
   */
  async predict(userId: string, action: string): Promise<PredictionResponse | null> {
    // Validate input with Zod
    const parsed = PredictSchema.safeParse({ userId, action });
    if (!parsed.success) {
      return null;
    }

    const result = await this.safeCall<PredictionResponse>(async () => {
      return this.http.post<PredictionResponse>(`/users/${userId}/predict`, { action });
    });

    if (!result.success) {
      return null;
    }

    return result.data ?? null;
  }

  /**
   * Predict multiple actions at once
   *
   * @param userId - User's unique identifier
   * @param actions - Array of actions to predict
   * @returns Predictions for all actions
   */
  async predictBatch(
    userId: string,
    actions: string[]
  ): Promise<{
    predictions: Array<{
      action: string;
      probability: number;
      factors: Array<{ key: string; contribution: number }>;
      predictedAt: string;
    }>;
  } | null> {
    return this.safeCall(async () => {
      return this.http.post<{
        predictions: Array<{
          action: string;
          probability: number;
          factors: Array<{ key: string; contribution: number }>;
          predictedAt: string;
        }>;
      }>(`/users/${userId}/predict/batch`, { actions });
    });
  }

  /**
   * Get recommended actions for a user
   *
   * @param userId - User's unique identifier
   * @param context - Context for recommendations (e.g., 'product_page', 'checkout')
   * @returns Ranked list of recommended actions
   */
  async getRecommendations(
    userId: string,
    context?: string
  ): Promise<{
    recommendations: Array<{
      action: string;
      score: number;
      reason: string;
    }>;
  } | null> {
    return this.safeCall(async () => {
      const params = context ? `?context=${encodeURIComponent(context)}` : '';
      return this.http.get<{
        recommendations: Array<{
          action: string;
          score: number;
          reason: string;
        }>;
      }>(`/users/${userId}/recommendations${params}`);
    });
  }

  // ============================================================================
  // User Profile Enrichment
  // ============================================================================

  /**
   * Get enriched user profile with ML insights
   *
   * @param userId - User's unique identifier
   * @returns Enriched profile with intent signals and predictions
   */
  async getUserProfile(userId: string): Promise<{
    userId: string;
    intent: string;
    confidence: number;
    segments: string[];
    lifetimeValue: 'low' | 'medium' | 'high' | 'premium';
    engagement: 'low' | 'medium' | 'high' | 'very_high';
    churnRisk: 'low' | 'medium' | 'high';
    purchaseProbability: number;
    preferences: Record<string, unknown>;
    lastUpdated: string;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        userId: string;
        intent: string;
        confidence: number;
        segments: string[];
        lifetimeValue: 'low' | 'medium' | 'high' | 'premium';
        engagement: 'low' | 'medium' | 'high' | 'very_high';
        churnRisk: 'low' | 'medium' | 'high';
        purchaseProbability: number;
        preferences: Record<string, unknown>;
        lastUpdated: string;
      }>(`/users/${userId}/profile`);
    });
  }

  /**
   * Get user's engagement score
   *
   * @param userId - User's unique identifier
   * @returns Engagement metrics
   */
  async getEngagementScore(userId: string): Promise<{
    score: number;
    level: 'inactive' | 'low' | 'medium' | 'high' | 'very_high';
    trend: 'declining' | 'stable' | 'growing';
    lastActive: string;
    activityBreakdown: {
      sessions: number;
      eventsTracked: number;
      avgSessionDuration: number;
    };
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        score: number;
        level: 'inactive' | 'low' | 'medium' | 'high' | 'very_high';
        trend: 'declining' | 'stable' | 'growing';
        lastActive: string;
        activityBreakdown: {
          sessions: number;
          eventsTracked: number;
          avgSessionDuration: number;
        };
      }>(`/users/${userId}/engagement`);
    });
  }

  // ============================================================================
  // Cohort & Analytics
  // ============================================================================

  /**
   * Get users in the same intent cohort
   *
   * @param userId - Reference user's unique identifier
   * @param limit - Maximum number of similar users to return
   * @returns Similar users based on intent patterns
   */
  async getSimilarUsers(userId: string, limit = 10): Promise<{
    users: Array<{
      userId: string;
      similarityScore: number;
      commonIntents: string[];
    }>;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        users: Array<{
          userId: string;
          similarityScore: number;
          commonIntents: string[];
        }>;
      }>(`/users/${userId}/similar?limit=${limit}`);
    });
  }

  /**
   * Get trending intents in a segment
   *
   * @param segment - Segment name (e.g., 'new_users', 'power_users')
   * @param timeRange - Time range for analysis
   * @returns Trending intents for the segment
   */
  async getTrendingIntents(
    segment?: string,
    timeRange: '1h' | '24h' | '7d' = '24h'
  ): Promise<{
    intents: Array<{
      intent: string;
      count: number;
      trend: 'rising' | 'stable' | 'falling';
      changePercent: number;
    }>;
  } | null> {
    return this.safeCall(async () => {
      const params = new URLSearchParams({ range: timeRange });
      if (segment) params.set('segment', segment);
      return this.http.get<{
        intents: Array<{
          intent: string;
          count: number;
          trend: 'rising' | 'stable' | 'falling';
          changePercent: number;
        }>;
      }>(`/insights/trending-intents?${params.toString()}`);
    });
  }

  // ============================================================================
  // A/B Testing & Experiments
  // ============================================================================

  /**
   * Get user's experiment assignments
   *
   * @param userId - User's unique identifier
   * @returns Active experiment assignments
   */
  async getExperimentAssignments(userId: string): Promise<{
    experiments: Array<{
      experimentId: string;
      variant: string;
      assignedAt: string;
    }>;
  } | null> {
    return this.safeCall(async () => {
      return this.http.get<{
        experiments: Array<{
          experimentId: string;
          variant: string;
          assignedAt: string;
        }>;
      }>(`/users/${userId}/experiments`);
    });
  }

  // ============================================================================
  // Health Check
  // ============================================================================

  /**
   * Check if the intent service is healthy
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    const start = Date.now();
    try {
      const response = await this.http.get<{ status: string }>('/health');
      return {
        healthy: response.success,
        latency: Date.now() - start,
      };
    } catch {
      return { healthy: false };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let intentInstance: IntentGraphConnector | null = null;

/**
 * Get or create a singleton IntentGraphConnector instance
 *
 * @param config - Optional configuration override
 * @returns IntentGraphConnector instance
 */
export function createIntentConnector(config?: IntentGraphConnectorConfig): IntentGraphConnector {
  if (!intentInstance) {
    intentInstance = new IntentGraphConnector(config);
  } else if (config) {
    intentInstance = new IntentGraphConnector(config);
  }
  return intentInstance;
}

/**
 * Reset the singleton instance (mainly for testing)
 */
export function resetIntentConnector(): void {
  intentInstance = null;
}