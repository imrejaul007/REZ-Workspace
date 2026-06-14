// @ts-nocheck
import React, { Suspense, useCallback, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  RefreshControl,
  Platform,
  InteractionManager,
  AppState,
  AppStateStatus,
  Animated,
  ScrollView,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  interpolate,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { platformAlertSimple } from '@/utils/platformAlert';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import {
  useGetCurrencySymbol,
  useGetCurrency,
  useGetLocale,
  useAuthUser,
  useAuthActions,
  useIsAuthenticated,
  useCartItemCount,
  useRefreshCart,
  useRezBalance,
  useWalletData,
  useWalletLoading,
  useSavingsInsights,
  useActiveTab,
  useSetActiveTab,
  useIsPriveEligible,
  useRegisterScrollToTop,
} from '@/stores';
import { useProfile, useProfileMenu } from '@/contexts/ProfileContext';
import type { User } from '@/types/profile.types';
import { useUserIdentityStore } from '@/stores/userIdentityStore';

// Phase 1: Habit Engine components
import StreakFireIcon from '@/components/gamification/StreakFireIcon';
import RezScoreCard from '@/components/gamification/RezScoreCard';
import RewardCelebrationModal from '@/components/gamification/RewardCelebrationModal';

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import FeatureErrorBoundary from '@/components/common/FeatureErrorBoundary';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import StickySearchHeader from '@/components/homepage/StickySearchHeader';
import SavingsDashboard from '@/components/homepage/SavingsDashboard';
import SmartTipsCard from '@/components/homepage/SmartTipsCard';
import type { TabId } from '@/components/homepage/HomeTabSection';
import { useHomepage, useHomepageNavigation } from '@/hooks/useHomepage';
import { useLoyaltySection } from '@/hooks/useLoyaltySection';
import streakApi from '@/services/streakApi';
import { getScore } from '@/services/rezScoreApi';
import { getSpendingInsights } from '@/services/insightsApi';

// NOTE: PersonaDetectionOnboarding, MicroMomentDecisionCard, StreakToDealConnector,
// CoinExpiryUrgencyBanner are rendered inside NearUTabContent — not here.
import CoinExpiryBanner from '@/components/homepage/CoinExpiryBanner';
import RebookingNudgeCard from '@/components/home/RebookingNudgeCard';
import PersonalizedFeedSection, { PersonalizedFeedSectionHandle } from '@/components/homepage/PersonalizedFeedSection';
import pushNotificationService from '@/services/pushNotificationService';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
// Profile now from Zustand store (imported above)
import { profileMenuSections } from '@/data/profileData';
import LocationDisplay from '@/components/location/LocationDisplay';
// LocationPickerModal lazy-loaded below (modal — only needed on tap)
import { useCurrentLocation, useLocationPermission } from '@/hooks/useLocation';
import { AddressSearchResult } from '@/types/location.types';
// Cart & Auth now from Zustand selectors (imported above)
import { HomepageCacheWarmer } from '@/services/homepageApi';
// Wallet now from Zustand selectors (imported above)
import StoriesRow from '@/components/whats-new/StoriesRow';
// HomeTab now from Zustand selectors (imported above)
import CachedImage, { prefetchImages } from '@/components/ui/CachedImage';
import HomepageSkeleton from '@/components/homepage/HomepageSkeleton';
import { BRAND } from '@/constants/brand';
import { queryClient } from '@/lib/queryClient';
import { queryKeys } from '@/lib/queryKeys';
import { isUserFirstDay, trackSessionStart, trackSessionEnd } from '@/utils/retentionHooks';
import sessionTrackingService from '@/services/sessionTrackingService';

// ProfileMenuModal eagerly loaded — React.lazy + Suspense(null) causes modal to not appear on Android
import ProfileMenuModal from '@/components/profile/ProfileMenuModal';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyWithRetry<T extends object>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return React.lazy(() =>
    factory().catch(() => new Promise<{ default: T }>((resolve) => setTimeout(() => resolve(factory()), 1500))),
  ) as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
}

// Lazy-loaded tab containers (code-split — prefetched in background after mount)
const MallSectionContainer = lazyWithRetry(() => import('@/components/mall/MallSectionContainer'));
const MallHeaderWrapper = lazyWithRetry(() => import('@/components/mall/MallHeaderWrapper'));
const CashStoreHeaderWrapper = lazyWithRetry(() => import('@/components/cash-store/CashStoreHeaderWrapper'));
const CashStoreSectionContainer = lazyWithRetry(() => import('@/components/cash-store/CashStoreSectionContainer'));
const PriveHeaderWrapper = lazyWithRetry(() => import('@/components/prive/PriveHeaderWrapper'));
const PriveSectionContainer = lazyWithRetry(() =>
  import('@/components/prive/PriveSectionContainer').then((m) => ({ default: m.PriveSectionContainer })),
);

// Lazy-loaded components (below-the-fold / modals / secondary content)
const HomeTabSection = lazyWithRetry(() => import('@/components/homepage/HomeTabSection'));
const NearUTabContent = lazyWithRetry(() => import('@/components/homepage/NearUTabContent'));
const LocationPickerModal = lazyWithRetry(() => import('@/components/location/LocationPickerModal'));
const QuickAccessFAB = lazyWithRetry(() => import('@/components/navigation/QuickAccessFAB'));
const PushNotificationInitializer = lazyWithRetry(() => import('@/components/common/PushNotificationInitializer'));

// Extracted home screen components (bundle optimization)
const HomeErrorState = lazyWithRetry(() => import('./components/HomeErrorState'));
const HomeHeader = lazyWithRetry(() => import('./components/HomeHeader'));
const LocationBanner = lazyWithRetry(() => import('./components/LocationBanner'));
const StreakScoreRow = lazyWithRetry(() => import('./components/StreakScoreRow'));
const HomeSkeleton = lazyWithRetry(() => import('./components/HomeSkeleton'));

// ── Module-level constants ──
const IS_IOS = Platform.OS === 'ios';
const IS_WEB = Platform.OS === 'web';
const SCROLL_EVENT_THROTTLE = Platform.OS === 'android' ? 32 : 16;

// ── Module-level state: survives component remounts caused by DeferredProviders ──
let _lastFocusRefreshTime = 0; // Throttle focus refreshes across remounts
let _statsLoadedGlobal = false; // Prevent redundant stats loads across remounts

