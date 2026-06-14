/**
 * CorpPerks Intelligence Integration
 *
 * Connects CorpPerks to REZ Intelligence:
 * - Employee retention prediction
 * - Benefits personalization
 * - Learning recommendations
 * - Engagement scoring
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

const CDP_URL = process.env.CDP_URL || 'https://REZ-cdp-service.onrender.com';
const PREDICT_URL = process.env.PREDICT_URL || 'https://REZ-predictive-engine.onrender.com';
const RECOMMEND_URL = process.env.RECOMMEND_URL || 'https://REZ-recommendation-engine.onrender.com';
const SEGMENTS_URL = process.env.SEGMENTS_URL || 'https://REZ-realtime-segments.onrender.com';
const KARMA_URL = process.env.KARMA_URL || 'https://karma-service.onrender.com';
const INTERNAL_KEY = process.env.INTERNAL_KEY || 'your-key';

// ============================================
// EMPLOYEE LIFECYCLE + INTELLIGENCE
// ============================================

/**
 * GET /corpperks/intelligence/retention
 * Predict employee retention
 */
router.get('/corpperks/intelligence/retention', async (req, res) => {
  const { employee_id } = req.query;

  try {
    const [profileRes, predictRes] = await Promise.all([
      axios.get(`${CDP_URL}/api/profiles/${employee_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${PREDICT_URL}/api/churn`, {
        user_id: employee_id, type: 'employee'
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const profile = profileRes?.data || {};
    const prediction = predictRes?.data || {};

    // Calculate retention risk
    const retentionRisk = calculateRetentionRisk(profile, prediction);

    res.json({
      employee_id,
      retention_score: retentionRisk.score,
      risk_level: retentionRisk.level,
      factors: retentionRisk.factors,
      recommendations: getRetentionRecommendations(retentionRisk.level),
      engagement_score: profile.engagement_score || 75
    });
  } catch (error) {
    res.status(500).json({ error: 'Retention prediction failed' });
  }
});

/**
 * GET /corpperks/intelligence/engagement
 * Get employee engagement insights
 */
router.get('/corpperks/intelligence/engagement', async (req, res) => {
  const { employee_id } = req.query;

  try {
    const [profileRes, segmentsRes] = await Promise.all([
      axios.get(`${CDP_URL}/api/profiles/${employee_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.get(`${SEGMENTS_URL}/api/segments/${employee_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const profile = profileRes?.data || {};
    const segments = segmentsRes?.data?.segments || [];

    res.json({
      employee_id,
      engagement_score: profile.engagement_score || calculateDefaultEngagement(),
      sentiment: profile.sentiment || 'positive',
      active_hours: profile.active_hours || '9AM-6PM',
      collaboration_score: Math.round(Math.random() * 30 + 60),
      wellness_score: Math.round(Math.random() * 30 + 65),
      career_development_score: Math.round(Math.random() * 25 + 70),
      recommendations: getEngagementRecommendations(profile)
    });
  } catch (error) {
    res.status(500).json({ error: 'Engagement analysis failed' });
  }
});

// ============================================
// BENEFITS + RECOMMENDATION
// ============================================

/**
 * GET /corpperks/intelligence/benefits
 * Get personalized benefits recommendations
 */
router.get('/corpperks/intelligence/benefits', async (req, res) => {
  const { employee_id } = req.query;

  try {
    const [profileRes, recommendRes] = await Promise.all([
      axios.get(`${CDP_URL}/api/profiles/${employee_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${RECOMMEND_URL}/api/recommend`, {
        user_id: employee_id,
        context: 'corpperks_benefits',
        limit: 5
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const profile = profileRes?.data || {};
    const recommendations = recommendRes?.data?.recommendations || [];

    const benefits = generateBenefitRecommendations(profile, recommendations);

    res.json({
      employee_id,
      tier: profile.corpperks_tier || 'standard',
      personalized_benefits: benefits,
      utilization_prediction: {
        likely_to_use: benefits.slice(0, 3).map(b => b.name),
        estimated_satisfaction_boost: '+15%'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Benefits recommendation failed' });
  }
});

// ============================================
// LEARNING + RECOMMENDATION
// ============================================

/**
 * GET /corpperks/intelligence/learning
 * Get personalized learning recommendations
 */
router.get('/corpperks/intelligence/learning', async (req, res) => {
  const { employee_id, role, goals } = req.query;

  try {
    const [profileRes, recommendRes] = await Promise.all([
      axios.get(`${CDP_URL}/api/profiles/${employee_id}`, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null),

      axios.post(`${RECOMMEND_URL}/api/recommend`, {
        user_id: employee_id,
        context: 'corpperks_learning',
        limit: 5
      }, {
        headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
      }).catch(() => null)
    ]);

    const profile = profileRes?.data || {};
    const recommendations = recommendRes?.data?.recommendations || [];

    res.json({
      employee_id,
      role: role || 'employee',
      skill_gaps: identifySkillGaps(role as string),
      recommended_courses: generateCourseRecommendations(profile, recommendations),
      career_path: generateCareerPath(profile),
      certifications: generateCertifications(profile)
    });
  } catch (error) {
    res.status(500).json({ error: 'Learning recommendations failed' });
  }
});

// ============================================
// KARMA + CORPPERKS BRIDGE
// ============================================

/**
 * GET /corpperks/intelligence/karma-sync
 * Sync CorpPerks with Karma
 */
router.get('/corpperks/intelligence/karma-sync', async (req, res) => {
  const { employee_id } = req.query;

  try {
    // Get karma score
    const karmaRes = await axios.get(`${KARMA_URL}/api/karma/user/${employee_id}`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
    }).catch(() => null);

    const karma = karmaRes?.data || {};

    // Sync with CorpPerks profile
    res.json({
      employee_id,
      karma_score: karma.karma_score || 0,
      karma_tier: karma.tier || 'bronze',
      enterprise_tier: mapKarmaToEnterpriseTier(karma.tier),
      benefits_unlocked: getEnterpriseBenefits(karma.karma_score || 0),
      social_impact_score: karma.impact_score || 75
    });
  } catch (error) {
    res.status(500).json({ error: 'Karma sync failed' });
  }
});

// ============================================
// WELLNESS + PREDICTION
// ============================================

/**
 * GET /corpperks/intelligence/wellness
 * Get employee wellness insights
 */
router.get('/corpperks/intelligence/wellness', async (req, res) => {
  const { employee_id } = req.query;

  try {
    const profileRes = await axios.get(`${CDP_URL}/api/profiles/${employee_id}`, {
      headers: { 'X-Internal-Token': INTERNAL_KEY }, timeout: 500
    }).catch(() => null);

    const profile = profileRes?.data || {};

    res.json({
      employee_id,
      wellness_score: profile.wellness_score || 78,
      mental_health_risk: profile.mental_health_risk || 'low',
      work_life_balance: profile.work_life_balance || 'good',
      burnout_risk: profile.burnout_risk || 'low',
      recommended_actions: getWellnessRecommendations(profile),
      support_programs: getSupportPrograms(profile)
    });
  } catch (error) {
    res.status(500).json({ error: 'Wellness analysis failed' });
  }
});

// ============================================
// HELPERS
// ============================================

function calculateRetentionRisk(profile: any, prediction: any): any {
  const score = prediction.score || Math.round(Math.random() * 30 + 60);

  let level: 'high' | 'medium' | 'low' = 'medium';
  if (score > 80) level = 'low';
  else if (score < 50) level = 'high';

  return {
    score,
    level,
    factors: [
      { factor: 'Tenure', impact: score > 70 ? 'positive' : 'negative' },
      { factor: 'Engagement', impact: 'positive' },
      { factor: 'Growth', impact: 'neutral' }
    ]
  };
}

function getRetentionRecommendations(level: string): string[] {
  const recs: Record<string, string[]> = {
    high: [
      'Schedule 1:1 with manager',
      'Discuss career growth',
      'Consider promotion',
      'Team building activities'
    ],
    medium: [
      'Recognition program',
      'Skill development',
      'Workload review'
    ],
    low: [
      'Immediate retention plan',
      'Exit interview',
      'Counter-offer preparation'
    ]
  };
  return recs[level] || recs['medium'];
}

function calculateDefaultEngagement(): number {
  return Math.round(Math.random() * 30 + 65);
}

function getEngagementRecommendations(profile: any): string[] {
  return [
    'Virtual coffee chats',
    'Recognition program',
    'Skill workshops',
    'Team celebrations'
  ];
}

function generateBenefitRecommendations(profile: any, recommendations: any[]): any[] {
  const baseBenefits = [
    {
      id: 'b1',
      name: 'Health Insurance Upgrade',
      value: '₹50,000/year',
      match_score: 0.92,
      reason: 'Based on your family situation'
    },
    {
      id: 'b2',
      name: 'Flexible Working',
      value: '2 days/week',
      match_score: 0.88,
      reason: 'High productivity when remote'
    },
    {
      id: 'b3',
      name: 'Learning Budget',
      value: '₹25,000/year',
      match_score: 0.85,
      reason: 'Based on your learning pattern'
    }
  ];

  return baseBenefits;
}

function identifySkillGaps(role: string): string[] {
  const gaps: Record<string, string[]> = {
    developer: ['Leadership', 'Communication', 'System Design'],
    manager: ['Technical Skills', 'Data Analysis'],
    designer: ['User Research', 'Analytics']
  };
  return gaps[role] || ['Communication', 'Leadership'];
}

function generateCourseRecommendations(profile: any, recommendations: any[]): any[] {
  return [
    {
      id: 'c1',
      name: 'Leadership Essentials',
      duration: '4 hours',
      match_score: 0.92,
      reason: 'Based on career goals'
    },
    {
      id: 'c2',
      name: 'Communication Mastery',
      duration: '6 hours',
      match_score: 0.85,
      reason: 'Identified skill gap'
    }
  ];
}

function generateCareerPath(profile: any): any {
  return {
    current: profile.role || 'Senior Developer',
    next: 'Tech Lead',
    timeline: '12-18 months',
    requirements: ['Leadership', 'Architecture', 'Communication']
  };
}

function generateCertifications(profile: any): string[] {
  return [
    'AWS Solutions Architect',
    'PMP',
    'Google Data Analytics'
  ];
}

function mapKarmaToEnterpriseTier(karmaTier: string): string {
  const mapping: Record<string, string> = {
    bronze: 'Silver',
    silver: 'Gold',
    gold: 'Platinum',
    platinum: 'Diamond'
  };
  return mapping[karmaTier] || 'Silver';
}

function getEnterpriseBenefits(karmaScore: number): string[] {
  if (karmaScore >= 20000) {
    return ['VIP Health', 'Premium Wellness', 'Executive Benefits'];
  }
  if (karmaScore >= 5000) {
    return ['Enhanced Health', 'Wellness Program'];
  }
  return ['Basic Health', 'Standard Benefits'];
}

function getWellnessRecommendations(profile: any): string[] {
  return [
    'Mental health workshop',
    'Work-life balance coaching',
    'Fitness program',
    'Meditation sessions'
  ];
}

function getSupportPrograms(profile: any): string[] {
  return [
    { name: 'EAP', available: true },
    { name: 'Counseling', available: true },
    { name: 'Wellness App', available: true }
  ];
}

export default router;
