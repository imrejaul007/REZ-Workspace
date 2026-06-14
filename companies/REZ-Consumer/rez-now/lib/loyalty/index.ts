/**
 * REZ Loyalty Integration for Rez-now
 *
 * Connects to:
 * - Consumer App APIs for user loyalty
 * - Merchant Service APIs for store loyalty
 */

import apiClient from '@/lib/api/api-client';
import { authClient } from '@/lib/api/client';
import { logger } from '@/lib/utils/logger';

// ── Types ──────────────────────────────────────────────────────────────────────

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface TIER_DISPLAY_ENTRY {
  name: string;
  icon: string;
  color: string;
  minPoints: number;
}

export const TIER_DISPLAY: Record<LoyaltyTier, TIER_DISPLAY_ENTRY> = {
  bronze: {
    name: 'Bronze',
    icon: '🥉',
    color: '#CD7F32',
    minPoints: 0,
  },
  silver: {
    name: 'Silver',
    icon: '🥈',
    color: '#C0C0C0',
    minPoints: 500,
  },
  gold: {
    name: 'Gold',
    icon: '🥇',
    color: '#FFD700',
    minPoints: 1500,
  },
  platinum: {
    name: 'Platinum',
    icon: '💎',
    color: '#E5E4E2',
    minPoints: 5000,
  },
  diamond: {
    name: 'Diamond',
    icon: '💠',
    color: '#B9F2FF',
    minPoints: 15000,
  },
};

export interface LoyaltyProfile {
  currentPoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  nextTier: string;
  pointsToNextTier: number;
  lifetimePoints: number;
  expiringPoints: number;
}

export interface VisitStreak {
  totalVisits: number;
  currentStreak: number;
  longestStreak: number;
  hasCheckedInToday: boolean;
  nextMilestone: {
    visitsNeeded: number;
    totalRequired: number;
    reward: number;
    name: string;
  } | null;
  recentVisits: {
    visitNumber: string;
    storeId: string;
    storeName: string;
    visitDate: string;
  }[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: string;
}

export interface CoinBalance {
  available: number;
  expiring: number;
  expiryDate: string;
}

export interface CoinTransaction {
  amount: number;
  type: 'earned' | 'spent' | 'expired';
  description: string;
  date: string;
}

export interface LoyaltyEvent {
  id: string;
  type: string;
  description: string;
  coinsEarned: number;
  pointsEarned: number;
  createdAt: string;
}

export interface UnlockedMilestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: {
    coins?: number;
    discount?: number;
    badge?: string;
  };
}

// ── CONSUMER APIs (User Loyalty) ──────────────────────────────────────────────

