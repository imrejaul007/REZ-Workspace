/**
 * REZ Intelligence Integration Service
 *
 * Connects ReZ Commerce to AI/ML services.
 */

import axios from 'axios';

const {
  INTENT_SERVICE_URL = 'https://rez-intent-predictor.render.com',
  PREDICT_SERVICE_URL = 'https://rez-predictive-engine.render.com',
  SEGMENT_SERVICE_URL = 'https://rez-realtime-segments.render.com',
  SIGNAL_SERVICE_URL = 'https://rez-social-signals.render.com',
  UNIFIED_PROFILE_URL = 'https://rez-unified-profile.render.com',
  INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '',
} = process.env;

const ML_HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': INTERNAL_TOKEN,
};

export class IntelligenceIntegration {
  // ─── Intent Prediction ───────────────────────────────────────────

  /**
   * Predict customer intent
   */
  static async predictIntent(data: {
    customerId: string;
    cartItems: Array<{ productId: string; category?: string; price: number }>;
    sessionContext?: Record<string, any>;
  }) {
    try {
      const response = await axios.post(
        `${INTENT_SERVICE_URL}/api/predict/intent`,
        {
          customerId: data.customerId,
          cartContents: data.cartItems,
          context: data.sessionContext,
        },
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Intent prediction failed:', error);
      return { intent: 'browsing', confidence: 0.5 };
    }
  }

  /**
   * Get personalized recommendations
   */
  static async getRecommendations(customerId: string, limit: number = 5) {
    try {
      const response = await axios.get(
        `${INTENT_SERVICE_URL}/api/recommendations/${customerId}?limit=${limit}`,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Recommendations failed:', error);
      return { products: [] };
    }
  }

  // ─── Predictive Analytics ───────────────────────────────────────────

  /**
   * Predict customer LTV
   */
  static async predictLTV(data: {
    customerId: string;
    features: {
      totalOrders: number;
      totalSpent: number;
      avgOrderValue: number;
      daysSinceSignup: number;
      engagement: number;
    };
  }) {
    try {
      const response = await axios.post(
        `${PREDICT_SERVICE_URL}/api/ltv/predict`,
        {
          customerId: data.customerId,
          features: data.features,
        },
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('LTV prediction failed:', error);
      return { ltv: 0, tier: 'new' };
    }
  }

  /**
   * Predict churn risk
   */
  static async predictChurn(data: {
    customerId: string;
    daysSinceLastOrder: number;
    engagement: number;
  }) {
    try {
      const response = await axios.post(
        `${PREDICT_SERVICE_URL}/api/churn/predict`,
        {
          customerId: data.customerId,
          daysSinceLastOrder: data.daysSinceLastOrder,
          engagement: data.engagement,
        },
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      console.error('Churn prediction failed:', error);
      return { risk: 'low', score: 0 };
    }
  }

  /**
   * Predict next purchase date
   */
  static async predictNextPurchase(customerId: string) {
    try {
      const response = await axios.get(
        `${PREDICT_SERVICE_URL}/api/next-purchase/${customerId}`,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { predictedDate: null, confidence: 0 };
    }
  }

  // ─── Real-time Segmentation ───────────────────────────────────────────

  /**
   * Get customer segments
   */
  static async getSegments(customerId: string) {
    try {
      const response = await axios.get(
        `${SEGMENT_SERVICE_URL}/api/segments/customer/${customerId}`,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { segments: [] };
    }
  }

  /**
   * Get segment members
   */
  static async getSegmentMembers(segmentId: string) {
    try {
      const response = await axios.get(
        `${SEGMENT_SERVICE_URL}/api/segments/${segmentId}/members`,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { members: [] };
    }
  }

  /**
   * Create dynamic segment
   */
  static async createSegment(data: {
    name: string;
    rules: Array<{ field: string; operator: string; value: any }>;
  }) {
    try {
      const response = await axios.post(
        `${SEGMENT_SERVICE_URL}/api/segments`,
        data,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }

  // ─── Social Signals ───────────────────────────────────────────

  /**
   * Get product social proof
   */
  static async getProductSignals(productId: string) {
    try {
      const response = await axios.get(
        `${SIGNAL_SERVICE_URL}/api/signals/product/${productId}`,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return {
        reviews: 0,
        rating: 0,
        shares: 0,
        wishlists: 0,
        trending: false
      };
    }
  }

  // ─── Unified Profile ───────────────────────────────────────────

  /**
   * Get 360° customer view
   */
  static async getCustomerProfile(customerId: string) {
    try {
      const response = await axios.get(
        `${UNIFIED_PROFILE_URL}/api/profile/${customerId}`,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { customer: null };
    }
  }

  /**
   * Update customer attributes
   */
  static async updateProfile(customerId: string, attributes: Record<string, any>) {
    try {
      const response = await axios.patch(
        `${UNIFIED_PROFILE_URL}/api/profile/${customerId}`,
        attributes,
        { headers: ML_HEADERS }
      );
      return response.data;
    } catch (error) {
      return { success: false };
    }
  }
}

export default IntelligenceIntegration;
