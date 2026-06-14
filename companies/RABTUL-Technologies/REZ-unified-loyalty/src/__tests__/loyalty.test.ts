/**
 * Unified Loyalty Tests
 * Tests for points, rewards, tiers, and loyalty management
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface LoyaltyAccount {
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  lifetimePoints: number;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire';
  points: number;
  balance: number;
  description: string;
  timestamp: Date;
}

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  type: 'discount' | 'cashback' | 'freebie' | 'voucher';
  active: boolean;
}

// Tier management
function calculateTier(lifetimePoints: number): LoyaltyAccount['tier'] {
  if (lifetimePoints >= 50000) return 'platinum';
  if (lifetimePoints >= 20000) return 'gold';
  if (lifetimePoints >= 5000) return 'silver';
  return 'bronze';
}

// Points earning
function earnPoints(
  account: LoyaltyAccount,
  amount: number,
  description: string
): Transaction {
  // Base rate: 1 point per 100 rupees
  const basePoints = Math.floor(amount / 100);

  // Tier multipliers
  const tierMultipliers: Record<string, number> = {
    bronze: 1.0,
    silver: 1.25,
    gold: 1.5,
    platinum: 2.0,
  };

  const multiplier = tierMultipliers[account.tier];
  const earnedPoints = Math.floor(basePoints * multiplier);

  const transaction: Transaction = {
    id: `txn_${Date.now()}`,
    type: 'earn',
    points: earnedPoints,
    balance: account.points + earnedPoints,
    description,
    timestamp: new Date(),
  };

  account.points += earnedPoints;
  account.lifetimePoints += earnedPoints;
  account.tier = calculateTier(account.lifetimePoints);
  account.transactions.push(transaction);

  return transaction;
}

// Points redemption
function redeemPoints(
  account: LoyaltyAccount,
  points: number,
  description: string
): Transaction | null {
  if (points > account.points) return null;

  const transaction: Transaction = {
    id: `txn_${Date.now()}`,
    type: 'redeem',
    points: -points,
    balance: account.points - points,
    description,
    timestamp: new Date(),
  };

  account.points -= points;
  account.transactions.push(transaction);

  return transaction;
}

// Points expiry
function expirePoints(
  account: LoyaltyAccount,
  points: number
): Transaction | null {
  const toExpire = Math.min(points, account.points);

  if (toExpire <= 0) return null;

  const transaction: Transaction = {
    id: `txn_${Date.now()}`,
    type: 'expire',
    points: -toExpire,
    balance: account.points - toExpire,
    description: 'Points expired',
    timestamp: new Date(),
  };

  account.points -= toExpire;
  account.transactions.push(transaction);

  return transaction;
}

// Reward validation
function canRedeem(account: LoyaltyAccount, reward: Reward): boolean {
  if (!reward.active) return false;
  if (account.points < reward.pointsCost) return false;

  // Tier restrictions
  const tierRewards: Record<string, string[]> = {
    bronze: ['discount', 'voucher'],
    silver: ['discount', 'voucher', 'cashback'],
    gold: ['discount', 'voucher', 'cashback', 'freebie'],
    platinum: ['discount', 'voucher', 'cashback', 'freebie'],
  };

  return tierRewards[account.tier]?.includes(reward.type) ?? false;
}

// Points value calculation
function getPointsValue(points: number, rewardType: string): number {
  const values: Record<string, number> = {
    discount: points * 0.25, // 1 point = ₹0.25
    cashback: points * 0.20,
    voucher: points * 0.15,
    freebie: points * 0.10,
  };
  return values[rewardType] || points * 0.15;
}

describe('Tier Calculation', () => {
  it('should calculate bronze tier', () => {
    expect(calculateTier(0)).toBe('bronze');
    expect(calculateTier(4999)).toBe('bronze');
  });

  it('should calculate silver tier', () => {
    expect(calculateTier(5000)).toBe('silver');
    expect(calculateTier(19999)).toBe('silver');
  });

  it('should calculate gold tier', () => {
    expect(calculateTier(20000)).toBe('gold');
    expect(calculateTier(49999)).toBe('gold');
  });

  it('should calculate platinum tier', () => {
    expect(calculateTier(50000)).toBe('platinum');
    expect(calculateTier(100000)).toBe('platinum');
  });
});

describe('Points Earning', () => {
  let account: LoyaltyAccount;

  beforeEach(() => {
    account = {
      userId: 'user_1',
      points: 0,
      tier: 'bronze',
      lifetimePoints: 0,
      transactions: [],
    };
  });

  it('should earn base points', () => {
    const txn = earnPoints(account, 1000, 'Purchase');

    expect(txn.type).toBe('earn');
    expect(txn.points).toBe(10); // 1000/100 = 10 points
    expect(account.points).toBe(10);
  });

  it('should apply tier multiplier', () => {
    account.tier = 'gold';
    const txn = earnPoints(account, 1000, 'Purchase');

    expect(txn.points).toBe(15); // 10 * 1.5 = 15 points
  });

  it('should upgrade tier on lifetime points', () => {
    earnPoints(account, 500000, 'Big purchase');
    expect(account.tier).toBe('platinum');
  });

  it('should round down fractional points', () => {
    const txn = earnPoints(account, 150, 'Small purchase');
    expect(txn.points).toBe(1); // 150/100 = 1.5 -> 1
  });
});

describe('Points Redemption', () => {
  let account: LoyaltyAccount;

  beforeEach(() => {
    account = {
      userId: 'user_1',
      points: 1000,
      tier: 'silver',
      lifetimePoints: 10000,
      transactions: [],
    };
  });

  it('should redeem points', () => {
    const txn = redeemPoints(account, 500, 'Reward redemption');

    expect(txn).not.toBeNull();
    expect(txn!.points).toBe(-500);
    expect(account.points).toBe(500);
  });

  it('should reject insufficient points', () => {
    const txn = redeemPoints(account, 2000, 'Reward redemption');
    expect(txn).toBeNull();
  });

  it('should record transaction', () => {
    redeemPoints(account, 500, 'Reward');
    expect(account.transactions).toHaveLength(1);
  });
});

describe('Points Expiry', () => {
  let account: LoyaltyAccount;

  beforeEach(() => {
    account = {
      userId: 'user_1',
      points: 500,
      tier: 'bronze',
      lifetimePoints: 1000,
      transactions: [],
    };
  });

  it('should expire points', () => {
    const txn = expirePoints(account, 100);

    expect(txn).not.toBeNull();
    expect(txn!.points).toBe(-100);
    expect(account.points).toBe(400);
  });

  it('should cap expiry at balance', () => {
    const txn = expirePoints(account, 1000);

    expect(txn!.points).toBe(-500);
    expect(account.points).toBe(0);
  });
});

describe('Reward Validation', () => {
  const reward: Reward = {
    id: 'reward_1',
    name: '₹100 Discount',
    pointsCost: 400,
    type: 'discount',
    active: true,
  };

  it('should allow redemption when eligible', () => {
    const account: LoyaltyAccount = {
      userId: 'user_1',
      points: 500,
      tier: 'bronze',
      lifetimePoints: 6000,
      transactions: [],
    };

    expect(canRedeem(account, reward)).toBe(true);
  });

  it('should reject when insufficient points', () => {
    const account: LoyaltyAccount = {
      userId: 'user_1',
      points: 100,
      tier: 'bronze',
      lifetimePoints: 6000,
      transactions: [],
    };

    expect(canRedeem(account, reward)).toBe(false);
  });

  it('should reject inactive rewards', () => {
    const inactiveReward: Reward = { ...reward, active: false };
    const account: LoyaltyAccount = {
      userId: 'user_1',
      points: 1000,
      tier: 'bronze',
      lifetimePoints: 10000,
      transactions: [],
    };

    expect(canRedeem(account, inactiveReward)).toBe(false);
  });
});

describe('Points Value', () => {
  it('should calculate discount value', () => {
    expect(getPointsValue(100, 'discount')).toBe(25);
  });

  it('should calculate cashback value', () => {
    expect(getPointsValue(100, 'cashback')).toBe(20);
  });

  it('should calculate voucher value', () => {
    expect(getPointsValue(100, 'voucher')).toBe(15);
  });
});
