// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RechargeWalletCard from '../components/RechargeWalletCard';
import ReferAndEarnCard from '@/components/ReferAndEarnCard';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Share,
  AppState,
  AppStateStatus,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Href } from 'expo-router';
import { CoinBalance, WalletScreenProps, COIN_TYPES, CoinType } from '@/types/wallet';
import {
  useGetCurrency,
  useGetCurrencySymbol,
  useAuthUser,
  useIsAuthenticated,
  useAuthLoading,
  useWalletData,
  useWalletLoading,
  useWalletRefreshing,
  useRefreshWallet,
} from '@/stores/selectors';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { useProfile } from '@/contexts/ProfileContext';
import { useReferral } from '@/hooks/useReferral';
import { useWalletAnalytics } from '@/hooks/useWalletAnalytics';
import FeatureErrorBoundary from '@/components/common/FeatureErrorBoundary';
import { TransactionListSkeleton } from '@/components/skeletons';
import EarningsBreakdown from '@/components/wallet/EarningsBreakdown';
import { BalanceDisplay } from '@/components/wallet/BalanceDisplay';
import { StickyQuickActions } from '@/components/wallet/StickyQuickActions';
import { CoinDetailCard } from '@/components/wallet/CoinDetailCard';
import { InsightSection } from '@/components/wallet/InsightSection';
import { TransactionCTA } from '@/components/wallet/TransactionCTA';
import { MoreForYouSection } from '@/components/wallet/MoreForYouSection';
import CoinEducationOverlay from '@/components/wallet/CoinEducationOverlay';
import SavingsHero from '@/components/wallet/SavingsHero';
import CoinProportionBar from '@/components/wallet/CoinProportionBar';
import { platformAlert } from '@/utils/platformAlert';
import { ThemedText } from '@/components/ThemedText';
import { BRAND } from '@/constants/brand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, BorderRadius, Typography, Gradients } from '@/constants/DesignSystem';
import walletApi from '@/services/walletApi';
import { colors } from '@/constants/theme';
import { getOtaWallet, OtaWalletHotelBrandCoin } from '@/services/hotelOtaApi';
import { WALLET_RECHARGE_CASHBACK_TEXT } from '@/constants/appConstants';
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Phase 1.3: Simplified wallet view for new/casual users
import SimplifiedWalletView from '@/components/wallet/SimplifiedWalletView';
import CoinExpiryBanner from '@/components/wallet/CoinExpiryBanner';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { useHomeTabStore } from '@/stores/homeTabStore';
import { getCoinExpiryWarning } from '@/utils/retentionHooks';
import { logger } from '@/utils/logger';
// Savings module integration
import { useSavings } from '@/hooks/useSavings';
import { useSavingsNotifications } from '@/hooks/useSavingsNotifications';
import SavingsWidget, { SavingsQuickStats, SavingsStreakCard } from '@/components/wallet/SavingsWidget';

/** Local type for coin bucket items used in expiry breakdown */
interface CoinBucketItem {
  type?: string;
  source?: string;
  amount?: number;
  expiresAt?: string;
  daysLeft?: number;
}

/** Local type for lifetime stats returned by wallet balance API */
interface ExpiryResData {
  lifetimeEarned?: number;
  lifetimeRedeemed?: number;
  lifetimeExpired?: number;
  expiringSoon?: {
    amount?: number;
    expiresAt?: string;
  };
}

