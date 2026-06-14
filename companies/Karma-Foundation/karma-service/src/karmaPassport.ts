/**
 * Karma Passport - Public Impact Identity
 *
 * A verifiable impact passport showing:
 * - Contributions
 * - Causes supported
 * - Badges earned
 * - Events attended
 * - Social proof
 * - Trust score
 */

import express from 'express';
import { logger } from './utils/logger';

const router = express.Router();

// ============================================
// TYPES
// ============================================

interface Passport {
  user_id: string;
  karma_score: number;
  tier: string;
  badges: Badge[];
  impact_stats: ImpactStats;
  causes_supported: string[];
  verification_level: 'basic' | 'verified' | 'premium';
  created_at: string;
  verified_at?: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  icon: string;
  verified: boolean;
}

interface ImpactStats {
  total_points: number;
  total_impact: number;
  events_attended: number;
  donations_value: number;
  co2_saved: number;
  lives_impacted: number;
  volunteering_hours: number;
  streak_days: number;
}

interface PublicProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  passport: Passport;
  recent_achievements: Badge[];
  trust_score: number;
}

// ============================================
// PASSPORT API
// ============================================

/**
 * GET /api/karma/passport/:userId
 * Get user's karma passport (full private version)
 */
router.get('/passport/:userId', async (req, res) => {
  const { userId } = req.params;
  const requestingUser = req.userId;

  // Check if user can view full passport
  if (userId !== requestingUser) {
    return res.status(403).json({ error: 'Can only view own passport' });
  }

  const passport = await getPassport(userId);

  res.json({ passport });
});

/**
 * GET /api/karma/passport/:userId/public
 * Get public passport (shareable)
 */
router.get('/passport/:userId/public', async (req, res) => {
  const { userId } = req.params;

  const publicProfile = await getPublicProfile(userId);

  res.json({ profile: publicProfile });
});

/**
 * GET /api/karma/passport/:userId/verify
 * Get verification status
 */
router.get('/passport/:userId/verify', async (req, res) => {
  const { userId } = req.params;

  const verification = await getVerificationStatus(userId);

  res.json({ verification });
});

/**
 * POST /api/karma/passport/:userId/verify
 * Submit verification (photo, ID, etc.)
 */
router.post('/passport/:userId/verify', async (req, res) => {
  const { userId } = req.params;
  const { type, documents } = req.body;

  // Submit for verification
  const verification = await submitVerification(userId, type, documents);

  res.json({ verification });
});

// ============================================
// TRUST SCORE
// ============================================

/**
 * GET /api/karma/trust-score/:userId
 * Get user's trust score
 */
router.get('/trust-score/:userId', async (req, res) => {
  const { userId } = req.params;

  const trustScore = await calculateTrustScore(userId);

  res.json({ trust_score: trustScore });
});

/**
 * GET /api/karma/trust-breakdown/:userId
 * Get trust score breakdown
 */
router.get('/trust-breakdown/:userId', async (req, res) => {
  const { userId } = req.params;

  const breakdown = await getTrustBreakdown(userId);

  res.json({ breakdown });
});

// ============================================
// BADGES
// ============================================

/**
 * GET /api/karma/badges
 * Get all available badges
 */
router.get('/badges', async (req, res) => {
  const badges = getAllBadges();

  res.json({ badges });
});

/**
 * GET /api/karma/badges/earned/:userId
 * Get user's earned badges
 */
router.get('/badges/earned/:userId', async (req, res) => {
  const { userId } = req.params;

  const earned = await getEarnedBadges(userId);

  res.json({ badges: earned });
});

/**
 * POST /api/karma/badges/:badgeId/earn
 * Earn a badge (check eligibility)
 */
router.post('/badges/:badgeId/earn', async (req, res) => {
  const { userId } = req.userId;
  const { badgeId } = req.params;

  const result = await checkAndEarnBadge(userId, badgeId);

  res.json(result);
});

// ============================================
// SHAREABLE LINK
// ============================================

/**
 * GET /api/karma/passport/:userId/share
 * Generate shareable passport link
 */
router.get('/passport/:userId/share', async (req, res) => {
  const { userId } = req.params;
  const { platform } = req.query;

  const shareLink = await generateShareLink(userId, platform as string);

  res.json({ share_link: shareLink });
});

/**
 * POST /api/karma/passport/:userId/share
 * Share passport to social platform
 */
router.post('/passport/:userId/share', async (req, res) => {
  const { userId } = req.params;
  const { platform, message } = req.body;

  const result = await sharePassport(userId, platform, message);

  // Award bonus points for sharing
  if (result.success) {
    await awardBonusPoints(userId, 10, 'passport_share');
  }

  res.json(result);
});

// ============================================
// HELPERS
// ============================================

async function getPassport(userId: string): Promise<Passport> {
  // Mock data - replace with actual database queries
  return {
    user_id: userId,
    karma_score: 4520,
    tier: 'gold',
    badges: [
      {
        id: 'b1',
        name: 'First Steps',
        description: 'Earned first 100 karma',
        earned_at: '2024-01-15',
        rarity: 'common',
        icon: '🌱',
        verified: true
      },
      {
        id: 'b2',
        name: 'Community Hero',
        description: 'Helped 50 community members',
        earned_at: '2024-03-20',
        rarity: 'rare',
        icon: '🦸',
        verified: true
      },
      {
        id: 'b3',
        name: 'Earth Guardian',
        description: 'Planted 100 trees',
        earned_at: '2024-06-01',
        rarity: 'epic',
        icon: '🌍',
        verified: true
      }
    ],
    impact_stats: {
      total_points: 4520,
      total_impact: 125,
      events_attended: 8,
      donations_value: 5000,
      co2_saved: 125,
      lives_impacted: 45,
      volunteering_hours: 24,
      streak_days: 15
    },
    causes_supported: ['environment', 'education', 'health'],
    verification_level: 'verified',
    created_at: '2024-01-01'
  };
}

