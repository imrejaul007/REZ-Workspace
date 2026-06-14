/**
 * REZ QR Services - REZ Intelligence Integration
 *
 * Connects all QR services to REZ Intelligence AI/ML services
 *
 * Services:
 * - Intent Predictor
 * - Fraud Agent
 * - Recommendation Engine
 * - Predictive Engine
 * - Signal Aggregator
 * - Personalization Engine
 * - Realtime Segments
 * - CDP Service
 * - RFM Service
 */

import axios from 'axios';

// ============================================
// SERVICE URLs
// ============================================

export const INTELLIGENCE_SERVICES = {
  INTENT: process.env.INTENT_PREDICTOR_URL || 'https://rez-intent-predictor.onrender.com',
  FRAUD: process.env.FRAUD_AGENT_URL || 'https://rez-fraud-agent.onrender.com',
  RECOMMEND: process.env.RECOMMENDATION_ENGINE_URL || 'https://REZ-recommendation-engine.onrender.com',
  PREDICT: process.env.PREDICTIVE_ENGINE_URL || 'https://REZ-predictive-engine.onrender.com',
  SIGNAL: process.env.SIGNAL_AGGREGATOR_URL || 'https://REZ-signal-aggregator.onrender.com',
  PERSONAL: process.env.PERSONALIZATION_URL || 'https://REZ-personalization-engine.onrender.com',
  SEGMENTS: process.env.REALTIME_SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com',
  CDP: process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com',
  RFM: process.env.RFM_URL || 'https://REZ-rfm-service.onrender.com',
  MIND: process.env.MIND_API || 'https://REZ-mind.onrender.com',
};

const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN ?? (() => {
  throw new Error('INTERNAL_SERVICE_TOKEN environment variable is required');
})();

// ============================================
// HELPER
// ============================================

async function call(service: keyof typeof INTELLIGENCE_SERVICES, endpoint: string, method = 'POST', data?) {
  const url = `${INTELLIGENCE_SERVICES[service]}${endpoint}`;
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'X-Internal-Token': INTERNAL_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`${service} call failed:`, error);
    return null;
  }
}

// ============================================
// INTENT PREDICTOR
// ============================================

export const intentPredictor = {
  /**
   * Predict user intent
   */
  async predict(userId: string, action: string, entities: unknown = {}) {
    return call('INTENT', '/api/predict', 'POST', {
      user_id: userId,
      action,
      entities
    });
  },

  /**
   * Get next best action
   */
  async nextBestAction(userId: string, context: unknown = {}) {
    return call('INTENT', '/api/next-best-action', 'POST', {
      user_id: userId,
      context
    });
  },

  /**
   * Track user journey
   */
  async trackJourney(userId: string, steps: unknown[]) {
    return call('INTENT', '/api/journey/track', 'POST', {
      user_id: userId,
      steps
    });
  },

  /**
   * Predict conversion probability
   */
  async conversionProbability(userId: string, goal: string) {
    return call('INTENT', '/api/conversion-probability', 'POST', {
      user_id: userId,
      goal
    });
  }
};

// ============================================
// FRAUD AGENT
// ============================================

export const fraudAgent = {
  /**
   * Score transaction for fraud
   */
  async scoreTransaction(data: {
    user_id: string;
    transaction_type: string;
    amount?: number;
    device_id?: string;
    ip_address?: string;
    location?: { lat: number; lng: number };
  }) {
    return call('FRAUD', '/api/score', 'POST', data);
  },

  /**
   * Check for duplicate/fraud patterns
   */
  async checkPatterns(data: {
    serial_number?: string;
    user_id?: string;
    device_id?: string;
    ip_address?: string;
    event_type: string;
  }) {
    return call('FRAUD', '/api/check-patterns', 'POST', data);
  },

  /**
   * Get fraud risk level
   */
  async riskLevel(userId: string, context: unknown = {}) {
    return call('FRAUD', '/api/risk-level', 'POST', {
      user_id: userId,
      ...context
    });
  },

  /**
   * Report fraud incident
   */
  async reportIncident(data: {
    incident_type: string;
    user_id: string;
    details;
  }) {
    return call('FRAUD', '/api/incident', 'POST', data);
  },

  /**
   * Verify scan authenticity
   */
  async verifyScan(data: {
    serial_number: string;
    user_id: string;
    location: { lat: number; lng: number };
    device_id: string;
    timestamp: string;
  }) {
    return call('FRAUD', '/api/verify-scan', 'POST', data);
  }
};