const WalletScreen: React.FC<WalletScreenProps> = ({ onNavigateBack, onCoinPress }) => {
  const isMounted = useIsMounted();
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const currentUserId = user?.id || '';
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const getCurrency = useGetCurrency();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [coinEducationVisible, setCoinEducationVisible] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [hotelBrandCoins, setHotelBrandCoins] = useState<OtaWalletHotelBrandCoin[]>([]);

  const walletData = useWalletData();
  const walletLoading = useWalletLoading();
  const walletRefreshing = useWalletRefreshing();
  const refreshWallet = useRefreshWallet();

  const { segment, statedIdentity } = useUserIdentityStore();
  const { activeTab } = useHomeTabStore();
  const { completionStatus, isLoading: profileLoading, error: profileError } = useProfile();

  const {
    referralData,
    isLoading: referralLoading,
    error: referralError,
  } = useReferral({
    autoFetch: true,
    refreshInterval: 15 * 60 * 1000,
  });

  const { trackWalletViewed, trackTopupInitiated, trackTransactionViewed } = useWalletAnalytics();

  // Savings module - load data and enable notifications
  const { dashboard: savingsDashboard, refreshDashboard } = useSavings();
  useSavingsNotifications();

  // Refresh savings data when wallet screen loads
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshDashboard();
    }
  }, [isAuthenticated, user?.id, refreshDashboard]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  // SS-005 FIX: Refresh wallet when app returns to foreground (e.g. after payment in browser)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active' && isAuthenticated) {
        refreshWallet().catch(() => {});
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [isAuthenticated, refreshWallet]);

  // Fetch hotel brand coins from OTA wallet (non-blocking)
  useEffect(() => {
    let cancelled = false;
    getOtaWallet()
      .then((wallet) => {
        if (!cancelled && wallet?.hotel_brand_coins?.length) {
          setHotelBrandCoins(wallet.hotel_brand_coins.filter((c) => c.balancePaise > 0));
        }
      })
      .catch(() => {}); // non-fatal
    return () => {
      cancelled = true;
    };
  }, []);

  // CA-PAY-059 FIX: Use secure storage for sensitive preference data
  // Wallet balance visibility is user preference but sensitive if device is compromised.
  // Note: AsyncStorage fallback used for compatibility; ideal solution is react-native-secure-store
  // For now, we store only the visibility preference (non-sensitive) and avoid storing actual balances.
  useEffect(() => {
    AsyncStorage.getItem('@wallet_screen_balance_hidden')
      .then((val) => {
        if (isMounted() && val === 'true') {
          setIsBalanceHidden(true);
        }
      })
      .catch(() => {
        // CA-PAY-059: Log error to error reporter instead of silently failing
        logger.warn('[WalletScreen] Failed to load balance hidden preference');
      });
  }, []);

  // Compute coin balances for CoinProportionBar
  const rezBalance = useMemo(() => {
    // ETHAN: crash guard — walletData?.coins could be undefined; filter safely
    const rezCoin = walletData?.coins?.find((c: CoinBalance) => c?.type === 'rez');
    return rezCoin?.amount ?? 0;
  }, [walletData?.coins]);

  const promoBalance = useMemo(() => {
    // ETHAN: crash guard — walletData?.coins could be undefined or contain null items
    const promoCoin = walletData?.coins?.find((c: CoinBalance) => c?.type === 'promo');
    return promoCoin?.amount ?? 0;
  }, [walletData?.coins]);

  const totalBrandedCoins = walletData?.brandedCoinsTotal ?? 0;
  const totalBalance = walletData?.totalBalance ?? 0;

  // Determine wallet header based on active tab
  const walletHeaderTitle = useMemo(() => {
    switch (activeTab) {
      case 'near-u':
        return 'Your REZ Wallet';
      case 'mall':
        return 'Mall Wallet';
      case 'prive':
        return 'Privé Balance';
      case 'cash':
        return 'Your REZ Wallet';
      default:
        return 'Wallet';
    }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    trackWalletViewed();
    // Auto-show coin education on first wallet visit
    AsyncStorage.getItem('wallet_education_seen')
      .then((seen) => {
        if (cancelled) return;
        if (!seen) {
          setCoinEducationVisible(true);
          AsyncStorage.setItem('wallet_education_seen', '1').catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trackWalletViewed]);

  // Expiring coins warning
  const [expiringAmount, setExpiringAmount] = useState(0);
  const [expiringLabel, setExpiringLabel] = useState('');
  const [expiringByType, setExpiringByType] = useState<
    { type: string; amount: number; expiresAt: string; daysLeft: number }[]
  >([]);
  const [minDaysLeft, setMinDaysLeft] = useState<number>(30); // Track minimum days to determine urgency

  // Sprint 10: Lifetime stats from GET /api/wallet/balance
  const [lifetimeEarned, setLifetimeEarned] = useState<number>(0);
  const [lifetimeRedeemed, setLifetimeRedeemed] = useState<number>(0);
  const [lifetimeExpired, setLifetimeExpired] = useState<number>(0);
  const [expiringSoonAmount, setExpiringSoonAmount] = useState<number>(0);
  const [expiringSoonDate, setExpiringSoonDate] = useState<string>('');

  // Sprint 10: Recent transactions from GET /api/user/transactions?limit=5
  const [recentTransactions, setRecentTransactions] = useState<import('@/services/walletApi').TransactionResponse[]>(
    [],
  );

  // Refresh wallet balance and expiring coins in parallel on screen focus.
  // Promise.all ensures both complete together — prevents the UI from showing
  // stale balance while expiry data has already updated (race condition fix).
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || authLoading) return;
      let cancelled = false;
      Promise.all([refreshWallet(), walletApi.getExpiringCoins()])
        .then(([, expiryRes]) => {
          if (cancelled || !expiryRes.success || !expiryRes.data) return;
          const expiringCoins = expiryRes.data?.expiringCoins ?? {};
          const totalExpiring = typeof expiryRes.data?.totalExpiring === 'number' ? expiryRes.data.totalExpiring : 0;
          if (totalExpiring <= 0) {
            setExpiringAmount(0);
            setExpiringLabel('');
            setExpiringByType([]);
            return;
          }
          setExpiringAmount(totalExpiring);
          // Determine urgency label from the most imminent bucket
          const thisWeekAmt = expiringCoins?.this_week?.totalAmount ?? 0;
          const thisMonthAmt = expiringCoins?.this_month?.totalAmount ?? 0;
          if (thisWeekAmt > 0) {
            setExpiringLabel(`${thisWeekAmt} ${BRAND.CURRENCY_CODE} expiring this week`);
          } else if (thisMonthAmt > 0) {
            setExpiringLabel(`${thisMonthAmt} ${BRAND.CURRENCY_CODE} expiring this month`);
          } else {
            setExpiringLabel(`${totalExpiring} ${BRAND.CURRENCY_CODE} expiring soon`);
          }
          // Build per-type breakdown across all periods
          const typeMap = new Map<string, { amount: number; expiresAt: string; daysLeft: number }>();
          for (const period of ['this_week', 'this_month', 'next_month'] as const) {
            const bucket = expiringCoins?.[period];
            if (!bucket) continue;
            const coinsList = Array.isArray(bucket.coins) ? bucket.coins : [];
            for (const coin of coinsList) {
              if (!coin) continue;
              const coinType: string = (coin as CoinBucketItem).type || (coin as CoinBucketItem).source || 'rez';
              const coinAmount: number =
                typeof (coin as CoinBucketItem).amount === 'number' ? ((coin as CoinBucketItem).amount as number) : 0;
              const coinExpiresAt: string = (coin as CoinBucketItem).expiresAt || '';
              const coinDaysLeft: number =
                typeof (coin as CoinBucketItem).daysLeft === 'number'
                  ? ((coin as CoinBucketItem).daysLeft as number)
                  : 0;
              const existing = typeMap.get(coinType);
              if (existing) {
                existing.amount += coinAmount;
                if (coinDaysLeft < existing.daysLeft) {
                  existing.daysLeft = coinDaysLeft;
                  existing.expiresAt = coinExpiresAt;
                }
              } else {
                typeMap.set(coinType, { amount: coinAmount, expiresAt: coinExpiresAt, daysLeft: coinDaysLeft });
              }
            }
          }
          const expiringList = Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data }));
          setExpiringByType(expiringList);
          // Calculate minimum days left for urgency styling
          if (expiringList.length > 0) {
            const minDays = Math.min(...expiringList.map((item) => item.daysLeft));
            setMinDaysLeft(minDays);
          }
        })
        .catch(() => {
          /* silent — expiry info is supplementary */
        });
      return () => {
        cancelled = true;
      };
    }, [refreshWallet, isAuthenticated, authLoading]),
  );

  // Sprint 10: Fetch lifetime stats + recent transactions on focus
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || authLoading) return;
      let cancelled = false;

      // Fetch lifetime breakdown from GET /api/gamification/leaderboard/me (or wallet balance)
      walletApi
        .getBalance()
        .then((res) => {
          if (cancelled || !res.success || !res.data) return;
          const data = res.data as ExpiryResData;
          setLifetimeEarned(data.lifetimeEarned ?? 0);
          setLifetimeRedeemed(data.lifetimeRedeemed ?? 0);
          setLifetimeExpired(data.lifetimeExpired ?? 0);
          if ((data.expiringSoon?.amount ?? 0) > 0) {
            setExpiringSoonAmount(data.expiringSoon!.amount!);
            setExpiringSoonDate(data.expiringSoon!.expiresAt ?? '');
          }
        })
        .catch(() => {});

      // Fetch recent 5 transactions
      walletApi
        .getTransactions({ limit: 5, page: 1 })
        .then((res) => {
          if (cancelled || !res.success || !res.data) return;
          setRecentTransactions(res.data.transactions ?? []);
        })
        .catch(() => {});

      return () => {
        cancelled = true;
      };
    }, [isAuthenticated, authLoading]),
  );

  const handleRefresh = useCallback(async () => {
    try {
      await refreshWallet();
    } catch (error) {
      platformAlert('Refresh Failed', error instanceof Error ? error.message : 'Unable to refresh wallet data');
    }
  }, [refreshWallet]);

  const handleBackPress = useCallback(() => {
    if (onNavigateBack) {
      onNavigateBack();
    } else {
      goBack('/');
    }
  }, [onNavigateBack, goBack]);

  const handleCoinPress = useCallback(
    (coin: CoinBalance) => {
      if (onCoinPress) {
        onCoinPress(coin);
      } else {
        router.push({
          pathname: '/wallet/coin-detail/[coinType]',
          params: { coinType: coin.type },
        } as Href);
      }
    },
    [onCoinPress, router],
  );

  const handleCoinTypePress = useCallback(
    (type: CoinType) => {
      router.push({
        pathname: '/wallet/coin-detail/[coinType]',
        params: { coinType: type },
      } as Href);
    },
    [router],
  );

  const handleRetry = useCallback(() => {
    refreshWallet();
  }, [refreshWallet]);

  // Topup state management
  const [topupLoading, setTopupLoading] = useState(false);

  const handleAmountSelect = useCallback((amount: number | 'other') => {
    // No-op: amount selection handled by RechargeWalletCard internally
  }, []);

  const handleTopupSubmit = useCallback(
    (amount: number) => {
      trackTopupInitiated(amount);
      router.push({
        pathname: '/payment',
        params: {
          amount: amount.toString(),
          currency: BRAND.CURRENCY_CODE,
          fiatCurrency: getCurrency(),
          timestamp: Date.now().toString(),
        },
      });
    },
    [trackTopupInitiated, router, getCurrency],
  );

  // Segment-specific shortcut for verified users — shown at top of More For You
  const segmentShortcut = useMemo(() => {
    const map: Record<string, { id: string; icon: string; title: string; subtitle: string; route: string }> = {
      verified_student: {
        id: 'student-deals',
        icon: 'school-outline',
        title: 'Student Deals',
        subtitle: 'Exclusive campus offers',
        route: '/offers/student',
      },
      verified_employee: {
        id: 'corporate-deals',
        icon: 'briefcase-outline',
        title: 'Work Perks',
        subtitle: 'Corporate benefits & deals',
        route: '/offers/corporate',
      },
      verified_healthcare: {
        id: 'health-deals',
        icon: 'medkit-outline',
        title: 'Healthcare Offers',
        subtitle: 'Pharmacy & wellness deals',
        route: '/offers/zones/healthcare',
      },
      verified_defence: {
        id: 'defence-deals',
        icon: 'shield-outline',
        title: 'Defence Perks',
        subtitle: 'Service member deals',
        route: '/offers/zones/defence',
      },
      verified_teacher: {
        id: 'teacher-deals',
        icon: 'book-outline',
        title: 'Teacher Benefits',
        subtitle: 'Education & stationery offers',
        route: '/offers/zones/teacher',
      },
    };
    const entry = map[segment];
    if (!entry) return null;
    return {
      id: entry.id,
      icon: entry.icon,
      title: entry.title,
      subtitle: entry.subtitle,
      onPress: () => router.push(entry.route as unknown as string),
      badge: 'VERIFIED',
    };
  }, [segment, router]);

  // "More for You" options — Ring Sizer + Saved Address moved here from main scroll
  const moreForYouOptions = useMemo(
    () => [
      ...(segmentShortcut ? [segmentShortcut] : []),
      {
        id: 'profile',
        icon: 'person-outline' as const,
        title: 'Complete Profile',
        subtitle: `${completionStatus?.completionPercentage || 0}% complete`,
        onPress: () => router.push('/profile/edit'),
      },
      {
        id: 'savings-goals',
        icon: 'flag-outline' as const,
        title: 'Savings Goals',
        subtitle: 'Track & hit your targets',
        onPress: () => router.push('/savings-goals'),
      },
      {
        id: 'scratch-card',
        icon: 'ticket-outline' as const,
        title: 'Scratch Card',
        subtitle: 'Win coins & discounts',
        onPress: () => router.push('/scratch-card'),
        badge: 'NEW',
      },
      {
        id: 'refer',
        icon: 'people-outline' as const,
        title: 'Refer & Earn',
        subtitle: 'Invite friends, earn coins',
        onPress: () => router.push('/referral'),
      },
      {
        id: 'orders',
        icon: 'receipt-outline' as const,
        title: 'Order History',
        subtitle: 'View order details',
        onPress: () => router.push('/order-history'),
      },
      {
        id: 'wishlist',
        icon: 'heart-outline' as const,
        title: 'Wishlist',
        subtitle: 'All your Favorites',
        onPress: () => router.push('/wishlist'),
      },
      {
        id: 'address',
        icon: 'location-outline' as const,
        title: 'Saved Address',
        subtitle: 'Edit, add, delete your address',
        onPress: () => router.push('/account/addresses'),
      },
      {
        id: 'ring-sizer',
        icon: 'resize-outline' as const,
        title: 'Ring Sizer',
        subtitle: 'Check your ring size',
        onPress: () => router.push('/ring-sizer'),
      },
    ],
    [completionStatus, router, segmentShortcut],
  );

  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(screenData, insets), [screenData, insets]);

  // Determine expiry banner style based on urgency
  const expiryBannerStyle = useMemo((): { backgroundColor: string; borderColor: string; iconColor: string } => {
    // Red/urgent if ≤24 hours (1 day)
    if (minDaysLeft <= 1) {
      return {
        backgroundColor: Colors.errorScale?.[50] ?? '#FEF2F2',
        borderColor: Colors.errorScale?.[200] ?? '#FECACA',
        iconColor: Colors.errorScale?.[700] ?? '#B91C1C',
      };
    }
    // Amber if >7 days
    if (minDaysLeft > 7) {
      return {
        backgroundColor: colors.tint.amber,
        borderColor: colors.warningScale?.[200] ?? '#FDE68A',
        iconColor: colors.warningScale?.[700] ?? '#B45309',
      };
    }
    // Orange/warning if 1 < daysLeft ≤ 7
    return {
      backgroundColor: colors.warningScale?.[50] ?? '#FFF9E6',
      borderColor: (colors.warningScale as unknown as Record<string, string>)?.[300] ?? '#FCD34D',
      iconColor: (colors.warningScale as unknown as Record<string, string>)?.[600] ?? '#D97706',
    };
  }, [minDaysLeft]);

  // --- Loading State ---
  if (walletLoading && !walletData) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
        <LinearGradient colors={Gradients.nileBlue} style={styles.headerBg}>
          <View style={styles.headerContainer}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>{walletHeaderTitle}</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
        <TransactionListSkeleton />
      </View>
    );
  }

  // --- Empty/Loading State (no data yet) ---
  if (!walletData && !walletLoading) {
    // If the authenticated user has not completed onboarding, their wallet has
    // not been provisioned on the backend yet. Show a clear CTA instead of a
    // generic error so they know what action to take.
    const isNotOnboarded = isAuthenticated && user && !user.isOnboarded;

    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
        <LinearGradient colors={Gradients.nileBlue} style={styles.headerBg}>
          <View style={styles.headerContainer}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>{walletHeaderTitle}</Text>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
        {isNotOnboarded ? (
          <View style={styles.errorContainer}>
            <Ionicons name="wallet-outline" size={56} color={Colors.brand.purple} />
            <Text style={styles.errorTitle}>Activate Your Wallet</Text>
            <Text style={styles.errorDetails}>
              Complete your profile to activate your wallet and start earning REZ coins.
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: Colors.brand.purple }]}
              onPress={() => router.push('/onboarding/profile' as unknown as string)}
              accessibilityLabel="Complete your profile"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Complete Profile</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
            <Text style={styles.errorTitle}>Unable to load wallet</Text>
            <Text style={styles.errorDetails}>Please check your connection and try again.</Text>
            <Pressable
              style={styles.retryButton}
              onPress={handleRetry}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  if (!walletData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background.secondary,
        }}
      >
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <ThemedText style={{ marginTop: Spacing.md, color: colors.text.secondary }}>Loading wallet...</ThemedText>
      </View>
    );
  }

  return (
    <FeatureErrorBoundary featureName="Wallet">
      <Animated.View style={styles.root} entering={FadeIn.duration(300)} pointerEvents="box-none">
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />

        {/* Fixed Header */}
        <LinearGradient colors={Gradients.nileBlue} style={styles.headerBg}>
          <View style={styles.headerContainer}>
            <Pressable
              style={styles.backButton}
              onPress={handleBackPress}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={22} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>{walletHeaderTitle}</Text>
            <Pressable
              style={styles.settingsButton}
              onPress={() => router.push('/wallet/settings')}
              accessibilityLabel="Wallet settings"
              accessibilityRole="button"
            >
              <Ionicons name="settings-outline" size={20} color={colors.text.inverse} />
            </Pressable>
          </View>

          {/* Savings Hero - inside gradient header for white-on-dark text */}
          {/* Uses SavingsContext when available, falls back to walletData */}
          <SavingsHero
            totalSaved={savingsDashboard?.totalSavingsAmount ?? walletData?.savingsInsights?.totalSaved ?? 0}
            thisMonth={savingsDashboard?.thisMonthAmount ?? walletData?.savingsInsights?.thisMonth ?? 0}
            currencySymbol={currencySymbol}
            isHidden={isBalanceHidden}
            segment={segment}
          />

          {/* Pending Cashback Banner — shown prominently when there are pending rewards */}
          {(walletData.pendingRewards > 0 || walletData.cashbackBalance > 0) && (
            <Pressable
              onPress={() => router.push('/transaction-history')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: 16,
                marginBottom: 10,
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: 'rgba(16, 185, 129, 0.35)',
                gap: 10,
                opacity: pressed ? 0.8 : 1,
              })}
              accessibilityLabel={`Pending cashback: ${currencySymbol}${(walletData.pendingRewards || walletData.cashbackBalance).toLocaleString('en-IN')}`}
              accessibilityRole="button"
              accessibilityHint="Tap to view transaction history"
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(16, 185, 129, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="hourglass-outline" size={18} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.75)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  Pending Cashback
                </Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#10b981', marginTop: 2 }}>
                  {currencySymbol}
                  {(walletData.pendingRewards || walletData.cashbackBalance).toLocaleString('en-IN')}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
                  Crediting soon — tap to track
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}

          {/* REZ Cash identity entry point */}
          <Pressable
            onPress={() => router.push('/rez-cash')}
            style={({ pressed }) => [
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginHorizontal: 16,
                marginBottom: 10,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>REZ Cash — Your Savings Story</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={walletRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.nileBlue}
              colors={[colors.nileBlue]}
              progressBackgroundColor={colors.background.primary}
            />
          }
        >
          {/* Frozen Wallet Banner */}
          {walletData.isFrozen && (
            <View style={styles.frozenBanner}>
              <Ionicons name="lock-closed" size={18} color={Colors.errorScale[700]} />
              <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                <Text style={styles.frozenTitle}>Wallet Locked</Text>
                <Text style={styles.frozenReason}>
                  {walletData.frozenReason || 'Your wallet is temporarily locked. Contact support for help.'}
                </Text>
              </View>
            </View>
          )}

          {/* Phase 1.3: Simplified wallet view — one-number balance for casual users */}
          <SimplifiedWalletView
            balance={walletData?.totalBalance ?? walletData?.availableBalance ?? 0}
            expiringCoins={
              expiringAmount > 0
                ? {
                    count: expiringAmount,
                    daysLeft: minDaysLeft,
                  }
                : null
            }
            onDetailPress={() => setCoinEducationVisible(true)}
          />

          {/* Coin expiry banner if coins expiring soon (within 7 days) */}
          {expiringAmount > 0 && minDaysLeft <= 7 && (
            <CoinExpiryBanner
              expiringCount={expiringAmount}
              daysLeft={minDaysLeft}
              onPress={() => router.push('/near-u/map')}
            />
          )}

          {/* Balance Display with hide/reveal + coin chips */}
          <BalanceDisplay walletData={walletData} onCoinPress={handleCoinTypePress} currencySymbol={currencySymbol} />

          {/* Coin Proportion Bar */}
          <CoinProportionBar
            rezBalance={rezBalance}
            promoBalance={promoBalance}
            brandedBalance={totalBrandedCoins}
            totalBalance={totalBalance}
            currencySymbol={currencySymbol}
          />

          {/* Coin Expiry Warning Banner */}
          {expiringAmount > 0 && (
            <Pressable
              style={[
                styles.expiryBanner,
                {
                  backgroundColor: expiryBannerStyle.backgroundColor,
                  borderColor: expiryBannerStyle.borderColor,
                },
              ]}
              onPress={() => router.push('/wallet/expiry-tracker')}
              accessibilityLabel={`${expiringLabel} — tap to view expiry details`}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.expiryIconWrap,
                  {
                    backgroundColor:
                      minDaysLeft <= 1
                        ? (Colors.errorScale?.[100] ?? '#FEE2E2')
                        : minDaysLeft > 7
                          ? colors.tint.amberLight
                          : (colors.warningScale?.[100] ?? '#FEF3C7'),
                  },
                ]}
              >
                <Ionicons
                  name={minDaysLeft <= 1 ? 'alert-circle' : 'timer-outline'}
                  size={20}
                  color={expiryBannerStyle.iconColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.expiryText,
                    {
                      color:
                        minDaysLeft <= 1
                          ? (Colors.errorScale?.[700] ?? '#B91C1C')
                          : minDaysLeft > 7
                            ? (colors.brand.amberDark ?? '#92400E')
                            : (colors.warningScale?.[700] ?? '#B45309'),
                    },
                  ]}
                >
                  {expiringLabel}
                </Text>
                {expiringByType.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    {expiringByType.slice(0, 3).map((item, idx) => {
                      const typeLabel =
                        item.type === 'promo'
                          ? 'Promo'
                          : item.type === 'branded'
                            ? 'Branded'
                            : item.type === 'prive'
                              ? 'Privé'
                              : 'Rez';
                      const daysText =
                        typeof item.daysLeft === 'number'
                          ? item.daysLeft <= 0
                            ? 'expires today'
                            : `${item.daysLeft}d left`
                          : '';
                      return (
                        <Text key={idx} style={styles.expiryTypeRow}>
                          {typeLabel}: {item.amount} {BRAND.CURRENCY_CODE}
                          {daysText ? ` (${daysText})` : ''}
                        </Text>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.expirySubtext}>Use them before they expire</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={expiryBannerStyle.iconColor} />
            </Pressable>
          )}

          {/* Quick Actions Bar — Add Money is the primary action */}
          {!walletData.isFrozen && (
            <>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.text.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  paddingHorizontal: 16,
                  marginTop: 12,
                  marginBottom: 4,
                }}
              >
                Quick Actions
              </Text>
              <StickyQuickActions />
            </>
          )}

          {/* Section: Your Savings Breakdown */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: Spacing.md,
              marginTop: Spacing.md,
              marginBottom: Spacing.xs,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>Your Savings Breakdown</Text>
            <Pressable
              onPress={() => setCoinEducationVisible(true)}
              hitSlop={8}
              accessibilityLabel="Learn about coin types"
              accessibilityRole="button"
              accessibilityHint="Double tap to view explanation of different coin types"
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.neutral[400]} />
            </Pressable>
          </View>
          {(walletData.coins ?? []).map((coin: CoinBalance, idx: number) => (
            <CoinDetailCard key={coin.id ?? `coin-${idx}`} coin={coin} onPress={handleCoinPress} />
          ))}

          {/* Branded Coins Summary */}
          {Array.isArray(walletData.brandedCoins) && walletData.brandedCoins.length > 0 && (
            <CoinDetailCard
              coin={{
                id: 'branded-summary',
                type: 'branded' as CoinType,
                name: 'Branded Coins',
                amount: walletData.brandedCoinsTotal ?? 0,
                currency: BRAND.CURRENCY_CODE,
                formattedAmount: `${BRAND.CURRENCY_CODE} ${walletData.brandedCoinsTotal ?? 0}`,
                description: `From ${walletData.brandedCoins.length} ${walletData.brandedCoins.length === 1 ? 'store' : 'stores'}`,
                iconPath: BRAND.COIN_IMAGE,
                backgroundColor: COIN_TYPES.branded.backgroundColor,
                color: COIN_TYPES.branded.color,
                isActive: true,
              }}
              onPress={() => router.push('/BrandedCoinsScreen')}
            />
          )}

          {/* Hotel Brand Coins */}
          {hotelBrandCoins.length > 0 && (
            <View style={{ marginTop: 4, marginBottom: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: Spacing.md,
                  marginBottom: Spacing.xs,
                }}
              >
                <Ionicons name="bed" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text?.primary ?? '#0F172A' }}>
                  Hotel Coins
                </Text>
              </View>
              {hotelBrandCoins.map((hc) => (
                <Pressable
                  key={hc.hotelId}
                  onPress={() =>
                    router.push({
                      pathname: '/travel/hotels/coin-history',
                      params: {
                        hotelId: hc.hotelId,
                        hotelName: hc.hotelName,
                        coinName: hc.brandCoinName ?? hc.brandCoinSymbol ?? 'Hotel Coin',
                        lifetimeEarned: String(hc.lifetimeEarnedPaise ?? 0),
                        lifetimeBurned: String(hc.lifetimeBurnedPaise ?? 0),
                      },
                    } as Href)
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    marginHorizontal: Spacing.md,
                    marginBottom: 10,
                    padding: 14,
                    shadowColor: '#7C3AED',
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#F5F3FF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>🏨</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                      {hc.hotelName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#7C3AED', marginTop: 1 }}>
                      {hc.brandCoinName ?? hc.brandCoinSymbol ?? 'Hotel Coin'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#7C3AED' }}>
                      ₹{Math.round(hc.balancePaise / 100).toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>available</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginLeft: 8 }} />
                </Pressable>
              ))}
            </View>
          )}

          {/* Wallet Insights */}
          <InsightSection walletData={walletData} currencySymbol={currencySymbol} segment={segment} />

          {/* Savings Module Section */}
          {savingsDashboard && savingsDashboard.totalSavings > 0 && (
            <View style={styles.section}>
              {/* Savings Quick Stats */}
              <SavingsQuickStats
                onPressHistory={() => router.push('/savings/history')}
                onPressGoals={() => router.push('/savings/goals')}
              />

              {/* Savings Streak Card */}
              <View style={{ marginTop: Spacing.md }}>
                <SavingsStreakCard />
              </View>

              {/* View Full Savings Button */}
              <Pressable
                style={styles.savingsViewAllButton}
                onPress={() => router.push('/savings')}
              >
                <Text style={styles.savingsViewAllText}>View Full Savings Dashboard</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
              </Pressable>
            </View>
          )}

          {/* Sprint 10: Lifetime Breakdown Cards */}
          <View style={sprint10Styles.breakdownSection}>
            <Text style={sprint10Styles.breakdownTitle}>Lifetime Summary</Text>
            <View style={sprint10Styles.breakdownRow}>
              <View style={[sprint10Styles.breakdownCard, sprint10Styles.earnedCard]}>
                <Ionicons name="arrow-down-circle" size={20} color="#16A34A" />
                <Text style={sprint10Styles.breakdownCardLabel}>Total Earned</Text>
                <Text style={[sprint10Styles.breakdownCardValue, { color: '#16A34A' }]}>
                  {lifetimeEarned > 0
                    ? lifetimeEarned.toLocaleString()
                    : (walletData?.savingsInsights?.totalSaved ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={[sprint10Styles.breakdownCard, sprint10Styles.redeemedCard]}>
                <Ionicons name="arrow-up-circle" size={20} color="#DC2626" />
                <Text style={sprint10Styles.breakdownCardLabel}>Total Redeemed</Text>
                <Text style={[sprint10Styles.breakdownCardValue, { color: '#DC2626' }]}>
                  {lifetimeRedeemed.toLocaleString()}
                </Text>
              </View>
              <View style={[sprint10Styles.breakdownCard, sprint10Styles.expiredCard]}>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
                <Text style={sprint10Styles.breakdownCardLabel}>Expired</Text>
                <Text style={[sprint10Styles.breakdownCardValue, { color: '#6B7280' }]}>
                  {lifetimeExpired.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Expiring Soon Banner */}
            {expiringSoonAmount > 0 && (
              <View style={sprint10Styles.expiringSoonBanner}>
                <Ionicons name="warning-outline" size={16} color="#92400E" />
                <Text style={sprint10Styles.expiringSoonText}>
                  {expiringSoonAmount} coins expire on{' '}
                  {expiringSoonDate
                    ? new Date(expiringSoonDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'soon'}
                </Text>
              </View>
            )}
          </View>

          {/* Sprint 10: Quick Actions Row */}
          <View style={sprint10Styles.quickActionsSection}>
            <Text style={sprint10Styles.breakdownTitle}>Quick Actions</Text>
            <View style={sprint10Styles.quickActionsRow}>
              <Pressable
                style={sprint10Styles.quickActionBtn}
                onPress={() => router.push('/redeem-coins')}
                accessibilityLabel="Redeem Coins"
                accessibilityRole="button"
              >
                <View style={[sprint10Styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="gift-outline" size={22} color="#16A34A" />
                </View>
                <Text style={sprint10Styles.quickActionLabel}>Redeem Coins</Text>
              </Pressable>
              <Pressable
                style={sprint10Styles.quickActionBtn}
                onPress={() => router.push('/group-buy')}
                accessibilityLabel="Group Buy"
                accessibilityRole="button"
              >
                <View style={[sprint10Styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="people-outline" size={22} color="#1D4ED8" />
                </View>
                <Text style={sprint10Styles.quickActionLabel}>Group Buy</Text>
              </Pressable>
              <Pressable
                style={sprint10Styles.quickActionBtn}
                onPress={() => router.push('/transaction-history')}
                accessibilityLabel="Transaction History"
                accessibilityRole="button"
              >
                <View style={[sprint10Styles.quickActionIcon, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="receipt-outline" size={22} color="#7C3AED" />
                </View>
                <Text style={sprint10Styles.quickActionLabel}>History</Text>
              </Pressable>
            </View>
          </View>

          {/* Sprint 10: Recent Transactions */}
          {recentTransactions.length > 0 && (
            <View style={sprint10Styles.recentTxSection}>
              <View style={sprint10Styles.recentTxHeader}>
                <Text style={sprint10Styles.breakdownTitle}>Recent Transactions</Text>
                <Pressable
                  onPress={() => router.push('/transaction-history')}
                  accessibilityLabel="View all transactions"
                  accessibilityRole="button"
                >
                  <Text style={sprint10Styles.viewAllLink}>View All</Text>
                </Pressable>
              </View>
              {recentTransactions.map((tx) => (
                <View key={tx.id || tx.transactionId} style={sprint10Styles.txRow}>
                  <View
                    style={[sprint10Styles.txIcon, { backgroundColor: tx.type === 'credit' ? '#F0FDF4' : '#FEF2F2' }]}
                  >
                    <Ionicons
                      name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={tx.type === 'credit' ? '#16A34A' : '#DC2626'}
                    />
                  </View>
                  <View style={sprint10Styles.txInfo}>
                    <Text style={sprint10Styles.txDescription} numberOfLines={1}>
                      {tx.description}
                    </Text>
                    <Text style={sprint10Styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  <Text style={[sprint10Styles.txAmount, { color: tx.type === 'credit' ? '#16A34A' : '#DC2626' }]}>
                    {tx.type === 'credit' ? '+' : '-'}
                    {tx.amount}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recharge with Discount */}
          <RechargeWalletCard
            cashbackText={WALLET_RECHARGE_CASHBACK_TEXT}
            amountOptions={[120, 500, 1000, 5000, 10000]}
            onAmountSelect={handleAmountSelect}
            onSubmit={handleTopupSubmit}
            isLoading={topupLoading}
            currency={BRAND.CURRENCY_CODE}
          />

          {/* View Transactions CTA */}
          <TransactionCTA
            onPress={() => {
              trackTransactionViewed();
              router.push('/earnings-history');
            }}
          />

          {/* Partner Earnings Breakdown */}
          <EarningsBreakdown compact={true} onViewDetails={() => router.push('/explore')} />

          {/* ── Persona-Specific Wallet Cards ─────────────────────────── */}

          {/* STUDENT: Student Savings Card */}
          {(segment === 'verified_student' || statedIdentity === 'student') && (
            <View
              style={{
                marginHorizontal: 14,
                marginVertical: 8,
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[colors.nileBlue, colors.brand.goldWarm]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 18 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>🎓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Student Savings</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Your campus coins & rewards</Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>
                      {currencySymbol}
                      {walletData?.savingsInsights?.thisMonth ?? 0}
                    </Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
                      Saved this month
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      borderRadius: 12,
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{rezBalance + promoBalance}</Text>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Total coins</Text>
                  </View>
                </View>

                {/* Micro Pack CTA */}
                <Pressable
                  onPress={() => router.push('/value-packs?persona=student' as unknown as string)}
                  style={{
                    backgroundColor: colors.background.primary,
                    borderRadius: 12,
                    paddingVertical: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="flash" size={15} color={colors.nileBlue} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.nileBlue }}>
                    Buy a Micro Pack — unlock more deals
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* EMPLOYEE/CORPORATE: Monthly Savings Report Card */}
          {(segment === 'verified_employee' || statedIdentity === 'corporate') && (
            <View
              style={{
                marginHorizontal: 14,
                marginVertical: 8,
                borderRadius: 18,
                overflow: 'hidden',
              }}
            >
              <LinearGradient
                colors={[colors.nileBlue, colors.secondary[500]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 18 }}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: 'rgba(255,205,87,0.2)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="briefcase" size={22} color={colors.lightMustard} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>Monthly Savings Report</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                      Your corporate spending breakdown
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: colors.lightMustard,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.nileBlue }}>VERIFIED</Text>
                  </View>
                </View>

                {/* Total saved */}
                <View
                  style={{
                    backgroundColor: 'rgba(255,205,87,0.15)',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Total saved this month</Text>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 2 }}>
                      {currencySymbol}
                      {walletData?.savingsInsights?.thisMonth ?? 0}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>All time</Text>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.lightMustard }}>
                      {currencySymbol}
                      {walletData?.savingsInsights?.totalSaved ?? 0}
                    </Text>
                  </View>
                </View>

                {/* Category breakdown */}
                <View style={{ gap: 8, marginBottom: 14 }}>
                  {[
                    {
                      label: 'Dining',
                      emoji: '🍱',
                      value: Math.round((walletData?.savingsInsights?.thisMonth ?? 0) * 0.45),
                    },
                    {
                      label: 'Grooming',
                      emoji: '💆',
                      value: Math.round((walletData?.savingsInsights?.thisMonth ?? 0) * 0.3),
                    },
                    {
                      label: 'Fitness',
                      emoji: '💪',
                      value: Math.round((walletData?.savingsInsights?.thisMonth ?? 0) * 0.25),
                    },
                  ].map((cat) => (
                    <View key={cat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                      <Text style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>
                        {cat.label}
                      </Text>
                      <View
                        style={{
                          height: 6,
                          flex: 2,
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderRadius: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: cat.value > 0 ? `${Math.max(cat.value, 5)}%` : '5%',
                            height: '100%',
                            backgroundColor: colors.lightMustard,
                            borderRadius: 4,
                          }}
                        />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', width: 48, textAlign: 'right' }}>
                        {currencySymbol}
                        {cat.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Value Pack CTA */}
                <Pressable
                  onPress={() => router.push('/value-packs?persona=corporate' as unknown as string)}
                  style={{
                    backgroundColor: colors.lightMustard,
                    borderRadius: 12,
                    paddingVertical: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Ionicons name="briefcase-outline" size={15} color={colors.nileBlue} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.nileBlue }}>
                    Get a Smart Value Pack — save 30%+
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* Verification CTA for unverified users who stated an identity */}
          {segment === 'normal' && statedIdentity && statedIdentity !== 'general' && (
            <Pressable
              onPress={() => router.push('/onboarding/identity-select')}
              style={{
                marginHorizontal: Spacing.md,
                marginVertical: Spacing.md,
                padding: Spacing.md,
                backgroundColor: colors.tint.orange,
                borderRadius: 14,
                borderLeftWidth: 3,
                borderLeftColor: colors.brand.orange,
                flexDirection: 'row',
                alignItems: 'center',
                gap: Spacing.md,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.background.accent,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="lock-open-outline" size={20} color={colors.brand.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.primary, marginBottom: 2 }}>
                  Unlock exclusive deals
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                  Verify your identity to access student, corporate & healthcare offers
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.brand.orange} />
            </Pressable>
          )}

          {/* More For You — collapsible section with profile, scratch card, refer, orders, wishlist, address, ring sizer */}
          <MoreForYouSection options={moreForYouOptions} />

          {/* Refer and Earn Card */}
          <ReferAndEarnCard
            data={{
              title: referralData?.title || 'Refer and Earn',
              subtitle: referralData?.subtitle || 'Invite your friends and get free jewellery',
              inviteButtonText: referralData?.inviteButtonText || 'Invite',
              inviteLink: referralData?.inviteLink || '',
            }}
            onInvite={() => {
              const link = referralData?.inviteLink || '';
              if (link) {
                Share.share({ message: `Join me on ${BRAND.APP_NAME} and earn rewards! ${link}`, url: link }).catch(
                  () => {},
                );
              } else {
                router.push('/referral');
              }
            }}
            isLoading={referralLoading}
          />

          <View style={{ height: 120 }} />
        </ScrollView>
      </Animated.View>

      {/* Coin Education Overlay */}
      <CoinEducationOverlay visible={coinEducationVisible} onDismiss={() => setCoinEducationVisible(false)} />
    </FeatureErrorBoundary>
  );
};

const createStyles = (
  screenData: { width: number; height: number },
  insets: { top: number; bottom: number; left: number; right: number },
) => {
  const isSmallScreen = screenData.width < 375;
  const isTablet = screenData.width > 768;
  const horizontalPadding = isSmallScreen ? 10 : isTablet ? 24 : 14;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background.primary },
    headerBg: {
      paddingTop: insets.top + Spacing.md,
      paddingBottom: Spacing.base,
      paddingHorizontal: horizontalPadding,
      borderBottomLeftRadius: BorderRadius.xl,
      borderBottomRightRadius: BorderRadius.xl,
      overflow: 'hidden',
      shadowColor: colors.nileBlue,
      shadowOpacity: 0.15,
      elevation: 8,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingsButton: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.full,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.text.inverse,
      fontSize: isTablet ? Typography.h2.fontSize : isSmallScreen ? Typography.h4.fontSize : Typography.h3.fontSize,
      fontWeight: '800',
      textAlign: 'center',
    },
    headerRight: { width: 36 },
    scroll: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontSize: Typography.body.fontSize, color: colors.text.secondary },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing['2xl'] },
    errorTitle: {
      fontSize: Typography.bodyLarge.fontSize,
      fontWeight: '700',
      color: colors.text.primary,
      marginTop: Spacing.md,
    },
    errorDetails: {
      fontSize: Typography.bodySmall.fontSize,
      color: colors.text.secondary,
      marginTop: Spacing.xs + 2,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.nileBlue,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm + 2,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.sm + 2,
    },
    retryButtonText: { color: colors.text.inverse, fontSize: Typography.bodySmall.fontSize, fontWeight: '600' },
    frozenBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.errorScale[100],
      marginHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.errorScale[200],
    },
    frozenTitle: {
      fontSize: Typography.bodySmall.fontSize,
      fontWeight: '700',
      color: Colors.errorScale[700],
    },
    frozenReason: {
      fontSize: Typography.caption.fontSize,
      color: colors.errorScale[700],
      marginTop: 1,
    },
    expiryBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.tint.amber,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.sm,
      marginHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: colors.warningScale[200],
      gap: Spacing.sm,
    },
    expiryIconWrap: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: colors.tint.amberLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    expiryText: {
      fontSize: Typography.bodySmall.fontSize,
      fontWeight: '700',
      color: colors.brand.amberDark,
    },
    expirySubtext: {
      fontSize: Typography.caption.fontSize,
      color: colors.brand.amberDeep,
      marginTop: 3,
    },
    expiryTypeRow: {
      fontSize: 11,
      color: colors.brand.amberDark,
      marginTop: 1,
    },
    // Savings module section
    section: {
      marginHorizontal: 14,
      marginTop: 16,
      marginBottom: 4,
    },
    savingsViewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.surface,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      gap: 6,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    savingsViewAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary,
    },
  });
};

// Sprint 10: standalone styles for new breakdown/quick-actions/recent-tx sections
const sprint10Styles = StyleSheet.create({
  breakdownSection: {
    marginHorizontal: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  breakdownCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  earnedCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  redeemedCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  expiredCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  breakdownCardLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  breakdownCardValue: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  expiringSoonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  expiringSoonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  quickActionsSection: {
    marginHorizontal: 14,
    marginTop: 16,
    marginBottom: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    textAlign: 'center',
  },
  recentTxSection: {
    marginHorizontal: 14,
    marginTop: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recentTxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
    gap: 10,
  },
  txIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  txDate: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default withErrorBoundary(WalletScreen, 'Wallet');
