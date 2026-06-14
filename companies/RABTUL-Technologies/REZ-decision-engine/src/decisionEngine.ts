/**
 * REZ Real-Time Decision Engine
 *
 * Dynamic decision making for commerce operations
 *
 * Features:
 * - Real-time offer decisions
 * - Next best action
 * - Dynamic pricing
 * - Personalized routing
 * - Fraud decisions
 * - Cashback optimization
 */

import { randomUUID } from 'crypto';
import { featureStore } from '../../../REZ-Intelligence/REZ-feature-store/src/featureStore';

// ============================================================================
// Types
// ============================================================================

export type DecisionType =
  | 'offer'
  | 'cashback'
  | 'personalization'
  | 'routing'
  | 'fraud'
  | 'pricing'
  | 'next_action'
  | 'retention';

export type DecisionPriority = 'low' | 'medium' | 'high' | 'critical';

export interface DecisionContext {
  userId: string;
  merchantId?: string;
  sessionId?: string;
  eventType?: string;
  entityType?: 'product' | 'store' | 'cart' | 'order' | 'search';
  entityId?: string;
  location?: { lat: number; lng: number; city?: string };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Decision {
  id: string;
  type: DecisionType;
  priority: DecisionPriority;

  action: {
    type: string;
    target?: string;
    value?;
    message?: string;
  };

  reasoning: {
    factors: string[];
    confidence: number;
    model?: string;
  };

  constraints: {
    maxUses?: number;
    expiresAt?: string;
    conditions?: DecisionCondition[];
  };

  metadata?: Record<string, unknown>;
}

export interface DecisionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'not_in';
  value;
}

export interface DecisionRequest {
  type: DecisionType;
  context: DecisionContext;
  options?: {
    maxDecisions?: number;
    includeReasoning?: boolean;
    constraints?: DecisionCondition[];
  };
}

export interface DecisionResponse {
  decisions: Decision[];
  metadata: {
    requestId: string;
    latencyMs: number;
    model?: string;
  };
}

// ============================================================================
// Decision Rules Engine
// ============================================================================

class DecisionRulesEngine {
  private rules: Map<string, DecisionRule[]> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Cashback rules
    this.registerRule({
      id: 'cashback-premium-tier',
      type: 'cashback',
      priority: 'high',
      conditions: [
        { field: 'user.tier', operator: 'eq', value: 'platinum' },
        { field: 'order.value', operator: 'gte', value: 500 }
      ],
      action: {
        type: 'cashback_percentage',
        value: 10
      }
    });

    this.registerRule({
      id: 'cashback-first-order',
      type: 'cashback',
      priority: 'high',
      conditions: [
        { field: 'user.orderCount', operator: 'eq', value: 0 }
      ],
      action: {
        type: 'cashback_percentage',
        value: 15
      }
    });

    // Retention rules
    this.registerRule({
      id: 'retention-churn-risk',
      type: 'retention',
      priority: 'critical',
      conditions: [
        { field: 'user.churnRisk', operator: 'gte', value: 0.7 }
      ],
      action: {
        type: 'send_offer',
        target: 'personal_channel',
        value: { discount: 20, coins: 500 }
      }
    });

    // Personalization rules
    this.registerRule({
      id: 'personalize-dining',
      type: 'personalization',
      priority: 'medium',
      conditions: [
        { field: 'context.eventType', operator: 'eq', value: 'search' },
        { field: 'context.entityType', operator: 'eq', value: 'product' }
      ],
      action: {
        type: 'reorder_suggestion'
      }
    });

    // Fraud rules
    this.registerRule({
      id: 'fraud-high-amount',
      type: 'fraud',
      priority: 'critical',
      conditions: [
        { field: 'order.value', operator: 'gte', value: 50000 }
      ],
      action: {
        type: 'require_verification'
      }
    });

    this.registerRule({
      id: 'fraud-new-device',
      type: 'fraud',
      priority: 'high',
      conditions: [
        { field: 'user.isNewDevice', operator: 'eq', value: true },
        { field: 'order.value', operator: 'gte', value: 10000 }
      ],
      action: {
        type: 'require_otp'
      }
    });

