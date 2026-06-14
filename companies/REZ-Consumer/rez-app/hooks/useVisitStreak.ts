import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { getVisitStreak, VisitStreakData } from '@/services/visitStreakApi';

/**
 * Fetches the authenticated user's store-visit streak and next reward milestone.
 * Wraps GET /api/users/visit-streak.
 */
export function useVisitStreak() {
  return useQuery<VisitStreakData>({
    queryKey: queryKeys.users.visitStreak(),
    queryFn: async () => {
      const response = await getVisitStreak();
      if (response.success && response.data) {
        return response.data;
      }
      // Safe default — callers use optional-chaining so this shape still works
      return {
        totalVisits: 0,
        currentStreak: 0,
        longestStreak: 0,
        nextMilestone: null,
        recentVisits: [],
      };
    },
  });
}