// Prefetch lazy chunks + API data in background after initial render
// This ensures Mall/Cash Store are ready BEFORE the user taps the tab
const prefetchTabsRef = { done: false };
function prefetchOtherTabs() {
  if (prefetchTabsRef.done) return;
  prefetchTabsRef.done = true;

  // Prefetch JS chunks (import() caches the module — next React.lazy render is instant)
  import('@/components/homepage/HomeTabSection').catch(() => {});
  import('@/components/homepage/NearUTabContent').catch(() => {});
  import('@/components/homepage/RecommendedStoresSection').catch(() => {});
  import('@/components/mall/MallSectionContainer').catch(() => {});
  import('@/components/mall/MallHeaderWrapper').catch(() => {});
  import('@/components/cash-store/CashStoreHeaderWrapper').catch(() => {});
  import('@/components/cash-store/CashStoreSectionContainer').catch(() => {});
  // Prefetch play tab chunks
  import('@/components/playPage/CategoryHeader').catch(() => {});
  import('@/components/playPage/MerchantVideoSection').catch(() => {});

  // Prefetch API data (backend caches in Redis — first call warms it)
  import('@/services/mallApi').then((m) => m.mallApi.getMallHomepageBatch().catch(() => {})).catch(() => {});
  import('@/services/cashStoreApi').then((m) => m.default.getHomepageData().catch(() => {})).catch(() => {});

  // Seed TanStack Query cache so tab switches are instant
  queryClient
    .prefetchQuery({
      queryKey: queryKeys.cashStore.homepage(),
      queryFn: () => import('@/services/cashStoreApi').then((m) => m.default.getHomepageData()),
      staleTime: 5 * 60_000,
    })
    .catch(() => {});

  queryClient
    .prefetchQuery({
      queryKey: queryKeys.categories.list(),
      queryFn: () => import('@/services/categoriesApi').then((m) => m.default.getCategories()),
      staleTime: 30 * 60_000,
    })
    .catch(() => {});

  // Prefetch top homepage product/store images into expo-image disk cache
  import('@/services/homepageDataService')
    .then((m) => {
      const service = m.default as { getCachedSections?: () => unknown };
      if (service && typeof service.getCachedSections === 'function') {
        const sections = service.getCachedSections?.();
        if (sections && Array.isArray(sections)) {
          const imageUrls: string[] = [];
          for (const section of sections) {
            const sectionObj = section as { items?: unknown[]; data?: unknown[] };
            const items = sectionObj.items || sectionObj.data || [];
            for (const item of items.slice(0, 10)) {
              const itemObj = item as { image?: string; imageUrl?: string; logo?: string; banner?: string[] };
              const url = itemObj.image || itemObj.imageUrl || itemObj.logo || itemObj.banner?.[0];
              if (url && typeof url === 'string' && url.startsWith('http')) {
                imageUrls.push(url);
              }
              if (imageUrls.length >= 15) break;
            }
            if (imageUrls.length >= 15) break;
          }
          if (imageUrls.length > 0) {
            prefetchImages(imageUrls);
          }
        }
      }
    })
    .catch(() => {});
}

// Tab content loading fallback — static styles to avoid creating objects per render
const fallbackStyles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.lg, paddingHorizontal: spacing.base, gap: spacing.base },
  bar1: { height: 24, width: 160, backgroundColor: colors.border.default, borderRadius: borderRadius.sm },
  hero: { height: 120, backgroundColor: colors.gray[50], borderRadius: borderRadius.lg },
  bar2: { height: 24, width: 200, backgroundColor: colors.border.default, borderRadius: borderRadius.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  card: { height: 100, flex: 1, backgroundColor: colors.gray[50], borderRadius: borderRadius.md },
  footer: { height: 80, backgroundColor: colors.gray[50], borderRadius: borderRadius.md },
});
// eslint-disable-next-line react/display-name
const TabContentFallback = React.memo(() => (
  <View style={fallbackStyles.container}>
    <View style={fallbackStyles.bar1} />
    <View style={fallbackStyles.hero} />
    <View style={fallbackStyles.bar2} />
    <View style={fallbackStyles.row}>
      <View style={fallbackStyles.card} />
      <View style={fallbackStyles.card} />
      <View style={fallbackStyles.card} />
    </View>
    <View style={fallbackStyles.footer} />
  </View>
));

// Fallback components for Suspense boundaries
const FABFallback = () => null;

// BadgeAvatar replaced by inline savedAvatarBox (Section 4 handoff)

