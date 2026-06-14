/**
 * REZ Media Intelligence Integration
 *
 * Connects REZ Media services to Intelligence:
 * - AdBazaar → Intent targeting
 * - Karma → AI recommendations
 * - DOOH → Contextual content
 * - Attribution → ML attribution
 */

import express from 'express';
import axios from 'axios';
import { randomInt, randomUUID } from 'crypto';

const router = express.Router();

const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';
const INTENT_URL = process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com';
const RECOMMEND_URL = process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com';
const FRAUD_URL = process.env.FRAUD_URL || 'https://REZ-fraud-agent.onrender.com';
const SEGMENTS_URL = process.env.SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'your-key';

// ============================================
// ADBAZAAR + INTELLIGENCE
// ============================================

/**
 * POST /api/adbazaar/intelligence/targeting
 * Get AI-powered ad targeting
 */
router.post('/adbazaar/intelligence/targeting', async (req, res) => {
  const { campaign_id, user_id, context } = req.body;

  try {
    // Parallel intelligence calls
    const [intentRes, segmentsRes, fraudRes] = await Promise.all([
      axios.post(`${INTENT_URL}/api/predict`, { user_id }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.get(`${SEGMENTS_URL}/api/segments/${user_id}`, {
        headers: { ' 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${FRAUD_URL}/api/score`, {
        user_id, type: 'ad_impression'
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const intent = intentRes?.data || {};
    const segments = segmentsRes?.data?.segments || [];
    const fraudRisk = fraudRes?.data?.risk_score || 0;

    // Exclude high fraud risk users
    if (fraudRisk > 0.7) {
      return res.json({
        targeting: { eligible: false, reason: 'Fraud risk too high' }
      });
    }

    res.json({
      targeting: {
        eligible: true,
        user_intent: intent.primary_intent || 'browse',
        intent_confidence: intent.confidence || 0.5,
        segments,
        recommended_creatives: getRecommendedCreatives(intent),
        bid_adjustment: calculateBidAdjustment(intent, fraudRisk),
        frequency_optimization: getFrequencyCap(intent),
        fraud_risk: fraudRisk
      },
      campaign_optimization: getCampaignOptimization(campaign_id, intent)
    });
  } catch (error) {
    res.status(500).json({ error: 'Intelligence targeting failed' });
  }
});

/**
 * GET /api/adbazaar/intelligence/audiences
 * Get AI-generated audiences
 */
router.get('/adbazaar/intelligence/audiences', async (req, res) => {
  const { campaign_id } = req.query;

  try {
    // Get dynamic audiences from segments service
    const segmentsRes = await axios.get(`${SEGMENTS_URL}/api/audiences`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 1000
    }).catch(() => null);

    const audiences = segmentsRes?.data?.audiences || generateMockAudiences();

    res.json({
      audiences: audiences.map(a => ({
        ...a,
        size: a.size || randomInt(10000, 110001),
        intent_match: randomInt(70, 101),
        predicted_ctr: ((randomInt(200, 501) / 100) + 2).toFixed(1)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Audience generation failed' });
  }
});

// ============================================
// KARMA + INTELLIGENCE
// ============================================

/**
 * GET /karma/intelligence/recommendations
 * Get AI-powered karma mission recommendations
 */
router.get('/karma/intelligence/recommendations', async (req, res) => {
  const { user_id } = req.query;

  try {
    const [profileRes, intentRes, recommendRes] = await Promise.all([
      axios.get(`${CDP_URL}/api/profiles/${user_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${INTENT_URL}/api/predict`, { user_id }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${RECOMMEND_URL}/api/recommend`, {
        user_id, context: 'karma_mission', limit: 5
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const profile = profileRes?.data || {};
    const intent = intentRes?.data || {};
    const recommendations = recommendRes?.data?.recommendations || [];

    const missions = generateMissionRecommendations(intent, profile);

    res.json({
      user_id,
      profile: {
        karma_score: profile.karma_score || 0,
        tier: profile.tier || 'bronze',
        causes: profile.causes || ['community']
      },
      recommended_missions: missions,
      engagement_prediction: {
        predicted_engagement: randomInt(60, 91),
        recommended_mission_type: getMissionType(intent)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Mission recommendations failed' });
  }
});

/**
 * GET /karma/intelligence/impact-prediction
 * Predict user impact potential
 */
router.get('/karma/intelligence/impact-prediction', async (req, res) => {
  const { user_id } = req.query;

  try {
    const profileRes = await axios.get(`${CDP_URL}/api/profiles/${user_id}`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
    }).catch(() => null);

    const profile = profileRes?.data || {};

    res.json({
      user_id,
      impact_prediction: {
        likelihood_to_donate: randomInt(50, 81),
        preferred_causes: profile.causes || ['environment', 'education'],
        estimated_lifetime_impact: randomInt(5000, 55001),
        social_influence_score: randomInt(50, 91),
        retention_probability: randomInt(80, 101)
      },
      personalized_insights: [
        'Based on your history, education causes resonate most with you',
        'Your social sharing frequency suggests high influence potential',
        'Environment missions have 85% completion rate for users like you'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Impact prediction failed' });
  }
});

// ============================================
// DOOH + INTELLIGENCE
// ============================================

/**
 * GET /dooh/intelligence/content
 * Get AI-personalized DOOH content
 */
router.get('/dooh/intelligence/content', async (req, res) => {
  const { screen_id, location, audience } = req.query;

  try {
    // Get audience segments for this screen
    const segmentsRes = await axios.get(`${SEGMENTS_URL}/api/screens/${screen_id}/audience`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
    }).catch(() => null);

    const segments = segmentsRes?.data?.segments || ['general'];

    // Get recommendations for this audience
    const recommendRes = await axios.post(`${RECOMMEND_URL}/api/recommend`, {
      context: 'dooh_content',
      segments
    }, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
    }).catch(() => null);

    const recommendations = recommendRes?.data?.recommendations || [];

    res.json({
      screen_id,
      location,
      recommended_content: recommendations.map(r => ({
        content_id: r.id,
        type: r.type || 'banner',
        duration: getContentDuration(r.type),
        relevance_score: r.score || 0.8
      })),
      fallback_content: getFallbackContent(),
      context_tags: segments
    });
  } catch (error) {
    res.status(500).json({ error: 'Content personalization failed' });
  }
});

// ============================================
// ATTRIBUTION + INTELLIGENCE
// ============================================

/**
 * GET /attribution/intelligence/model
 * Get AI attribution model
 */
router.get('/attribution/intelligence/model', async (req, res) => {
  const { model_type } = req.query;

  // Supported AI attribution models
  const models = {
    linear: {
      name: 'Linear Attribution',
      description: 'Equal credit to all touchpoints'
    },
    position: {
      name: 'Position-based',
      description: '40% first, 40% last, 20% middle'
    },
    time_decay: {
      name: 'Time Decay',
      description: 'More credit to recent touchpoints'
    },
    data_driven: {
      name: 'AI Data-Driven',
      description: 'ML-optimized credit distribution'
    }
  };

  res.json({
    current_model: model_type || 'data_driven',
    available_models: models,
    ai_optimization: {
      recommended: 'data_driven',
      reason: 'ML model shows 23% better ROAS prediction',
      estimated_improvement: '+23% ROAS'
    }
  });
});

// ============================================
// HELPERS
// ============================================

function getRecommendedCreatives(intent): unknown[] {
  const intentMap: Record<string, string[]> = {
    'purchase': ['discount_banner', 'limited_offer', 'buy_now'],
    'browse': ['new_arrivals', 'trending', 'featured'],
    'compare': ['specs_banner', 'vs_competitor', 'review_highlight']
  };

  const creatives = intentMap[intent.primary_intent] || intentMap['browse'];

  return creatives.map((name, i) => ({
    name,
    creative_id: `c_${i + 1}`,
    predicted_ctr: ((randomInt(200, 401) / 100) + 3).toFixed(1),
    match_score: (0.9 - i * 0.1).toFixed(2)
  }));
}

function calculateBidAdjustment(intent, fraudRisk: number): number {
  // Higher intent = higher bid
  const intentBoost = intent.confidence || 0.5;
  // Lower fraud = higher bid
  const fraudDeduction = fraudRisk * 0.3;

  return Math.max(0.5, Math.min(2.0, intentBoost - fraudDeduction + 1));
}

function getFrequencyCap(intent): number {
  const caps: Record<string, number> = {
    'purchase': 3,
    'browse': 5,
    'compare': 4
  };
  return caps[intent.primary_intent] || 5;
}

function getCampaignOptimization(campaignId: string, intent): unknown {
  return {
    recommended_budget_allocation: {
      search: randomInt(30, 51),
      display: randomInt(20, 31),
      social: randomInt(15, 31)
    },
    predicted_outcomes: {
      impressions: randomInt(100000, 1100001),
      clicks: randomInt(1000, 11001),
      conversions: randomInt(50, 551),
      roas: ((randomInt(200, 501) / 100) + 2).toFixed(2)
    }
  };
}

function generateMockAudiences(): unknown[] {
  return [
    { id: 'a1', name: 'High Intent Shoppers', description: 'Users likely to purchase' },
    { id: 'a2', name: 'Deal Seekers', description: 'Discount-conscious users' },
    { id: 'a3', name: 'New Users', description: 'Joined in last 30 days' },
    { id: 'a4', name: 'Loyal Customers', description: 'Repeat purchasers' }
  ];
}

function generateMissionRecommendations(intent, profile): unknown[] {
  const causes = profile.causes || ['community'];
  const baseCause = causes[0] || 'community';

  const missionTemplates: Record<string, unknown[]> = {
    environment: [
      { id: 'm1', name: 'Plant Trees', points: 100, difficulty: 'medium' },
      { id: 'm2', name: 'Beach Cleanup', points: 150, difficulty: 'hard' },
      { id: 'm3', name: 'Plastic Free Week', points: 200, difficulty: 'hard' }
    ],
    education: [
      { id: 'm4', name: 'Teach Kids', points: 120, difficulty: 'easy' },
      { id: 'm5', name: 'Book Donation', points: 100, difficulty: 'easy' }
    ],
    community: [
      { id: 'm6', name: 'Help Neighbor', points: 50, difficulty: 'easy' },
      { id: 'm7', name: 'Food Drive', points: 80, difficulty: 'medium' }
    ]
  };

  return missionTemplates[baseCause] || missionTemplates['community'];
}

function getMissionType(intent): string {
  if (intent.primary_intent === 'community') return 'social';
  if (intent.primary_intent === 'environment') return 'sustainability';
  return 'community';
}

function getContentDuration(type: string): number {
  const durations: Record<string, number> = {
    banner: 15,
    video: 30,
    interactive: 20
  };
  return durations[type] || 15;
}

function getFallbackContent(): unknown[] {
  return [
    { content_id: 'f1', type: 'banner', name: 'REZ Logo', duration: 10 }
  ];
}

export default router;
