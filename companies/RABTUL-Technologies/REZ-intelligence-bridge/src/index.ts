/**
 * REZ Intelligence Bridge - Connects all services to Intelligence
 *
 * Single integration point for all AI/ML services
 *
 * Features:
 * - Unified intent prediction
 * - Fraud scoring
 * - Recommendations
 * - Churn prediction
 * - Unified profiles
 * - Cross-company intelligence
 */

import axios from 'axios';

const INTELLIGENCE_URL = process.env.INTELLIGENCE_URL || 'https://REZ-cdp-service.onrender.com';
const FRAUD_URL = process.env.FRAUD_URL || 'https://REZ-fraud-agent.onrender.com';
const INTENT_URL = process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com';
const RECOMMEND_URL = process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'your-key';

// ============================================
// UNIFIED INTELLIGENCE CLIENT
// ============================================

class RezIntelligence {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ==========================================
  // INTENT PREDICTION
  // ==========================================

  /**
   * Predict user intent in real-time
   */
  async predictIntent(userId: string): Promise<IntentPrediction> {
    try {
      const response = await axios.post(`${INTENT_URL}/api/predict`, {
        user_id: userId
      }, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 500
      });
      return response.data;
    } catch (error) {
      return this.getDefaultIntent();
    }
  }

  /**
   * Get top user intents
   */
  async getTopIntents(userId: string): Promise<string[]> {
    const prediction = await this.predictIntent(userId);
    return prediction.top_intents || ['browse', 'compare'];
  }

  // ==========================================
  // FRAUD DETECTION
  // ==========================================

  /**
   * Check fraud risk for transaction
   */
  async checkFraud(params: {
    user_id?: string;
    amount: number;
    type: string;
    device_id?: string;
    ip_address?: string;
  }): Promise<FraudResult> {
    try {
      const response = await axios.post(`${FRAUD_URL}/api/score`, params, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 500
      });

      return {
        risk_level: response.data.risk_level || 'low',
        risk_score: response.data.risk_score || 0,
        action: this.getFraudAction(response.data.risk_score || 0),
        factors: response.data.risk_factors || []
      };
    } catch (error) {
      return { risk_level: 'low', risk_score: 0, action: 'allow', factors: [] };
    }
  }

  private getFraudAction(score: number): 'allow' | 'review' | 'block' {
    if (score < 0.3) return 'allow';
    if (score < 0.7) return 'review';
    return 'block';
  }

  // ==========================================
  // RECOMMENDATIONS
  // ==========================================

  /**
   * Get personalized recommendations
   */
  async getRecommendations(userId: string, params?: {
    limit?: number;
    context?: string;
    category?: string;
  }): Promise<Recommendation[]> {
    try {
      const response = await axios.post(`${RECOMMEND_URL}/api/recommend`, {
        user_id: userId,
        limit: params?.limit || 10,
        context: params?.context || 'general',
        category: params?.category
      }, {
        headers: { 'X-API-Key': this.apiKey },
        timeout: 500
      });
      return response.data.recommendations || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get merchant recommendations
   */
  async getMerchantRecommendations(userId: string, location?: {
    lat: number;
    lng: number;
  }): Promise<Recommendation[]> {
    return this.getRecommendations(userId, { context: 'merchant', limit: 5 });
  }

  // ==========================================
  // PREDICTIVE ENGINE
  // ==========================================

  /**
   * Predict customer churn risk
   */
  async predictChurn(userId: string): Promise<ChurnPrediction> {
    try {
      const response = await axios.post(`${INTELLIGENCE_URL}/api/predict/churn`, {
        user_id: userId
      }, {
        headers: { 'X-API-Key': this.apiKey }
      });

      return {
        risk: response.data.risk || 'low',
        score: response.data.score || 0,
        factors: response.data.factors || []
      };
    } catch (error) {
      return { risk: 'low', score: 0, factors: [] };
    }
  }

  /**
   * Predict customer LTV
   */
  async predictLTV(userId: string): Promise<{ ltv: number; tier: string }> {
    try {
      const response = await axios.post(`${INTELLIGENCE_URL}/api/predict/ltv`, {
        user_id: userId
      }, {
        headers: { 'X-API-Key': this.apiKey }
      });

      return {
        ltv: response.data.ltv || 0,
        tier: this.getLTVTier(response.data.ltv || 0)
      };
    } catch (error) {
      return { ltv: 0, tier: 'standard' };
    }
  }

  private getLTVTier(ltv: number): string {
    if (ltv > 100000) return 'platinum';
    if (ltv > 50000) return 'gold';
    if (ltv > 10000) return 'silver';
    return 'standard';
  }

  // ==========================================
  // UNIFIED PROFILE (CDP)
  // ==========================================

  /**
   * Get unified customer profile
   */
  async getProfile(userId: string): Promise<CustomerProfile> {
    try {
      const response = await axios.get(`${INTELLIGENCE_URL}/api/profiles/${userId}`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      return response.data;
    } catch (error) {
      return this.getDefaultProfile(userId);
    }
  }

  /**
   * Update customer profile
   */
  async updateProfile(userId: string, data: Partial<CustomerProfile>): Promise<void> {
    try {
      await axios.patch(`${INTELLIGENCE_URL}/api/profiles/${userId}`, data, {
        headers: { 'X-API-Key': this.apiKey }
      });
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  }

  // ==========================================
  // SEGMENTS
  // ==========================================

  /**
   * Get user segments
   */
  async getUserSegments(userId: string): Promise<string[]> {
    try {
      const response = await axios.get(`${INTELLIGENCE_URL}/api/segments/${userId}`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      return response.data.segments || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get users in segment
   */
  async getSegmentUsers(segmentId: string): Promise<string[]> {
    try {
      const response = await axios.get(`${INTELLIGENCE_URL}/api/segments/${segmentId}/users`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      return response.data.users || [];
    } catch (error) {
      return [];
    }
  }

  // ==========================================
  // NEXT BEST ACTION
  // ==========================================

  /**
   * Get AI-recommended next action
   */
  async getNextBestAction(params: {
    user_id: string;
    goal?: 'conversion' | 'retention' | 'engagement';
    context?: string;
  }): Promise<NextBestAction> {
    // Combine predictions for best action
    const [churn, ltv, intents] = await Promise.all([
      this.predictChurn(params.user_id),
      this.predictLTV(params.user_id),
      this.getTopIntents(params.user_id)
    ]);

    // Determine action based on context
    if (params.goal === 'retention' || churn.risk === 'high') {
      return {
        action: 'offer_loyalty_reward',
        reason: 'High churn risk detected',
        offer: '20% off next purchase',
        priority: 'high'
      };
    }

    if (params.goal === 'conversion' || intents.includes('purchase')) {
      return {
        action: 'show_checkout_offer',
        reason: 'User intent to purchase',
        offer: 'Free delivery',
        priority: 'high'
      };
    }

    return {
      action: 'personalized_recommendation',
      reason: 'General recommendation',
      offer: await this.getRecommendations(params.user_id, { limit: 3 }).then(r => r[0]?.title),
      priority: 'medium'
    };
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private getDefaultIntent(): IntentPrediction {
    return {
      primary_intent: 'browse',
      confidence: 0.5,
      top_intents: ['browse', 'compare', 'research']
    };
  }

  private getDefaultProfile(userId: string): CustomerProfile {
    return {
      user_id: userId,
      segments: [],
      preferences: {},
      ltv_tier: 'standard'
    };
  }
}

// ============================================
// TYPES
// ============================================

interface IntentPrediction {
  primary_intent: string;
  confidence: number;
  top_intents: string[];
}

interface FraudResult {
  risk_level: 'low' | 'medium' | 'high';
  risk_score: number;
  action: 'allow' | 'review' | 'block';
  factors: string[];
}

interface Recommendation {
  id: string;
  title: string;
  type: string;
  score: number;
}

interface ChurnPrediction {
  risk: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
}

interface CustomerProfile {
  user_id: string;
  segments: string[];
  preferences: Record<string, unknown>;
  ltv_tier: string;
}

interface NextBestAction {
  action: string;
  reason: string;
  offer?: string;
  priority: 'low' | 'medium' | 'high';
}

// ============================================
// EXPORTS
// ============================================

export { RezIntelligence };

export default new RezIntelligence(process.env.INTELLIGENCE_KEY || '');


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-intelligence-bridge',
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
