'use client';

import { useState, useEffect, useCallback } from 'react';
import { loyaltyApi, merchantLoyaltyApi, type LoyaltyProfile, type VisitStreak, type CoinBalance, type Badge } from '@/lib/loyalty';

/**
 * Hook for accessing user loyalty data
 */
export function useLoyalty() {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [streak, setStreak] = useState<VisitStreak | null>(null);
  const [coins, setCoins] = useState<CoinBalance | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, streakRes, coinsRes, badgesRes] = await Promise.all([
        loyaltyApi.getProfile(),
        loyaltyApi.getVisitStreak(),
        loyaltyApi.getCoins(),
        loyaltyApi.getBadges(),
      ]);

      setProfile(profileRes);
      setStreak(streakRes);
      setCoins(coinsRes);
      setBadges(badgesRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const recordVisit = useCallback(async (storeId: string, visitType?: string) => {
    await loyaltyApi.recordVisit(storeId, visitType);
    await loadProfile(); // Refresh data
  }, [loadProfile]);

  const checkInStreak = useCallback(async (type: 'login' | 'order' | 'review' | 'savings') => {
    const result = await loyaltyApi.checkInStreak(type);
    if (result?.success) {
      await loadProfile(); // Refresh data
    }
    return result;
  }, [loadProfile]);

  return {
    profile,
    streak,
    coins,
    badges,
    loading,
    error,
    recordVisit,
    checkInStreak,
    refresh: loadProfile,
  };
}

/**
 * Hook for merchant-specific loyalty data (customer stats for a store)
 */
export function useMerchantLoyalty(storeId: string, userId?: string) {
  const [stats, setStats] = useState<{
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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!userId || !storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await merchantLoyaltyApi.getCustomerStats(userId, storeId);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer stats');
    } finally {
      setLoading(false);
    }
  }, [userId, storeId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refresh: loadStats };
}

/**
 * Hook for frequent items ("Your Usual")
 */
export function useFrequentItems(storeSlug: string, limit: number = 5) {
  const [items, setItems] = useState<Array<{
    menuItemId: string;
    name: string;
    price: number;
    image?: string;
    orderCount: number;
    lastOrderedAt: string;
    category?: string;
    isAvailable?: boolean;
  }>>([]);
  const [tasteProfile, setTasteProfile] = useState<{
    spiceTolerance: number;
    preferredCuisines: string[];
    orderingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    favoriteCategories: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFrequentItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [frequentItemsRes, tasteProfileRes] = await Promise.all([
        loyaltyApi.getFrequentItems(storeSlug, limit),
        loyaltyApi.getTasteProfile(),
      ]);

      setItems(frequentItemsRes);
      setTasteProfile(tasteProfileRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load frequent items');
      // Fallback to empty array
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [storeSlug, limit]);

  useEffect(() => {
    loadFrequentItems();
  }, [loadFrequentItems]);

  return { items, tasteProfile, loading, error, refresh: loadFrequentItems };
}

/**
 * Hook for gamification streaks
 */
export function useStreaks() {
  const [streaks, setStreaks] = useState<{
    login: { current: number; required: number; reward: number } | null;
    order: { current: number; required: number; reward: number } | null;
    review: { current: number; required: number; reward: number } | null;
    savings: { current: number; required: number; reward: number } | null;
  }>({ login: null, order: null, review: null, savings: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStreaks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await loyaltyApi.getStreaks();
      setStreaks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load streaks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  const checkIn = useCallback(async (type: 'login' | 'order' | 'review' | 'savings') => {
    const result = await loyaltyApi.checkInStreak(type);
    if (result?.success) {
      await loadStreaks();
    }
    return result;
  }, [loadStreaks]);

  return { streaks, loading, error, checkIn, refresh: loadStreaks };
}