async function getPublicProfile(userId: string): Promise<PublicProfile> {
  const passport = await getPassport(userId);

  return {
    user_id: userId,
    display_name: 'Karma Champion',
    avatar_url: `https://api.dicebear.com/7.x/avataaars/${userId}.png`,
    passport,
    recent_achievements: passport.badges.slice(0, 3),
    trust_score: 0.85
  };
}

async function getVerificationStatus(userId: string): Promise<unknown> {
  return {
    user_id: userId,
    level: 'verified',
    verified_at: '2024-03-15',
    documents: ['phone', 'email'],
    pending: []
  };
}

async function submitVerification(userId: string, type: string, documents: unknown[]): Promise<unknown> {
  // Submit for admin review
  return {
    submitted: true,
    status: 'pending',
    estimated_completion: '2-3 business days'
  };
}

async function calculateTrustScore(userId: string): Promise<number> {
  // Calculate based on:
  // - Badge rarity
  // - Verification level
  // - Activity consistency
  // - Community contributions
  // - Response rate
  // - Verification status

  const passport = await getPassport(userId);

  let score = 0.5; // Base

  // Add for badges
  const badgeScores = {
    common: 0.05,
    rare: 0.1,
    epic: 0.15,
    legendary: 0.25
  };

  for (const badge of passport.badges) {
    score += badgeScores[badge.rarity] || 0.05;
  }

  // Add for verification
  const verificationScores = {
    basic: 0,
    verified: 0.1,
    premium: 0.2
  };
  score += verificationScores[passport.verification_level as keyof typeof verificationScores] || 0;

  // Add for streak
  score += Math.min(passport.impact_stats.streak_days * 0.01, 0.1);

  return Math.min(score, 1.0);
}

async function getTrustBreakdown(userId: string): Promise<unknown> {
  const score = await calculateTrustScore(userId);

  return {
    overall: score,
    components: {
      badges: { score: 0.25, weight: 0.3 },
      verification: { score: 0.1, weight: 0.2 },
      consistency: { score: 0.15, weight: 0.2 },
      community: { score: 0.2, weight: 0.15 },
      verification_status: { score: 0.1, weight: 0.15 }
    },
    tier: score > 0.8 ? 'Trusted' : score > 0.5 ? 'Verified' : 'New'
  };
}

function getAllBadges(): Badge[] {
  return [
    { id: 'b1', name: 'First Steps', description: 'Earn first 100 karma', rarity: 'common', icon: '🌱', earned_at: '', verified: false },
    { id: 'b2', name: 'Regular', description: '30-day streak', rarity: 'rare', icon: '🔥', earned_at: '', verified: false },
    { id: 'b3', name: 'Champion', description: 'Earn 5000 karma', rarity: 'epic', icon: '🏆', earned_at: '', verified: false },
    { id: 'b4', name: 'Legend', description: 'Earn 20000 karma', rarity: 'legendary', icon: '⭐', earned_at: '', verified: false },
    { id: 'b5', name: 'Earth Guardian', description: 'Plant 100 trees', rarity: 'epic', icon: '🌍', earned_at: '', verified: false },
    { id: 'b6', name: 'Community Hero', description: 'Help 50 members', rarity: 'rare', icon: '🦸', earned_at: '', verified: false },
    { id: 'b7', name: 'Social Butterfly', description: 'Share 10 times', rarity: 'common', icon: '🦋', earned_at: '', verified: false },
    { id: 'b8', name: 'Lifesaver', description: 'Blood donation', rarity: 'epic', icon: '💉', earned_at: '', verified: false },
    { id: 'b9', name: 'Mentor', description: 'Help 100 users', rarity: 'rare', icon: '📚', earned_at: '', verified: false },
    { id: 'b10', name: 'Guardian Angel', description: 'Help 500 users', rarity: 'legendary', icon: '👼', earned_at: '', verified: false }
  ];
}

async function getEarnedBadges(userId: string): Promise<Badge[]> {
  const passport = await getPassport(userId);
  return passport.badges;
}

async function checkAndEarnBadge(userId: string, badgeId: string): Promise<unknown> {
  const allBadges = getAllBadges();
  const badge = allBadges.find(b => b.id === badgeId);

  if (!badge) {
    return { earned: false, error: 'Badge not found' };
  }

  // Check if already earned
  const passport = await getPassport(userId);
  if (passport.badges.find(b => b.id === badgeId)) {
    return { earned: false, error: 'Badge already earned' };
  }

  // Check eligibility (simplified)
  const eligible = await checkBadgeEligibility(userId, badge);

  if (eligible) {
    return { earned: true, badge };
  }

  return { earned: false, error: 'Not eligible' };
}

async function checkBadgeEligibility(userId: string, badge: Badge): Promise<boolean> {
  // Check karma points, missions completed, etc.
  return true;
}

async function generateShareLink(userId: string, platform?: string): Promise<string> {
  const base = 'https://karma.rez.money/passport';
  const token = Buffer.from(userId).toString('base64');
  return `${base}/${token}${platform ? `?ref=${platform}` : ''}`;
}

async function sharePassport(userId: string, platform: string, message?: string): Promise<unknown> {
  return {
    success: true,
    platform,
    message: message || 'Check out my Karma Impact Passport!',
    share_url: await generateShareLink(userId, platform)
  };
}

async function awardBonusPoints(userId: string, points: number, reason: string): Promise<void> {
  // Award bonus points for sharing
  logger.info(`Awarded ${points} bonus points to ${userId} for ${reason}`);
}

export default router;
