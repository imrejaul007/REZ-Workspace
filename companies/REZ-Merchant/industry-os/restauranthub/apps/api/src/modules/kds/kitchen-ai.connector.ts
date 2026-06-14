/**
 * Kitchen AI Connector
 *
 * Bridges RestaurantHub KDS to Kitchen AI service for order analysis.
 *
 * Integration Flow:
 * 1. KDS receives new order from OrdersService
 * 2. Kitchen AI connector maps order to KitchenAI format
 * 3. Kitchen AI analyzes order (prep time, routing, fire suggestions)
 * 4. Insights returned to KDS or logged for dashboard
 *
 * Kitchen AI Endpoints:
 * - POST /analyze     - Full order analysis with prep time + routing
 * - POST /route       - Station routing only
 * - POST /priority    - Priority scoring
 * - POST /prep-time   - Prep time prediction
 * - POST /fire        - Firing suggestions
 * - GET  /status      - Kitchen status (utilization, alerts)
 * - GET  /metrics     - Performance metrics
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { z, ZodSchema } from 'zod';

// =============================================================================
// Types
// =============================================================================

/** Station types supported by Kitchen AI */
export type KitchenAIStationType =
  | 'grill'
  | 'fry'
  | 'saute'
  | 'pasta'
  | 'salad'
  | 'dessert'
  | 'beverage'
  | 'expo';

/** Order item in Kitchen AI format */
export interface KitchenAIOrderItem {
  id: string;
  name: string;
  station: KitchenAIStationType;
  prepTime: number; // base prep time in minutes
  cookTime: number; // base cook time in minutes
  quantity: number;
  modifiers?: string[];
  dependencies?: string[];
}

/** Order in Kitchen AI format */
export interface KitchenAIOrder {
  orderId: string;
  items: KitchenAIOrderItem[];
  priority: number; // 1-5, 1 being highest
  targetReadyTime?: string;
  customerId?: string;
  merchantId?: string;
}

/** Prep time prediction from Kitchen AI */
export interface PrepTimePrediction {
  estimatedMinutes: number;
  confidence: number; // 0-1
  factors: Array<{
    name: string;
    impact: number;
    weight: number;
  }>;
  stationBreakdown: Array<{
    station: KitchenAIStationType;
    estimatedMinutes: number;
    queueAhead: number;
  }>;
}

/** Station routing assignment */
export interface StationAssignment {
  station: KitchenAIStationType;
  items: string[];
  load: number;
}

/** Full order analysis result */
export interface OrderAnalysisResult {
  orderId: string;
  totalPrepTime: number;
  confidence: number;
  itemPredictions: PrepTimePrediction[];
  routing: Record<KitchenAIStationType, number>;
  stationBreakdown: PrepTimePrediction['stationBreakdown'];
}

/** Priority score result */
export interface PriorityResult {
  score: number;
  level: 'critical' | 'high' | 'normal' | 'low';
  waitTimeMinutes: number;
  rushItems: number;
  reasons: string[];
}

/** Fire suggestion for station */
export interface FireSuggestion {
  itemId: string;
  orderId: string;
  fireAt: string;
  station: KitchenAIStationType;
  priority: number;
  urgency: 'critical' | 'high' | 'normal' | 'low';
  reason: string;
}

/** Kitchen status metrics */
export interface KitchenStatus {
  stations: number;
  stationUtilization: Record<string, number>;
  nextOrder: string | null;
  activeAlerts: number;
}

/** Performance metrics */
export interface PerformanceMetrics {
  metrics: {
    totalOrders: number;
    delayedOrders: number;
    onTimeRate: number;
    avgPrepTime: number;
    stationMetrics: Record<string, unknown>;
    periodHours: number;
  };
  insights: string[];
  timeRange: string;
}

/** KDS order item format (from OrdersService) */
export interface KDSOrderItem {
  id: string;
  name?: string;
  productId?: string;
  quantity: number;
  price?: number;
  cookingTime?: number;
  station?: string;
  allergens?: string[];
  modifications?: string[];
}

/** KDS order format (from OrdersService) */
export interface KDSOrder {
  orderId: string;
  orderNumber: string;
  orderType: 'delivery' | 'pickup' | 'dine-in';
  items: KDSOrderItem[];
  specialInstructions?: string | null;
  storeId: string;
  customerId?: string;
  priority?: number;
  targetReadyTime?: string;
}