    // Offer rules
    this.registerRule({
      id: 'offer-rainy-day',
      type: 'offer',
      priority: 'medium',
      conditions: [
        { field: 'context.weather', operator: 'eq', value: 'rainy' }
      ],
      action: {
        type: 'emergency_delivery_offer',
        value: { deliveryDiscount: 50 }
      }
    });
  }

  registerRule(rule: DecisionRule): void {
    const rules = this.rules.get(rule.type) || [];
    rules.push(rule);
    this.rules.set(rule.type, rules);
  }

  async evaluate(context: DecisionContext, type: DecisionType): Promise<Decision[]> {
    const rules = this.rules.get(type) || [];
    const decisions: Decision[] = [];

    for (const rule of rules) {
      if (this.matchesConditions(context, rule.conditions)) {
        decisions.push(this.createDecision(rule, context));
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    decisions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return decisions;
  }

  private matchesConditions(context: DecisionContext, conditions: DecisionCondition[]): boolean {
    return conditions.every(condition => {
      const value = this.getFieldValue(context, condition.field);
      return this.compareValues(value, condition.operator, condition.value);
    });
  }

  private getFieldValue(context, field: string): unknown {
    const parts = field.split('.');
    let value = context;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  private compareValues(actual, operator: DecisionCondition['operator'], expected): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'in': return Array.isArray(expected) && expected.includes(actual);
      case 'not_in': return Array.isArray(expected) && !expected.includes(actual);
      default: return false;
    }
  }

  private createDecision(rule: DecisionRule, context: DecisionContext): Decision {
    return {
      id: randomUUID(),
      type: rule.type,
      priority: rule.priority,
      action: { ...rule.action },
      reasoning: {
        factors: rule.conditions.map(c => `${c.field} ${c.operator} ${c.value}`),
        confidence: 0.9,
        model: 'rules-engine'
      },
      constraints: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      metadata: { ruleId: rule.id }
    };
  }
}

// ============================================================================
// ML Decision Model
// ============================================================================

interface DecisionRule {
  id: string;
  type: DecisionType;
  priority: DecisionPriority;
  conditions: DecisionCondition[];
  action: { type: string; target?: string; value?: unknown };
}

class MLDecisionModel {
  // In production, this would load trained models
  // For now, implement rule-based ML-like decisions

