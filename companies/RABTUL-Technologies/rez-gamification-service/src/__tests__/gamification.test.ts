/**
 * Gamification Service Tests
 * Tests for points, badges, levels, and achievements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface UserPoints {
  userId: string;
  points: number;
  level: number;
  totalEarned: number;
  totalSpent: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: BadgeCriteria;
}

interface BadgeCriteria {
  type: 'points' | 'actions' | 'streak' | 'milestone';
  threshold: number;
  action?: string;
}

interface Achievement {
  userId: string;
  badgeId: string;
  earnedAt: Date;
}

// Points calculation
function calculateLevel(points: number): number {
  // Level formula: each level requires 100 more points
  // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
  let level = 1;
  let threshold = 0;
  let increment = 100;

  while (points >= threshold + increment) {
    threshold += increment;
    level++;
    increment += 50;
  }

  return level;
}

function pointsToNextLevel(currentPoints: number): number {
  const currentLevel = calculateLevel(currentPoints);
  let threshold = 0;
  let increment = 100;

  for (let i = 1; i < currentLevel; i++) {
    threshold += increment;
    increment += 50;
  }

  const nextThreshold = threshold + increment;
  return nextThreshold - currentPoints;
}

// Badge eligibility
function isEligibleForBadge(
  user: UserPoints,
  badge: Badge,
  stats: Record<string, number>
): boolean {
  const criteria = badge.criteria;

  switch (criteria.type) {
    case 'points':
      return user.points >= criteria.threshold;

    case 'actions':
      return (stats[criteria.action!] || 0) >= criteria.threshold;

    case 'streak':
      return (stats['streak'] || 0) >= criteria.threshold;

    case 'milestone':
      return user.totalEarned >= criteria.threshold;

    default:
      return false;
  }
}

// Points transaction
function addPoints(
  user: UserPoints,
  amount: number,
  reason: string
): { user: UserPoints; transaction: PointsTransaction } {
  const transaction: PointsTransaction = {
    id: `txn_${Date.now()}`,
    userId: user.userId,
    amount,
    type: 'earn',
    reason,
    balanceAfter: user.points + amount,
    timestamp: new Date()
  };

  return {
    user: {
      ...user,
      points: user.points + amount,
      totalEarned: user.totalEarned + amount,
      level: calculateLevel(user.points + amount)
    },
    transaction
  };
}

function deductPoints(
  user: UserPoints,
  amount: number,
  reason: string
): { user: UserPoints; transaction: PointsTransaction } | { error: string } {
  if (amount > user.points) {
    return { error: 'Insufficient points' };
  }

  const transaction: PointsTransaction = {
    id: `txn_${Date.now()}`,
    userId: user.userId,
    amount,
    type: 'spend',
    reason,
    balanceAfter: user.points - amount,
    timestamp: new Date()
  };

  return {
    user: {
      ...user,
      points: user.points - amount,
      totalSpent: user.totalSpent + amount
    },
    transaction
  };
}

interface PointsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  balanceAfter: number;
  timestamp: Date;
}

// Leaderboard
function buildLeaderboard(users: UserPoints[], limit: number = 10): UserPoints[] {
  return [...users]
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((user, index) => ({
      ...user,
      rank: index + 1
    }));
}

describe('Level Calculation', () => {
  it('should return level 1 for 0 points', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('should return level 1 for 99 points', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('should return level 2 for 100 points', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('should return level 3 for 300 points', () => {
    expect(calculateLevel(300)).toBe(3);
  });

  it('should increase level as points increase', () => {
    expect(calculateLevel(0)).toBeLessThan(calculateLevel(500));
    expect(calculateLevel(500)).toBeLessThan(calculateLevel(1000));
  });
});

describe('Points to Next Level', () => {
  it('should return 100 for level 1 user with 0 points', () => {
    expect(pointsToNextLevel(0)).toBe(100);
  });

  it('should return correct points for level 2', () => {
    expect(pointsToNextLevel(100)).toBe(150); // Level 2 requires 100-249
  });

  it('should decrease as user approaches next level', () => {
    expect(pointsToNextLevel(90)).toBe(10);
    expect(pointsToNextLevel(95)).toBe(5);
  });
});

describe('Badge Eligibility', () => {
  const user: UserPoints = {
    userId: 'user_1',
    points: 500,
    level: 4,
    totalEarned: 600,
    totalSpent: 100
  };

  const badges: Badge[] = [
    { id: 'newcomer', name: 'Newcomer', description: 'Welcome!', icon: '🎉', criteria: { type: 'points', threshold: 10 } },
    { id: 'bronze', name: 'Bronze Member', description: '100 points', icon: '🥉', criteria: { type: 'points', threshold: 100 } },
    { id: 'silver', name: 'Silver Member', description: '500 points', icon: '🥈', criteria: { type: 'points', threshold: 500 } },
    { id: 'action_10', name: 'Active User', description: '10 purchases', icon: '🛒', criteria: { type: 'actions', threshold: 10, action: 'purchase' } },
    { id: 'streak_7', name: 'Week Warrior', description: '7 day streak', icon: '🔥', criteria: { type: 'streak', threshold: 7 } },
  ];

  it('should be eligible for newcomer badge', () => {
    const badge = badges.find(b => b.id === 'newcomer')!;
    expect(isEligibleForBadge(user, badge, {})).toBe(true);
  });

  it('should be eligible for bronze badge', () => {
    const badge = badges.find(b => b.id === 'bronze')!;
    expect(isEligibleForBadge(user, badge, {})).toBe(true);
  });

  it('should be eligible for silver badge', () => {
    const badge = badges.find(b => b.id === 'silver')!;
    expect(isEligibleForBadge(user, badge, {})).toBe(true);
  });

  it('should not be eligible for action badge without actions', () => {
    const badge = badges.find(b => b.id === 'action_10')!;
    expect(isEligibleForBadge(user, badge, { purchase: 5 })).toBe(false);
  });

  it('should be eligible for action badge with enough actions', () => {
    const badge = badges.find(b => b.id === 'action_10')!;
    expect(isEligibleForBadge(user, badge, { purchase: 15 })).toBe(true);
  });
});

describe('Adding Points', () => {
  it('should add points correctly', () => {
    const user: UserPoints = {
      userId: 'user_1',
      points: 100,
      level: 2,
      totalEarned: 100,
      totalSpent: 0
    };

    const result = addPoints(user, 50, 'Purchase reward');

    expect(result.user.points).toBe(150);
    expect(result.user.totalEarned).toBe(150);
    expect(result.transaction.amount).toBe(50);
    expect(result.transaction.type).toBe('earn');
  });

  it('should update level when crossing threshold', () => {
    const user: UserPoints = {
      userId: 'user_1',
      points: 95,
      level: 1,
      totalEarned: 95,
      totalSpent: 0
    };

    const result = addPoints(user, 10, 'Referral bonus');

    expect(result.user.level).toBe(2);
  });
});

describe('Deducting Points', () => {
  it('should deduct points correctly', () => {
    const user: UserPoints = {
      userId: 'user_1',
      points: 200,
      level: 3,
      totalEarned: 200,
      totalSpent: 0
    };

    const result = deductPoints(user, 50, 'Redeem reward');

    expect(result).not.toHaveProperty('error');
    if (!('error' in result)) {
      expect(result.user.points).toBe(150);
      expect(result.user.totalSpent).toBe(50);
      expect(result.transaction.type).toBe('spend');
    }
  });

  it('should reject deduction with insufficient points', () => {
    const user: UserPoints = {
      userId: 'user_1',
      points: 30,
      level: 1,
      totalEarned: 30,
      totalSpent: 0
    };

    const result = deductPoints(user, 50, 'Redeem reward');

    expect(result).toHaveProperty('error');
  });
});

describe('Leaderboard', () => {
  const users: UserPoints[] = [
    { userId: 'u1', points: 500, level: 4, totalEarned: 500, totalSpent: 0 },
    { userId: 'u2', points: 1000, level: 6, totalEarned: 1000, totalSpent: 0 },
    { userId: 'u3', points: 300, level: 3, totalEarned: 300, totalSpent: 0 },
    { userId: 'u4', points: 750, level: 5, totalEarned: 750, totalSpent: 0 },
  ];

  it('should rank users by points descending', () => {
    const leaderboard = buildLeaderboard(users);

    expect(leaderboard[0].userId).toBe('u2'); // 1000 points
    expect(leaderboard[1].userId).toBe('u4'); // 750 points
    expect(leaderboard[2].userId).toBe('u1'); // 500 points
    expect(leaderboard[3].userId).toBe('u3'); // 300 points
  });

  it('should limit leaderboard size', () => {
    const leaderboard = buildLeaderboard(users, 2);
    expect(leaderboard).toHaveLength(2);
  });

  it('should include rank in results', () => {
    const leaderboard = buildLeaderboard(users);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].rank).toBe(2);
  });
});
