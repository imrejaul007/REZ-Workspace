// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
/**
 * Full provider tree for the app.
 * Composes all eager and deferred context providers in the correct nesting order.
 *
 * Removed providers (now Zustand stores):
 * - RezThemeProvider → themeStore
 * - CrossPlatformAlertProvider → alertStore
 * - ToastProvider → toastStore
 * - DeferredOfflineQueue → offlineQueueStore
 * - DeferredSubscription → subscriptionStore
 * - RegionProvider → regionStore
 * - DeferredNotification → notificationStore
 * - SharedSkeletonProvider → module-level singleton
 * - AppProvider → appStore
 * - HomeTabProvider → homeTabStore
 * - RewardPopupProvider → rewardPopupStore
 * - DeferredSecurity → securityStore
 * - DeferredWishlist → wishlistStore
 * - DeferredProfile → profileStore
 * - DeferredGreeting → greetingStore
 * - DeferredOffers → offersThemeStore
 * - DeferredAppPreferences → appPreferencesStore
 * - DeferredCategory → categoryStore
 * - DeferredRecommendation → recommendationStore
 */
import React, { useEffect, useRef } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import analytics from '@/services/analytics/AnalyticsService';

import { useTheme } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import ToastManager from '@/components/common/ToastManager';
import { CrossPlatformAlertRenderer } from '@/components/common/CrossPlatformAlert';
import LocationRegionSync from '@/components/common/LocationRegionSync';
import { SavingsProvider } from '@/contexts/SavingsContext';
import OfflineBanner from '@/components/common/OfflineBanner';

import {
  DeferredSocket,
  DeferredWallet,
  DeferredGamification,
  DeferredCart,
} from './DeferredProviders';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { useIsAuthenticated } from '@/stores/selectors';
import { useAuth } from '@/contexts/AuthContext';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { fetchIdentityFromProfile } from '@/services/identityApi';
import { queryKeys } from '@/lib/queryKeys';

const RewardPopupManager = React.lazy(() => import('@/components/gamification/RewardPopupManager'));
const BottomNavigation = React.lazy(() => import('@/components/navigation/BottomNavigation'));

/**
 * Hydrates identity store on auth ready — ensures featureLevel is correct
 * regardless of which screen loads first (deep links, non-home screens).
 */
const IdentityHydrator = React.memo(function IdentityHydrator() {
  const isAuthenticated = useIsAuthenticated();
  const auth = useAuth();
  const authLoading = auth?.state?.isLoading ?? false;

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    fetchIdentityFromProfile()
      .then((data) => {
        if (data) useUserIdentityStore.getState().hydrateFromBackend(data);
      })
      .catch(() => {});
  }, [isAuthenticated, authLoading]);

  return null;
});

/**
 * PACKETSENSE FIX-3: Startup prefetch — seeds TanStack Query cache with wallet
 * balance the moment auth is confirmed, before unknown screen renders the wallet UI.
 *
 * Without this, the first render of the wallet section always shows a loading
 * spinner while waiting for the DeferredWallet provider to mount and fire its
 * own fetch. With this in place the data is already in cache and the wallet
 * renders instantly on the very first paint.
 *
 * staleTime = 60s matches the backend Redis TTL for the computed balance cache
 * (walletBalanceController caches it for 2 min; 60s here gives a safe buffer).
 */
const WalletPrefetcher = React.memo(function WalletPrefetcher() {
  const isAuthenticated = useIsAuthenticated();
  const auth = useAuth();
  const authLoading = auth?.state?.isLoading ?? false;
  const prefetchedRef = React.useRef(false);

  useEffect(() => {
    // Only prefetch once per session, only when auth is confirmed
    if (authLoading || !isAuthenticated || prefetchedRef.current) return;
    prefetchedRef.current = true;

    queryClient.prefetchQuery({
      queryKey: queryKeys.wallet.balance(),
      queryFn: () =>
        import('@/services/walletApi').then(m => m.default.getBalance()),
      staleTime: 60_000, // 60 s — matches backend balance cache TTL
    }).catch(() => {
      // Non-fatal: DeferredWallet will fetch on its own when it mounts
      prefetchedRef.current = false; // Allow retry on next render cycle
    });
  }, [isAuthenticated, authLoading]);

  // Reset on logout so the next login triggers a fresh prefetch
  useEffect(() => {
    if (!isAuthenticated) {
      prefetchedRef.current = false;
    }
  }, [isAuthenticated]);

  return null;
});