// ============================================
// RECOMMENDATION ENGINE
// ============================================

export const recommendationEngine = {
  /**
   * Get product recommendations
   */
  async getProducts(userId: string, context: unknown = {}) {
    return call('RECOMMEND', '/api/products', 'POST', {
      user_id: userId,
      context
    });
  },

  /**
   * Get warranty plan recommendations
   */
  async getWarrantyPlans(userId: string, productId: string) {
    return call('RECOMMEND', '/api/warranty-plans', 'POST', {
      user_id: userId,
      product_id: productId
    });
  },

  /**
   * Get service recommendations
   */
  async getServices(userId: string, category: string) {
    return call('RECOMMEND', '/api/services', 'POST', {
      user_id: userId,
      category
    });
  },

  /**
   * Get similar users for collaboration filtering
   */
  async similarUsers(userId: string, limit = 10) {
    return call('RECOMMEND', '/api/similar-users', 'POST', {
      user_id: userId,
      limit
    });
  },

  /**
   * Get trending items
   */
  async getTrending(category?: string, limit = 10) {
    return call('RECOMMEND', '/api/trending', 'POST', {
      category,
      limit
    });
  },

  /**
   * Upsell recommendations
   */
  async upsell(userId: string, currentItem) {
    return call('RECOMMEND', '/api/upsell', 'POST', {
      user_id: userId,
      current_item: currentItem
    });
  },

  /**
   * Cross-sell recommendations
   */
  async crossSell(userId: string, itemId: string) {
    return call('RECOMMEND', '/api/cross-sell', 'POST', {
      user_id: userId,
      item_id: itemId
    });
  }
};

// ============================================
// PREDICTIVE ENGINE
// ============================================

export const predictiveEngine = {
  /**
   * Predict churn probability
   */
  async churnPrediction(userId: string) {
    return call('PREDICT', '/api/churn', 'POST', { user_id: userId });
  },

  /**
   * Predict customer lifetime value
   */
  async ltvPrediction(userId: string) {
    return call('PREDICT', '/api/ltv', 'POST', { user_id: userId });
  },

  /**
   * Predict revisit probability
   */
  async revisitPrediction(userId: string, storeId?: string) {
    return call('PREDICT', '/api/revisit', 'POST', {
      user_id: userId,
      store_id: storeId
    });
  },

  /**
   * Predict conversion probability
   */
  async conversionPrediction(userId: string, action: string) {
    return call('PREDICT', '/api/conversion', 'POST', {
      user_id: userId,
      action
    });
  },

  /**
   * Forecast demand
   */
  async demandForecast(storeId: string, days = 7) {
    return call('PREDICT', '/api/demand-forecast', 'POST', {
      store_id: storeId,
      days
    });
  },

  /**
   * Predict best time for engagement
   */
  async bestEngagementTime(userId: string) {
    return call('PREDICT', '/api/best-time', 'POST', { user_id: userId });
  },

  /**
   * Price sensitivity prediction
   */
  async priceSensitivity(userId: string, productCategory: string) {
    return call('PREDICT', '/api/price-sensitivity', 'POST', {
      user_id: userId,
      category: productCategory
    });
  }
};

// ============================================
// SIGNAL AGGREGATOR
// ============================================

export const signalAggregator = {
  /**
   * Collect user signal/event
   */
  async collect(data: {
    service: string;
    event: string;
    user_id: string;
    entities?;
    context?;
  }) {
    return call('SIGNAL', '/api/collect', 'POST', data);
  },

  /**
   * Get user signals
   */
  async getSignals(userId: string, filters: unknown = {}) {
    return call('SIGNAL', '/api/signals', 'POST', {
      user_id: userId,
      ...filters
    });
  },

  /**
   * Aggregate signals for segments
   */
  async aggregate(type: 'user' | 'product' | 'store', id: string) {
    return call('SIGNAL', '/api/aggregate', 'POST', {
      type,
      id
    });
  },

  /**
   * Track attribution
   */
  async trackAttribution(data: {
    event_type: string;
    user_id?: string;
    touchpoints: unknown[];
    conversion_value?: number;
  }) {
    return call('SIGNAL', '/api/attribution/track', 'POST', data);
  },

  /**
   * Sentiment analysis
   */
  async analyzeSentiment(text: string) {
    return call('SIGNAL', '/api/sentiment', 'POST', { text });
  }
};

