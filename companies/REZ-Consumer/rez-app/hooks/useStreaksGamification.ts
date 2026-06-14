// @ts-nocheck
// useStreaksGamification Hook
// Fetches real streak and weekly missions data from the gamification API

import { useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import gamificationAPI from '@/services/gamificationApi';
import apiClient from '@/services/apiClient';
import { useIsAuthenticated } from '@/stores/selectors';
import {
  StreakData,
  Mission,
  UseStreaksGamificationResult,
  PlayAndEarnResponse,
} from '@/types/streaksGamification.types';

// ReturnType<typeof setTimeout> for API calls to prevent infinite loading
const API_TIMEOUT = 10000; // 10 seconds

// Default streak data (used as initial state before API data loads)
const DEFAULT_STREAK: StreakData = {
  current: 0,
  target: 7,
  nextReward: 100,
  type: 'order',
  longestStreak: 0,
  todayCheckedIn: false,
};

// Icon mapping for different challenge action types
const getMissionIcon = (action?: string): keyof typeof Ionicons.glyphMap => {
  switch (action) {
    case 'visit_stores':
      return 'location-outline';
    case 'upload_bills':
      return 'receipt-outline';
    case 'share_deals':
      return 'share-social-outline';
    case 'order_count':
      return 'cart-outline';
    case 'review_count':
      return 'star-outline';
    case 'refer_friends':
      return 'people-outline';
    case 'spend_amount':
      return 'wallet-outline';
    case 'login_streak':
      return 'flame-outline';
    case 'explore_categories':
      return 'compass-outline';
    case 'add_favorites':
      return 'heart-outline';
    default:
      return 'trophy-outline';
  }
};

// Transform backend challenge to frontend Mission format
const transformChallengeToMission = (challenge: PlayAndEarnResponse['challenges']['active'][0]): Mission => ({
  id: challenge.id,
  title: challenge.title,
  progress: challenge.progress.current,
  target: challenge.progress.target,
  reward: challenge.reward,
  icon: getMissionIcon(challenge.requirements?.action),
  completed: challenge.progress.current >= challenge.progress.target,
  expiresAt: challenge.expiresAt,
  type: 'weekly', // Homepage shows weekly missions
});

export function useStreaksGamification(): UseStreaksGamificationResult {
  const isAuthenticated = useIsAuthenticated();
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState<number>(0);

  const isMountedRef = useRef(true);
  const isCheckingInRef = useRef(false);

  // Fetch data from API with timeout protection
  const fetchData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Create timeout promise with cleanup
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), API_TIMEOUT);
      });

      // Race between API call and timeout
      const response: unknown = await Promise.race([
        gamificationAPI.getPlayAndEarnData(),
        timeoutPromise,
      ]).finally(() => clearTimeout(timeoutId));

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        const data = response.data;

        // Transform streak data - prioritize order streak
        const streakData: StreakData = {
          current: data.streak?.currentStreak || 0,
          target: data.streak?.nextMilestone?.day || 7,
          nextReward: data.streak?.nextMilestone?.coins || 100,
          type: (data.streak?.type as StreakData['type']) || 'order',
          longestStreak: data.streak?.longestStreak || 0,
          todayCheckedIn: data.streak?.todayCheckedIn || false,
        };
        setStreak(streakData);

        // Transform challenges to missions (limit to 3 for homepage display)
        const weeklyMissions = data.challenges?.active
          ?.slice(0, 3)
          ?.map(transformChallengeToMission) || [];
        setMissions(weeklyMissions);

        // Update coin balance
        setCoinBalance(data.coinBalance || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch gamification data');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Failed to load data');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Claim mission reward
  const claimReward = useCallback(async (missionId: string): Promise<boolean> => {
    // Only mark the mission as claimed after the server confirms success.
    // Previously the UI optimistically flipped `completed: true` regardless of
    // the response, which left users looking at a "claimed" state even when
    // the backend had rejected the claim.
    const response: unknown = await (gamificationAPI as unknown).claimChallengeReward(missionId);

    if (response?.success === true) {
      setMissions(prev =>
        prev.map(mission =>
          mission.id === missionId
            ? { ...mission, completed: true }
            : mission
        )
      );

      if (response.data?.newBalance) {
        setCoinBalance(response.data.newBalance);
      }

      return true;
    }

    // Surface the failure so callers can render an error toast instead of
    // silently assuming the claim went through.
    throw new Error(response?.message || 'Failed to claim reward');
  }, []);

  // Check in for streak
  const checkin = useCallback(async () => {
    // Guard against double-tap: parallel checkin calls would double-increment
    // the streak and double-award the daily reward on the server.
    if (isCheckingInRef.current) return;
    isCheckingInRef.current = true;

    // Optimistic flip so the UI immediately reflects the check-in; rolled back
    // on failure below.
    let previousCheckedIn = false;
    setStreak(prev => {
      previousCheckedIn = prev.todayCheckedIn;
      return { ...prev, todayCheckedIn: true };
    });

    try {
      const response: unknown = await gamificationAPI.streakCheckin();

      if (response.success && response.data) {
        // Reconcile with server-authoritative values
        setStreak(prev => ({
          ...prev,
          current: response.data.currentStreak,
          longestStreak: response.data.longestStreak || prev.longestStreak,
          todayCheckedIn: true,
        }));

        if (response.data.newBalance) {
          setCoinBalance(response.data.newBalance);
        }
      } else {
        // API returned a non-success response — roll back the optimistic flip
        setStreak(prev => ({ ...prev, todayCheckedIn: previousCheckedIn }));
      }
    } catch (_err) {
      // Network/parse failure — roll back the optimistic flip
      setStreak(prev => ({ ...prev, todayCheckedIn: previousCheckedIn }));
    } finally {
      isCheckingInRef.current = false;
    }
  }, []);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch data on mount (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [fetchData, isAuthenticated]);

  // Campus rank (S-05)
  const [campusRank, setCampusRank] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Fetch campus leaderboard to find user rank
    apiClient.get('/leaderboard/campus').then((res) => {
      if (!isMountedRef.current) return;
      const ranks = res?.data?.ranks || res?.data?.entries || [];
      // The API returns the user's rank in the response
      const myRank = res?.data?.myRank || res?.data?.userRank;
      if (typeof myRank === 'number' && myRank > 0) {
        setCampusRank(myRank);
      } else if (ranks.length > 0) {
        // If no direct rank field, check if there's a highlighted entry
        const myEntry = ranks.find((r) => r.isCurrentUser);
        if (myEntry) setCampusRank(myEntry.rank || ranks.indexOf(myEntry) + 1);
      }
    }).catch(() => { /* non-blocking */ });
  }, [isAuthenticated]);

  return {
    streak,
    missions,
    loading,
    error,
    coinBalance,
    campusRank,
    actions: {
      refresh,
      claimReward,
      checkin,
    },
  };
}

export default useStreaksGamification;
