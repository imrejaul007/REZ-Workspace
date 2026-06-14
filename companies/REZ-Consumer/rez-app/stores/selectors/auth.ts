/**
 * Auth store selectors — 150 imports, most critical.
 *
 * Split out of the monolithic `stores/selectors.ts` to reduce the circular-import
 * blast radius (NA-HIGH-24). A cycle in unknown single store only breaks its own
 * selector file instead of every screen that imports from the selector index.
 */

import { useAuthStore } from '../authStore';

/** Only re-renders when user object changes */
export const useAuthUser = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.user);

/** Only re-renders when auth status flips */
export const useIsAuthenticated = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.isAuthenticated);

/** Only re-renders when loading state changes */
export const useAuthLoading = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.isLoading);

/** Only re-renders when error changes */
export const useAuthError = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.error);

/** Never re-renders — actions are stable references */
export const useAuthActions = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.actions);

/** Common pattern: just need user ID for API guards */
export const useUserId = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.user?.id || s.state.user?._id);

/** Common pattern: check if onboarded */
export const useIsOnboarded = () => useAuthStore((s: ReturnType<typeof useAuthStore.getState>) => s.state.user?.isOnboarded ?? false);
