/**
 * Engagement Hooks
 * React hooks for loyalty, badges, streaks, and offers
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/stores/selectors';
import {
  getLoyaltyProfile,
  getPointsHistory,
  earnPoints,
  getAllBadges,
  getUserBadges,
  getUserStreaks,
  getAvailableOffers,
  getReferralProgram,
  LoyaltyProfile,
  PointsTransaction,
  Badge,
  Streak,
  Offer,
  ReferralProgram,
} from '@/services/engagementService';

// ============================================================================
// LOYALTY HOOK
// ============================================================================

interface UseLoyaltyReturn {
  profile: LoyaltyProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  pointsFormatted: string;
  tierProgress: number; // 0-100
}

export function useLoyalty(): UseLoyaltyReturn {
  const user = useAuthUser();
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getLoyaltyProfile(user.id);
      if (response.success && response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const pointsFormatted = profile
    ? `${profile.points.toLocaleString()} pts`
    : '0 pts';

  // Calculate tier progress (percentage to next tier)
  const tierProgress = profile?.nextTier
    ? Math.max(0, 100 - (profile.nextTier.pointsNeeded / 1000) * 100)
    : 0;

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    pointsFormatted,
    tierProgress,
  };
}

// ============================================================================
// POINTS HISTORY HOOK
// ============================================================================

interface UsePointsHistoryReturn {
  transactions: PointsTransaction[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

export function usePointsHistory(limit = 20): UsePointsHistoryReturn {
  const user = useAuthUser();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchHistory = useCallback(async (pageNum: number) => {
    if (!user?.id) return;

    try {
      const response = await getPointsHistory(user.id, limit * pageNum);
      if (response.success && response.data) {
        if (pageNum === 1) {
          setTransactions(response.data);
        } else {
          setTransactions((prev) => [...prev, ...response.data!]);
        }
      }
    } catch {
      // Silent fail
    }
  }, [user?.id, limit]);

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      fetchHistory(1).finally(() => setLoading(false));
    }
  }, [user?.id, fetchHistory]);

  const loadMore = useCallback(async () => {
    setPage((p) => p + 1);
    await fetchHistory(page + 1);
  }, [page, fetchHistory]);

  return {
    transactions,
    loading,
    hasMore: transactions.length >= limit,
    loadMore,
  };
}

// ============================================================================
// BADGES HOOK
// ============================================================================

interface UseBadgesReturn {
  badges: Badge[];
  loading: boolean;
  earnedBadges: Badge[];
  lockedBadges: Badge[];
}

export function useBadges(): UseBadgesReturn {
  const user = useAuthUser();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      if (!user?.id) {
        setBadges([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [allRes, userRes] = await Promise.all([
          getAllBadges(),
          getUserBadges(user.id),
        ]);

        if (allRes.success && userRes.success) {
          const earnedIds = new Set(userRes.data?.map((b) => b.id) || []);
          setBadges(
            allRes.data?.map((badge) => ({
              ...badge,
              earnedAt: earnedIds.has(badge.id) ? new Date().toISOString() : undefined,
            })) || []
          );
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [user?.id]);

  return {
    badges,
    loading,
    earnedBadges: badges.filter((b) => b.earnedAt),
    lockedBadges: badges.filter((b) => !b.earnedAt),
  };
}

// ============================================================================
// STREAKS HOOK
// ============================================================================

interface UseStreaksReturn {
  streaks: Streak[];
  activeStreaks: Streak[];
  loading: boolean;
  totalDays: number;
}

export function useStreaks(): UseStreaksReturn {
  const user = useAuthUser();
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStreaks() {
      if (!user?.id) {
        setStreaks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getUserStreaks(user.id);
        if (response.success && response.data) {
          setStreaks(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchStreaks();
  }, [user?.id]);

  return {
    streaks,
    activeStreaks: streaks.filter((s) => s.isActive),
    loading,
    totalDays: streaks.reduce((sum, s) => sum + s.currentCount, 0),
  };
}

// ============================================================================
// OFFERS HOOK
// ============================================================================

interface UseOffersReturn {
  offers: Offer[];
  loading: boolean;
  claimOffer: (offerId: string) => Promise<boolean>;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export function useOffers(): UseOffersReturn {
  const user = useAuthUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await getAvailableOffers(user?.id);
      if (response.success && response.data) {
        setOffers(response.data);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  }, [fetchOffers]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const claimOffer = useCallback(async (offerId: string): Promise<boolean> => {
    if (!user?.id) return false;

    const response = await getAvailableOffers(user.id);
    // In real implementation, this would call claimOffer from engagementService
    return response.success;
  }, [user?.id]);

  return {
    offers,
    loading,
    claimOffer,
    refreshing,
    refresh,
  };
}

// ============================================================================
// REFERRAL HOOK
// ============================================================================

interface UseReferralReturn {
  referral: ReferralProgram | null;
  loading: boolean;
  applyCode: (code: string) => Promise<{ success: boolean; message: string }>;
}

export function useReferral(): UseReferralReturn {
  const user = useAuthUser();
  const [referral, setReferral] = useState<ReferralProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReferral() {
      if (!user?.id) {
        setReferral(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getReferralProgram(user.id);
        if (response.success && response.data) {
          setReferral(response.data);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }

    fetchReferral();
  }, [user?.id]);

  const applyCode = useCallback(
    async (code: string): Promise<{ success: boolean; message: string }> => {
      if (!user?.id) {
        return { success: false, message: 'Please login first' };
      }

      try {
        const { applyReferralCode } = await import('@/services/engagementService');
        const response = await applyReferralCode(user.id, code);
        if (response.success && response.data?.bonusPoints) {
          return {
            success: true,
            message: `Code applied! You earned ${response.data.bonusPoints} bonus points!`,
          };
        }
        return { success: false, message: 'Invalid referral code' };
      } catch {
        return { success: false, message: 'Failed to apply code' };
      }
    },
    [user?.id]
  );

  return {
    referral,
    loading,
    applyCode,
  };
}
