// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useWalletStore, type WalletStoreState } from '@/stores/walletStore';
import { WalletData, CoinBalance, CoinPromoDetails } from '@/types/wallet';
import { CoinType } from '@/types/enums/index';
import walletApi from '@/services/walletApi';
import { useAuthUser, useIsAuthenticated } from '@/stores/selectors';
import { BRAND } from '@/constants/brand';
import { errorReporter } from '@/utils/errorReporter';
import { logger } from '@/utils/logger';
// SS-007 FIX: Subscribe to backend socket events so wallet auto-refreshes on coins earned / wallet updated
import { useSocket } from '@/contexts/SocketContext';

// ---------------------------------------------------------------------------
// Typed shapes for raw backend wallet data
// ---------------------------------------------------------------------------
/** A single coin entry as returned by the backend /wallet/balance endpoint */
export interface BackendCoinEntry {
  type: string;
  amount: number;
  isActive?: boolean;
  earnedDate?: string;
  lastUsed?: string;
  expiryDate?: string;
  promoDetails?: unknown;
}

/** A single branded-coin (store/partner coin) entry from the backend */
export interface BrandedCoinEntry {
  id?: string;
  brandId?: string;
  brandName?: string;
  amount: number;
  currency?: string;
  expiryDate?: string;
  isActive?: boolean;
}

/** Raw backend wallet response shape (lenient — extra fields are allowed) */
export interface RawWalletBackendData {
  coins?: BackendCoinEntry[];
  promoCoins?: BackendCoinEntry & { promoDetails?: unknown };
  brandedCoins?: BrandedCoinEntry[];
  brandedCoinsTotal?: number;
  totalValue?: number;
  balance?: {
    available?: number;
    cashback?: number;
    pending?: number;
  };
  breakdown?: {
    rezCoins?: { amount: number };
    cashback?: number;
    cashbackBalance?: number;
    pending?: number;
    pendingRewards?: number;
  };
  savingsInsights?: {
    totalSaved: number;
    thisMonth: number;
    avgPerVisit: number;
  };
  lastUpdated?: string;
  status?: {
    isActive?: boolean;
    isFrozen?: boolean;
    frozenReason?: string;
  };
}

