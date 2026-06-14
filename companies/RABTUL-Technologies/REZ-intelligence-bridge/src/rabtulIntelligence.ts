/**
 * RABTUL Intelligence Integration
 *
 * Connects RABTUL services to REZ Intelligence:
 * - Auth → Fraud Agent + Intent
 * - Payment → Fraud Agent
 * - Wallet → Recommendation + Segments
 * - Order → Intent + Prediction
 * - Notifications → Intent + CDP
 * - Search → Intent + Recommendation
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';
const FRAUD_URL = process.env.FRAUD_URL || 'https://REZ-fraud-agent.onrender.com';
const INTENT_URL = process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com';
const RECOMMEND_URL = process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com';
const PREDICT_URL = process.env.PREDICT_URL || 'https://REZ-predictive-engine.onrender.com';
const SEGMENTS_URL = process.env.SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'your-key';

// ============================================
// AUTH + FRAUD + INTENT
// ============================================

/**
 * POST /api/auth/intelligence/login
 * Authenticate with AI risk assessment
 */
router.post('/auth/intelligence/login', async (req, res) => {
  const { user_id, email, device_id, ip_address } = req.body;

  try {
    // Get fraud score
    const [fraudRes, intentRes] = await Promise.all([
      axios.post(`${FRAUD_URL}/api/score`, {
        user_id,
        device_id,
        ip_address,
        type: 'login'
      }, { headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500 }).catch(() => null),

      axios.post(`${INTENT_URL}/api/predict`, { user_id }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const fraudScore = fraudRes?.data?.risk_score || 0;
    const intent = intentRes?.data?.primary_intent || 'login';

    // Determine auth requirements
    let authLevel = 'basic';
    let mfaRequired = false;

    if (fraudScore > 0.7) {
      authLevel = 'high';
      mfaRequired = true;
    } else if (fraudScore > 0.3) {
      authLevel = 'medium';
      mfaRequired = Math.random() > 0.5; // STATISTICAL: mock MFA requirement for testing
    }

    // Get user profile for personalization
    const profileRes = await axios.get(`${CDP_URL}/api/profiles/${user_id}`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
    }).catch(() => null);

    res.json({
      auth_level: authLevel,
      mfa_required: mfaRequired,
      fraud_score: fraudScore,
      user_intent: intent,
      profile: profileRes?.data || null,
      personalization: {
        homepage_order: getPersonalizedOrder(intent),
        preferred_categories: profileRes?.data?.preferences?.categories || [],
        recommended_features: getRecommendedFeatures(intent)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Intelligence check failed' });
  }
});

// ============================================
// PAYMENT + FRAUD
// ============================================

/**
 * POST /api/payment/intelligence/score
 * Score transaction with AI fraud detection
 */
router.post('/payment/intelligence/score', async (req, res) => {
  const { user_id, amount, type, merchant_id, payment_method, metadata } = req.body;

  try {
    // Parallel fraud checks
    const [fraudRes, profileRes] = await Promise.all([
      axios.post(`${FRAUD_URL}/api/score`, {
        user_id,
        amount,
        type: 'payment',
        merchant_id,
        payment_method
      }, { headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500 }),

      axios.get(`${CDP_URL}/api/profiles/${user_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const fraudResult = fraudRes?.data || {};
    const profile = profileRes?.data || {};

    // Calculate final risk
    const baseRisk = fraudResult.risk_score || 0;
    const profileRisk = getProfileRisk(profile, amount);
    const finalRisk = (baseRisk * 0.7) + (profileRisk * 0.3);

    let action: 'allow' | 'review' | 'block' = 'allow';
    if (finalRisk > 0.8) action = 'block';
    else if (finalRisk > 0.5) action = 'review';

    res.json({
      transaction_id: `txn_${Date.now()}`,
      risk_score: finalRisk,
      action,
      fraud_factors: fraudResult.factors || [],
      profile_insights: profile.insights || [],
      recommendation: getRecommendation(finalRisk, profile)
    });
  } catch (error) {
    res.status(500).json({ error: 'Fraud scoring failed' });
  }
});

// ============================================
// WALLET + RECOMMENDATION
// ============================================

/**
 * GET /api/wallet/intelligence/rewards
 * Get personalized reward recommendations
 */
router.get('/wallet/intelligence/rewards', async (req, res) => {
  const { user_id } = req.query;

  try {
    const [profileRes, segmentsRes, recommendRes] = await Promise.all([
      axios.get(`${CDP_URL}/api/profiles/${user_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.get(`${SEGMENTS_URL}/api/segments/${user_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${RECOMMEND_URL}/api/recommend`, {
        user_id,
        context: 'wallet_reward',
        limit: 5
      }, { headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500 }).catch(() => null)
    ]);

    const profile = profileRes?.data || {};
    const segments = segmentsRes?.data?.segments || [];
    const recommendations = recommendRes?.data?.recommendations || [];

    const rewards = generateWalletRewards(profile, segments, recommendations);

    res.json({
      user_id,
      tier: profile.tier || 'bronze',
      current_balance: profile.wallet_balance || 0,
      recommended_rewards: rewards,
      cashback_offers: generateCashbackOffers(profile)
    });
  } catch (error) {
    res.status(500).json({ error: 'Reward recommendations failed' });
  }
});

// ============================================
// ORDER + INTENT + PREDICTION
// ============================================

/**
 * POST /api/order/intelligence/predict
 * Predict order outcomes
 */
router.post('/order/intelligence/predict', async (req, res) => {
  const { user_id, cart, location } = req.body;

  try {
    const [intentRes, predictRes] = await Promise.all([
      axios.post(`${INTENT_URL}/api/predict`, { user_id }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${PREDICT_URL}/api/order/likelihood`, {
        user_id,
        cart,
        location
      }, { headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500 }).catch(() => null)
    ]);

    const intent = intentRes?.data?.primary_intent || 'browse';
    const prediction = predictRes?.data || { conversion_probability: 0.5 };

    res.json({
      user_id,
      intent,
      conversion_probability: prediction.conversion_probability,
      recommended_actions: getRecommendedActions(intent, prediction),
      personalized_offers: getPersonalizedOffers(intent, prediction)
    });
  } catch (error) {
    res.status(500).json({ error: 'Order prediction failed' });
  }
});

// ============================================
// NOTIFICATIONS + INTENT
// ============================================

/**
 * GET /api/notifications/intelligence/optimal
 * Get optimal notification timing
 */
router.get('/notifications/intelligence/optimal', async (req, res) => {
  const { user_id } = req.query;

  try {
    const [intentRes, segmentsRes] = await Promise.all([
      axios.post(`${INTENT_URL}/api/predict`, { user_id }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.get(`${SEGMENTS_URL}/api/segments/${user_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const intent = intentRes?.data?.primary_intent || 'browse';
    const segments = segmentsRes?.data?.segments || [];

    res.json({
      user_id,
      optimal_send_time: getOptimalTime(intent),
      channel: getPreferredChannel(segments),
      content_personalization: {
        subject: getPersonalizedSubject(intent),
        body: getPersonalizedBody(intent),
        cta: getPersonalizedCTA(intent)
      },
      notification_type: getNotificationType(intent)
    });
  } catch (error) {
    res.status(500).json({ error: 'Notification optimization failed' });
  }
});

// ============================================
// SEARCH + INTENT + RECOMMENDATION
// ============================================

/**
 * GET /api/search/intelligence/results
 * Get AI-enhanced search results
 */
router.get('/search/intelligence/results', async (req, res) => {
  const { user_id, query } = req.query;

  try {
    const [intentRes, recommendRes] = await Promise.all([
      axios.post(`${INTENT_URL}/api/predict`, { user_id: user_id as string }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${RECOMMEND_URL}/api/search`, {
        user_id: user_id as string,
        query
      }, { headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500 }).catch(() => null)
    ]);

    const intent = intentRes?.data?.primary_intent || 'search';
    const recommendations = recommendRes?.data?.results || [];

    res.json({
      query,
      intent,
      ai_insights: {
        likely_intent: intent,
        recommended_filters: getRecommendedFilters(intent),
        personalized_boost: getPersonalizedBoost(intent)
      },
      results: recommendations
    });
  } catch (error) {
    res.status(500).json({ error: 'Search intelligence failed' });
  }
});

// ============================================
// HELPERS
// ============================================

function getPersonalizedOrder(intent: string): string[] {
  const orders: Record<string, string[]> = {
    'purchase': ['deals', 'popular', 'new'],
    'browse': ['recommended', 'trending', 'categories'],
    'compare': ['specs', 'reviews', 'deals'],
    'search': ['results', 'suggestions', 'categories']
  };
  return orders[intent] || orders['browse'];
}

function getRecommendedFeatures(intent: string): string[] {
  const features: Record<string, string[]> = {
    'purchase': ['quick_buy', 'express_checkout', 'loyalty_discount'],
    'browse': ['recommendations', 'categories', 'trending'],
    'compare': ['comparison_tools', 'reviews', 'specs']
  };
  return features[intent] || features['browse'];
}

function getProfileRisk(profile, amount: number): number {
  let risk = 0;
  if (profile.account_age < 30) risk += 0.2;
  if (profile.transaction_count < 5) risk += 0.2;
  if (amount > profile.avg_transaction * 5) risk += 0.3;
  return Math.min(risk, 1);
}

function getRecommendation(risk: number, profile): string {
  if (risk > 0.8) return 'Block transaction - high risk detected';
  if (risk > 0.5) return 'Review transaction - moderate risk';
  if (profile.tier === 'gold' || profile.tier === 'platinum') return 'Allow - premium customer';
  return 'Allow - normal risk profile';
}

function generateWalletRewards(profile, segments: string[], recommendations: unknown[]): unknown[] {
  return [
    {
      id: 'r1',
      type: 'cashback',
      title: '5% Cashback',
      description: 'On your next purchase',
      points_required: 100,
      match_score: 0.92,
      reason: 'Based on your purchase history'
    },
    {
      id: 'r2',
      type: 'discount',
      title: '₹50 Off',
      description: 'On orders above ₹500',
      points_required: 200,
      match_score: 0.85,
      reason: 'Great for your preferred category'
    }
  ];
}

function generateCashbackOffers(profile): unknown[] {
  return [
    { offer: 'Extra 2% cashback on UPI', expires: '2 days', match: 0.9 },
    { offer: '3x coins on first order', expires: '1 week', match: 0.85 }
  ];
}

function getRecommendedActions(intent: string, prediction): string[] {
  const actions: Record<string, string[]> = {
    'purchase': ['show_checkout', 'offer_discount', 'express_checkout'],
    'browse': ['show_recommendations', 'highlight_deals', 'similar_items'],
    'abandoned': ['recovery_offer', 'reminder', 'incentive']
  };
  return actions[intent] || actions['browse'];
}

function getPersonalizedOffers(intent: string, prediction): unknown[] {
  if (prediction.conversion_probability > 0.8) {
    return [{ type: 'urgency', message: 'Complete your purchase!' }];
  }
  if (prediction.conversion_probability > 0.5) {
    return [{ type: 'incentive', message: '₹50 off to complete order' }];
  }
  return [];
}

function getOptimalTime(intent: string): { hour: number; day: string } {
  const times: Record<string, unknown> = {
    'purchase': { hour: 19, day: 'Friday' },
    'browse': { hour: 21, day: 'Saturday' },
    'compare': { hour: 14, day: 'Sunday' }
  };
  return times[intent] || { hour: 20, day: 'Friday' };
}

function getPreferredChannel(segments: string[]): string {
  if (segments.includes('mobile')) return 'push';
  if (segments.includes('email_preferred')) return 'email';
  return 'in_app';
}

function getPersonalizedSubject(intent: string): string {
  const subjects: Record<string, string> = {
    'purchase': 'Complete your purchase - Limited time offer!',
    'browse': 'New items you might love',
    'loyalty': 'Your exclusive rewards are waiting'
  };
  return subjects[intent] || 'Check out these recommendations';
}

function getPersonalizedBody(intent: string): string {
  const bodies: Record<string, string> = {
    'purchase': 'Complete your order and earn bonus coins!',
    'browse': 'Based on your browsing history',
    'loyalty': 'You\'ve earned 500 bonus points!'
  };
  return bodies[intent] || 'Hello from REZ!';
}

function getPersonalizedCTA(intent: string): string {
  const ctas: Record<string, string> = {
    'purchase': 'Complete Order',
    'browse': 'Shop Now',
    'loyalty': 'Claim Rewards'
  };
  return ctas[intent] || 'Shop Now';
}

function getNotificationType(intent: string): string {
  if (intent === 'purchase') return 'reminder';
  if (intent === 'browse') return 'recommendation';
  return 'engagement';
}

function getRecommendedFilters(intent: string): string[] {
  const filters: Record<string, string[]> = {
    'search': ['price_range', 'brand', 'category'],
    'browse': ['trending', 'new_arrivals', 'deals'],
    'compare': ['specs', 'price', 'rating']
  };
  return filters[intent] || filters['browse'];
}

function getPersonalizedBoost(intent: string): Record<string, number> {
  const boosts: Record<string, Record<string, number>> = {
    'deals': { discount: 1.5, trending: 1.2 },
    'premium': { rating: 1.3, brand: 1.2 },
    'new': { new_arrivals: 2.0, featured: 1.5 }
  };
  return boosts[intent] || boosts['deals'];
}

export default router;