export const loyaltyApi = {
  /**
   * Get user loyalty profile
   */
  async getProfile(): Promise<LoyaltyProfile> {
    try {
      const res = await authClient.get('/loyalty');
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get loyalty profile:', { error });
      return {
        currentPoints: 0,
        tier: 'bronze',
        nextTier: 'silver',
        pointsToNextTier: 100,
        lifetimePoints: 0,
        expiringPoints: 0,
      };
    }
  },

  /**
   * Get visit streak
   */
  async getVisitStreak(): Promise<VisitStreak> {
    try {
      const res = await authClient.get('/users/visit-streak');
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get visit streak:', { error });
      return {
        totalVisits: 0,
        currentStreak: 0,
        longestStreak: 0,
        hasCheckedInToday: false,
        nextMilestone: null,
        recentVisits: [],
      };
    }
  },

  /**
   * Record a visit
   */
  async recordVisit(storeId: string, visitType: string = 'dine_in'): Promise<void> {
    try {
      await authClient.post('/loyalty/visits', { storeId, visitType });
    } catch (error) {
      logger.error('Failed to record visit:', { error });
    }
  },

  /**
   * Get coin balance
   */
  async getCoins(): Promise<CoinBalance> {
    try {
      const res = await authClient.get('/loyalty/coins');
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get coins:', { error });
      return { available: 0, expiring: 0, expiryDate: '' };
    }
  },

  /**
   * Get coin history
   */
  async getCoinHistory(): Promise<CoinTransaction[]> {
    try {
      const res = await authClient.get('/loyalty/coins/history');
      return res.data.data || res.data || [];
    } catch (error) {
      logger.error('Failed to get coin history:', { error });
      return [];
    }
  },

  /**
   * Get badges
   */
  async getBadges(): Promise<Badge[]> {
    try {
      const res = await authClient.get('/loyalty/badges');
      return res.data.data || res.data || [];
    } catch (error) {
      logger.error('Failed to get badges:', { error });
      return [];
    }
  },

  /**
   * Get streak status for gamification
   */
  async getStreaks(): Promise<{
    login: { current: number; required: number; reward: number } | null;
    order: { current: number; required: number; reward: number } | null;
    review: { current: number; required: number; reward: number } | null;
    savings: { current: number; required: number; reward: number } | null;
  }> {
    try {
      const res = await authClient.get('/gamification/streaks');
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get streaks:', { error });
      return { login: null, order: null, review: null, savings: null };
    }
  },

  /**
   * Check in for streak
   */
  async checkInStreak(type: 'login' | 'order' | 'review' | 'savings'): Promise<{
    success: boolean;
    currentStreak: number;
    reward?: number;
    milestone?: UnlockedMilestone;
  } | null> {
    try {
      const res = await authClient.post(`/gamification/streaks/${type}/checkin`);
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to check in streak:', { error });
      return null;
    }
  },

  /**
   * Get full user loyalty data
   */
  async getUserLoyalty(): Promise<{
    profile: LoyaltyProfile;
    visitStreak: VisitStreak;
    coins: CoinBalance;
    badges: Badge[];
  } | null> {
    try {
      const res = await authClient.get('/loyalty');
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get user loyalty:', { error });
      return null;
    }
  },

  /**
   * Get frequent items for a store
   */
  async getFrequentItems(storeSlug: string, limit: number = 5): Promise<Array<{
    menuItemId: string;
    name: string;
    price: number;
    image?: string;
    orderCount: number;
    lastOrderedAt: string;
    category?: string;
    isAvailable?: boolean;
  }>> {
    try {
      const res = await authClient.get('/loyalty/frequent-items', {
        params: { storeSlug, limit },
      });
      return res.data.data || res.data || [];
    } catch (error) {
      logger.error('Failed to get frequent items:', { error });
      return [];
    }
  },

  /**
   * Get taste profile
   */
  async getTasteProfile(): Promise<{
    spiceTolerance: number;
    preferredCuisines: string[];
    orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    favoriteCategories: string[];
  } | null> {
    try {
      const res = await authClient.get('/loyalty/taste-profile');
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get taste profile:', { error });
      return null;
    }
  },
};

// ── MERCHANT APIs (Store Loyalty) ─────────────────────────────────────────────

export const merchantLoyaltyApi = {
  /**
   * Get loyalty config for a store
   */
  async getConfig(storeId: string): Promise<{
    enabled: boolean;
    coinsPerVisit: number;
    coinsPerRupee: number;
    tierThresholds: number[];
  } | null> {
    try {
      const res = await apiClient.get(`/loyalty/config?storeId=${storeId}`);
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get config:', { error });
      return null;
    }
  },

  /**
   * Get customer loyalty stats for a specific store
   */
  async getCustomerStats(userId: string, storeId: string): Promise<{
    visits: number;
    totalSpent: number;
    coinsEarned: number;
    currentTier: string;
    lastVisit: string;
    frequentItems: Array<{
      menuItemId: string;
      name: string;
      orderCount: number;
      lastOrderedAt: string;
    }>;
  } | null> {
    try {
      const res = await authClient.get(`/loyalty/customers/${userId}?storeId=${storeId}`);
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to get customer stats:', { error });
      return null;
    }
  },

  /**
   * Award coins to a customer (merchant action)
   */
  async awardCoins(
    userId: string,
    amount: number,
    reason: string,
    storeId: string
  ): Promise<{ success: boolean; newBalance: number } | null> {
    try {
      const res = await authClient.post('/loyalty/coins/award', {
        userId,
        amount,
        reason,
        storeId,
      });
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to award coins:', { error });
      return null;
    }
  },

  /**
   * Record a store visit
   */
  async recordVisit(
    userId: string,
    storeId: string,
    visitType?: string
  ): Promise<{
    visitId: string;
    coinsEarned: number;
    pointsEarned: number;
    milestone?: UnlockedMilestone;
  } | null> {
    try {
      const res = await authClient.post('/store-visits', {
        userId,
        storeId,
        visitType: visitType || 'dine_in',
      });
      return res.data.data || res.data;
    } catch (error) {
      logger.error('Failed to record visit:', { error });
      return null;
    }
  },

  /**
   * Get store loyalty leaderboard
   */
  async getLeaderboard(storeId: string, limit: number = 10): Promise<Array<{
    rank: number;
    userId: string;
    displayName: string;
    visits: number;
    tier: string;
  }>> {
    try {
      const res = await apiClient.get(`/loyalty/leaderboard?storeId=${storeId}&limit=${limit}`);
      return res.data.data || res.data || [];
    } catch (error) {
      logger.error('Failed to get leaderboard:', { error });
      return [];
    }
  },
};

// ── Record Visit Helper (used by order.ts) ────────────────────────────────────