// ---------------------------------------------------------------------------
// Transform backend wallet response into frontend WalletData
// (Same logic as hooks/useWallet.ts — kept in sync)
// ---------------------------------------------------------------------------
function transformWalletResponse(backendData: RawWalletBackendData, userId: string): WalletData {
  if (!backendData || typeof backendData !== 'object') {
    throw new Error('Invalid wallet data received');
  }

  // Safe fallback date — guards against missing lastUpdated field in API response
  const safeDate = backendData.lastUpdated ? new Date(backendData.lastUpdated) : new Date();

  const backendCoins = Array.isArray(backendData.coins) ? backendData.coins : [];
  const rezCoin = backendCoins.find((c) => c.type === 'rez');
  const promoData = backendData.promoCoins;

  // Resolve rez coin amount: prefer coin object, fall back to breakdown.rezCoins.amount
  const rezAmount = rezCoin?.amount ?? backendData?.breakdown?.rezCoins?.amount ?? 0;
  const promoAmount = promoData?.amount ?? 0;

  const coins: CoinBalance[] = [
    {
      id: 'rez-0',
      type: 'rez' as CoinType,
      name: BRAND.COIN_NAME,
      amount: rezAmount,
      currency: BRAND.CURRENCY_CODE,
      formattedAmount: `${BRAND.CURRENCY_CODE} ${rezAmount}`,
      description: `Universal rewards usable anywhere on ${BRAND.APP_NAME}`,
      iconPath: require('@/assets/images/wasil-coin.png'),
      backgroundColor: '#FFF9E6',
      color: '#B45309',
      isActive: rezCoin?.isActive !== false,
      earnedDate: rezCoin?.earnedDate ? new Date(rezCoin.earnedDate) : safeDate,
      lastUsed: rezCoin?.lastUsed ? new Date(rezCoin.lastUsed) : safeDate,
      expiryDate: rezCoin?.expiryDate ? new Date(rezCoin.expiryDate) : undefined,
    },
    {
      id: 'promo-0',
      type: 'promo' as CoinType,
      name: 'Promo Coins',
      amount: promoAmount,
      currency: BRAND.CURRENCY_CODE,
      formattedAmount: `${BRAND.CURRENCY_CODE} ${promoAmount}`,
      description: 'Special coins from campaigns & events (max 20% per bill)',
      iconPath: require('@/assets/images/promo-coin.png'),
      backgroundColor: '#FEF9E7',
      color: '#D97706',
      isActive: promoData?.isActive !== false,
      earnedDate: promoData?.earnedDate ? new Date(promoData.earnedDate) : safeDate,
      lastUsed: promoData?.lastUsed ? new Date(promoData.lastUsed) : safeDate,
      expiryDate: promoData?.expiryDate ? new Date(promoData.expiryDate) : undefined,
      promoDetails: (promoData?.promoDetails as unknown) as CoinPromoDetails | undefined,
    }
  ];

  // Prefer the API's canonical totalValue (already includes all coin types).
  // Fall back to local sum only if totalValue is missing (older API versions).
  const brandedCoinsData: BrandedCoinEntry[] = Array.isArray(backendData.brandedCoins) ? backendData.brandedCoins : [];
  const brandedCoinsTotal = backendData.brandedCoinsTotal
    ?? brandedCoinsData.reduce((sum, bc) => sum + (bc.amount || 0), 0);

  // GF-09 FIX: Backend only sends breakdown.cashbackBalance and breakdown.pendingRewards.
  // Removed the never-populated fallback paths (balance.cashback, breakdown.cashback,
  // balance.pending, breakdown.pending) to prevent a future field-name collision from
  // silently winning the ?? chain with the wrong value.
  const cashbackBalance = backendData?.breakdown?.cashbackBalance ?? 0;

  // GF-09 FIX: Same reasoning — only breakdown.pendingRewards is sent by backend.
  const pendingRewards = backendData?.breakdown?.pendingRewards ?? 0;

  // Use API totalValue as authoritative total — avoids double-counting
  const totalBalance =
    typeof backendData.totalValue === 'number' && backendData.totalValue > 0
      ? backendData.totalValue
      : (rezAmount + promoAmount + cashbackBalance + brandedCoinsTotal);

  return {
    userId: userId || 'unknown',
    totalBalance,
    availableBalance: backendData?.balance?.available ?? totalBalance,
    cashbackBalance,
    pendingRewards,
    currency: BRAND.CURRENCY_CODE,
    formattedTotalBalance: `${BRAND.CURRENCY_CODE} ${totalBalance}`,
    coins,
    brandedCoins: brandedCoinsData as BrandedCoinEntry[],
    brandedCoinsTotal,
    savingsInsights: backendData.savingsInsights || { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
    recentTransactions: [],
    lastUpdated: safeDate,
    isActive: backendData?.status?.isActive ?? true,
    isFrozen: backendData?.status?.isFrozen || false,
    frozenReason: backendData?.status?.frozenReason,
  };
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------
// Data context — changes only when actual wallet data changes (not loading state)
interface WalletDataContextType {
  walletData: WalletData | null;
  rezBalance: number;
  totalBalance: number;
  availableBalance: number;
  cashbackBalance: number;
  pendingRewards: number;
  brandedCoins: BrandedCoinEntry[];
  savingsInsights: { totalSaved: number; thisMonth: number; avgPerVisit: number };
  refreshWallet: () => Promise<void>;
  rawBackendData: RawWalletBackendData | null;
  error: string | null;
  /** CD-CRIT-04: Stack of in-flight optimistic deltas for rollback on API failure */
  pendingDeltaStack: number[];
}

// Loading context — changes on loading transitions only
interface WalletLoadingContextType {
  isLoading: boolean;
  isRefreshing: boolean;
}

// Combined type for backwards compatibility
interface WalletContextType extends WalletDataContextType, WalletLoadingContextType {
  /** CD-CRIT-04: Stack of in-flight optimistic deltas for rollback on API failure */
  pendingDeltaStack: number[];
}

const WALLET_DATA_DEFAULTS: WalletDataContextType = {
  walletData: null,
  rezBalance: 0,
  totalBalance: 0,
  availableBalance: 0,
  cashbackBalance: 0,
  pendingRewards: 0,
  brandedCoins: [] as BrandedCoinEntry[],
  savingsInsights: { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
  refreshWallet: async () => {},
  rawBackendData: null,
  error: null,
  pendingDeltaStack: [],
};

const WALLET_LOADING_DEFAULTS: WalletLoadingContextType = {
  isLoading: false,
  isRefreshing: false,
};

const WALLET_DEFAULTS: WalletContextType = { ...WALLET_DATA_DEFAULTS, ...WALLET_LOADING_DEFAULTS };

const WalletDataContext = createContext<WalletDataContextType | undefined>(undefined);
const WalletLoadingContext = createContext<WalletLoadingContextType | undefined>(undefined);
// Keep legacy context for backwards compat with any direct consumers
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// ── Module-level dedup: survives component remounts caused by DeferredProviders ──
let _walletPending: Promise<void> | null = null;
let _walletLastFetch = 0;
const WALLET_DEDUP_MS = 10_000; // 10 seconds dedup window

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function WalletProvider({ children }: { children: ReactNode }) {
  const authUser = useAuthUser();
  const isAuthenticated = useIsAuthenticated();

  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [rawBackendData, setRawBackendData] = useState<RawWalletBackendData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Fetch wallet from API (module-level dedup prevents duplicate calls on remount)
  const fetchWallet = useCallback(async (isRefresh: boolean = false) => {
    // Coalesce with in-flight request (module-level — survives remounts)
    if (_walletPending) {
      await _walletPending;
      return;
    }

    // Skip if fetched very recently (dedup across DeferredProvider remounts)
    if (!isRefresh && Date.now() - _walletLastFetch < WALLET_DEDUP_MS) {
      return;
    }

    const promise = (async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        if (isRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        // FIX 6: Pass abort signal so the fetch is cancelled on unmount/navigation
        const response = await walletApi.getBalance({ signal: abortRef.current.signal });

        if (abortRef.current.signal.aborted) return;

        if (response.success && response.data) {
          const userId = authUser?._id || authUser?.id || 'unknown';
          const rawData = response.data as unknown as RawWalletBackendData;
          const transformed = transformWalletResponse(rawData, userId);
          setWalletData(transformed);
          setRawBackendData(rawData);
          setWalletError(null);
          _walletLastFetch = Date.now();
        }
      } catch (error) {
        if (abortRef.current?.signal.aborted) return;
        // CONS-013: Report wallet fetch failures to Sentry/errorReporter instead of swallowing
        errorReporter.captureError(
          error instanceof Error ? error : new Error('Wallet fetch failed'),
          { context: 'WalletContext.fetchWallet', userId: authUser?._id || 'unknown' },
          'warning'
        );
        setWalletError('Failed to load wallet. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        _walletPending = null;
      }
    })();

    _walletPending = promise;
    await promise;
  }, [authUser?._id]);

  // Stable ref for fetchWallet to break the dependency chain:
  // fetchWallet → refreshWallet → context value → all consumers re-render
  const fetchWalletRef = useRef(fetchWallet);
  fetchWalletRef.current = fetchWallet;

  // Public refresh function (always bypasses dedup cache)
  // Uses ref to maintain stable identity — prevents 46 consumer re-renders
  const refreshWallet = useCallback(async () => {
    await fetchWalletRef.current(true);
  }, []); // Empty deps — stable identity

  // Auto-fetch when user authenticates, clear on logout
  // Skip during onboarding to prevent thundering herd of API calls on Android
  useEffect(() => {
    if (isAuthenticated && authUser && authUser.isOnboarded) {
      // Module-level dedup handles preventing duplicate fetches across remounts
      fetchWallet(false);
    } else if (!isAuthenticated) {
      // Clear on logout
      setWalletData(null);
      setRawBackendData(null);
      setWalletError(null);
      _walletLastFetch = 0;
      if (abortRef.current) abortRef.current.abort();
    }
  }, [isAuthenticated, authUser?._id]);

  // Retry wallet fetch if first attempt failed (e.g., 401 race on page refresh)
  // Waits 2s then retries once if walletData is still null
  useEffect(() => {
    if (!isAuthenticated || !authUser?.isOnboarded) return;
    if (walletData) return; // Already loaded
    if (isLoading) return; // Still loading

    const retryTimer = setTimeout(() => {
      if (!walletData && _walletLastFetch === 0) {
        fetchWallet(false);
      }
    }, 2000);

    return () => clearTimeout(retryTimer);
  }, [isAuthenticated, authUser, walletData, isLoading, fetchWallet]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // SS-007 FIX: Listen for backend socket events that signal a wallet change.
  // The backend emits 'coins:awarded' and 'wallet:updated' to the user's personal room
  // (see orderSocketService.ts emitCoinsAwarded / emitToUser).
  // When received, trigger a server-side refresh so the displayed balance is always accurate.
  const { socket } = useSocket();
  const refreshWalletRef = useRef(refreshWallet);
  refreshWalletRef.current = refreshWallet;

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const handleCoinsAwarded = () => {
      refreshWalletRef.current().catch(err => logger.error('[WalletContext] coins:awarded refresh failed', err));
    };
    const handleWalletUpdated = () => {
      refreshWalletRef.current().catch(err => logger.error('[WalletContext] wallet:updated refresh failed', err));
    };

    socket.on('coins:awarded', handleCoinsAwarded);
    socket.on('wallet:updated', handleWalletUpdated);

    return () => {
      socket.off('coins:awarded', handleCoinsAwarded);
      socket.off('wallet:updated', handleWalletUpdated);
    };
  }, [socket, isAuthenticated]);

  // Split into two memo'd values so loading state changes don't re-render data consumers
  const dataValue = useMemo<WalletDataContextType>(() => {
    const rezBalance = walletData?.coins?.find(c => c.type === 'rez')?.amount ?? 0;
    const totalBalance = walletData?.totalBalance ?? 0;
    const availableBalance = walletData?.availableBalance ?? 0;
    const cashbackBalance = walletData?.cashbackBalance ?? 0;
    const pendingRewards = walletData?.pendingRewards ?? 0;
    const brandedCoins = walletData?.brandedCoins ?? [];
    const savingsInsights = walletData?.savingsInsights ?? { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 };

    return {
      walletData, rezBalance, totalBalance, availableBalance,
      cashbackBalance, pendingRewards,
      brandedCoins, savingsInsights, refreshWallet, rawBackendData,
      error: walletError,
      // CD-CRIT-SEC-04: pendingDeltaStack lives in the Zustand store, not the context
      pendingDeltaStack: [],
    };
  }, [walletData, refreshWallet, rawBackendData, walletError]);

  const loadingValue = useMemo<WalletLoadingContextType>(() => ({
    isLoading, isRefreshing,
  }), [isLoading, isRefreshing]);

  // Combined value for legacy WalletContext consumers
  const combinedValue = useMemo<WalletContextType>(() => ({
    ...dataValue, ...loadingValue,
    // CD-CRIT-04: Sync pendingDeltaStack from store to context
    pendingDeltaStack: dataValue.pendingDeltaStack ?? [],
  }), [dataValue, loadingValue]);

  // Sync to Zustand store for crash-safe fallback
  const _setFromProvider = useWalletStore((s: WalletStoreState) => s._setFromProvider);
  useEffect(() => {
    _setFromProvider(combinedValue);
  }, [combinedValue, _setFromProvider]);

  return (
    <WalletDataContext.Provider value={dataValue}>
      <WalletLoadingContext.Provider value={loadingValue}>
        <WalletContext.Provider value={combinedValue}>
          {children}
        </WalletContext.Provider>
      </WalletLoadingContext.Provider>
    </WalletDataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
/**
 * Primary hook — reads from data context only (not affected by loading state transitions).
 * Falls back to Zustand store for crash safety when outside Provider.
 */
export function useWalletContext(): WalletContextType {
  const dataCtx = useContext(WalletDataContext);
  const loadingCtx = useContext(WalletLoadingContext);

  // Zustand fallback selectors (always called — hooks can't be conditional)
  const storeWalletData = useWalletStore((s: WalletStoreState) => s.walletData);
  const storeRezBalance = useWalletStore((s: WalletStoreState) => s.rezBalance);
  const storeTotalBalance = useWalletStore((s: WalletStoreState) => s.totalBalance);
  const storeAvailableBalance = useWalletStore((s: WalletStoreState) => s.availableBalance);
  const storeBrandedCoins = useWalletStore((s: WalletStoreState) => s.brandedCoins);
  const storeSavingsInsights = useWalletStore((s: WalletStoreState) => s.savingsInsights);
  const storeRefreshWallet = useWalletStore((s: WalletStoreState) => s.refreshWallet);
  const storeRawBackendData = useWalletStore((s: WalletStoreState) => s.rawBackendData);
  const storeIsLoading = useWalletStore((s: WalletStoreState) => s.isLoading);
  const storeIsRefreshing = useWalletStore((s: WalletStoreState) => s.isRefreshing);
  const storeError = useWalletStore((s: WalletStoreState) => s.error);

  if (dataCtx && loadingCtx) {
    return { ...dataCtx, ...loadingCtx };
  }

  // Fallback to Zustand store (populated by Provider elsewhere in the tree)
  return {
    walletData: storeWalletData,
    rezBalance: storeRezBalance,
    totalBalance: storeTotalBalance,
    availableBalance: storeAvailableBalance,
    cashbackBalance: storeWalletData?.cashbackBalance ?? 0,
    pendingRewards: storeWalletData?.pendingRewards ?? 0,
    brandedCoins: storeBrandedCoins,
    savingsInsights: storeSavingsInsights,
    refreshWallet: storeRefreshWallet,
    rawBackendData: storeRawBackendData,
    isLoading: storeIsLoading,
    isRefreshing: storeIsRefreshing,
    error: storeError,
    // CD-CRIT-SEC-04: pendingDeltaStack lives in the Zustand store, not the context
    pendingDeltaStack: [],
  };
}

/**
 * Loading-only hook — for consumers that need to show loading spinners.
 * Only re-renders when isLoading/isRefreshing change.
 */
export function useWalletLoading(): WalletLoadingContextType {
  const context = useContext(WalletLoadingContext);
  return context ?? WALLET_LOADING_DEFAULTS;
}

export { WalletContext, WalletDataContext, WalletLoadingContext };
