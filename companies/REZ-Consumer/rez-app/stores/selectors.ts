// @ts-nocheck
/**
 * Granular Zustand selectors for maximum performance.
 *
 * Instead of: const { state } = useAuth() — re-renders on ANY auth change
 * Use:        const user = useAuthUser() — re-renders ONLY when user changes
 *
 * These selectors give components surgical precision over what they subscribe to.
 */

import { useAuthStore } from './authStore';
import { useWalletStore } from './walletStore';
import { useCartStore } from './cartStore';
import { useRegionStore } from './regionStore';
import { useHomeTabStore } from './homeTabStore';
import { useThemeStore } from './themeStore';
import { useGamificationStore } from './gamificationStore';
import { useSubscriptionStore } from './subscriptionStore';
import { useWishlistStore } from './wishlistStore';
import { useProfileStore } from './profileStore';

// ============================================================================
// AUTH SELECTORS — 150 imports, most critical
// ============================================================================

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

// ============================================================================
// WALLET SELECTORS — 48 imports
// ============================================================================

/** Only re-renders when balance changes */
export const useRezBalance = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.rezBalance);

/** Only re-renders when total balance changes */
export const useTotalBalance = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.totalBalance);

/** Only re-renders when available balance changes */
export const useAvailableBalance = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.availableBalance);

/** Only re-renders when branded coins change */
export const useBrandedCoins = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.brandedCoins);

/** Only re-renders when wallet loading state changes */
export const useWalletLoading = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.isLoading);

/** Never re-renders — stable function reference */
export const useRefreshWallet = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.refreshWallet);

/** Full wallet data (use sparingly — re-renders on unknown wallet change) */
export const useWalletData = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.walletData);

// ============================================================================
// CART SELECTORS — 37 imports
// ============================================================================

/** Only re-renders when item count changes */
export const useCartItemCount = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.items?.length ?? 0);

/** Only re-renders when cart items change */
export const useCartItems = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.items);

/** Only re-renders when cart total changes */
export const useCartTotal = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.totalPrice ?? 0);

/** Only re-renders when cart loading changes */
export const useCartLoading = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state.isLoading);

/** Never re-renders — stable action references */
export const useCartActions = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.actions);

// ============================================================================
// REGION SELECTORS — 426 imports (!)
// ============================================================================

/** Only re-renders when region ID changes */
export const useCurrentRegionId = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.currentRegion);

/** Only re-renders when currency changes */
export const useCurrency = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.currency);

/** Stable function — never re-renders */
export const useGetCurrencySymbol = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.getCurrencySymbol);

/** Stable function — never re-renders */
export const useFormatPrice = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.formatPrice);

/** Stable function — never re-renders */
export const useGetLocale = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.getLocale);

/** Stable function — never re-renders */
export const useGetCurrency = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.getCurrency);

/** Stable function — never re-renders */
export const useSetRegion = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.setRegion);

/** Only re-renders when region state changes */
export const useRegionState = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.state);

// ============================================================================
// WALLET EXTRA SELECTORS
// ============================================================================

/** Only re-renders when savings insights change */
export const useSavingsInsights = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.savingsInsights);

/** Raw backend data — use sparingly */
export const useRawWalletData = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.rawBackendData);

/** Only re-renders when refreshing state changes */
export const useWalletRefreshing = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.isRefreshing);

/** Stable function — optimistic balance adjustment for instant UI feedback */
export const useAdjustBalance = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.adjustBalance);

/** Stable function — roll back the last optimistic adjustBalance if API call fails */
export const useRollbackAdjustment = () => useWalletStore((s: ReturnType<typeof useWalletStore.getState>) => s.rollbackAdjustment);

// ============================================================================
// CART EXTRA SELECTORS
// ============================================================================

/** Full cart state (use sparingly) */
export const useCartState = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.state);

/** Stable function — never re-renders */
export const useRefreshCart = () => useCartStore((s: ReturnType<typeof useCartStore.getState>) => s.refreshCart);

// ============================================================================
// HOME TAB SELECTORS — 5 imports
// ============================================================================

/** Only re-renders when active tab changes */
export const useActiveTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.activeTab);

/** Stable function — never re-renders */
export const useSetActiveTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.setActiveTab);

/** Derived booleans */
export const useIsPriveActive = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.isPriveActive);
export const useIsMallActive = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.isMallActive);

/** Only re-renders when prive eligibility changes */
export const usePriveEligibility = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.priveEligibility);

/** Only re-renders when prive eligible status changes */
export const useIsPriveEligible = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.isPriveEligible);

/** Legacy tab ID — only re-renders when active tab changes */
export const useActiveHomeTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.activeHomeTab);

/** Stable function — never re-renders */
export const useSetActiveHomeTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.setActiveHomeTab);

/** Stable function — never re-renders */
export const useRegisterScrollToTop = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.registerScrollToTop);

// ============================================================================
// THEME SELECTORS — most used
// ============================================================================

/** Only re-renders when dark mode toggles */
export const useIsDark = () => {
  const mode = useThemeStore((s: ReturnType<typeof useThemeStore.getState>) => s.themeMode);
  // Can't call useColorScheme here (not a hook context), so just return stored mode
  return mode === 'dark';
};

// ============================================================================
// GAMIFICATION SELECTORS — 16 imports
// ============================================================================

/** Only re-renders when streak changes */
export const useStreak = () => useGamificationStore((s: ReturnType<typeof useGamificationStore.getState>) => s.state?.dailyStreak);

/** Only re-renders when daily check-in status changes */
export const useHasCheckedIn = () => useGamificationStore((s: ReturnType<typeof useGamificationStore.getState>) => (s.state as unknown)?.hasCheckedInToday);

// ============================================================================
// SUBSCRIPTION SELECTORS — 10 imports
// ============================================================================

/** Only re-renders when subscription tier changes */
export const useSubscriptionTier = () => useSubscriptionStore((s: ReturnType<typeof useSubscriptionStore.getState>) => s.state?.currentSubscription?.tier);

/** Only re-renders when subscribed status changes */
export const useIsSubscribed = () => useSubscriptionStore((s: ReturnType<typeof useSubscriptionStore.getState>) => s.computed?.isSubscribed ?? false);

// ============================================================================
// WISHLIST SELECTORS — 15 imports
// ============================================================================

/** Only re-renders when wishlist count changes */
export const useWishlistCount = () => useWishlistStore((s: ReturnType<typeof useWishlistStore.getState>) => s.wishlistItems?.length ?? 0);

/** Stable function — never re-renders */
export const useIsInWishlist = () => useWishlistStore((s: ReturnType<typeof useWishlistStore.getState>) => s.isInWishlist);

// ============================================================================
// PROFILE SELECTORS — 9 imports
// ============================================================================

/** Only re-renders when profile data changes */
export const useUserProfile = () => useProfileStore((s: ReturnType<typeof useProfileStore.getState>) => s.user);