  async predictNextAction(userId: string): Promise<Decision> {
    const features = await featureStore.getUserFeatures(userId);

    // Predict next action based on features
    const churnRisk = features.features['user.churn_probability'] || 0;
    const engagement = features.features['user.engagement_score'] || 50;
    const orderCount = features.features['user.order_count'] || 0;

    // Decision logic
    if (churnRisk > 0.7) {
      return {
        id: randomUUID(),
        type: 'retention',
        priority: 'critical',
        action: {
          type: 'retention_offer',
          target: userId,
          value: { discount: 15, coins: 200, freeDelivery: true }
        },
        reasoning: {
          factors: [`churn_risk=${churnRisk.toFixed(2)}`],
          confidence: 0.85,
          model: 'churn-prevention-v2'
        },
        constraints: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }

    if (orderCount > 10 && engagement > 70) {
      return {
        id: randomUUID(),
        type: 'offer',
        priority: 'high',
        action: {
          type: 'loyalty_reward',
          target: userId,
          value: { cashback: 5, bonusCoins: 100 }
        },
        reasoning: {
          factors: [`order_count=${orderCount}`, `engagement=${engagement}`],
          confidence: 0.9,
          model: 'loyalty-promotion-v1'
        },
        constraints: {
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }

    // Default: personalization
    return {
      id: randomUUID(),
      type: 'personalization',
      priority: 'medium',
      action: {
        type: 'recommend_products',
        value: { count: 5, strategy: 'collaborative_filtering' }
      },
      reasoning: {
        factors: ['user_profile_based'],
        confidence: 0.75,
        model: 'recommendation-v3'
      },
      constraints: {}
    };
  }

  async predictCashback(userId: string, orderValue: number): Promise<Decision> {
    const features = await featureStore.getUserFeatures(userId);

    const tier = features.features['user.loyalty_tier'] as string || 'standard';
    const ltv = features.features['user.lifetime_value'] || 0;
    const purchaseLikelihood = features.features['user.purchase_likelihood'] || 0.5;

    // Calculate cashback percentage based on tier and value
    let baseCashback = 1; // 1% base

    if (tier === 'platinum') baseCashback = 5;
    else if (tier === 'gold') baseCashback = 3;
    else if (tier === 'silver') baseCashback = 2;

    // Boost for high-value orders
    if (orderValue > 1000) baseCashback += 1;
    if (orderValue > 5000) baseCashback += 1;

    // Cap at 10%
    const cashbackPercent = Math.min(baseCashback, 10);
    const cashbackValue = Math.round(orderValue * cashbackPercent / 100);

    return {
      id: randomUUID(),
      type: 'cashback',
      priority: 'high',
      action: {
        type: 'cashback_percentage',
        value: {
          percentage: cashbackPercent,
          amount: cashbackValue,
          currency: 'INR'
        }
      },
      reasoning: {
        factors: [
          `tier=${tier}`,
          `ltv=${ltv}`,
          `order_value=${orderValue}`,
          `purchase_likelihood=${purchaseLikelihood.toFixed(2)}`
        ],
        confidence: 0.88,
        model: 'cashback-optimization-v2'
      },
      constraints: {
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  async predictFraudRisk(context: DecisionContext): Promise<Decision> {
    // Simplified fraud detection
    const orderValue = context.metadata?.orderValue || 0;
    const isNewDevice = context.metadata?.isNewDevice || false;
    const ipCountry = context.metadata?.ipCountry || 'IN';
    const velocityScore = context.metadata?.velocityScore || 0;

    let riskScore = 0;
    const factors: string[] = [];

    if (orderValue > 50000) {
      riskScore += 0.3;
      factors.push('high_value_order');
    }

    if (isNewDevice) {
      riskScore += 0.2;
      factors.push('new_device');
    }

    if (velocityScore > 0.8) {
      riskScore += 0.3;
      factors.push('high_velocity');
    }

    if (ipCountry !== 'IN') {
      riskScore += 0.1;
      factors.push('international_ip');
    }

    let action: { type: string; value?: unknown };
    let priority: DecisionPriority = 'medium';

    if (riskScore >= 0.7) {
      action = { type: 'block', value: 'high_fraud_risk' };
      priority = 'critical';
    } else if (riskScore >= 0.4) {
      action = { type: 'require_verification', value: ['otp', 'callback'] };
      priority = 'high';
    } else {
      action = { type: 'allow' };
    }

    return {
      id: randomUUID(),
      type: 'fraud',
      priority,
      action,
      reasoning: {
        factors,
        confidence: 1 - riskScore,
        model: 'fraud-detection-v4'
      },
      constraints: {}
    };
  }
}

// ============================================================================
// Real-Time Decision Engine
// ============================================================================

export class DecisionEngine {
  private rulesEngine: DecisionRulesEngine;
  private mlModel: MLDecisionModel;

  constructor() {
    this.rulesEngine = new DecisionRulesEngine();
    this.mlModel = new MLDecisionModel();
  }

  /**
   * Make a decision
   */
  async decide(request: DecisionRequest): Promise<DecisionResponse> {
    const startTime = Date.now();
    const requestId = randomUUID();

    const decisions: Decision[] = [];

    // Rule-based decisions
    const ruleDecisions = await this.rulesEngine.evaluate(request.context, request.type);
    decisions.push(...ruleDecisions);

    // ML-based decisions
    const mlDecision = await this.getMLDecision(request);
    if (mlDecision) {
      decisions.push(mlDecision);
    }

    // Apply constraints
    let filteredDecisions = decisions;
    if (request.options?.constraints) {
      filteredDecisions = decisions.filter(d =>
        this.matchesConstraints(d, request.options!.constraints!)
      );
    }

    // Limit results
    const maxDecisions = request.options?.maxDecisions || 5;
    filteredDecisions = filteredDecisions.slice(0, maxDecisions);

    return {
      decisions: filteredDecisions,
      metadata: {
        requestId,
        latencyMs: Date.now() - startTime,
        model: 'hybrid-rules-ml'
      }
    };
  }

  /**
   * Get next best action for user
   */
  async getNextBestAction(userId: string, goal?: 'conversion' | 'retention' | 'engagement'): Promise<Decision> {
    return this.mlModel.predictNextAction(userId);
  }

  /**
   * Get cashback decision
   */
  async getCashback(userId: string, orderValue: number): Promise<Decision> {
    return this.mlModel.predictCashback(userId, orderValue);
  }

  /**
   * Get fraud decision
   */
  async getFraudDecision(context: DecisionContext): Promise<Decision> {
    return this.mlModel.predictFraudRisk(context);
  }

  /**
   * Get personalization decision
   */
  async getPersonalization(userId: string, slot: string): Promise<Decision> {
    const features = await featureStore.getUserFeatures(userId);

    const preferredCategories = features.features['user.preferred_categories'] as string[] || [];
    const priceRange = features.features['user.preferred_price_range'] as { min: number; max: number } || { min: 0, max: 10000 };

    return {
      id: randomUUID(),
      type: 'personalization',
      priority: 'medium',
      action: {
        type: 'personalized_content',
        value: {
          slot,
          categories: preferredCategories.slice(0, 5),
          priceRange,
          strategy: 'hybrid'
        }
      },
      reasoning: {
        factors: [
          `preferred_categories=${preferredCategories.join(',')}`,
          `price_range=${priceRange.min}-${priceRange.max}`
        ],
        confidence: 0.82,
        model: 'personalization-v3'
      },
      constraints: {
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      }
    };
  }

  /**
   * Get dynamic pricing decision
   */
  async getDynamicPricing(
    productId: string,
    context: DecisionContext
  ): Promise<Decision> {
    // Simplified dynamic pricing
    const demandScore = context.metadata?.demandScore || 0.5;
    const competitorPrice = context.metadata?.competitorPrice || 0;
    const basePrice = context.metadata?.basePrice || 0;

    let priceMultiplier = 1.0;

    if (demandScore > 0.8) {
      priceMultiplier = 1.1; // 10% surge
    } else if (demandScore < 0.3) {
      priceMultiplier = 0.85; // 15% discount
    }

    const finalPrice = Math.round(basePrice * priceMultiplier);

    return {
      id: randomUUID(),
      type: 'pricing',
      priority: 'high',
      action: {
        type: 'dynamic_price',
        value: {
          basePrice,
          finalPrice,
          multiplier: priceMultiplier,
          reason: demandScore > 0.8 ? 'high_demand' : demandScore < 0.3 ? 'low_demand' : 'standard'
        }
      },
      reasoning: {
        factors: [
          `demand_score=${demandScore}`,
          `competitor_price=${competitorPrice}`
        ],
        confidence: 0.78,
        model: 'dynamic-pricing-v2'
      },
      constraints: {
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    };
  }

  /**
   * Get routing decision
   */
  async getRoutingDecision(
    orderId: string,
    context: DecisionContext
  ): Promise<Decision> {
    // Determine optimal routing
    const location = context.location;
    const merchantId = context.merchantId;

    // Simplified routing logic
    let driverType = 'standard';
    let priority = 'normal';

    // Priority for premium users or high-value orders
    const orderValue = context.metadata?.orderValue || 0;
    if (orderValue > 5000) {
      driverType = 'premium';
      priority = 'high';
    }

    return {
      id: randomUUID(),
      type: 'routing',
      priority: priority as DecisionPriority,
      action: {
        type: 'assign_driver',
        target: merchantId,
        value: {
          driverType,
          priority,
          estimatedPickup: '15-20 mins'
        }
      },
      reasoning: {
        factors: [
          `order_value=${orderValue}`,
          `location=${location?.city || 'unknown'}`
        ],
        confidence: 0.85,
        model: 'routing-v1'
      },
      constraints: {
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }
    };
  }

  // ============================================
  // Private Methods
  // ============================================

  private async getMLDecision(request: DecisionRequest): Promise<Decision | null> {
    switch (request.type) {
      case 'next_action':
        return this.mlModel.predictNextAction(request.context.userId);

      case 'cashback':
        return this.mlModel.predictCashback(
          request.context.userId,
          request.context.metadata?.orderValue || 0
        );

      case 'fraud':
        return this.mlModel.predictFraudRisk(request.context);

      default:
        return null;
    }
  }

  private matchesConstraints(decision: Decision, constraints: DecisionCondition[]): boolean {
    return constraints.every(c => {
      const value = this.getNestedValue(decision, c.field);
      return this.compareValues(value, c.operator, c.value);
    });
  }

  private getNestedValue(obj, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private compareValues(actual, operator: DecisionCondition['operator'], expected): boolean {
    switch (operator) {
      case 'eq': return actual === expected;
      case 'ne': return actual !== expected;
      case 'gt': return actual > expected;
      case 'lt': return actual < expected;
      case 'gte': return actual >= expected;
      case 'lte': return actual <= expected;
      case 'in': return Array.isArray(expected) && expected.includes(actual);
      case 'not_in': return Array.isArray(expected) && !expected.includes(actual);
      default: return true;
    }
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const decisionEngine = new DecisionEngine();
export default decisionEngine;