// =============================================================================
// Response Schemas (Zod validation)
// =============================================================================

const KitchenAIResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

const AnalysisResultSchema = z.object({
  orderId: z.string(),
  totalPrepTime: z.number(),
  confidence: z.number(),
  itemPredictions: z.array(z.object({
    estimatedMinutes: z.number(),
    confidence: z.number(),
    factors: z.array(z.object({
      name: z.string(),
      impact: z.number(),
      weight: z.number(),
    })),
    stationBreakdown: z.array(z.object({
      station: z.string(),
      estimatedMinutes: z.number(),
      queueAhead: z.number(),
    })),
  })),
  routing: z.record(z.string(), z.number()),
  stationBreakdown: z.array(z.unknown()),
});

const PriorityResultSchema = z.object({
  priority: z.object({
    score: z.number(),
    level: z.enum(['critical', 'high', 'normal', 'low']),
    waitTimeMinutes: z.number(),
    rushItems: z.number(),
    reasons: z.array(z.string()),
  }),
});

const FireSuggestionsSchema = z.object({
  orderId: z.string(),
  suggestions: z.array(z.object({
    itemId: z.string(),
    orderId: z.string(),
    fireAt: z.string(),
    station: z.string(),
    priority: z.number(),
    urgency: z.enum(['critical', 'high', 'normal', 'low']),
    reason: z.string(),
  })),
  totalItems: z.number(),
  criticalItems: z.number(),
});

const KitchenStatusSchema = z.object({
  stations: z.number(),
  stationUtilization: z.record(z.string(), z.number()),
  nextOrder: z.union([z.string(), z.null()]),
  activeAlerts: z.number(),
});

const PerformanceMetricsSchema = z.object({
  metrics: z.object({
    totalOrders: z.number(),
    delayedOrders: z.number(),
    onTimeRate: z.number(),
    avgPrepTime: z.number(),
    stationMetrics: z.record(z.string(), z.unknown()),
    periodHours: z.number(),
  }),
  insights: z.array(z.string()),
  timeRange: z.string(),
});

const RouteResponseSchema = z.object({
  assignments: z.array(z.object({
    station: z.string(),
    items: z.array(z.string()),
    load: z.number(),
  })),
  totalItems: z.number(),
  utilization: z.record(z.string(), z.number()),
});

// =============================================================================
// Connector
// =============================================================================

