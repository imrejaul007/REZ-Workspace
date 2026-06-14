/**
 * ReZ Rewards Module
 * Loyalty rewards system with point management, redemptions, and expiry tracking
 */

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'freeItem' | 'experience' | 'voucher';
  minTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  maxRedemptions?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive: boolean;
}

export interface UserPoints {
  userId: string;
  balance: number;
  lifetimeEarned: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  transactions: PointTransaction[];
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
  points: number;
  description: string;
  timestamp: Date;
  relatedRewardId?: string;
  expiresAt?: Date;
}

export interface Offer {
  id: string;
  userId: string;
  rewardId: string;
  status: 'available' | 'redeemed' | 'expired' | 'cancelled';
  pointsSpent: number;
  code?: string;
  createdAt: Date;
  redeemedAt?: Date;
  expiresAt: Date;
}

export interface ExpiryAlert {
  userId: string;
  pointsExpiring: number;
  expiresAt: Date;
  daysUntilExpiry: number;
  notified: boolean;
}

// ============================================
// Reward Catalog
// ============================================

const rewardCatalog: Map<string, Reward> = new Map();

export function addReward(reward: Reward): { success: boolean; error?: string } {
  if (!reward.id || !reward.name || reward.pointsCost < 0) {
    return { success: false, error: 'Invalid reward data' };
  }
  if (rewardCatalog.has(reward.id)) {
    return { success: false, error: 'Reward ID already exists' };
  }
  rewardCatalog.set(reward.id, { ...reward, isActive: true });
  return { success: true };
}

export function getReward(id: string): Reward | undefined {
  const reward = rewardCatalog.get(id);
  if (!reward) return undefined;

  // Check if reward is currently valid
  const now = new Date();
  if (reward.validFrom && reward.validFrom > now) return undefined;
  if (reward.validUntil && reward.validUntil < now) return undefined;
  if (!reward.isActive) return undefined;

  return reward;
}

export function getRewardsByCategory(category: Reward['category']): Reward[] {
  return Array.from(rewardCatalog.values()).filter(
    (r) => r.category === category && r.isActive
  );
}

export function getRewardsForTier(tier: UserPoints['tier']): Reward[] {
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  const tierIndex = tierOrder.indexOf(tier);

  return Array.from(rewardCatalog.values()).filter((r) => {
    const rewardTierIndex = tierOrder.indexOf(r.minTier);
    return r.isActive && rewardTierIndex <= tierIndex;
  });
}

export function updateReward(id: string, updates: Partial<Reward>): { success: boolean; error?: string } {
  const reward = rewardCatalog.get(id);
  if (!reward) {
    return { success: false, error: 'Reward not found' };
  }
  rewardCatalog.set(id, { ...reward, ...updates });
  return { success: true };
}

export function deactivateReward(id: string): { success: boolean; error?: string } {
  return updateReward(id, { isActive: false });
}

// ============================================
// Point Management
// ============================================

const userPointsMap: Map<string, UserPoints> = new Map();

export function initializeUserPoints(userId: string): UserPoints {
  const existing = userPointsMap.get(userId);
  if (existing) return existing;

  const newUser: UserPoints = {
    userId,
    balance: 0,
    lifetimeEarned: 0,
    tier: 'bronze',
    transactions: [],
  };
  userPointsMap.set(userId, newUser);
  return newUser;
}

export function getUserPoints(userId: string): UserPoints | undefined {
  return userPointsMap.get(userId);
}

export function earnPoints(
  userId: string,
  points: number,
  description: string,
  expiresInDays?: number
): { success: boolean; error?: string; transaction?: PointTransaction } {
  if (points <= 0) {
    return { success: false, error: 'Points must be positive' };
  }

  let userPoints = userPointsMap.get(userId);
  if (!userPoints) {
    userPoints = initializeUserPoints(userId);
  }

  const transaction: PointTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'earn',
    points,
    description,
    timestamp: new Date(),
    expiresAt: expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined,
  };

  userPoints.balance += points;
  userPoints.lifetimeEarned += points;
  userPoints.transactions.push(transaction);

  // Update tier based on lifetime earned
  userPoints.tier = calculateTier(userPoints.lifetimeEarned);

  userPointsMap.set(userId, userPoints);
  return { success: true, transaction };
}

