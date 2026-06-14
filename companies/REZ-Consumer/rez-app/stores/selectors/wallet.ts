/**
 * Wallet store selectors — 48 imports.
 */

import { useWalletStore } from '../walletStore';

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
