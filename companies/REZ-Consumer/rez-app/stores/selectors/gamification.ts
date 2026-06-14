/**
 * Gamification store selectors — 16 imports.
 */

import { useGamificationStore } from '../gamificationStore';

/** Only re-renders when streak changes */
export const useStreak = () => useGamificationStore((s: ReturnType<typeof useGamificationStore.getState>) => s.state?.dailyStreak);

/** Only re-renders when daily check-in status changes */
export const useHasCheckedIn = () =>
  useGamificationStore((s: ReturnType<typeof useGamificationStore.getState>) => {
    // hasCheckedInToday is an auxiliary flag that may or may not exist on the
    // concrete store shape — fall back to `undefined` rather than casting.
    const state = s.state as unknown as { hasCheckedInToday?: boolean } | undefined;
    return state?.hasCheckedInToday;
  });