export function deductPoints(
  userId: string,
  points: number,
  description: string,
  relatedRewardId?: string
): { success: boolean; error?: string; transaction?: PointTransaction } {
  if (points <= 0) {
    return { success: false, error: 'Points must be positive' };
  }

  const userPoints = userPointsMap.get(userId);
  if (!userPoints) {
    return { success: false, error: 'User not found' };
  }
  if (userPoints.balance < points) {
    return { success: false, error: `Insufficient points. Balance: ${userPoints.balance}, Required: ${points}` };
  }

  const transaction: PointTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'redeem',
    points: -points,
    description,
    timestamp: new Date(),
    relatedRewardId,
  };

  userPoints.balance -= points;
  userPoints.transactions.push(transaction);
  userPointsMap.set(userId, userPoints);

  return { success: true, transaction };
}

export function expirePoints(
  userId: string,
  points: number,
  description: string
): { success: boolean; error?: string; transaction?: PointTransaction } {
  const userPoints = userPointsMap.get(userId);
  if (!userPoints) {
    return { success: false, error: 'User not found' };
  }

  const expiredPoints = Math.min(points, userPoints.balance);
  if (expiredPoints <= 0) {
    return { success: false, error: 'No points to expire' };
  }

  const transaction: PointTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type: 'expire',
    points: -expiredPoints,
    description,
    timestamp: new Date(),
  };

  userPoints.balance -= expiredPoints;
  userPoints.transactions.push(transaction);
  userPointsMap.set(userId, userPoints);

  return { success: true, transaction };
}

function calculateTier(lifetimeEarned: number): UserPoints['tier'] {
  if (lifetimeEarned >= 10000) return 'platinum';
  if (lifetimeEarned >= 5000) return 'gold';
  if (lifetimeEarned >= 2000) return 'silver';
  return 'bronze';
}

// ============================================
// Point Redemptions
// ============================================

const offersMap: Map<string, Offer> = new Map();