export interface RecordVisitOptions {
  orderId: string;
  storeSlug: string;
  storeName: string;
  orderTotal: number;
}

export interface RecordVisitResult {
  visit: {
    id: string;
    pointsEarned: number;
    coinsEarned: number;
  };
  events: LoyaltyEvent[];
  unlockedMilestones: UnlockedMilestone[];
  newTier?: string;
  earnedPoints: number;
  earnedCoins: number;
}

/**
 * Record a loyalty visit after successful order
 */
export async function recordVisit(options: RecordVisitOptions): Promise<RecordVisitResult> {
  const { orderId, storeSlug, storeName, orderTotal } = options;

  try {
    const res = await authClient.post('/loyalty/record-visit', {
      orderId,
      storeSlug,
      storeName,
      orderTotal,
    });

    const data = res.data.data || res.data;

    // Also record to karma service (fire-and-forget)
    recordKarmaForVisit(orderId, storeSlug).catch(logger.error);

    return {
      visit: {
        id: data.visitId || data.visit?.id || '',
        pointsEarned: data.pointsEarned || 0,
        coinsEarned: data.coinsEarned || 0,
      },
      events: data.events || [],
      unlockedMilestones: data.unlockedMilestones || [],
      newTier: data.newTier,
      earnedPoints: data.pointsEarned || data.earnedPoints || 0,
      earnedCoins: data.coinsEarned || data.earnedCoins || 0,
    };
  } catch (error) {
    logger.error('Failed to record visit:', { error });
    return {
      visit: { id: '', pointsEarned: 0, coinsEarned: 0 },
      events: [],
      unlockedMilestones: [],
      earnedPoints: 0,
      earnedCoins: 0,
    };
  }
}

// ─── Karma Integration ─────────────────────────────────────────────────────────

// Server-side API route URL (safe for SSR/client)
const KARMA_API_URL = process.env.KARMA_API_URL ?? process.env.NEXT_PUBLIC_KARMA_API_URL ?? 'https://rez-karma-loyalty.onrender.com';

/**
 * Record store visit to karma service
 */
async function recordKarmaForVisit(orderId: string, storeSlug: string): Promise<void> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return;

    const response = await fetch(`${KARMA_API_URL}/api/karma/verify/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Key': process.env.KARMA_SERVICE_KEY || '',
      },
      body: JSON.stringify({
        userId,
        eventId: `store_visit:${orderId}`,
        mode: 'qr',
        metadata: {
          storeSlug,
          visitType: 'menu_scan',
          source: 'loyalty',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Karma API error: ${response.status}`);
    }
  } catch (error) {
    logger.error('[Loyalty] Karma record failed', { error });
  }
}

/**
 * Get current user ID from auth context
 */
function getCurrentUserId(): string | null {
  // In browser context, get from localStorage or auth state
  if (typeof window !== 'undefined') {
    try {
      const authData = localStorage.getItem('auth_user');
      if (authData) {
        const user = JSON.parse(authData);
        return user?.id || user?.userId || null;
      }
    } catch (err) {
      logger.warn('[Loyalty] Failed to parse auth data', { error: err });
    }
  }
  return null;
}

/**
 * Get karma profile for current user
 */
export async function getKarmaProfile(): Promise<{
  success: boolean;
  profile?: {
    totalKarma: number;
    level: string;
  };
}> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return { success: false };

    const response = await fetch(`${KARMA_API_URL}/api/karma/user/${userId}`, {
      headers: {
        'X-Service-Key': process.env.KARMA_SERVICE_KEY || '',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return { success: false };

    const data = await response.json();
    return {
      success: true,
      profile: {
        totalKarma: data.totalKarma || data.activeKarma || 0,
        level: data.level || 'bronze',
      },
    };
  } catch (err) {
    logger.error('[Loyalty] Failed to get karma profile', { error: err });
    return { success: false };
  }
}

/**
 * Get karma multiplier for rewards
 */
export async function getKarmaMultiplier(): Promise<{
  multiplier: number;
  tier: string;
}> {
  try {
    const profile = await getKarmaProfile();
    if (!profile.success || !profile.profile) {
      return { multiplier: 1.0, tier: 'default' };
    }

    const multipliers: Record<string, number> = {
      bronze: 1.0,
      silver: 1.25,
      gold: 1.5,
      platinum: 2.0,
      diamond: 2.5,
    };

    return {
      multiplier: multipliers[profile.profile.level] || 1.0,
      tier: profile.profile.level,
    };
  } catch (err) {
    logger.error('[Loyalty] Failed to get karma multiplier', { error: err });
    return { multiplier: 1.0, tier: 'default' };
  }
}