function HomeScreen() {
  const isMounted = useIsMounted();
  const router = useRouter();
  // Sprint 12: dark mode
  const { isDark, sprintColors: themeColors } = useTheme();
  // Zustand selectors — each only re-renders when its specific value changes
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const getCurrency = useGetCurrency();
  const getLocale = useGetLocale();
  const { state, actions, getUserContext: getHomepageUserContext } = useHomepage();
  const { handleItemPress, handleAddToCart } = useHomepageNavigation();
  const { user: profileUser, isModalVisible, showModal, hideModal } = useProfile();
  const { handleMenuItemPress } = useProfileMenu();
  const cartItemCount = useCartItemCount();
  const refreshCart = useRefreshCart();
  const authUser = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const authActions = useAuthActions();
  const userPoints = useRezBalance();
  const { featureLevel } = useUserIdentityStore();

  const walletData = useWalletData();
  const isWalletLoading = useWalletLoading();
  const savingsInsights = useSavingsInsights();
  const totalSaved = savingsInsights?.totalSaved ?? 0;

  // Fetch REZ Score — used by RezScoreCard in the Habit Engine row
  const { data: rezScoreData } = useQuery({
    queryKey: ['rez-score'],
    queryFn: getScore,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000, // score updates infrequently — 5-min cache is fine
  });

  // Fetch spending insights — used by SavingsDashboard for month comparison + top stores
  const { data: spendingInsightsData } = useQuery({
    queryKey: ['insights', 'dashboard'],
    queryFn: getSpendingInsights,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  // Fetch savings summary — streak, missed savings count, top category
  const { data: savingsSummaryData } = useQuery({
    queryKey: ['savings', 'summary'],
    queryFn: async () => {
      const { default: apiClient } = await import('@/services/apiClient');
      const response = await apiClient.get<{
        data: {
          lifetimeSavedPaise: number;
          thisMonthSavedPaise: number;
          lastMonthSavedPaise: number;
          avgPerVisitPaise: number;
          topCategory: string;
          missedSavingsCount: number;
          savingsStreak: number;
        };
      }>('/user/savings/summary');
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });

  // Derive last month savings from 6-month trend array
  const lastMonthSaved = React.useMemo(() => {
    const trend = spendingInsightsData?.monthlyTrend;
    if (!trend || trend.length < 2) return undefined;
    // trend is sorted oldest→newest; second-to-last is previous month
    return trend[trend.length - 2]?.totalSaved;
  }, [spendingInsightsData]);
  // Zustand selectors for home tab — granular subscriptions
  const activeTab = useActiveTab();
  const setActiveTab = useSetActiveTab();
  const isPriveEligible = useIsPriveEligible();
  const registerScrollToTop = useRegisterScrollToTop();
  const navTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [refreshing, setRefreshing] = React.useState(false);
  const [showDetailedLocation, setShowDetailedLocation] = React.useState(false);
  // On web, InteractionManager resolves synchronously — start as true to avoid an extra re-render
  const [interactionsComplete, setInteractionsComplete] = React.useState(IS_WEB);
  const [pushReady, setPushReady] = React.useState(false); // Deferred push notification init
  const [selectedCategory, setSelectedCategory] = React.useState('for-you'); // Category tab state
  // activeTab now comes directly from useHomeTab() context
  // Batched stats state — single setState for voucher + offers count to reduce re-renders
  const [statsState, setStatsState] = React.useState({ voucherCount: 0, newOffersCount: 0 });
  const voucherCount = statsState.voucherCount;
  const newOffersCount = statsState.newOffersCount;
  const [isLocationModalVisible, setIsLocationModalVisible] = React.useState(false); // Location picker modal
  // Deferred location prompt — shown to users who skipped location during onboarding
  const { permissionStatus, requestPermission: requestLocPermission } = useLocationPermission();
  const [locationBannerDismissed, setLocationBannerDismissed] = React.useState(true); // default hidden
  const [celebrationModal, setCelebrationModal] = React.useState<{
    visible: boolean;
    coinsEarned: number;
    totalSaved: number;
  } | null>(null);
  React.useEffect(() => {
    if (permissionStatus === 'granted' || permissionStatus === 'denied') return;
    // Check if user already dismissed the banner
    let mounted = true;
    import('@react-native-async-storage/async-storage')
      .then(({ default: AS }) =>
        AS.getItem('location_banner_dismissed').then((v) => {
          if (mounted && v !== 'true') setLocationBannerDismissed(false);
        }),
      )
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [permissionStatus]);

  // Handler for tab changes
  const handleTabChange = React.useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
    },
    [setActiveTab],
  );

  // Get current location hook for editable location
  const { currentLocation, updateLocation: updateUserLocation } = useCurrentLocation();

  // Serviceability check — show Coming Soon banner if no local stores nearby
  // NOTE: never auto-switch; let user stay on Near U and choose manually via the banner
  const [isAreaServiceable, setIsAreaServiceable] = React.useState(true);
  const [serviceabilityChecked, setServiceabilityChecked] = React.useState(false);

  // CARLOS: retention — day-1 habit prompt & streak display
  // Note: isFirstDay and streakDisplay values are intentionally not used here
  // The state setters are called to trigger any future components that might need them
  const [, _setIsFirstDay] = React.useState(false);
  const [showDay1Challenge, setShowDay1Challenge] = React.useState(false);
  const [streakCount, setStreakCount] = React.useState(0);
  const [, _setStreakDisplay] = React.useState({ emoji: '', text: '' });
  const sessionStartTimeRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>('active');
  const personalizedFeedRef = useRef<PersonalizedFeedSectionHandle>(null);

  React.useEffect(() => {
    if (!currentLocation?.coordinates || serviceabilityChecked) return;

    const lat = currentLocation.coordinates.latitude;
    const lng = currentLocation.coordinates.longitude;
    let mounted = true;

    import('@/utils/serviceabilityCheck')
      .then(({ checkAreaServiceability }) => {
        checkAreaServiceability(lat, lng)
          .then((result) => {
            if (mounted) {
              setIsAreaServiceable(result.isServiceable);
              setServiceabilityChecked(true);
            }
            // No auto-switch — unserviceable areas see a banner with "Mall →" CTA instead
          })
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation?.coordinates?.latitude, currentLocation?.coordinates?.longitude]);

  // Get recently viewed items
  const {
    items: recentlyViewedItems,
    isLoading: isLoadingRecentlyViewed,
    refresh: refreshRecentlyViewed,
  } = useRecentlyViewed();

  // Get loyalty section data for homepage cards - only fetch when near-u tab is active
  const {
    loyaltyHub,
    featuredLockProduct,
    trendingService,
    isLoading: isLoyaltySectionLoading,
  } = useLoyaltySection({ autoFetch: activeTab === 'near-u' });

  // CARLOS: retention — check if user is on first day and should see day-1 challenge
  React.useEffect(() => {
    if (!authUser) return;
    const isDay1 = isUserFirstDay(authUser);
    _setIsFirstDay(isDay1);
    if (isDay1) {
      // Show day-1 challenge card (only once per session)
      import('@react-native-async-storage/async-storage')
        .then(({ default: AS }) => {
          AS.getItem('day1_challenge_shown')
            .then((shown) => {
              if (!shown) {
                setShowDay1Challenge(true);
              }
            })
            .catch(() => {});
        })
        .catch(() => {});
    }
  }, [authUser, _setIsFirstDay]);

  // CARLOS: retention — session start/end tracking for cohort analysis
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      appStateRef.current = state;
      if (state === 'active') {
        // Session start — app comes to foreground
        sessionStartTimeRef.current = Date.now();
        const event = trackSessionStart();
        // Start session tracking service
        sessionTrackingService.startSession(authUser?.id);
        // CARLOS: retention — log to analytics (would go to analytics queue)
        if (__DEV__) {
          logger.debug('[Retention] Session started:', { event });
        }
      } else if (state === 'background' || state === 'inactive') {
        // Session end — app goes background
        if (sessionStartTimeRef.current > 0) {
          const event = trackSessionEnd(sessionStartTimeRef.current);
          // End session tracking and persist for analytics
          sessionTrackingService.endSession().catch(() => {});
          // CARLOS: retention — log to analytics (would go to analytics queue)
          if (__DEV__) {
            logger.debug('[Retention] Session ended', { duration: event.sessionDuration });
          }
          sessionStartTimeRef.current = 0;
        }
      }
    });

    sessionStartTimeRef.current = Date.now();
    sessionTrackingService.startSession(authUser?.id);

    return () => {
      subscription.remove();
      sessionTrackingService.endSession().catch(() => {});
    };
  }, [authUser?.id]);

  // Fetch real streak data from backend (GET /api/gamification/streaks)
  React.useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    streakApi
      .getStreakStatus('login')
      .then((result) => {
        if (cancelled) return;
        const count = result.data?.current ?? 0;
        setStreakCount(count);
        if (count > 0) {
          const emoji = count >= 30 ? '🔥' : count >= 7 ? '⚡' : '✨';
          _setStreakDisplay({ emoji, text: `${count}d` });
        } else {
          _setStreakDisplay({ emoji: '', text: '' });
        }
      })
      .catch(() => {
        // Fail silently — streak pill stays hidden if API is unreachable
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);
  const locationExpandStyle = useAnimatedStyle(() => ({
    height: interpolate(animatedHeight.value, [0, 1], [0, 145]),
    opacity: animatedOpacity.value,
    overflow: 'hidden' as const,
  }));
  const scrollY = useSharedValue(0); // For sticky header (reanimated shared value)
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const statsLoadedRef = React.useRef(_statsLoadedGlobal); // Sync with module-level flag
  const lastFocusRefreshRef = React.useRef(_lastFocusRefreshTime); // Sync with module-level timestamp
  const scrollViewRef = React.useRef<{ scrollTo?: (options: { y: number; animated?: boolean }) => void } | null>(null); // ScrollView ref for scrollToTop

  // Register scroll to top callback
  React.useEffect(() => {
    registerScrollToTop(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
  }, [registerScrollToTop]);

  // Cleanup nav timer on unmount
  React.useEffect(() => {
    return () => clearTimeout(navTimerRef.current);
  }, []);

  // Defer heavy renders until after animations complete, then prefetch other tabs
  React.useEffect(() => {
    if (IS_WEB) {
      // Already set to true on web — just prefetch in background
      const webTimer = setTimeout(prefetchOtherTabs, 1000);
      return () => clearTimeout(webTimer);
    }
    let prefetchTimer: ReturnType<typeof setTimeout>;
    const handle = InteractionManager.runAfterInteractions(() => {
      setInteractionsComplete(true);
      // After Near U renders, prefetch Mall/Cash Store JS chunks + API data in background
      prefetchTimer = setTimeout(prefetchOtherTabs, 1000);
    });

    return () => {
      handle.cancel();
      if (prefetchTimer) clearTimeout(prefetchTimer);
    };
  }, []);

  // Defer push notification init by 3 seconds after mount
  React.useEffect(() => {
    const timer = setTimeout(() => setPushReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Phase 1.2: Trigger RewardCelebrationModal when backend notifies coins earned
  // Backend sends push with data: { type: 'coins_earned', amount: N, totalSaved: M }
  // This covers instant rewards from store visits, check-ins, and gamification events.
  React.useEffect(() => {
    const unsubscribe = pushNotificationService.addDataRefreshListener((data) => {
      if (data?.type === 'coins_earned' && typeof data.amount === 'number' && data.amount > 0) {
        setCelebrationModal({
          visible: true,
          coinsEarned: data.amount,
          totalSaved: typeof data.totalSaved === 'number' ? data.totalSaved : 0,
        });
      }
    });
    return unsubscribe;
  }, []);

  // Auto-complete onboarding for users who reached /(tabs) via shortcut path
  // (Android location-denied → notification-permission → tabs, skipping transactions-preview)
  // This triggers all deferred context providers to initialize
  const onboardingCompletedRef = React.useRef(false);
  React.useEffect(() => {
    let mounted = true;
    if (isAuthenticated && authUser && !authUser.isOnboarded && !onboardingCompletedRef.current) {
      onboardingCompletedRef.current = true;
      authActions
        .completeOnboarding({
          preferences: {
            notifications: { push: true, email: true, sms: true },
            currency: getCurrency(),
            language: getLocale().split('-')[0] || 'en',
          },
        })
        .catch(() => {
          // If completeOnboarding API fails, reset so it can retry on next render
          if (mounted) {
            onboardingCompletedRef.current = false;
          }
        });
    }
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, authUser, authActions, getCurrency, getLocale]);

  // Load supplementary homepage data (wallet balance comes from WalletContext)
  const loadUserContext = useCallback(async () => {
    if (!isAuthenticated || !authUser) {
      setStatsState({ voucherCount: 0, newOffersCount: 0 });
      return;
    }

    // First, try to use userContext from homepage batch response (already fetched, no extra API call)
    const batchContext = getHomepageUserContext();
    if (batchContext) {
      setStatsState({
        voucherCount: batchContext.voucherCount || 0,
        newOffersCount: batchContext.offersCount || 0,
      });
      return;
    }

    // Fallback: separate API call if batch didn't include userContext (e.g., not authenticated during batch)
    const contextResult = await HomepageCacheWarmer.getUserContext()
      .then((r) => ({ status: 'fulfilled' as const, value: r }))
      .catch((e) => ({ status: 'rejected' as const, reason: e }));

    if (contextResult.status === 'fulfilled' && contextResult.value.success && contextResult.value.data) {
      if (!isMounted()) return;
      setStatsState({
        voucherCount: contextResult.value.data.voucherCount || 0,
        newOffersCount: contextResult.value.data.offersCount || 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authUser, getHomepageUserContext]);

  // Load user context once after interactions complete + authenticated
  React.useEffect(() => {
    if (interactionsComplete && isAuthenticated && !statsLoadedRef.current) {
      statsLoadedRef.current = true;
      _statsLoadedGlobal = true; // Module-level — survives remounts
      loadUserContext();
    }
    // Reset flag on logout so next login triggers a fresh load
    if (!isAuthenticated) {
      statsLoadedRef.current = false;
      _statsLoadedGlobal = false;
    }
  }, [isAuthenticated, interactionsComplete, loadUserContext]);

  // Refresh all dynamic data when screen comes into focus (throttled to prevent continuous refreshing)
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Use module-level timestamp to survive remounts from DeferredProviders
      const timeSinceLastRefresh = now - _lastFocusRefreshTime;

      // Throttle focus refreshes: only refresh if more than 60 seconds since last
      // (homepage data is cached server-side for 5min, so refreshing more often is wasteful)
      if (timeSinceLastRefresh < 60000) {
        return;
      }

      lastFocusRefreshRef.current = now;
      _lastFocusRefreshTime = now; // Module-level — survives remounts

      // Refresh recently viewed items when returning to homepage
      refreshRecentlyViewed();

      // Only refresh user data if authenticated
      if (authUser && isAuthenticated) {
        // Single API call for wallet, vouchers, offers, cart, subscription
        loadUserContext();

        // Refresh cart context (for badge updates from context)
        refreshCart();
      }
    }, [authUser, isAuthenticated, refreshCart, refreshRecentlyViewed, loadUserContext]),
  );

  // Auth status check removed — AuthContext already calls checkAuthStatus on mount.
  // Calling it again here caused a redundant AUTH_LOADING→AUTH_SUCCESS cycle = flicker.

  // Debug function removed for production

  // Debug user and modal state (removed for production)

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Reset dedup timers so explicit refresh always works
    _lastFocusRefreshTime = 0;
    _statsLoadedGlobal = false;
    statsLoadedRef.current = false;
    try {
      // Refresh sections first (visual feedback) — force=true bypasses dedup
      await actions.refreshAllSections(true);

      // Refresh personalized feed
      personalizedFeedRef.current?.refresh();

      // Refresh all user data in background (non-blocking)
      if (authUser && isAuthenticated) {
        // Single API call for all user-specific data
        loadUserContext().catch(() => {});

        // Refresh cart context
        refreshCart();

        // Refresh recently viewed
        refreshRecentlyViewed();
      }
    } catch {
      // silently handle
    } finally {
      if (!isMounted()) return;
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions, authUser, isAuthenticated, loadUserContext, refreshCart, refreshRecentlyViewed]);

  const handleSearchPress = useCallback(() => {
    router.push('/search');
  }, [router]);

  const handleCoinPress = useCallback(() => {
    // CARLOS: retention — track wallet feature touch for cohort analysis
    sessionTrackingService.trackFeatureTouch('wallet');
    if (IS_IOS) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => router.push('/wallet-screen'), 50);
    } else {
      router.push('/wallet-screen');
    }
  }, [router]);

  const handlePriveLockedPress = useCallback(() => {
    router.push('/prive/eligibility');
  }, [router]);

  const handleCartPress = useCallback(() => {
    if (IS_IOS) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => router.push('/cart'), 50);
    } else {
      router.push('/cart');
    }
  }, [router]);

  const handleNotificationPress = useCallback(() => {
    router.push('/account/notification-history' as unknown as string);
  }, [router]);

  const handleProfilePress = useCallback(() => {
    if (isAuthenticated && authUser) {
      showModal();
    }
  }, [isAuthenticated, authUser, showModal]);

  // Handle location selection from the picker modal
  const handleLocationSelect = useCallback(
    async (selectedLocation: AddressSearchResult) => {
      try {
        const coordinates = {
          latitude: selectedLocation.coordinates.latitude,
          longitude: selectedLocation.coordinates.longitude,
        };
        // Pass city/state/pincode from search results
        await updateUserLocation(coordinates, selectedLocation.formattedAddress, 'manual', {
          city: selectedLocation.city,
          state: selectedLocation.state,
          pincode: selectedLocation.pincode,
        });
        if (!isMounted()) return;
        setIsLocationModalVisible(false);
      } catch {
        platformAlertSimple('Error', 'Failed to update location. Please try again.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateUserLocation],
  );

  // Handle location pill expansion/collapse
  const handleLocationPillPress = useCallback(() => {
    const newState = !showDetailedLocation;
    setShowDetailedLocation(newState);
    animatedHeight.value = withTiming(newState ? 1 : 0, { duration: 300 });
    animatedOpacity.value = withTiming(newState ? 1 : 0, { duration: 300 });
  }, [showDetailedLocation, animatedHeight, animatedOpacity]);

  // Handle change location button press
  const handleChangeLocationPress = useCallback(() => {
    setShowDetailedLocation(false);
    animatedHeight.value = withTiming(0, { duration: 200 });
    animatedOpacity.value = withTiming(0, { duration: 200 });
    setTimeout(() => setIsLocationModalVisible(true), 220);
  }, [animatedHeight, animatedOpacity]);

  // ROHAN: Extract inline async handlers from Pressable to prevent new function references on every render
  const handleEnableLocationPress = useCallback(async () => {
    await requestLocPermission();
    if (!isMounted()) return;
    setLocationBannerDismissed(true);
  }, [requestLocPermission, isMounted]);

  // CARLOS: retention — dismiss day-1 challenge card
  const handleDismissDay1Challenge = useCallback(async () => {
    setShowDay1Challenge(false);
    const { default: AS } = await import('@react-native-async-storage/async-storage');
    AS.setItem('day1_challenge_shown', new Date().toISOString()).catch(() => {});
  }, []);

  // CARLOS: retention — day-1 challenge action handler (booking, earn, or store)
  const handleDay1ChallengePress = useCallback(
    (action: 'booking' | 'earn' | 'store') => {
      // CARLOS: retention — track day-1 challenge engagement
      sessionTrackingService.trackFeatureTouch(`day1_challenge_${action}`);
      handleDismissDay1Challenge();
      switch (action) {
        case 'booking':
          sessionTrackingService.trackFeatureTouch('booking');
          router.push('/booking' as string);
          break;
        case 'earn':
          sessionTrackingService.trackFeatureTouch('earn');
          router.push('/(tabs)/earn' as string);
          break;
        case 'store':
          sessionTrackingService.trackFeatureTouch('mall');
          setActiveTab('mall');
          break;
      }
    },
    [handleDismissDay1Challenge, router, setActiveTab],
  );

  const handleDismissLocationBanner = useCallback(async () => {
    setLocationBannerDismissed(true);
    const { default: AS } = await import('@react-native-async-storage/async-storage');
    AS.setItem('location_banner_dismissed', 'true').catch(() => {});
  }, []);

  // Memoize tab-dependent styles to avoid creating new objects every render
  const tabStyles = useMemo(() => {
    const isPrive = activeTab === 'prive';
    return {
      locationIconBg: isPrive ? { backgroundColor: MUSTARD } : undefined,
      locationText: isPrive
        ? { color: colors.text.inverse, ...typography.body, fontWeight: '600' as const }
        : undefined,
      chevronColor: isPrive ? MUSTARD : colors.text.tertiary,
      coinContainerStyle: isPrive
        ? { backgroundColor: 'rgba(255, 200, 87, 0.2)', borderColor: 'rgba(255, 200, 87, 0.4)' }
        : undefined,
      coinTextColor: isPrive ? { color: MUSTARD } : undefined,
      iconColor: isPrive ? colors.text.inverse : colors.text.primary,
      whatsNewVariant: (isPrive ? 'gold' : 'green') as 'blue' | 'gold' | 'green',
      savedPillBg: isPrive ? { backgroundColor: 'rgba(255, 200, 87, 0.25)' } : undefined,
      savedTextColor: isPrive ? { color: MUSTARD } : undefined,
    };
  }, [activeTab]);

  // Show full-page skeleton while initial data is loading
  // This prevents layout shift and provides instant visual feedback
  if (!interactionsComplete && state.loading) {
    return <HomepageSkeleton />;
  }

  // Show error state when homepage data fails to load and there is nothing to display
  if (state.error && !state.loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background.primary,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}
      >
        <Ionicons name="cloud-offline-outline" size={56} color={colors.text.tertiary} />
        <Text
          style={{
            marginTop: spacing.base,
            fontSize: 17,
            fontWeight: '600',
            color: colors.text.primary,
            textAlign: 'center',
          }}
        >
          Could not load your feed
        </Text>
        <Text style={{ marginTop: spacing.sm, fontSize: 14, color: colors.text.tertiary, textAlign: 'center' }}>
          {state.error}
        </Text>
        <Pressable
          onPress={handleRefresh}
          style={{
            marginTop: spacing.lg,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            backgroundColor: colors.primary[500] ?? colors.brand.goldWarm,
            borderRadius: borderRadius.md,
          }}
          accessibilityRole="button"
          accessibilityLabel="Retry loading homepage"
        >
          <Text style={{ color: colors.text.inverse, fontWeight: '600', fontSize: 15 }}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ReAnimated.View
      style={[viewStyles.mainContainer, isDark && { backgroundColor: themeColors.bg }]}
      entering={FadeIn.duration(250)}
    >
      {/* iOS fix: home tab has a white header, so status-bar icons must be dark to be visible.
          This overrides the global 'light' default set in AppProviders. */}
      <StatusBar style="dark" />
      <ReAnimated.ScrollView
        ref={scrollViewRef}
        style={[viewStyles.container, isDark && { backgroundColor: themeColors.bg }]}
        contentContainerStyle={viewStyles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        onScroll={scrollHandler}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={MUSTARD} colors={[MUSTARD]} />
        }
      >
        {/* Coin Expiry Banner — shown when user has coins expiring in next 7 days */}
        <FeatureErrorBoundary featureName="Coin Expiry Banner" compact={true}>
          <CoinExpiryBanner />
        </FeatureErrorBoundary>

        {/* Header - Flat dark background (CRED-style, no gradient) */}
        <View style={[viewStyles.header, isDark && { backgroundColor: themeColors.card }]}>
          <View style={viewStyles.headerTop}>
            {/* Modern Location Pill - Tap to expand details */}
            <Pressable
              style={viewStyles.locationPill}
              onPress={handleLocationPillPress}
              accessibilityLabel="Current location"
              accessibilityHint={
                showDetailedLocation ? 'Tap to collapse location details' : 'Tap to expand location details'
              }
              accessibilityState={{ expanded: showDetailedLocation }}
            >
              {/* Section 4: 22x22 circle, rgba(255,178,60,.9) background */}
              <View style={viewStyles.locationIconWrapper}>
                <Ionicons name="location" size={12} color={colors.text.inverse} />
              </View>
              {/* Section 4: single line, truncated, maxWidth 80 */}
              <LocationDisplay
                compact={true}
                showCoordinates={false}
                showLastUpdated={false}
                showRefreshButton={false}
                style={viewStyles.locationDisplay}
                textStyle={textStyles.locationText}
              />
              {/* ⌄ chevron */}
              <Text style={viewStyles.locationChevronChar}>⌄</Text>
            </Pressable>

            {/* Modern Header Actions */}
            <View style={viewStyles.headerActions}>
              {/* Section 4: Streak pill — solid orange rgba(255,152,40,.82), fire emoji + bold dark number */}
              {streakCount > 0 && (
                <Pressable
                  onPress={() => router.push('/(tabs)/earn' as string)}
                  accessibilityRole="button"
                  accessibilityLabel={`${streakCount}-day streak`}
                  accessibilityHint="Tap to see your streak and earn missions"
                  style={viewStyles.headerStreakPill}
                >
                  <Text style={viewStyles.headerStreakEmoji}>🔥</Text>
                  <Text style={viewStyles.headerStreakText}>{streakCount}</Text>
                </Pressable>
              )}

              {/* Section 4: Coin pill — white card rgba(255,255,255,.9), coin circle + navy number */}
              <Pressable
                onPress={handleCoinPress}
                accessibilityRole="button"
                accessibilityLabel={`Your balance: ${userPoints} coins`}
                accessibilityHint="Tap to view wallet details"
                style={viewStyles.headerCoinContainer}
              >
                <CachedImage
                  source={BRAND.COIN_IMAGE}
                  style={viewStyles.headerCoinImage}
                  contentFit="contain"
                  showShimmer={false}
                />
                <ReAnimated.Text
                  key={isWalletLoading ? 'loading' : 'loaded'}
                  entering={FadeIn.duration(350)}
                  style={viewStyles.headerCoinText}
                >
                  {!walletData && isWalletLoading ? '...' : userPoints}
                </ReAnimated.Text>
              </Pressable>

              {/* Cart icon — white on dark */}
              <Pressable
                onPress={handleCartPress}
                accessibilityLabel={`Shopping cart: ${cartItemCount} items`}
                accessibilityRole="button"
                accessibilityHint="Double tap to view your shopping cart"
                style={viewStyles.headerIconButton}
              >
                <Ionicons name="cart-outline" size={24} color={NILE_BLUE} />
                {cartItemCount > 0 && (
                  <LinearGradient colors={[colors.error, colors.errorScale[400]]} style={viewStyles.cartBadgeModern}>
                    <Text style={viewStyles.cartBadgeTextModern}>{cartItemCount > 9 ? '9+' : cartItemCount}</Text>
                  </LinearGradient>
                )}
              </Pressable>

              {/* Notification Bell */}
              <Pressable
                onPress={handleNotificationPress}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
                accessibilityHint="Tap to view your notifications"
                style={viewStyles.headerIconButton}
              >
                <Ionicons name="notifications-outline" size={22} color={NILE_BLUE} />
              </Pressable>

              {/* Section 4: Saved pill — white half pill + orange square avatar joined (no gap) */}
              <Pressable
                onPress={handleProfilePress}
                accessibilityLabel="User profile menu"
                accessibilityRole="button"
                accessibilityHint="Double tap to open profile menu and account settings"
                style={viewStyles.profileSavingsContainer}
              >
                {/* White half-pill on left, rounded only on left side */}
                <View style={viewStyles.savedTextPill}>
                  <Text style={viewStyles.savedText}>
                    {!walletData && isWalletLoading ? '...' : `${currencySymbol}${totalSaved} saved`}
                  </Text>
                </View>
                {/* Orange square avatar on right — flush against pill, no gap */}
                <View style={viewStyles.savedAvatarBox}>
                  <Ionicons name="person" size={13} color={NILE_BLUE} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Detailed Location Section - Animated */}
          <ReAnimated.View style={[viewStyles.detailedLocationContainer, locationExpandStyle]}>
            <View style={viewStyles.detailedLocationContent}>
              {/* Full Address Section */}
              <View style={viewStyles.addressSection}>
                <View style={viewStyles.addressHeader}>
                  <Ionicons name="location" size={16} color={NILE_BLUE} />
                  <Text style={viewStyles.addressHeaderText}>Current Location</Text>
                </View>
                <LocationDisplay
                  compact={false}
                  showCoordinates={false}
                  showLastUpdated={false}
                  showRefreshButton={false}
                  style={viewStyles.detailedLocationDisplay}
                  textStyle={viewStyles.detailedLocationText}
                />
              </View>

              {/* Change Location Button */}
              <Pressable
                style={viewStyles.changeLocationButton}
                onPress={handleChangeLocationPress}
                accessibilityRole="button"
                accessibilityLabel="Change location"
                accessibilityHint="Tap to search and change your current location"
              >
                <View style={viewStyles.changeLocationIconWrapper}>
                  <Ionicons name="search" size={12} color={colors.text.inverse} />
                </View>
                <Text style={viewStyles.changeLocationText}>Change Location</Text>
                <Ionicons name="chevron-forward" size={14} color={NILE_BLUE} />
              </Pressable>
            </View>
          </ReAnimated.View>

          {/* Hero Banner: time-aware bold gradient hero for Near U tab.
              The header has paddingHorizontal: spacing.lg (20). The negative
              marginHorizontal below breaks out of that padding so the banner
              fills the full screen width edge-to-edge. */}
          {activeTab === 'near-u' && (
            <View style={viewStyles.heroBannerBreakout}>
              <FeatureErrorBoundary featureName="Savings Dashboard" compact={true}>
                <SavingsDashboard
                  totalSaved={savingsInsights?.totalSaved ?? 0}
                  thisMonth={savingsInsights?.thisMonth ?? 0}
                  avgPerVisit={savingsInsights?.avgPerVisit ?? 0}
                  currencySymbol={getCurrencySymbol()}
                  onScanPayPress={handleSearchPress}
                  onViewWalletPress={handleCoinPress}
                  lastMonthSaved={lastMonthSaved}
                  topMerchants={spendingInsightsData?.topMerchants}
                  savingsStreak={savingsSummaryData?.savingsStreak ?? 0}
                  missedSavingsCount={savingsSummaryData?.missedSavingsCount ?? 0}
                  topCategory={savingsSummaryData?.topCategory}
                  onMissedPress={() => router.push('/savings?tab=missed' as unknown as string)}
                />
              </FeatureErrorBoundary>
            </View>
          )}

          {/* CoinExpiryUrgencyBanner is now rendered inside NearUTabContent
              using walletData.coins (typed) instead of promoCoinBalance (untyped unknown cast).
              The old CoinExpiryBanner above was silently broken — field doesn't exist on WalletData. */}

          {/* Mall Hero Banner */}
          {activeTab === 'mall' && (
            <FeatureErrorBoundary featureName="Mall Banner" compact={true}>
              <Suspense fallback={<View style={{ height: 185 }} />}>
                <MallHeaderWrapper />
              </Suspense>
            </FeatureErrorBoundary>
          )}

          {/* Cash Store Header */}
          {activeTab === 'cash' && (
            <Suspense fallback={<View style={{ height: 60 }} />}>
              <CashStoreHeaderWrapper />
            </Suspense>
          )}

          {/* Privé Member Card */}
          {activeTab === 'prive' && (
            <Suspense fallback={<View style={{ height: 60 }} />}>
              <PriveHeaderWrapper />
            </Suspense>
          )}
        </View>

        {/* Home Tab Section with 4 Tabs */}
        <Suspense fallback={<View style={{ height: 44 }} />}>
          <HomeTabSection
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isPriveEligible={isPriveEligible}
            onPriveLockedPress={handlePriveLockedPress}
            onSearchPress={handleSearchPress}
            coinBalance={userPoints}
            onCoinPress={handleCoinPress}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </Suspense>

        {/* Deferred location permission banner */}
        {!locationBannerDismissed && permissionStatus !== 'granted' && permissionStatus !== 'denied' && (
          <View style={viewStyles.locationBanner}>
            <Ionicons name="location" size={20} color={NILE_BLUE} />
            <Text style={viewStyles.locationBannerText}>Enable location to find deals near you</Text>
            <Pressable
              style={viewStyles.locationBannerBtn}
              onPress={handleEnableLocationPress}
              accessibilityRole="button"
              accessibilityLabel="Enable location permission"
              accessibilityHint="Tap to grant location access and find deals near you"
            >
              <Text style={viewStyles.locationBannerBtnText}>Enable</Text>
            </Pressable>
            <Pressable
              onPress={handleDismissLocationBanner}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Dismiss location request"
              accessibilityHint="Tap to close this notification"
            >
              <Ionicons name="close" size={18} color="rgba(0,0,0,0.30)" />
            </Pressable>
          </View>
        )}

        {/* REZ Network Banner */}
        {activeTab === 'near-u' && (
          <Pressable
            style={{
              backgroundColor: '#F5F3FF',
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginHorizontal: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#DDD6FE',
            }}
            onPress={() => router.push('/explore' as unknown as string)}
            accessibilityRole="button"
            accessibilityLabel="Explore REZ network stores"
            accessibilityHint="Tap to discover stores where your REZ coins work"
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#EDE9FE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="sparkles" size={18} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#4C1D95' }}>
                Your REZ coins have value everywhere
              </Text>
              <Text style={{ fontSize: 12, color: '#8B5CF6', marginTop: 1 }}>
                Earn & spend across restaurants, salons, shops and more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
          </Pressable>
        )}

        {/* Rebooking Nudge — shown on Near-U tab for stores not visited in >10 days */}
        {activeTab === 'near-u' && (
          <FeatureErrorBoundary featureName="Rebooking Nudge" compact={true}>
            <RebookingNudgeCard />
          </FeatureErrorBoundary>
        )}

        {/* Try Before You Buy Banner */}
        {activeTab !== 'prive' && activeTab !== 'mall' && (
          <Pressable
            style={viewStyles.tryBanner}
            onPress={() => router.push('/try' as unknown as string)}
            accessibilityLabel="Try before you buy"
            accessibilityRole="button"
            accessibilityHint="Tap to explore products you can try risk-free and earn coins"
          >
            <View style={viewStyles.tryBannerGradient}>
              <View style={viewStyles.tryBannerContent}>
                <View style={viewStyles.tryBannerTextSection}>
                  <Text style={viewStyles.tryBannerTitle}>Try Before You Buy</Text>
                  <Text style={viewStyles.tryBannerSubtitle}>Experience products risk-free, earn coins</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={NILE_BLUE} style={viewStyles.tryBannerChevron} />
              </View>
            </View>
          </Pressable>
        )}

        {/* Stories Row — What's New (Instagram-style) */}
        {activeTab !== 'prive' && (
          <FeatureErrorBoundary featureName="Stories" compact={true}>
            <StoriesRow variant={tabStyles.whatsNewVariant} />
          </FeatureErrorBoundary>
        )}

        {/* Missed Savings Teaser — shown below hero when user has missed savings */}
        {activeTab === 'near-u' && (savingsSummaryData?.missedSavingsCount ?? 0) > 0 && (
          <Pressable
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fff9f0',
              borderRadius: 14,
              padding: 14,
              marginHorizontal: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#fcd34d',
              gap: 12,
            }}
            onPress={() => router.push('/savings?tab=missed' as unknown as string)}
            accessibilityRole="button"
            accessibilityLabel={`You could have saved more this month: ${savingsSummaryData?.missedSavingsCount} missed savings`}
            accessibilityHint="Tap to view missed savings opportunities"
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#fef3c7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="alert-circle" size={22} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>You missed savings this month</Text>
              <Text style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>
                {savingsSummaryData?.missedSavingsCount} better deals were nearby — see where to save more
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#f59e0b" />
          </Pressable>
        )}

        {/* Smart Tips Card — compact best nearby cashback offer */}
        {activeTab === 'near-u' && (
          <FeatureErrorBoundary featureName="Smart Tips" compact={true}>
            <SmartTipsCard />
          </FeatureErrorBoundary>
        )}

        {/* Personalized "For You" Feed — near-u tab only */}
        {activeTab === 'near-u' && (
          <FeatureErrorBoundary featureName="For You Feed" compact={true}>
            <PersonalizedFeedSection ref={personalizedFeedRef} />
          </FeatureErrorBoundary>
        )}

        {/* PersonalizedHeroBanner moved to header as HeroCard (Section 4).
            Kept here for non-near-u tabs if needed by other agents. */}

        {/* CARLOS: retention — Day-1 Challenge Card (Habit Loop Trigger) */}
        {showDay1Challenge && activeTab === 'near-u' && (
          <Pressable
            style={viewStyles.day1ChallengeCard}
            onPress={() => handleDay1ChallengePress('earn')}
            accessibilityRole="button"
            accessibilityLabel="Today's challenge: earn your first coins"
            accessibilityHint="Tap to start earning coins"
          >
            <View style={viewStyles.day1ChallengeGradient}>
              <View style={viewStyles.day1ChallengeContent}>
                <View style={viewStyles.day1ChallengeText}>
                  <Text style={viewStyles.day1ChallengeTitle}>🎯 Today's Challenge</Text>
                  <Text style={viewStyles.day1ChallengeSub}>Earn your first coins & start your journey</Text>
                </View>
                <Pressable
                  onPress={handleDismissDay1Challenge}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss challenge"
                >
                  <Ionicons name="close" size={20} color="rgba(0,0,0,0.30)" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}

        {/* Phase 1: Habit Engine — Streak + Score + Nearby Offers */}
        {activeTab === 'near-u' && (
          <FeatureErrorBoundary featureName="Habit Engine" compact={true}>
            <View style={viewStyles.streakScoreRow}>
              {streakCount > 0 && (
                <Pressable
                  onPress={() => router.push('/smart-spending')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  android_ripple={{ color: 'rgba(255,200,87,0.15)', borderless: false }}
                  accessibilityRole="button"
                  accessibilityLabel={`${streakCount}-day streak. Tap to view smart spending.`}
                >
                  <StreakFireIcon streakDays={streakCount} size="small" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: NILE_BLUE }}>{streakCount}d streak</Text>
                </Pressable>
              )}
              <View style={{ flex: 1 }}>
                <RezScoreCard
                  score={rezScoreData?.score ?? 0}
                  tier={rezScoreData?.tier ?? 'Beginner'}
                  trend={rezScoreData?.trend ?? 'stable'}
                  percentile={rezScoreData?.peerPercentile ?? 0}
                  onPress={() => router.push('/rez-score')}
                />
              </View>
            </View>
          </FeatureErrorBoundary>
        )}

        {/* Content */}
        <View
          style={[
            viewStyles.content,
            activeTab === 'mall' && viewStyles.mallContent,
            activeTab === 'cash' && viewStyles.cashStoreContent,
            activeTab === 'prive' && viewStyles.priveContent,
          ]}
        >
          {/* Near-U Tab Content - All sections with viewport-based lazy loading */}
          {activeTab === 'near-u' && (
            <FeatureErrorBoundary featureName="Near-U" compact={true}>
              <Suspense fallback={<TabContentFallback />}>
                <NearUTabContent
                  state={state}
                  actions={actions}
                  handleItemPress={handleItemPress}
                  handleAddToCart={handleAddToCart}
                  voucherCount={voucherCount}
                  userPoints={userPoints}
                  newOffersCount={newOffersCount}
                  recentlyViewedItems={recentlyViewedItems}
                  isLoadingRecentlyViewed={isLoadingRecentlyViewed}
                  loyaltyHub={loyaltyHub}
                  featuredLockProduct={featuredLockProduct}
                  trendingService={trendingService}
                  isLoyaltySectionLoading={isLoyaltySectionLoading}
                  scrollY={scrollY}
                  totalSaved={totalSaved}
                  thisMonthSaved={savingsInsights?.thisMonth ?? 0}
                  currencySymbol={currencySymbol}
                  featureLevel={featureLevel}
                  hasCompletedFirstOrder={featureLevel >= 3}
                  isAreaServiceable={isAreaServiceable}
                  areaName={currentLocation?.address?.neighbourhood || currentLocation?.address?.city}
                  onSwitchToMall={() => setActiveTab('mall')}
                />
              </Suspense>
            </FeatureErrorBoundary>
          )}

          {/* Mall Tab Content */}
          {activeTab === 'mall' && (
            <FeatureErrorBoundary featureName="Mall" compact={true}>
              <Suspense fallback={<TabContentFallback />}>
                <MallSectionContainer />
              </Suspense>
            </FeatureErrorBoundary>
          )}

          {/* Cash Store Tab Content */}
          {activeTab === 'cash' && (
            <Suspense fallback={<TabContentFallback />}>
              <CashStoreSectionContainer />
            </Suspense>
          )}

          {/* Privé Tab Content */}
          {activeTab === 'prive' && (
            <Suspense fallback={<TabContentFallback />}>
              <PriveSectionContainer />
            </Suspense>
          )}
        </View>

        {/* Profile Menu Modal */}
        {(profileUser || authUser) && (
          <ProfileMenuModal
            visible={isModalVisible}
            onClose={hideModal}
            user={(profileUser || authUser) as User}
            menuSections={profileMenuSections}
            onMenuItemPress={handleMenuItemPress}
          />
        )}

        {/* Location Picker Modal — lazy-loaded (only needed on tap) */}
        <Suspense fallback={null}>
          <LocationPickerModal
            visible={isLocationModalVisible}
            onClose={() => setIsLocationModalVisible(false)}
            onLocationSelect={handleLocationSelect}
            currentLocation={currentLocation}
          />
        </Suspense>

        {/* Quick Access FAB - Lazy Loaded */}
        <Suspense fallback={<FABFallback />}>
          <QuickAccessFAB />
        </Suspense>

        {/* Push Notification Init - deferred 3s after mount */}
        {pushReady && (
          <Suspense fallback={null}>
            <PushNotificationInitializer />
          </Suspense>
        )}
      </ReAnimated.ScrollView>

      {/* Sticky Search Header with Glass Effect - Rendered after ScrollView to avoid blocking touches */}
      {/* showThreshold should be high enough so sticky header only appears after category section scrolls out of view */}
      {/* Hide for Privé tab as it has its own dark theme */}
      {activeTab !== 'prive' && (
        <StickySearchHeader
          scrollY={scrollY}
          showThreshold={580}
          onSearchPress={handleSearchPress}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}

      {celebrationModal && (
        <RewardCelebrationModal
          visible={celebrationModal.visible}
          coinsEarned={celebrationModal.coinsEarned}
          totalSaved={celebrationModal.totalSaved}
          onDismiss={() => setCelebrationModal(null)}
        />
      )}
    </ReAnimated.View>
  );
}

