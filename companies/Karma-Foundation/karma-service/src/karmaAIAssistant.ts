/**
 * Karma AI Impact Assistant
 *
 * AI-powered mission and perk recommendations
 * Predicts user engagement
 * Personalizes karma experience
 */

import express from 'express';
import axios from 'axios';
import { createServiceLogger } from './config/logger.js';

const log = createServiceLogger('karmaAIAssistant');
const router = express.Router();

const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';
const INTENT_URL = process.env.INTENT_URL || 'https://rez-intent-predictor.onrender.com';
const RECOMMEND_URL = process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com';
// SECURITY FIX: INTERNAL_KEY must be set in environment - no fallback default
const INTERNAL_KEY = process.env.INTERNAL_SERVICE_TOKEN;
if (!INTERNAL_KEY) {
  log.error('INTERNAL_SERVICE_TOKEN not set - AI features may be unavailable');
}

// ============================================
// AI ASSISTANT
// ============================================

/**
 * GET /api/karma/ai/recommend-missions
 * Get AI-recommended missions
 */
router.get('/ai/recommend-missions', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  // Get user profile
  const profile = await getUserProfile(userId as string);

  // Get AI recommendations
  const recommendations = await getMissionRecommendations(userId as string, profile);

  res.json({ recommendations });
});

/**
 * GET /api/karma/ai/recommend-perks
 * Get AI-recommended perks
 */
router.get('/ai/recommend-perks', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const profile = await getUserProfile(userId as string);
  const recommendations = await getPerkRecommendations(userId as string, profile);

  res.json({ recommendations });
});

/**
 * GET /api/karma/ai/predict-engagement
 * Predict user engagement probability
 */
router.get('/ai/predict-engagement', async (req, res) => {
  const { userId, missionId } = req.query;

  if (!userId || !missionId) {
    return res.status(400).json({ error: 'userId and missionId required' });
  }

  const prediction = await predictEngagement(userId as string, missionId as string);

  res.json({ prediction });
});

/**
 * GET /api/karma/ai/next-best-action
 * Get AI's recommended next action
 */
router.get('/ai/next-best-action', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const action = await getNextBestAction(userId as string);

  res.json({ action });
});

/**
 * POST /api/karma/ai/chat
 * Chat with karma AI assistant
 */
router.post('/ai/chat', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message required' });
  }

  const response = await chatWithAssistant(userId, message);

  res.json({ response });
});

/**
 * GET /api/karma/ai/impact-insights
 * Get AI impact insights
 */
router.get('/ai/impact-insights', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  const insights = await getImpactInsights(userId as string);

  res.json({ insights });
});

// ============================================
// AI HELPERS
// ============================================

async function getUserProfile(userId: string): Promise<unknown> {
  try {
    const response = await axios.get(`${CDP_URL}/api/profiles/${userId}`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY },
      timeout: 3000
    });
    return response.data;
  } catch {
    return null;
  }
}

async function getMissionRecommendations(userId: string, profile): Promise<unknown[]> {
  try {
    // Get intent prediction
    const intentRes = await axios.post(`${INTENT_URL}/api/predict`, {
      user_id: userId
    }, {
      headers: { 'X-Internal-Token': INTERNAL_KEY },
      timeout: 3000
    }).catch(() => null);

    // Get ML recommendations
    const recommendRes = await axios.post(`${RECOMMEND_URL}/api/recommend`, {
      user_id: userId,
      context: 'karma_mission',
      limit: 5
    }, {
      headers: { 'X-Internal-Token': INTERNAL_KEY },
      timeout: 3000
    }).catch(() => null);

    const intent = intentRes?.data?.primary_intent || 'community';
    const mlRecs = recommendRes?.data?.recommendations || [];

    // Generate contextual recommendations
    const missions = generateContextualMissions(intent, profile);

    return missions.map((m, i) => ({
      ...m,
      score: mlRecs[i]?.score || (0.9 - i * 0.1),
      reason: generateRecommendationReason(intent, m.type)
    }));
  } catch {
    return getFallbackMissions();
  }
}

function generateContextualMissions(intent: string, profile): unknown[] {
  const missionTemplates = {
    environment: [
      { id: 'm1', name: 'Plant Trees', type: 'planting', points: 100, difficulty: 'medium' },
      { id: 'm2', name: 'Beach Cleanup', type: 'cleanup', points: 150, difficulty: 'hard' },
      { id: 'm3', name: 'Plastic Free Week', type: 'sustainability', points: 200, difficulty: 'hard' }
    ],
    community: [
      { id: 'm4', name: 'Teach Kids', type: 'education', points: 120, difficulty: 'easy' },
      { id: 'm5', name: 'Senior Care Visit', type: 'social', points: 100, difficulty: 'easy' },
      { id: 'm6', name: 'Food Drive', type: 'donation', points: 80, difficulty: 'easy' }
    ],
    health: [
      { id: 'm7', name: 'Blood Donation Camp', type: 'health', points: 200, difficulty: 'medium' },
      { id: 'm8', name: 'Yoga Session', type: 'wellness', points: 50, difficulty: 'easy' },
      { id: 'm9', name: 'Health Awareness', type: 'health', points: 100, difficulty: 'medium' }
    ]
  };

  return missionTemplates[intent as keyof typeof missionTemplates] || missionTemplates.community;
}

function generateRecommendationReason(intent: string, missionType: string): string {
  const reasons = {
    environment: 'Based on your interest in sustainability',
    community: 'Great match for your community focus',
    health: 'Aligned with your wellness activities',
    social: 'Perfect for your social engagement'
  };

  return reasons[intent as keyof typeof reasons] || 'Recommended for you';
}

