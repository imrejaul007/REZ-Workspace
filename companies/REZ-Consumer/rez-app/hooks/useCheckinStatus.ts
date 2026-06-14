// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import gamificationApi from '@/services/gamificationApi';

export interface CheckinStatus {
  checkedInToday: boolean;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate?: string;
  weeklyEarnings: number;
  totalEarned: number;
}

/**
 * Fetches the authenticated user's daily check-in status.
 * Wraps GET /api/gamification/streaks and exposes a normalised shape.
 */
export function useCheckinStatus() {
  return useQuery<CheckinStatus>({
    queryKey: queryKeys.gamification.streak(),
    queryFn: async () => {
      const response: unknown = await gamificationApi.getStreakStatus();
      if (response.success && response.data) {
        const d = response.data;
        return {
          checkedInToday: d.hasCheckedInToday,
          currentStreak: d.currentStreak,
          longestStreak: d.longestStreak,
          lastCheckInDate: d.lastCheckInDate,
          weeklyEarnings: d.weeklyEarnings,
          totalEarned: d.totalEarned,
        };
      }
      // Return a safe default so consumers don't need to handle undefined data
      return {
        checkedInToday: false,
        currentStreak: 0,
        longestStreak: 0,
        weeklyEarnings: 0,
        totalEarned: 0,
      };
    },
  });
}