export function redeemReward(
  userId: string,
  rewardId: string
): { success: boolean; error?: string; offer?: Offer } {
  // Validate reward exists
  const reward = getReward(rewardId);
  if (!reward) {
    return { success: false, error: 'Reward not found or unavailable' };
  }

  // Check user points
  const userPoints = getUserPoints(userId);
  if (!userPoints) {
    return { success: false, error: 'User not found' };
  }

  // Check tier requirement
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  if (tierOrder.indexOf(userPoints.tier) < tierOrder.indexOf(reward.minTier)) {
    return { success: false, error: `Requires ${reward.minTier} tier or higher` };
  }

  // Check points balance
  if (userPoints.balance < reward.pointsCost) {
    return {
      success: false,
      error: `Insufficient points. Balance: ${userPoints.balance}, Required: ${reward.pointsCost}`,
    };
  }

  // Deduct points
  const deductResult = deductPoints(userId, reward.pointsCost, `Redeemed: ${reward.name}`, rewardId);
  if (!deductResult.success) {
    return { success: false, error: deductResult.error };
  }

  // Create offer
  const offer: Offer = {
    id: `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    rewardId,
    status: 'available',
    pointsSpent: reward.pointsCost,
    code: generateOfferCode(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };

  offersMap.set(offer.id, offer);
  return { success: true, offer };
}

function generateOfferCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getUserOffers(userId: string): Offer[] {
  return Array.from(offersMap.values()).filter((o) => o.userId === userId);
}

export function getActiveOffers(userId: string): Offer[] {
  return getUserOffers(userId).filter((o) => o.status === 'available');
}

export function markOfferRedeemed(offerId: string): { success: boolean; error?: string } {
  const offer = offersMap.get(offerId);
  if (!offer) {
    return { success: false, error: 'Offer not found' };
  }
  if (offer.status !== 'available') {
    return { success: false, error: `Offer already ${offer.status}` };
  }
  if (offer.expiresAt < new Date()) {
    return { success: false, error: 'Offer has expired' };
  }

  offer.status = 'redeemed';
  offer.redeemedAt = new Date();
  offersMap.set(offerId, offer);
  return { success: true };
}

export function cancelOffer(offerId: string, userId: string): { success: boolean; error?: string } {
  const offer = offersMap.get(offerId);
  if (!offer) {
    return { success: false, error: 'Offer not found' };
  }
  if (offer.userId !== userId) {
    return { success: false, error: 'Unauthorized' };
  }
  if (offer.status !== 'available') {
    return { success: false, error: `Cannot cancel ${offer.status} offer` };
  }

  // Refund points
  const refundResult = earnPoints(userId, offer.pointsSpent, `Refunded: Offer cancelled`);
  if (!refundResult.success) {
    return { success: false, error: refundResult.error };
  }

  offer.status = 'cancelled';
  offersMap.set(offerId, offer);
  return { success: true };
}

// ============================================
// Offer Validation
// ============================================

export function validateOffer(offerId: string, userId?: string): { valid: boolean; error?: string } {
  const offer = offersMap.get(offerId);
  if (!offer) {
    return { valid: false, error: 'Offer not found' };
  }

  if (userId && offer.userId !== userId) {
    return { valid: false, error: 'Offer belongs to different user' };
  }

  if (offer.status !== 'available') {
    return { valid: false, error: `Offer is ${offer.status}` };
  }

  if (offer.expiresAt < new Date()) {
    return { valid: false, error: 'Offer has expired' };
  }

  return { valid: true };
}

export function validateRedemptionRequest(
  userId: string,
  rewardId: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const userPoints = getUserPoints(userId);
  if (!userPoints) {
    errors.push('User not found');
    return { valid: false, errors };
  }

  const reward = getReward(rewardId);
  if (!reward) {
    errors.push('Reward not found or unavailable');
    return { valid: false, errors };
  }

  // Check tier
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
  if (tierOrder.indexOf(userPoints.tier) < tierOrder.indexOf(reward.minTier)) {
    errors.push(`Requires ${reward.minTier} tier or higher (current: ${userPoints.tier})`);
  }

  // Check points
  if (userPoints.balance < reward.pointsCost) {
    errors.push(`Insufficient points (balance: ${userPoints.balance}, required: ${reward.pointsCost})`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// Expiry Alerts
// ============================================

export function getExpiringPoints(
  userId: string,
  withinDays: number = 30
): ExpiryAlert[] {
  const userPoints = userPointsMap.get(userId);
  if (!userPoints) return [];

  const alerts: ExpiryAlert[] = [];
  const now = new Date();
  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  // Group expiring points by date
  const expiringByDate: Map<string, number> = new Map();

  for (const txn of userPoints.transactions) {
    if (txn.type === 'earn' && txn.expiresAt) {
      if (txn.expiresAt > now && txn.expiresAt <= threshold) {
        const dateKey = txn.expiresAt.toISOString().split('T')[0];
        const current = expiringByDate.get(dateKey) || 0;
        expiringByDate.set(dateKey, current + txn.points);
      }
    }
  }

  for (const [dateStr, pointsExpiring] of expiringByDate) {
    const expiresAt = new Date(dateStr);
    const daysUntilExpiry = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );

    alerts.push({
      userId,
      pointsExpiring,
      expiresAt,
      daysUntilExpiry,
      notified: false,
    });
  }

  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export function getExpiredTransactions(userId: string): PointTransaction[] {
  const userPoints = userPointsMap.get(userId);
  if (!userPoints) return [];

  const now = new Date();
  const expired: PointTransaction[] = [];

  for (const txn of userPoints.transactions) {
    if (txn.type === 'earn' && txn.expiresAt && txn.expiresAt < now) {
      expired.push(txn);
    }
  }

  return expired;
}

export function processExpiredPoints(userId: string): { processed: number; pointsExpired: number } {
  const userPoints = userPointsMap.get(userId);
  if (!userPoints) return { processed: 0, pointsExpired: 0 };

  const now = new Date();
  let totalExpired = 0;
  let processedCount = 0;

  for (const txn of userPoints.transactions) {
    if (txn.type === 'earn' && txn.expiresAt && txn.expiresAt < now) {
      const result = expirePoints(userId, txn.points, `Points expired: ${txn.description}`);
      if (result.success) {
        totalExpired += txn.points;
        processedCount++;
      }
    }
  }

  return { processed: processedCount, pointsExpired: totalExpired };
}

export function markAlertNotified(alert: ExpiryAlert): ExpiryAlert {
  return { ...alert, notified: true };
}

// ============================================
// Utility Functions
// ============================================

export function getPointsSummary(userId: string): {
  balance: number;
  tier: string;
  lifetimeEarned: number;
  transactionsCount: number;
  activeOffers: number;
  expiringPoints: number;
} | null {
  const userPoints = userPointsMap.get(userId);
  if (!userPoints) return null;

  const activeOffers = getActiveOffers(userId).length;
  const expiringAlerts = getExpiringPoints(userId, 30);
  const expiringPoints = expiringAlerts.reduce((sum, a) => sum + a.pointsExpiring, 0);

  return {
    balance: userPoints.balance,
    tier: userPoints.tier,
    lifetimeEarned: userPoints.lifetimeEarned,
    transactionsCount: userPoints.transactions.length,
    activeOffers,
    expiringPoints,
  };
}

export function getTransactionHistory(
  userId: string,
  limit?: number,
  type?: PointTransaction['type']
): PointTransaction[] {
  const userPoints = userPointsMap.get(userId);
  if (!userPoints) return [];

  let transactions = [...userPoints.transactions];

  if (type) {
    transactions = transactions.filter((t) => t.type === type);
  }

  transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  if (limit) {
    transactions = transactions.slice(0, limit);
  }

  return transactions;
}

// ============================================
// Seed Data for Testing
// ============================================

export function seedDefaultRewards(): void {
  const defaultRewards: Reward[] = [
    {
      id: 'reward_welcome_10',
      name: '$10 Welcome Discount',
      description: 'Get $10 off your next purchase',
      pointsCost: 500,
      category: 'discount',
      minTier: 'bronze',
      isActive: true,
    },
    {
      id: 'reward_silver_25',
      name: '$25 Store Credit',
      description: '$25 credit to use anywhere',
      pointsCost: 1500,
      category: 'voucher',
      minTier: 'silver',
      isActive: true,
    },
    {
      id: 'reward_gold_free_item',
      name: 'Free Item (up to $30)',
      description: 'Choose any item up to $30 value',
      pointsCost: 2000,
      category: 'freeItem',
      minTier: 'gold',
      isActive: true,
    },
    {
      id: 'reward_platinum_vip',
      name: 'VIP Experience',
      description: 'Exclusive VIP access and premium experience',
      pointsCost: 5000,
      category: 'experience',
      minTier: 'platinum',
      isActive: true,
    },
    {
      id: 'reward_birthday_special',
      name: 'Birthday Special',
      description: 'Double points on your birthday month',
      pointsCost: 100,
      category: 'discount',
      minTier: 'bronze',
      isActive: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  ];

  for (const reward of defaultRewards) {
    if (!rewardCatalog.has(reward.id)) {
      rewardCatalog.set(reward.id, reward);
    }
  }
}

// Initialize with default rewards
seedDefaultRewards();


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-rewards',
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
