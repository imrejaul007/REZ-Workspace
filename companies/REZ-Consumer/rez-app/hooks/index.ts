// @ts-nocheck
/**
 * Hooks Export Index
 *
 * Centralized exports for custom React hooks.
 */

// Responsive Hooks
export {
  useWindowSize,
  useBreakpoint,
  useIsBelowBreakpoint,
  useIsAboveBreakpoint,
  useIsDevice,
  useResponsive,
  useIsHydrated,
  useResponsiveGridColumns,
  useResponsiveSpacing,
  useDebouncedWindowSize,
  responsiveHooks,
  BREAKPOINTS,
  type BreakpointKey,
} from './useResponsive';

// Responsive Grid Hooks
export { useResponsiveGrid, useResponsiveGridCustom } from './useResponsiveGrid';

// Analytics Hooks
export { useCartAbandonmentTracking, useCheckoutAbandonmentTracking, detectAbandonmentStage } from './useCartAbandonmentTracking';
export type { CartAbandonmentTrackingOptions, UseCartAbandonmentTrackingReturn } from './useCartAbandonmentTracking';

// Push Notifications Hook
export { usePushNotifications } from './usePushNotifications';
export type { UsePushNotificationsOptions, UsePushNotificationsResult } from './usePushNotifications';

// =============================================================================
// REZ INTELLIGENCE HOOKS
// =============================================================================

// Taste Profile Hooks (AI Personalization)
export { useTasteProfile, useBehavioralInsights, useCategoryAffinity } from './useTasteProfile';

// Care Service Hooks (AI Customer Support)
export {
  useCustomer360,
  useSelfService,
  useProactiveAlerts,
  useCSAT,
  useCustomerHealth,
} from './useCare';
export type {
  UseCustomer360Return,
  UseSelfServiceReturn,
  UseProactiveAlertsReturn,
  UseCSATReturn,
} from './useCare';

// Journey & Attribution Hooks (Lifecycle Automation)
export {
  useActiveCampaigns,
  useJourneyTracking,
  useAttributionTracking,
  resetSessionId,
} from './useJourney';
export type { UseActiveCampaignsReturn } from './useJourney';

// =============================================================================
// AUTH HOOKS
// =============================================================================

export {
  useAuth,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  type UseAuthContext,
  type UseAuthState,
  type UseAuthActions,
} from './useAuth';

export {
  useAuthToken,
  useAuthTokenAutoRefresh,
  type UseAuthTokenReturn,
} from './useAuthToken';

export {
  useAuthState,
  useAuthDerivedState,
  useAuthPermissions,
  useAuthLocation,
  useAuthMemberSince,
  type AuthState,
  type AuthDerivedState,
} from './useAuthState';

// =============================================================================
// CART HOOKS
// =============================================================================

export {
  useCart,
  useCartItems,
  useCartTotal,
  useCartLoading,
  useCartError,
  useCartPendingSync,
  useCartOnlineStatus,
  type CartState,
  type CartActions,
  type UseCartContext,
} from './useCart';

export {
  useCartItems,
  type UseCartItemsReturn,
} from './useCartItems';

export {
  useCartTotal,
  useCartItemPrice,
  useCartSavings,
} from './useCartTotal';

// =============================================================================
// SOCKET HOOKS
// =============================================================================

export {
  useSocketConnection,
} from './useSocketConnection';

export {
  useSocketEvent,
  type UseSocketEventReturn,
} from './useSocketEvent';

// Add other hook exports as needed
// export { default as useHomepage } from './useHomepage';
// export { default as useNavigation } from './useNavigation';
// etc.