// ============================================
// PERSONALIZATION ENGINE
// ============================================

export const personalizationEngine = {
  /**
   * Get personalized content
   */
  async getContent(userId: string, slot: string, context: unknown = {}) {
    return call('PERSONAL', '/api/content', 'POST', {
      user_id: userId,
      slot,
      context
    });
  },

  /**
   * Get personalized notifications
   */
  async getNotifications(userId: string, limit = 10) {
    return call('PERSONAL', '/api/notifications', 'POST', {
      user_id: userId,
      limit
    });
  },

  /**
   * Get personalized offers
   */
  async getOffers(userId: string, category?: string) {
    return call('PERSONAL', '/api/offers', 'POST', {
      user_id: userId,
      category
    });
  },

  /**
   * Predict response to offer
   */
  async offerResponseProbability(userId: string, offerId: string) {
    return call('PERSONAL', '/api/offer-response', 'POST', {
      user_id: userId,
      offer_id: offerId
    });
  },

  /**
   * Get personalization score
   */
  async personalizationScore(userId: string) {
    return call('PERSONAL', '/api/score', 'POST', { user_id: userId });
  }
};

// ============================================
// REALTIME SEGMENTS
// ============================================

export const realtimeSegments = {
  /**
   * Get user segments
   */
  async getSegments(userId: string) {
    return call('SEGMENTS', '/api/segments', 'POST', { user_id: userId });
  },

  /**
   * Get segment members
   */
  async getSegmentMembers(segmentName: string, limit = 100) {
    return call('SEGMENTS', '/api/segment-members', 'POST', {
      segment: segmentName,
      limit
    });
  },

  /**
   * Check if user in segment
   */
  async inSegment(userId: string, segmentName: string) {
    return call('SEGMENTS', '/api/in-segment', 'POST', {
      user_id: userId,
      segment: segmentName
    });
  },

  /**
   * Get segment rules
   */
  async getSegmentRules() {
    return call('SEGMENTS', '/api/segment-rules', 'GET');
  }
};

// ============================================
// CDP SERVICE
// ============================================

export const cdpService = {
  /**
   * Get unified customer profile
   */
  async getProfile(userId: string) {
    return call('CDP', '/api/profile', 'POST', { user_id: userId });
  },

  /**
   * Update customer profile
   */
  async updateProfile(userId: string, data) {
    return call('CDP', '/api/profile/update', 'POST', {
      user_id: userId,
      ...data
    });
  },

  /**
   * Get customer traits
   */
  async getTraits(userId: string) {
    return call('CDP', '/api/traits', 'POST', { user_id: userId });
  },

  /**
   * Add customer event
   */
  async addEvent(userId: string, event: string, properties: unknown = {}) {
    return call('CDP', '/api/event', 'POST', {
      user_id: userId,
      event,
      properties
    });
  },

  /**
   * Merge customer identities
   */
  async mergeIdentities(primaryId: string, secondaryId: string) {
    return call('CDP', '/api/merge', 'POST', {
      primary_id: primaryId,
      secondary_id: secondaryId
    });
  }
};

// ============================================
// RFM SERVICE
// ============================================

export const rfmService = {
  /**
   * Get RFM score
   */
  async getScore(userId: string) {
    return call('RFM', '/api/score', 'POST', { user_id: userId });
  },

  /**
   * Get RFM segment
   */
  async getSegment(userId: string) {
    return call('RFM', '/api/segment', 'POST', { user_id: userId });
  },

  /**
   * Get customer tier
   */
  async getTier(userId: string) {
    return call('RFM', '/api/tier', 'POST', { user_id: userId });
  },

  /**
   * Get at-risk customers
   */
  async getAtRisk(storeId?: string) {
    return call('RFM', '/api/at-risk', 'POST', { store_id: storeId });
  },

  /**
   * Get VIP customers
   */
  async getVIPs(storeId?: string) {
    return call('RFM', '/api/vips', 'POST', { store_id: storeId });
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================

export const intelligence = {
  intent: intentPredictor,
  fraud: fraudAgent,
  recommend: recommendationEngine,
  predict: predictiveEngine,
  signal: signalAggregator,
  personal: personalizationEngine,
  segments: realtimeSegments,
  cdp: cdpService,
  rfm: rfmService
};

export default intelligence;