@Injectable()
export class KitchenAIConnector {
  private readonly logger = new Logger(KitchenAIConnector.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;

  constructor(private readonly config: ConfigService) {
    // Load configuration
    this.baseUrl = this.config.get<string>(
      'KITCHEN_AI_URL',
      process.env.KITCHEN_AI_URL || 'http://localhost:4082',
    );
    this.timeout = this.config.get<number>('KITCHEN_AI_TIMEOUT', 5000) as number;
    this.retryAttempts = this.config.get<number>('KITCHEN_AI_RETRY_ATTEMPTS', 2) as number;

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Name': 'restauranthub-kds',
      },
    });

    this.logger.log(`[KitchenAI] Connector initialized, base URL: ${this.baseUrl}`);
  }

  /**
   * Validate data against a Zod schema with error handling.
   */
  private validateWithZod<T>(schema: ZodSchema<T>, data: unknown, context: string): { success: true; data: T } | { success: false; error: string } {
    try {
      const result = schema.safeParse(data);
      if (result.success) {
        return { success: true, data: result.data };
      }
      const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      this.logger.warn(`[${context}] Zod validation failed: ${errorMessages.join(', ')}`);
      return { success: false, error: errorMessages.join('; ') };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${context}] Zod validation threw: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Analyze an order for prep time, routing, and station breakdown.
   * This is the primary method called after notifyNewOrder.
   *
   * @param kdsOrder - Order from KDS/OrdersService
   * @returns Full analysis result or null on failure
   */
  async analyzeOrder(kdsOrder: KDSOrder): Promise<OrderAnalysisResult | null> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    this.logger.log(
      `[${requestId}] Analyzing order ${kdsOrder.orderId} (${kdsOrder.orderNumber})`,
    );

    try {
      // Map KDS order to Kitchen AI format
      const kitchenAIOrder: KitchenAIOrder = this.mapKDSOrderToKitchenAI(kdsOrder);

      const response = await this.httpClient.post('/analyze', {
        orderId: kitchenAIOrder.orderId,
        items: kitchenAIOrder.items,
        priority: kitchenAIOrder.priority,
        targetReadyTime: kitchenAIOrder.targetReadyTime,
        customerId: kitchenAIOrder.customerId,
        merchantId: kdsOrder.storeId,
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `[${requestId}] Analysis complete for ${kdsOrder.orderId} (${duration}ms)`,
      );

      // Validate response with Zod
      const parsed = this.validateWithZod(
        KitchenAIResponseSchema,
        response.data,
        'KitchenAI /analyze response',
      );

      if (!parsed.success) {
        this.logger.warn(
          `[${requestId}] Invalid response schema from KitchenAI: ${parsed.error}`,
        );
        return null;
      }

      const analysisResult = this.validateWithZod(
        AnalysisResultSchema,
        parsed.data,
        'KitchenAI analysis result',
      );

      if (!analysisResult.success) {
        this.logger.warn(
          `[${requestId}] Invalid analysis result: ${analysisResult.error}`,
        );
        return null;
      }

      return analysisResult.data;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        `[${requestId}] KitchenAI analysis failed for order ${kdsOrder.orderId}: ${errorMessage} (${duration}ms)`,
      );

      // Kitchen AI failure should NOT break KDS - return null for graceful degradation
      return null;
    }
  }

  /**
   * Get station routing for order items.
   * Useful when you need routing without full analysis.
   */
  async getStationRouting(items: KitchenAIOrderItem[]): Promise<StationAssignment[] | null> {
    const requestId = this.generateRequestId();

    this.logger.log(`[${requestId}] Getting station routing for ${items.length} items`);

    try {
      const response = await this.httpClient.post('/route', { items });

      const parsed = this.validateWithZod(
        KitchenAIResponseSchema,
        response.data,
        'KitchenAI /route response',
      );

      if (!parsed.success) {
        this.logger.warn(
          `[${requestId}] Invalid response schema from KitchenAI /route: ${parsed.error}`,
        );
        return null;
      }

      // The data is inside parsed.data.data due to the wrapper
      const routeResult = this.validateWithZod(
        RouteResponseSchema,
        parsed.data.data,
        'KitchenAI route result',
      );

      if (!routeResult.success) {
        this.logger.warn(`[${requestId}] Invalid route result: ${routeResult.error}`);
        return null;
      }

      return routeResult.data.assignments;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Station routing failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Get priority score for an order based on wait time.
   */
  async getPriorityScore(
    orderId: string,
    items: KitchenAIOrderItem[],
    timeWaitingMinutes: number,
  ): Promise<PriorityResult | null> {
    const requestId = this.generateRequestId();

    this.logger.log(
      `[${requestId}] Getting priority for order ${orderId}, wait: ${timeWaitingMinutes}min`,
    );

    try {
      const response = await this.httpClient.post('/priority', {
        orderId,
        items,
        timeWaiting: timeWaitingMinutes,
      });

      const parsed = this.validateWithZod(
        KitchenAIResponseSchema,
        response.data,
        'KitchenAI /priority response',
      );

      if (!parsed.success) {
        this.logger.warn(
          `[${requestId}] Invalid response schema from KitchenAI /priority: ${parsed.error}`,
        );
        return null;
      }

      // The data is nested inside the response wrapper
      const wrappedSchema = z.object({ priority: PriorityResultSchema.shape.priority });
      const priorityResult = this.validateWithZod(
        wrappedSchema,
        parsed.data.data,
        'KitchenAI priority result',
      );

      if (!priorityResult.success) {
        this.logger.warn(
          `[${requestId}] Invalid priority result: ${priorityResult.error}`,
        );
        return null;
      }

      return priorityResult.data.priority;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Priority scoring failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Get firing suggestions for optimal cooking sequence.
   */
  async getFireSuggestions(kdsOrder: KDSOrder): Promise<FireSuggestion[] | null> {
    const requestId = this.generateRequestId();

    this.logger.log(`[${requestId}] Getting fire suggestions for order ${kdsOrder.orderId}`);

    try {
      const kitchenAIOrder = this.mapKDSOrderToKitchenAI(kdsOrder);

      const response = await this.httpClient.post('/fire', {
        orderId: kitchenAIOrder.orderId,
        items: kitchenAIOrder.items,
        priority: kitchenAIOrder.priority,
        targetReadyTime: kitchenAIOrder.targetReadyTime,
      });

      const parsed = this.validateWithZod(
        KitchenAIResponseSchema,
        response.data,
        'KitchenAI /fire response',
      );

      if (!parsed.success) {
        this.logger.warn(
          `[${requestId}] Invalid response schema from KitchenAI /fire: ${parsed.error}`,
        );
        return null;
      }

      // Wrap the schema to match the nested data structure
      const fireResultSchema = z.object({
        suggestions: FireSuggestionsSchema.shape.suggestions,
        orderId: z.string(),
        totalItems: z.number(),
        criticalItems: z.number(),
      });

      const fireResult = this.validateWithZod(
        fireResultSchema,
        parsed.data.data,
        'KitchenAI fire suggestions',
      );

      if (!fireResult.success) {
        this.logger.warn(
          `[${requestId}] Invalid fire suggestions: ${fireResult.error}`,
        );
        return null;
      }

      return fireResult.data.suggestions;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Fire suggestions failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Get AI insights for a restaurant (aggregated metrics and recommendations).
   */
  async getInsights(restaurantId: string, hours: number = 24): Promise<PerformanceMetrics | null> {
    const requestId = this.generateRequestId();

    this.logger.log(`[${requestId}] Getting insights for restaurant ${restaurantId}`);

    try {
      const response = await this.httpClient.get('/metrics', {
        params: { hours },
      });

      const parsed = this.validateWithZod(
        KitchenAIResponseSchema,
        response.data,
        'KitchenAI /metrics response',
      );

      if (!parsed.success) {
        this.logger.warn(
          `[${requestId}] Invalid response schema from KitchenAI /metrics: ${parsed.error}`,
        );
        return null;
      }

      const metricsResult = this.validateWithZod(
        PerformanceMetricsSchema,
        parsed.data.data,
        'KitchenAI metrics',
      );

      if (!metricsResult.success) {
        this.logger.warn(
          `[${requestId}] Invalid metrics result: ${metricsResult.error}`,
        );
        return null;
      }

      return metricsResult.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Get insights failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Get current kitchen status (utilization, alerts).
   */
  async getKitchenStatus(): Promise<KitchenStatus | null> {
    const requestId = this.generateRequestId();

    try {
      const response = await this.httpClient.get('/status');

      const parsed = this.validateWithZod(
        KitchenAIResponseSchema,
        response.data,
        'KitchenAI /status response',
      );

      if (!parsed.success) {
        this.logger.warn(
          `[${requestId}] Invalid response schema from KitchenAI /status: ${parsed.error}`,
        );
        return null;
      }

      const statusResult = this.validateWithZod(
        KitchenStatusSchema,
        parsed.data.data,
        'KitchenAI status',
      );

      if (!statusResult.success) {
        this.logger.warn(
          `[${requestId}] Invalid status result: ${statusResult.error}`,
        );
        return null;
      }

      return statusResult.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Get kitchen status failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Report a delay alert to Kitchen AI.
   */
  async reportDelay(orderId: string, delayMinutes: number, merchantId: string): Promise<boolean> {
    const requestId = this.generateRequestId();

    this.logger.log(
      `[${requestId}] Reporting delay for order ${orderId}: ${delayMinutes}min`,
    );

    try {
      const response = await this.httpClient.post('/alert', {
        orderId,
        delay: delayMinutes,
        merchantId,
      });

      if (response.data?.success) {
        this.logger.log(
          `[${requestId}] Delay alert reported for order ${orderId}`,
        );
        return true;
      }
      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Report delay failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Track cook completion for historical data.
   */
  async trackCookCompletion(
    orderId: string,
    items: Array<{
      itemId: string;
      station: KitchenAIStationType;
      cookDuration: number;
      startTime: string;
      endTime: string;
    }>,
    merchantId: string,
    completed: boolean = false,
  ): Promise<boolean> {
    const requestId = this.generateRequestId();

    try {
      const response = await this.httpClient.post('/track-cook', {
        orderId,
        items,
        merchantId,
        completed,
      });

      if (response.data?.success) {
        this.logger.debug(
          `[${requestId}] Cook tracking updated for order ${orderId}`,
        );
        return true;
      }
      return false;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`[${requestId}] Track cook failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Health check for Kitchen AI service.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health', { timeout: 2000 });
      return response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Map KDS order format to Kitchen AI order format.
   * Handles missing fields with sensible defaults.
   */
  private mapKDSOrderToKitchenAI(kdsOrder: KDSOrder): KitchenAIOrder {
    const items: KitchenAIOrderItem[] = kdsOrder.items.map((item, index) => {
      // Infer station from item name or use default
      const station = this.inferStation(item.name || item.productId || `item-${index}`);

      return {
        id: item.id || `item-${kdsOrder.orderId}-${index}`,
        name: item.name || item.productId || 'Unknown Item',
        station,
        prepTime: item.cookingTime || 5, // default 5 min prep
        cookTime: this.estimateCookTime(station, item.quantity),
        quantity: item.quantity,
        modifiers: item.modifications || [],
      };
    });

    return {
      orderId: kdsOrder.orderId,
      items,
      priority: kdsOrder.priority || 3,
      targetReadyTime: kdsOrder.targetReadyTime,
      customerId: kdsOrder.customerId,
      merchantId: kdsOrder.storeId,
    };
  }

  /**
   * Infer station type from item name.
   * Uses keyword matching for common food categories.
   */
  private inferStation(itemName: string): KitchenAIStationType {
    const name = itemName.toLowerCase();

    // Grill items
    if (/\b(steak|burger|grill|bbq|kebab|tikka|seekh|chicken|mutton|lamb|fish|tuna|salmon|prawn|egg)\b/.test(name)) {
      return 'grill';
    }

    // Fry items
    if (/\b(fry|fries|samosa|pakora|vada|fried|chips|wings|nuggets|tempura)\b/.test(name)) {
      return 'fry';
    }

    // Saute items
    if (/\b(saute|stir|curry|masala|biryani|pulao|khichdi)\b/.test(name)) {
      return 'saute';
    }

    // Pasta items
    if (/\b(pasta|macaroni|spaghetti|lasagna|ravioli|noodles|ramen|udon|pho)\b/.test(name)) {
      return 'pasta';
    }

    // Salad items
    if (/\b(salad|green|leaf|caesar|greek|coleslaw|raita|cucumber|tomato|onion)\b/.test(name)) {
      return 'salad';
    }

    // Dessert items
    if (/\b(dessert|ice cream|cake|pie|pudding|gelato|mousse|falooda|halwa|gulab|kulfi)\b/.test(name)) {
      return 'dessert';
    }

    // Beverage items
    if (/\b(drink|beverage|coffee|tea|juice|soda|shake|milkshake|lassi|smoothie|chai|mocha|latte|cappuccino)\b/.test(name)) {
      return 'beverage';
    }

    // Default to expo (assembly/plating station)
    return 'expo';
  }

  /**
   * Estimate cook time based on station type and quantity.
   */
  private estimateCookTime(station: KitchenAIStationType, quantity: number): number {
    // Base cook times by station (in minutes)
    const baseTimes: Record<KitchenAIStationType, number> = {
      grill: 12,
      fry: 8,
      saute: 10,
      pasta: 15,
      salad: 5,
      dessert: 8,
      beverage: 3,
      expo: 2,
    };

    const baseTime = baseTimes[station] || 10;

    // Quantity affects time with diminishing returns
    const quantityMultiplier = Math.sqrt(quantity);

    return Math.round(baseTime * quantityMultiplier);
  }

  /**
   * Generate a short request ID for tracing.
   */
  private generateRequestId(): string {
    return `kds-ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
}

// =============================================================================
// Re-export types for consumers
// =============================================================================

export type {
  KitchenAIOrder,
  KitchenAIOrderItem,
  KitchenAIStationType,
  OrderAnalysisResult,
  StationAssignment,
  PrepTimePrediction,
  PriorityResult,
  FireSuggestion,
  KitchenStatus,
  PerformanceMetrics,
  KDSOrder,
  KDSOrderItem,
};
