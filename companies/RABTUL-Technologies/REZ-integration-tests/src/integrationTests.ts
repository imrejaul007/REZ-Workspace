import logger from './utils/logger';

/**
 * REZ Intelligence Integration Tests
 *
 * Tests the complete intelligence infrastructure working together
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// ============================================================================
// Test Imports (mock implementations for testing)
// ============================================================================

// We'll use inline mocks for testing without running actual services

// ============================================================================
// Mock Event Bus
// ============================================================================

class MockEventBus {
  private events: Map<string, unknown[]> = new Map();
  private listeners: Map<string, Function[]> = new Map();

  async publish(event): Promise<string> {
    const id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    event.id = id;
    event.timestamp = new Date().toISOString();

    const category = this.getCategory(event.type);
    const existing = this.events.get(category) || [];
    existing.push(event);
    this.events.set(category, existing);

    // Trigger listeners
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(fn => fn(event));

    return id;
  }

  on(type: string, fn: Function): void {
    const existing = this.listeners.get(type) || [];
    existing.push(fn);
    this.listeners.set(type, existing);
  }

  getEvents(category: string): unknown[] {
    return this.events.get(category) || [];
  }

  clear(): void {
    this.events.clear();
    this.listeners.clear();
  }

  private getCategory(type: string): string {
    return type.split('.')[0];
  }
}

// ============================================================================
// Mock Feature Store
// ============================================================================

class MockFeatureStore {
  private features: Map<string, Map<string, unknown>> = new Map();

  async computeFeature(userId: string, featureName: string): Promise<unknown> {
    if (!this.features.has(userId)) {
      this.features.set(userId, new Map());
    }

    const userFeatures = this.features.get(userId)!;

    // Simulate feature computation
    const featureValue = this.computeMockFeature(featureName);
    userFeatures.set(featureName, {
      value: featureValue,
      computedAt: new Date().toISOString()
    });

    return featureValue;
  }

  async getFeature(userId: string, featureName: string): Promise<unknown> {
    return this.features.get(userId)?.get(featureName)?.value;
  }

  async getAllFeatures(userId: string): Promise<Map<string, unknown>> {
    return this.features.get(userId) || new Map();
  }

  private computeMockFeature(featureName: string): unknown {
    const baseValues: Record<string, number> = {
      'user.order_count': 15,
      'user.avg_order_value': 450,
      'user.churn_probability': 0.15,
      'user.engagement_score': 75,
      'user.purchase_likelihood': 0.82,
      'user.dining_frequency': 3.5,
      'user.premium_affinity': 0.65,
      'user.discount_sensitivity': 0.45,
      'user.loyalty_points_balance': 2500
    };
    return baseValues[featureName] ?? Math.random();
  }

  clear(): void {
    this.features.clear();
  }
}

// ============================================================================
// Mock Decision Engine
// ============================================================================

class MockDecisionEngine {
  async decide(context, decisionType: string): Promise<unknown> {
    const startTime = Date.now();

    switch (decisionType) {
      case 'cashback':
        return {
          decisions: [{
            id: `dec_${Date.now()}`,
            type: 'cashback',
            action: {
              type: 'cashback_percentage',
              value: {
                percentage: this.calculateCashback(context),
                currency: 'INR'
              }
            },
            reasoning: {
              confidence: 0.85,
              model: 'mock-cashback-v1'
            }
          }],
          metadata: { latencyMs: Date.now() - startTime }
        };

      case 'fraud':
        return {
          decisions: [{
            id: `dec_${Date.now()}`,
            type: 'fraud',
            action: {
              type: context.orderValue > 50000 ? 'require_verification' : 'allow'
            },
            reasoning: { confidence: 0.92, model: 'mock-fraud-v1' }
          }],
          metadata: { latencyMs: Date.now() - startTime }
        };

      case 'personalization':
        return {
          decisions: [{
            id: `dec_${Date.now()}`,
            type: 'personalization',
            action: {
              type: 'personalized_content',
              value: { recommendations: ['pizza', 'biryani', 'chinese'] }
            },
            reasoning: { confidence: 0.78, model: 'mock-rec-v1' }
          }],
          metadata: { latencyMs: Date.now() - startTime }
        };

      default:
        return {
          decisions: [],
          metadata: { latencyMs: Date.now() - startTime }
        };
    }
  }

  private calculateCashback(context): number {
    let cashback = 1; // Base 1%
    if (context.tier === 'platinum') cashback += 4;
    else if (context.tier === 'gold') cashback += 2;
    else if (context.tier === 'silver') cashback += 1;

    if (context.orderValue > 1000) cashback += 1;

    return Math.min(cashback, 10);
  }
}

// ============================================================================
// Mock Commerce Graph
// ============================================================================

class MockCommerceGraph {
  private nodes: Map<string, unknown> = new Map();
  private relationships: Map<string, unknown[]> = new Map();

  async createNode(node): Promise<unknown> {
    const id = node.id || `node_${Date.now()}`;
    this.nodes.set(id, { ...node, id, createdAt: new Date().toISOString() });
    return this.nodes.get(id);
  }

  async createRelationship(rel): Promise<unknown> {
    const id = `rel_${Date.now()}`;
    const relationship = { ...rel, id, createdAt: new Date().toISOString() };

    const key = `${rel.sourceNodeId}:${rel.targetNodeId}`;
    const existing = this.relationships.get(key) || [];
    existing.push(relationship);
    this.relationships.set(key, existing);

    return relationship;
  }

  async findPath(startId: string, endId: string): Promise<unknown[] | null> {
    if (startId === endId) return [this.nodes.get(startId)];
    return null;
  }

  async getNeighbors(nodeId: string): Promise<unknown[]> {
    const neighbors: unknown[] = [];

    for (const [key, rels] of this.relationships) {
      for (const rel of rels) {
        if (rel.sourceNodeId === nodeId) {
          neighbors.push(this.nodes.get(rel.targetNodeId));
        }
        if (rel.targetNodeId === nodeId) {
          neighbors.push(this.nodes.get(rel.sourceNodeId));
        }
      }
    }

    return neighbors.filter(Boolean);
  }

  clear(): void {
    this.nodes.clear();
    this.relationships.clear();
  }
}

// ============================================================================
// Mock Central Intent Service
// ============================================================================

class MockCentralIntentService {
  private signals: Map<string, unknown[]> = new Map();
  private eventBus: MockEventBus;

  constructor(eventBus: MockEventBus) {
    this.eventBus = eventBus;

    // Listen to engagement events
    this.eventBus.on('engagement.product.viewed', (event) => {
      this.captureSignal({
        userId: event.data?.userId,
        signalType: 'view',
        entityId: event.data?.productId,
        confidence: 0.7
      });
    });

    this.eventBus.on('engagement.product.added_to_cart', (event) => {
      this.captureSignal({
        userId: event.data?.userId,
        signalType: 'add_to_cart',
        entityId: event.data?.productId,
        confidence: 0.85
      });
    });

    this.eventBus.on('commerce.order.completed', (event) => {
      this.captureSignal({
        userId: event.userId,
        signalType: 'purchase',
        entityId: event.data?.orderId,
        confidence: 0.95
      });
    });
  }

  async captureSignal(signal): Promise<void> {
    const userId = signal.userId;
    if (!userId) return;

    const existing = this.signals.get(userId) || [];
    existing.push({
      ...signal,
      id: `sig_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
    this.signals.set(userId, existing);
  }

  async predict(userId: string): Promise<unknown> {
    const signals = this.signals.get(userId) || [];

    // Simple prediction based on signals
    const purchaseSignals = signals.filter(s => s.signalType === 'purchase');
    const cartSignals = signals.filter(s => s.signalType === 'add_to_cart');

    let primaryIntent = 'browse';
    let confidence = 0.5;

    if (cartSignals.length > 0) {
      primaryIntent = 'cart';
      confidence = 0.8;
    }

    if (purchaseSignals.length > 0) {
      primaryIntent = 'purchase';
      confidence = 0.9;
    }

    return {
      userId,
      primaryIntent,
      confidence,
      topIntents: [
        { intent: primaryIntent, confidence }
      ],
      signalCount: signals.length
    };
  }

  async getSignals(userId: string): Promise<unknown[]> {
    return this.signals.get(userId) || [];
  }

  clear(): void {
    this.signals.clear();
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe('REZ Intelligence Infrastructure Integration Tests', () => {

  // Test instances
  let eventBus: MockEventBus;
  let featureStore: MockFeatureStore;
  let decisionEngine: MockDecisionEngine;
  let commerceGraph: MockCommerceGraph;
  let intentService: MockCentralIntentService;

  beforeAll(() => {
    eventBus = new MockEventBus();
    featureStore = new MockFeatureStore();
    decisionEngine = new MockDecisionEngine();
    commerceGraph = new MockCommerceGraph();
    intentService = new MockCentralIntentService(eventBus);
  });

  afterAll(() => {
    eventBus.clear();
    featureStore.clear();
    commerceGraph.clear();
    intentService.clear();
  });

  // ============================================
  // Test 1: Event Bus
  // ============================================

  describe('Event Bus', () => {

    test('should publish and receive commerce events', async () => {
      const eventId = await eventBus.publish({
        type: 'commerce.order.completed',
        userId: 'user_123',
        merchantId: 'merchant_456',
        data: {
          orderId: 'order_789',
          total: 599,
          items: [{ name: 'Pizza', price: 599 }]
        }
      });

      expect(eventId).toBeDefined();
      expect(eventId).toMatch(/^evt_/);

      const events = eventBus.getEvents('commerce');
      expect(events.length).toBeGreaterThan(0);

      const orderEvent = events.find(e => e.data?.orderId === 'order_789');
      expect(orderEvent).toBeDefined();
      expect(orderEvent.userId).toBe('user_123');
    });

    test('should publish and receive identity events', async () => {
      await eventBus.publish({
        type: 'identity.user.registered',
        userId: 'user_new',
        data: { email: 'test@example.com' }
      });

      const events = eventBus.getEvents('identity');
      expect(events.some(e => e.type === 'identity.user.registered')).toBe(true);
    });

    test('should support event listeners', (done) => {
      const testEvent = {
        type: 'test.custom.event',
        data: { message: 'hello' }
      };

      eventBus.on('test.custom.event', (event) => {
        expect(event.data.message).toBe('hello');
        done();
      });

      eventBus.publish(testEvent);
    });
  });

  // ============================================
  // Test 2: Feature Store
  // ============================================

  describe('Feature Store', () => {

    test('should compute and retrieve user features', async () => {
      const userId = 'user_feature_test';

      // Compute features
      const orderCount = await featureStore.computeFeature(userId, 'user.order_count');
      expect(typeof orderCount).toBe('number');

      const churnRisk = await featureStore.computeFeature(userId, 'user.churn_probability');
      expect(churnRisk).toBeGreaterThanOrEqual(0);
      expect(churnRisk).toBeLessThanOrEqual(1);

      // Retrieve feature
      const storedOrderCount = await featureStore.getFeature(userId, 'user.order_count');
      expect(storedOrderCount).toBe(orderCount);
    });

    test('should compute behavioral features', async () => {
      const userId = 'user_behavioral_test';

      const diningFrequency = await featureStore.computeFeature(userId, 'user.dining_frequency');
      expect(diningFrequency).toBeGreaterThanOrEqual(0);

      const premiumAffinity = await featureStore.computeFeature(userId, 'user.premium_affinity');
      expect(premiumAffinity).toBeGreaterThanOrEqual(0);
      expect(premiumAffinity).toBeLessThanOrEqual(1);
    });

    test('should track multiple users independently', async () => {
      const user1 = 'user_independent_1';
      const user2 = 'user_independent_2';

      await featureStore.computeFeature(user1, 'user.order_count');
      await featureStore.computeFeature(user2, 'user.order_count');

      const features1 = await featureStore.getAllFeatures(user1);
      const features2 = await featureStore.getAllFeatures(user2);

      expect(features1.has('user.order_count')).toBe(true);
      expect(features2.has('user.order_count')).toBe(true);
    });
  });

  // ============================================
  // Test 3: Decision Engine
  // ============================================

  describe('Decision Engine', () => {

    test('should make cashback decisions', async () => {
      const context = {
        userId: 'user_decision_test',
        tier: 'gold',
        orderValue: 1500
      };

      const result = await decisionEngine.decide(context, 'cashback');

      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.decisions[0].type).toBe('cashback');
      expect(result.decisions[0].action.value.percentage).toBeGreaterThan(1);
      expect(result.metadata.latencyMs).toBeDefined();
    });

    test('should calculate tier-based cashback', async () => {
      const platinumContext = { userId: 'u1', tier: 'platinum', orderValue: 500 };
      const standardContext = { userId: 'u2', tier: 'standard', orderValue: 500 };

      const platinumResult = await decisionEngine.decide(platinumContext, 'cashback');
      const standardResult = await decisionEngine.decide(standardContext, 'cashback');

      const platinumCashback = platinumResult.decisions[0].action.value.percentage;
      const standardCashback = standardResult.decisions[0].action.value.percentage;

      expect(platinumCashback).toBeGreaterThan(standardCashback);
    });

    test('should make fraud decisions based on order value', async () => {
      const lowValueContext = { userId: 'u1', orderValue: 500 };
      const highValueContext = { userId: 'u2', orderValue: 100000 };

      const lowResult = await decisionEngine.decide(lowValueContext, 'fraud');
      const highResult = await decisionEngine.decide(highValueContext, 'fraud');

      expect(lowResult.decisions[0].action.type).toBe('allow');
      expect(highResult.decisions[0].action.type).toBe('require_verification');
    });

    test('should make personalization decisions', async () => {
      const context = { userId: 'user_personalization_test' };

      const result = await decisionEngine.decide(context, 'personalization');

      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.decisions[0].type).toBe('personalization');
      expect(result.decisions[0].action.value.recommendations).toBeDefined();
    });
  });

  // ============================================
  // Test 4: Commerce Graph
  // ============================================

  describe('Commerce Graph', () => {

    test('should create nodes', async () => {
      const user = await commerceGraph.createNode({
        type: 'user',
        properties: { name: 'Test User', tier: 'gold' }
      });

      expect(user.id).toBeDefined();
      expect(user.type).toBe('user');
      expect(user.properties.name).toBe('Test User');
    });

    test('should create relationships', async () => {
      const user = await commerceGraph.createNode({
        type: 'user',
        id: 'graph_user_1',
        properties: { name: 'User 1' }
      });

      const merchant = await commerceGraph.createNode({
        type: 'merchant',
        id: 'graph_merchant_1',
        properties: { name: 'Pizza Palace' }
      });

      const relationship = await commerceGraph.createRelationship({
        sourceNodeId: user.id,
        targetNodeId: merchant.id,
        type: 'purchased_from',
        properties: { count: 5, totalValue: 2500 }
      });

      expect(relationship.id).toBeDefined();
      expect(relationship.sourceNodeId).toBe(user.id);
      expect(relationship.targetNodeId).toBe(merchant.id);
    });

    test('should find neighbors', async () => {
      const neighbors = await commerceGraph.getNeighbors('graph_user_1');
      expect(neighbors.length).toBeGreaterThan(0);
      expect(neighbors.some(n => n.id === 'graph_merchant_1')).toBe(true);
    });
  });

  // ============================================
  // Test 5: Central Intent Service
  // ============================================

  describe('Central Intent Service', () => {

    test('should capture signals from events', async () => {
      const userId = 'user_intent_test';

      // Publish engagement event
      await eventBus.publish({
        type: 'engagement.product.viewed',
        userId,
        data: { productId: 'prod_123' }
      });

      // Check signals were captured
      const signals = await intentService.getSignals(userId);
      expect(signals.length).toBeGreaterThan(0);
    });

    test('should predict intent based on signals', async () => {
      const userId = 'user_prediction_test';

      // Add purchase signal
      await eventBus.publish({
        type: 'commerce.order.completed',
        userId,
        data: { orderId: 'order_predict' }
      });

      const prediction = await intentService.predict(userId);

      expect(prediction.userId).toBe(userId);
      expect(prediction.primaryIntent).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    test('should detect cart abandonment intent', async () => {
      const userId = 'user_cart_test';

      // Add cart signal
      await eventBus.publish({
        type: 'engagement.product.added_to_cart',
        userId,
        data: { productId: 'prod_cart' }
      });

      const prediction = await intentService.predict(userId);
      expect(prediction.primaryIntent).toBe('cart');
    });
  });

  // ============================================
  // Test 6: End-to-End Flow
  // ============================================

  describe('End-to-End Flows', () => {

    test('complete commerce journey', async () => {
      const userId = 'user_e2e_journey';
      const merchantId = 'merchant_e2e';

      // 1. Create user and merchant in graph
      await commerceGraph.createNode({
        type: 'user',
        id: userId,
        properties: { name: 'E2E User', tier: 'gold' }
      });

      await commerceGraph.createNode({
        type: 'merchant',
        id: merchantId,
        properties: { name: 'E2E Restaurant' }
      });

      // 2. User views product (intent signal)
      await eventBus.publish({
        type: 'engagement.product.viewed',
        userId,
        data: { productId: 'prod_e2e' }
      });

      // 3. User adds to cart
      await eventBus.publish({
        type: 'engagement.product.added_to_cart',
        userId,
        data: { productId: 'prod_e2e', cartId: 'cart_e2e' }
      });

      // 4. Order completed
      await eventBus.publish({
        type: 'commerce.order.completed',
        userId,
        merchantId,
        data: { orderId: 'order_e2e', total: 899 }
      });

      // 5. Verify intent prediction
      const intent = await intentService.predict(userId);
      expect(intent.primaryIntent).toBe('purchase');
      expect(intent.confidence).toBeGreaterThan(0.8);

      // 6. Verify features computed
      const features = await featureStore.getAllFeatures(userId);
      expect(features.size).toBeGreaterThan(0);

      // 7. Verify graph relationship
      const neighbors = await commerceGraph.getNeighbors(userId);
      expect(neighbors.some(n => n.id === merchantId)).toBe(true);
    });

    test('personalization flow', async () => {
      const userId = 'user_personalization_flow';

      // 1. Compute user features
      await featureStore.computeFeature(userId, 'user.premium_affinity');
      await featureStore.computeFeature(userId, 'user.dining_frequency');

      // 2. Publish engagement
      await eventBus.publish({
        type: 'engagement.page.viewed',
        userId,
        data: { pageType: 'restaurant_list' }
      });

      // 3. Get intent prediction
      const intent = await intentService.predict(userId);

      // 4. Make personalization decision
      const decision = await decisionEngine.decide(
        { userId, intent: intent.primaryIntent },
        'personalization'
      );

      expect(decision.decisions.length).toBeGreaterThan(0);
      expect(decision.decisions[0].action.value.recommendations).toBeDefined();
    });

    test('fraud detection flow', async () => {
      const userId = 'user_fraud_flow';

      // 1. User has good history
      await commerceGraph.createRelationship({
        sourceNodeId: userId,
        targetNodeId: 'trusted_merchant',
        type: 'purchased_from',
        properties: { count: 50, totalValue: 50000 }
      });

      // 2. New high-value order
      const decision = await decisionEngine.decide(
        { userId, orderValue: 75000 },
        'fraud'
      );

      // 3. Should still flag high value
      expect(decision.decisions[0].action.type).toBe('require_verification');
    });
  });

  // ============================================
  // Test 7: Performance Benchmarks
  // ============================================

  describe('Performance Benchmarks', () => {

    test('event publishing should be fast', async () => {
      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await eventBus.publish({
          type: 'test.perf.event',
          data: { index: i }
        });
      }

      const elapsed = Date.now() - start;
      const avgMs = elapsed / iterations;

      logger.info(`Event publishing: ${avgMs.toFixed(2)}ms avg (${iterations} events)`);
      expect(avgMs).toBeLessThan(10); // Should be under 10ms per event
    });

    test('feature retrieval should be fast', async () => {
      const userId = 'user_perf_test';
      await featureStore.computeFeature(userId, 'user.order_count');

      const iterations = 100;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await featureStore.getFeature(userId, 'user.order_count');
      }

      const elapsed = Date.now() - start;
      const avgMs = elapsed / iterations;

      logger.info(`Feature retrieval: ${avgMs.toFixed(2)}ms avg (${iterations} calls)`);
      expect(avgMs).toBeLessThan(5); // Should be under 5ms per retrieval
    });

    test('decision making should be fast', async () => {
      const context = { userId: 'user_decision_perf', tier: 'gold' };

      const iterations = 50;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await decisionEngine.decide(context, 'cashback');
      }

      const elapsed = Date.now() - start;
      const avgMs = elapsed / iterations;

      logger.info(`Decision making: ${avgMs.toFixed(2)}ms avg (${iterations} decisions)`);
      expect(avgMs).toBeLessThan(50); // Should be under 50ms per decision
    });
  });

  // ============================================
  // Test 8: Error Handling
  // ============================================

  describe('Error Handling', () => {

    test('should handle missing user gracefully', async () => {
      const intent = await intentService.predict('nonexistent_user');
      expect(intent.userId).toBe('nonexistent_user');
      expect(intent.signalCount).toBe(0);
    });

    test('should handle empty features gracefully', async () => {
      const feature = await featureStore.getFeature('nonexistent', 'unknown.feature');
      expect(feature).toBeUndefined();
    });

    test('should handle invalid decision type', async () => {
      const result = await decisionEngine.decide({}, 'invalid_type');
      expect(result.decisions).toEqual([]);
    });
  });
});

// ============================================================================
// Export for running
// ============================================================================

export { MockEventBus, MockFeatureStore, MockDecisionEngine, MockCommerceGraph, MockCentralIntentService };