interface AppProvidersProps {
  onErrorBoundaryError: (error: Error, errorInfo: React.ErrorInfo) => void;
  onQueueSyncComplete: (result) => void;
  onQueueSyncError: (error: Error) => void;
}

function AppProviders({
  onErrorBoundaryError,
  // Queue sync callbacks kept in interface for backwards compat with _layout.tsx
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onQueueSyncComplete: _onQueueSyncComplete,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onQueueSyncError: _onQueueSyncError,
}: AppProvidersProps) {
  const content = (
    <QueryClientProvider client={queryClient}>
    <ErrorBoundary onError={onErrorBoundaryError}>
      <AuthProvider>
        <SavingsProvider>
          <IdentityHydrator />
          <WalletPrefetcher />
        <DeferredWallet>
          <DeferredGamification>
            <LocationProvider>
              <LocationRegionSync />
              <DeferredSocket>
                <DeferredCart>
                  <WishlistProvider>
                    <NotificationProvider>
                      <ProfileProvider>
                        <ThemedNavigation />
                      </ProfileProvider>
                    </NotificationProvider>
                  </WishlistProvider>
                </DeferredCart>
              </DeferredSocket>
            </LocationProvider>
          </DeferredGamification>
        </DeferredWallet>
        </SavingsProvider>
      </AuthProvider>
    </ErrorBoundary>
    </QueryClientProvider>
  );

  return content;
}

/**
 * Auto screen tracker — fires analytics.trackScreen() on every route change.
 */
const ScreenTrackerInner = React.memo(function ScreenTrackerInner() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);
  const lastTrackTime = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (
      pathname &&
      pathname !== prevPathRef.current &&
      now - lastTrackTime.current > 1000
    ) {
      prevPathRef.current = pathname;
      lastTrackTime.current = now;
      analytics.trackScreen(pathname, { route: pathname });
    }
  }, [pathname]);

  return null;
});

function ThemedNavigation() {
  const { isDark } = useTheme();
  const { state: authState } = useAuth();

  // Initialize analytics, remote feature flags, and offline sync queue (fire-and-forget)
  useEffect(() => {
    analytics.initialize().catch(() => {});
    import('@/services/remoteFeatureConfig').then(m => m.remoteFeatureConfig.initialize()).catch(() => {});
    import('@/services/offlineSyncService').then(m => m.default.initialize()).catch(() => {});
  }, []);

  // BUG 25: Show splash while auth is initializing to prevent flash of home page.
  // CRITICAL: Only block rendering during the INITIAL app startup load — never during
  // subsequent in-progress auth actions (sendOTP, login, etc.).
  // Unmounting <Stack> during an auth action destroys sign-in.tsx local state
  // (including `step`), resetting the user back to the phone entry screen.
  const hasEverLoadedRef = React.useRef(false);
  if (!authState.isLoading) {
    hasEverLoadedRef.current = true;
  }
  const isInitialLoad = authState.isLoading && !hasEverLoadedRef.current;

  if (isInitialLoad) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a3a52' }}>
        <ActivityIndicator size="large" color="#FFC857" />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <ScreenTrackerInner />
      <Stack screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* iOS fix: use 'light' (white icons) as the global default so status-bar icons
          remain visible on the many dark/navy gradient headers throughout the app.
          Screens with light backgrounds (e.g. home tab) can override per-screen. */}
      <StatusBar style="light" />
      <ToastManager />
      <CrossPlatformAlertRenderer />
      <OfflineBanner />
      <React.Suspense fallback={null}>
        <RewardPopupManager />
      </React.Suspense>
      <React.Suspense fallback={null}>
        <BottomNavigation />
      </React.Suspense>
    </ThemeProvider>
  );
}

export default withErrorBoundary(AppProviders, 'SetupAppProviders');