function getFallbackMissions(): unknown[] {
  return [
    { id: 'f1', name: 'Daily Check-in', type: 'daily', points: 5, difficulty: 'easy', score: 0.9, reason: 'Start your karma journey' },
    { id: 'f2', name: 'Help a Neighbor', type: 'social', points: 50, difficulty: 'easy', score: 0.8, reason: 'Easy community impact' },
    { id: 'f3', name: 'Share Karma', type: 'social', points: 10, difficulty: 'easy', score: 0.7, reason: 'Share with friends' }
  ];
}

async function getPerkRecommendations(userId: string, profile): Promise<unknown[]> {
  try {
    const recommendRes = await axios.post(`${RECOMMEND_URL}/api/recommend`, {
      user_id: userId,
      context: 'karma_perk',
      limit: 5
    }, {
      headers: { 'X-Internal-Token': INTERNAL_KEY },
      timeout: 3000
    }).catch(() => null);

    const mlRecs = recommendRes?.data?.recommendations || [];

    return mlRecs.length > 0 ? mlRecs : getFallbackPerks();
  } catch {
    return getFallbackPerks();
  }
}

function getFallbackPerks(): unknown[] {
  return [
    { id: 'p1', name: '₹10 REZ Coins', points: 100, score: 0.9, reason: 'Most popular' },
    { id: 'p2', name: 'Plant a Tree', points: 50, score: 0.8, reason: 'Environmental impact' },
    { id: 'p3', name: '₹50 Discount', points: 500, score: 0.7, reason: 'Great value' }
  ];
}

async function predictEngagement(userId: string, missionId: string): Promise<unknown> {
  // Simplified prediction
  // NOTE: Math.random() is ACCEPTABLE here for non-security ML predictions
  // This is a mock prediction function for demonstration purposes
  const baseProbability = 0.5 + Math.random() * 0.4;

  const profile = await getUserProfile(userId);

  // Adjust based on user history
  let probability = baseProbability;
  if (profile) {
    // Higher for returning users
    probability += 0.1;
    // Higher for matching interests (using Math.random for demo prediction)
    probability += Math.random() * 0.1;
  }

  return {
    mission_id: missionId,
    probability: Math.min(probability, 0.98),
    predicted: probability > 0.7 ? 'likely' : probability > 0.4 ? 'possible' : 'unlikely',
    factors: [
      { factor: 'User activity', impact: 'positive' },
      { factor: 'Mission type match', impact: 'positive' },
      { factor: 'Time of day', impact: 'neutral' }
    ]
  };
}

async function getNextBestAction(userId: string): Promise<unknown> {
  const profile = await getUserProfile(userId);
  const missions = await getMissionRecommendations(userId, profile);

  if (missions.length === 0) {
    return {
      action: 'check_in',
      title: 'Daily Check-in',
      points: 5,
      reason: 'Start your day with karma'
    };
  }

  const bestMission = missions[0];

  return {
    action: 'mission',
    mission_id: bestMission.id,
    title: bestMission.name,
    points: bestMission.points,
    reason: bestMission.reason
  };
}

async function chatWithAssistant(userId: string, message: string): Promise<unknown> {
  const lower = message.toLowerCase();

  // Intent detection
  if (lower.includes('best mission') || lower.includes('recommend')) {
    const nextAction = await getNextBestAction(userId);
    return {
      message: `Based on your profile, I recommend: ${nextAction.title}! You'll earn ${nextAction.points} karma points. ${nextAction.reason}`,
      action: nextAction
    };
  }

  if (lower.includes('how much') && lower.includes('karma')) {
    return {
      message: 'You can check your karma score in the app. Visit /karma/my-karma to see your current score and tier!',
      quick_reply: { label: 'View My Karma', action: 'navigate', screen: '/karma/my-karma' }
    };
  }

  if (lower.includes('donate') || lower.includes('charity')) {
    return {
      message: 'Great choice! Here are donation opportunities: Plant Trees (50 pts), Feed Hungry (100 pts), Education Fund (200 pts)',
      quick_reply: { label: 'View Donation Options', action: 'navigate', screen: '/karma/donate' }
    };
  }

  if (lower.includes('leaderboard') || lower.includes('rank')) {
    return {
      message: 'You\'re currently in the Gold tier! Top 10% of karma users. Keep going!',
      quick_reply: { label: 'View Leaderboard', action: 'navigate', screen: '/karma/leaderboard' }
    };
  }

  // Default response
  return {
    message: 'I\'m here to help with karma! Ask me about:\n• Best missions for you\n• Your karma score\n• How to earn more points\n• Donation options',
    suggestions: [
      'Best missions?',
      'My karma score',
      'How to earn points?',
      'Donation options'
    ]
  };
}

async function getImpactInsights(userId: string): Promise<unknown> {
  const profile = await getUserProfile(userId);

  return {
    carbon_footprint_reduction: '12.5 kg CO2',
    trees_planted: 8,
    people_helped: 45,
    volunteering_hours: 24,
    donation_value: '₹5,000',
    streak_days: 15,
    top_category: profile?.segments?.[0] || 'community',
    impact_score: 85,
    comparisons: {
      city_average: '+25%',
      global_average: '+45%'
    },
    suggestions: [
      'You\'re in the top 15% of karma users!',
      'Try an environmental mission for bonus impact',
      'Share your impact to earn extra points'
    ]
  };
}

export default router;