/* ---------------------------
   Styles: split into textStyles and viewStyles
   --------------------------- */

const textStyles = StyleSheet.create({
  // Single line, truncated — Nile Blue text on cream header
  locationText: {
    color: colors.nileBlue,
    fontSize: 13,
    fontWeight: '600',
  },
});

// ── CRED Light design tokens (mapped to theme — do NOT add raw hex values here) ─
const CREAM_BG = colors.tint.warmGray; // warm off-white page background
const WHITE = colors.background.primary; // pure white cards / header
const NILE_BLUE = colors.nileBlue; // brand primary dark
const MUSTARD = colors.brand.goldWarm; // brand accent gold
const PRIMARY_TEXT = colors.text.primary; // main text
const MUTED_TEXT = colors.slateGray; // secondary/muted text
const CARD_BORDER = 'rgba(0,0,0,0.06)'; // very subtle border (no token equivalent)
const DIVIDER = colors.slateLight; // list dividers

const viewStyles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: CREAM_BG,
  },
  container: {
    flex: 1,
    backgroundColor: CREAM_BG,
    ...Platform.select({
      web: {
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
      },
    }),
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 120,
    backgroundColor: CREAM_BG,
    ...Platform.select({
      web: {
        minHeight: '100%',
      },
    }),
  },
  // Flat white header on cream page
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: 0,
    backgroundColor: WHITE,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  // Location pill — white with thin gray border
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: DIVIDER,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexShrink: 1,
    flexGrow: 0,
    ...Platform.select({
      android: { maxWidth: '40%', overflow: 'hidden' as const },
      ios: { maxWidth: '45%' },
      default: {},
    }),
  },
  // Nile Blue circle for location icon (matches accent)
  locationIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: NILE_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  locationChevronChar: {
    marginLeft: spacing.xs,
    fontSize: 16,
    fontWeight: '700',
    color: NILE_BLUE,
    opacity: 0.55,
    lineHeight: 16,
    flexShrink: 0,
  },
  // Header actions row
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      android: { flexShrink: 0, flexGrow: 0, marginLeft: 4 },
      ios: { flexShrink: 0, marginLeft: 4 },
      default: { gap: spacing.xs },
    }),
  },
  // Streak pill — very subtle on light header
  headerStreakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.amber,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minHeight: 36,
    minWidth: 44,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.40)',
  },
  headerStreakEmoji: {
    fontSize: 13,
  },
  headerStreakText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.brand.goldAccent,
  },
  // Coin pill — white card, Nile Blue number
  headerCoinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 9,
    minHeight: 30,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    ...Platform.select({
      android: { flexShrink: 0 },
      ios: { flexShrink: 0 },
      default: {},
    }),
  },
  headerCoinImage: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  headerCoinText: {
    fontSize: 13,
    fontWeight: '800',
    color: NILE_BLUE,
  },
  // Icon buttons — transparent on white header
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      android: { marginLeft: 0, flexShrink: 0 },
      ios: { marginLeft: 0, flexShrink: 0 },
      default: {},
    }),
  },
  cartBadgeModern: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeTextModern: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '700',
  },
  // Profile savings pill — white card + mustard avatar
  profileSavingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      android: { marginLeft: 4, flexShrink: 0 },
      ios: { marginLeft: 4, flexShrink: 0 },
      default: {},
    }),
  },
  savedTextPill: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 7,
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: CARD_BORDER,
  },
  savedText: {
    color: MUTED_TEXT,
    fontSize: 10,
    fontWeight: '600',
  },
  savedAvatarBox: {
    width: 36,
    height: 36,
    backgroundColor: MUSTARD,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  locationDisplay: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
    maxWidth: 80,
    ...Platform.select({
      android: { flex: 0, flexGrow: 0, flexShrink: 1 },
      ios: { flex: 0, flexShrink: 1 },
      default: {},
    }),
  },
  // Detailed location dropdown — white card on cream
  detailedLocationContainer: {
    backgroundColor: WHITE,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  detailedLocationContent: {
    padding: spacing.base,
  },
  addressSection: {
    marginBottom: -10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addressHeaderText: {
    ...typography.body,
    fontWeight: '600',
    color: PRIMARY_TEXT,
    marginLeft: spacing.xs,
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,58,82,0.04)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(26,58,82,0.12)',
  },
  changeLocationIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.md,
    backgroundColor: NILE_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  changeLocationText: {
    flex: 1,
    ...typography.bodySmall,
    fontWeight: '600',
    color: NILE_BLUE,
  },
  detailedLocationDisplay: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },
  detailedLocationText: {
    color: MUTED_TEXT,
    ...typography.body,
    lineHeight: 20,
  },
  // Hero banner breakout — edge-to-edge
  heroBannerBreakout: {
    marginHorizontal: -spacing.lg,
  },
  content: {
    paddingTop: spacing.sm,
    paddingBottom: 100,
    paddingHorizontal: 0,
    backgroundColor: CREAM_BG,
  },
  mallContent: {
    padding: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  cashStoreContent: {
    padding: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  priveContent: {
    padding: 0,
    paddingBottom: 0,
    backgroundColor: 'transparent',
  },
  // Location banner — white card on cream
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: WHITE,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    gap: spacing.sm,
  },
  locationBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: MUTED_TEXT,
  },
  locationBannerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: MUSTARD,
    borderRadius: borderRadius.sm,
  },
  locationBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: NILE_BLUE,
  },
  // Try Banner — white card with mustard left border
  tryBanner: {
    marginHorizontal: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  tryBannerGradient: {
    backgroundColor: WHITE,
    borderLeftWidth: 3,
    borderLeftColor: MUSTARD,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  tryBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tryBannerTextSection: {
    flex: 1,
  },
  tryBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    marginBottom: spacing.xs,
  },
  tryBannerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: MUTED_TEXT,
  },
  tryBannerChevron: {
    marginLeft: spacing.md,
  },
  // Day-1 challenge card — white card
  day1ChallengeCard: {
    marginHorizontal: 16,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  day1ChallengeGradient: {
    backgroundColor: WHITE,
    borderLeftWidth: 3,
    borderLeftColor: MUSTARD,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  day1ChallengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  day1ChallengeText: {
    flex: 1,
  },
  day1ChallengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    marginBottom: spacing.xs,
  },
  day1ChallengeSub: {
    fontSize: 13,
    fontWeight: '400',
    color: MUTED_TEXT,
  },
  // Streak + Score row — white card on cream
  streakScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: 14,
    gap: 14,
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Streak display
  streakCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  streakGradient: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY_TEXT,
    textAlign: 'center',
  },
});

export default withErrorBoundary(HomeScreen, 'Home');
