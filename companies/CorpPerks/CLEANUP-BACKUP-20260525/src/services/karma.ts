/**
 * Karma Service Integration for TalentAI
 * Connect candidate Karma scores to job matching
 */

const KARMA_API = process.env.KARMA_API || 'https://karma.onrender.com';

export interface KarmaProfile {
  userId: string;
  lifetimeKarma: number;
  activeKarma: number;
  level: 'starter' | 'active' | 'contributor' | 'leader' | 'elite';
  trustScore: number;
  badges: Badge[];
  eventsCompleted: number;
  totalHours: number;
  skillsContributed: number;
  impactScore: number;
}

export interface Badge {
  id: string;
  name: string;
  icon?: string;
  earnedAt: string;
}

export interface KarmaMatchBonus {
  karmaBonus: number;
  trustBonus: number;
  badgeBonus: number;
  totalBonus: number;
  insights: string[];
}

// ─── Get Candidate Karma Profile ─────────────────────────────────────────────────

export async function getCandidateKarma(userId: string): Promise<KarmaProfile | null> {
  try {
    const response = await fetch(`${KARMA_API}/api/karma/profile/${userId}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.profile;
  } catch (error) {
    logger.error('Karma profile fetch error:', error);
    return null;
  }
}

// ─── Calculate Karma Match Bonus ───────────────────────────────────────────────

export function calculateKarmaMatchBonus(karma: KarmaProfile | null): KarmaMatchBonus {
  if (!karma) {
    return {
      karmaBonus: 0,
      trustBonus: 0,
      badgeBonus: 0,
      totalBonus: 0,
      insights: ['No Karma profile - start earning by completing challenges'],
    };
  }

  // Karma points bonus (0-20 points)
  const karmaBonus = Math.min(20, Math.floor(karma.lifetimeKarma / 100));

  // Trust score bonus (0-15 points)
  const trustBonus = Math.floor((karma.trustScore || 0) * 0.15);

  // Badge bonus (0-10 points, 2 points per badge)
  const badgeBonus = Math.min(10, karma.badges.length * 2);

  // Total bonus
  const totalBonus = karmaBonus + trustBonus + badgeBonus;

  // Insights
  const insights: string[] = [];

  if (karma.level === 'starter') {
    insights.push('New to Karma - building reputation');
  } else if (karma.level === 'elite') {
    insights.push('Elite contributor - high trust');
  }

  if (karma.trustScore > 80) {
    insights.push('High trust score indicates reliability');
  }

  if (karma.eventsCompleted > 10) {
    insights.push(`${karma.eventsCompleted} events completed - proven track record`);
  }

  return {
    karmaBonus,
    trustBonus,
    badgeBonus,
    totalBonus,
    insights,
  };
}

// ─── Get Karma Tier Label ──────────────────────────────────────────────────────

export function getKarmaTier(karma: KarmaProfile | null): {
  tier: string;
  color: string;
  icon: string;
  description: string;
} {
  if (!karma) {
    return {
      tier: 'New',
      color: '#9ca3af',
      icon: '🆕',
      description: 'No Karma profile yet',
    };
  }

  const level = karma.level;
  const lifetimeKarma = karma.lifetimeKarma;

  if (level === 'elite' || lifetimeKarma >= 10000) {
    return {
      tier: 'Elite',
      color: '#ffd700',
      icon: '👑',
      description: 'Top 1% contributor',
    };
  }

  if (level === 'leader' || lifetimeKarma >= 5000) {
    return {
      tier: 'Leader',
      color: '#8b5cf6',
      icon: '⭐',
      description: 'Top 5% contributor',
    };
  }

  if (level === 'contributor' || lifetimeKarma >= 1000) {
    return {
      tier: 'Contributor',
      color: '#10b981',
      icon: '🌟',
      description: 'Active community member',
    };
  }

  if (level === 'active' || lifetimeKarma >= 100) {
    return {
      tier: 'Active',
      color: '#3b82f6',
      icon: '🔥',
      description: 'Building reputation',
    };
  }

  return {
    tier: 'Starter',
    color: '#6b7280',
    icon: '🌱',
    description: 'Just started',
  };
}

// ─── Enhanced Job Match with Karma ───────────────────────────────────────────

export interface EnhancedJobMatch {
  baseMatch: number;
  karmaBonus: KarmaMatchBonus;
  finalMatch: number;
  karmaTier: ReturnType<typeof getKarmaTier>;
  recommendations: string[];
}

export function calculateEnhancedMatch(
  baseMatch: number,
  karma: KarmaProfile | null
): EnhancedJobMatch {
  const karmaBonus = calculateKarmaMatchBonus(karma);
  const karmaTier = getKarmaTier(karma);
  const finalMatch = Math.min(100, baseMatch + karmaBonus.totalBonus);

  const recommendations: string[] = [];

  if (karmaBonus.totalBonus < 10) {
    recommendations.push('Build Karma by completing challenges to improve match');
  }

  if (!karma || karma.level === 'starter') {
    recommendations.push('Earn badges to increase trust score');
  }

  return {
    baseMatch,
    karmaBonus,
    finalMatch,
    karmaTier,
    recommendations,
  };
}

// ─── Employer View: Top Karma Candidates ───────────────────────────────────────

export function rankCandidatesByKarma(candidates: {
  id: string;
  name: string;
  skills: string[];
  karma?: KarmaProfile;
}[]): typeof candidates {
  return candidates.sort((a, b) => {
    const karmaA = a.karma?.lifetimeKarma || 0;
    const karmaB = b.karma?.lifetimeKarma || 0;
    return karmaB - karmaA;
  });
}
