/**
 * REZ Intelligence Integration for Verify QR
 * AI-powered fraud detection, insights, and predictions
 */

// ============================================
// INTENT GRAPH - Track user behavior
// ============================================

interface VerifyIntent {
  user_id: string;
  serial_number: string;
  brand: string;
  category: string;
  action: 'scan' | 'activate' | 'claim';
  context: {
    device_id: string;
    location: { lat: number; lng: number; city: string };
    timestamp: Date;
  };
}

// Send to Intent Graph
async function trackVerifyIntent(data: VerifyIntent) {
  try {
    await axios.post(`${INTELLIGENCE_API}/api/intent/track`, {
      user_id: data.user_id,
      intent_type: 'warranty_verification',
      entities: {
        product: data.serial_number,
        brand: data.brand,
        category: data.category
      },
      action: data.action,
      context: data.context,
      confidence: 0.9
    });
  } catch (e) {
    logger.warn('Intelligence service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
}

// ============================================
// FRAUD ENGINE - ML-based detection
// ============================================

interface FraudCheckRequest {
  serial_number: string;
  user_id: string;
  device_id: string;
  location: { lat: number; lng: number };
  purchase_date?: Date;
  activation_history: number;
  recent_scans: number;
}

interface FraudCheckResponse {
  fraud_score: number;          // 0-1
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommended_action: 'allow' | 'review' | 'block';
  anomalies: {
    type: string;
    severity: string;
  }[];
}

// ML Fraud Check
async function mlFraudCheck(data: FraudCheckRequest): Promise<FraudCheckResponse> {
  try {
    const response = await axios.post(`${INTELLIGENCE_API}/api/fraud/verify-qr`, {
      serial_number: data.serial_number,
      user_id: data.user_id,
      device_fingerprint: data.device_id,
      geo_location: data.location,
      purchase_history: {
        date: data.purchase_date,
        activation_count: data.activation_history,
        recent_scan_count: data.recent_scans
      },
      model: 'verify-qr-fraud-v1'
    });
    return response.data;
  } catch (e) {
    // Fallback to rule-based
    return ruleBasedFraudCheck(data);
  }
}

// ============================================
// ATTRIBUTION - Track conversion
// ============================================

interface AttributionEvent {
  user_id: string;
  source: string;           // 'qr_scan' | 'social' | 'referral'
  campaign_id?: string;
  serial_number: string;
  brand: string;
  action: 'scan' | 'activate' | 'claim';
  value?: number;           // cashback amount
  metadata: Record<string, unknown>;
}

// Track attribution
async function trackAttribution(event: AttributionEvent) {
  try {
    await axios.post(`${INTELLIGENCE_API}/api/attribution/track`, {
      event_type: `verify_qr_${event.action}`,
      user_id: event.user_id,
      source: event.source,
      entities: {
        product: { id: event.serial_number, brand: event.brand }
      },
      value: event.value,
      metadata: event.metadata,
      timestamp: new Date()
    });
  } catch (e) {
    logger.warn('Intelligence service call failed', { error: e instanceof Error ? e.message : String(e) });
  }
}

// ============================================
// RECOMMENDATIONS - Upsell/Cross-sell
// ============================================

interface RecommendationRequest {
  user_id: string;
  serial_number: string;
  brand: string;
  category: string;
  warranty_status: 'none' | 'active' | 'expired';
}

interface Recommendation {
  type: 'product' | 'warranty_extend' | 'accessory' | 'insurance';
  item_id: string;
  title: string;
  reason: string;
  confidence: number;
  offer?: { discount: number };
}

// Get recommendations
async function getRecommendations(req: RecommendationRequest): Promise<Recommendation[]> {
  try {
    const response = await axios.post(`${INTELLIGENCE_API}/api/recommend/verify-qr`, {
      user_id: req.user_id,
      context: {
        current_product: { id: req.serial_number, brand: req.brand },
        warranty_status: req.warranty_status
      },
      filters: { type: ['warranty_extend', 'insurance', 'accessory'] }
    });
    return response.data.recommendations;
  } catch (e) {
    return [];
  }
}

// ============================================
// PREDICTIONS - Churn/Claim likelihood
// ============================================

interface PredictionRequest {
  serial_numbers: string[];
  metric: 'claim_likelihood' | 'resale_risk' | 'activation_probability';
}

// Predict outcomes
async function getPredictions(req: PredictionRequest) {
  try {
    const response = await axios.post(`${INTELLIGENCE_API}/api/predict/verify-qr`, {
      entities: req.serial_numbers.map(s => ({ id: s, type: 'serial' })),
      metrics: [req.metric]
    });
    return response.data.predictions;
  } catch (e) {
    return [];
  }
}

// ============================================
// CUSTOMER 360 - Unified view
// ============================================

interface CustomerVerify360 {
  user_id: string;
  total_scans: number;
  total_activations: number;
  brands_verified: string[];
  claim_count: number;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  fraud_risk: number;
  insights: string[];
}

// Get customer 360 for verify
async function getCustomerVerify360(user_id: string): Promise<CustomerVerify360> {
  try {
    const response = await axios.get(`${INTELLIGENCE_API}/api/customer/${user_id}/verify-360`);
    return response.data;
  } catch (e) {
    return {
      user_id,
      total_scans: 0,
      total_activations: 0,
      brands_verified: [],
      claim_count: 0,
      loyalty_tier: 'bronze',
      fraud_risk: 0,
      insights: []
    };
  }
}

// ============================================
// ANOMALY DETECTION
// ============================================

interface AnomalyAlert {
  type: 'serial_batch_fraud' | 'resale_ring' | 'fake_claims';
  severity: 'warning' | 'critical';
  affected_serials: string[];
  evidence: string[];
  recommended_action: string;
}

// Detect anomalies
async function detectAnomalies(serial_numbers: string[]): Promise<AnomalyAlert[]> {
  try {
    const response = await axios.post(`${INTELLIGENCE_API}/api/anomaly/detect`, {
      entity_type: 'serial',
      ids: serial_numbers,
      patterns: ['batch_fraud', 'resale_ring', 'fake_claims']
    });
    return response.data.anomalies;
  } catch (e) {
    return [];
  }
}

// ============================================
// ENRICH PRODUCT DATA
// ============================================

interface ProductEnrichment {
  serial_number: string;
  enriched_data: {
    sentiment_score: number;
    review_count: number;
    similar_products: string[];
    market_price: number;
    resale_value: number;
    category_trend: 'rising' | 'stable' | 'declining';
  };
}

// Enrich product info
async function enrichProduct(serial: string): Promise<ProductEnrichment | null> {
  try {
    const response = await axios.post(`${INTELLIGENCE_API}/api/enrich/product`, {
      product_id: serial,
      sources: ['reviews', 'marketplace', 'social']
    });
    return response.data;
  } catch (e) {
    return null;
  }
}

// ============================================
// EXPORT FOR SERVICE
// ============================================

export {
  trackVerifyIntent,
  mlFraudCheck,
  trackAttribution,
  getRecommendations,
  getPredictions,
  getCustomerVerify360,
  detectAnomalies,
  enrichProduct
};
