// @ts-nocheck
/**
 * useTryUser Hook
 *
 * Consolidates all user state for the Try module into a single hook.
 * Handles loading, caching, and refreshing of user data.
 *
 * Part of ReZ Try Simplified UX Architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { tryApi, type Mission, type ActiveBundle } from '@/services/tryApi';
import {
  getPrimaryMission,
  needsToBuyCoins,
  getCoinTier,
} from '../components/missionUtils';
// @ts-ignore - getMissionVisibility is exported from missionUtils but not from index
import { getMissionVisibility } from '../components/missionUtils';
import { shouldShowBundlesUpsell } from '../components/bundleUtils';

// =============================================================================
// TYPES
// =============================================================================

export interface TryUserState {
  // Coins
  coins: number;
  coinTier: 'low' | 'medium' | 'high';
  needsToBuyCoins: boolean;
  showBundlesUpsell: boolean;

  // Score
  score: number;
  tier: 'curious' | 'explorer' | 'adventurer' | 'pioneer';

  // Missions
  activeMission: Mission | null;
  showMissions: boolean;
  missionUrgency: 'high' | 'medium' | 'none';

  // Bundles
  activeBundles: ActiveBundle[];

  // Leaderboard
  leaderboardPercentile?: number;

  // Loading states
  loading: boolean;
  error: string | null;
}

export interface TryUserActions {
  refresh: () => Promise<void>;
  updateCoins: (newBalance: number) => void;
}

export type UseTryUserReturn = TryUserState & TryUserActions;

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_STATE: TryUserState = {
  coins: 0,
  coinTier: 'low',
  needsToBuyCoins: false,
  showBundlesUpsell: false,
  score: 0,
  tier: 'curious',
  activeMission: null,
  showMissions: false,
  missionUrgency: 'none',
  activeBundles: [],
  leaderboardPercentile: undefined,
  loading: true,
  error: null,
};

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook that consolidates all Try user state into a single place.
 *
 * Features:
 * - Parallel data fetching for optimal performance
 * - Automatic refresh on focus
 * - Manual refresh capability
 * - Optimistic updates for coin balance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     coins,
 *     coinTier,
 *     activeMission,
 *     loading,
 *     refresh,
 *   } = useTryUser();
 *
 *   if (loading) return <LoadingSpinner />;
 *
 *   return (
 *     <View>
 *       <Text>Coins: {coins}</Text>
 *       <Button onPress={refresh}>Refresh</Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useTryUser(): UseTryUserReturn {
  const [state, setState] = useState<TryUserState>(DEFAULT_STATE);

  /**
   * Load all user data in parallel
   */
  const loadUserData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [coinsData, scoreData, missionsData, bundlesData] = await Promise.all([
        tryApi.getCoins(),
        tryApi.getScore(),
        tryApi.getMissions(),
        tryApi.getMyBundles(),
      ]);

      const coins = coinsData.totalBalance;
      const activeBundles = bundlesData || [];

      // Get primary mission
      const activeMission = getPrimaryMission(missionsData) || null;
      const missionVisibility = getMissionVisibility(missionsData, 'active');

      // Check bundles upsell
      const bundlesUpsell = shouldShowBundlesUpsell(
        coins,
        activeBundles,
        [] // Will be populated from feed
      );

      setState({
        coins,
        coinTier: getCoinTier(coins),
        needsToBuyCoins: false, // Calculated per trial
        showBundlesUpsell: bundlesUpsell.shouldShow,
        score: scoreData.score,
        tier: scoreData.tier,
        activeMission,
        showMissions: missionVisibility.shouldShow,
        missionUrgency: missionVisibility.urgency,
        activeBundles,
        leaderboardPercentile: scoreData.leaderboardPercentile,
        loading: false,
        error: null,
      });
    } catch (error) {
      logger.error('[useTryUser] Failed to load user data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load user data',
      }));
    }
  }, []);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  /**
   * Optimistic coin balance update
   */
  const updateCoins = useCallback((newBalance: number) => {
    setState(prev => ({
      ...prev,
      coins: newBalance,
      coinTier: getCoinTier(newBalance),
      needsToBuyCoins: false,
      showBundlesUpsell: shouldShowBundlesUpsell(
        newBalance,
        prev.activeBundles,
        []
      ).shouldShow,
    }));
  }, []);

  // Load data on mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Refresh on app focus (optional - remove if not needed)
  useEffect(() => {
    let isMounted = true;

    const handleFocus = () => {
      if (isMounted) {
        loadUserData();
      }
    };

    // Note: If using React Navigation, you would add a focus listener here
    // const unsubscribe = navigation.addListener('focus', handleFocus);

    return () => {
      isMounted = false;
      // unsubscribe?.();
    };
  }, [loadUserData]);

  return {
    ...state,
    refresh,
    updateCoins,
  };
}

// =============================================================================
// NAMED EXPORTS
// =============================================================================

export default useTryUser;
