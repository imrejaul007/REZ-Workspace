// @ts-nocheck
/**
 * Wallet Hooks
 *
 * These hooks provide wallet-related data fetching for transactions, summaries, and expiring coins.
 *
 * IMPORTANT: Wallet balance is now provided by WalletContext (contexts/WalletContext.tsx).
 * For balance-related data (rezBalance, totalBalance, availableBalance, etc.), use:
 *   import { useWalletContext } from '@/contexts/WalletContext';
 *
 * This file only contains hooks for data that WalletContext does not provide:
 * - Transaction history (paginated)
 * - Transaction details by ID
 * - Wallet summary (analytics)
 * - Expiring coins
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import walletApi from '@/services/walletApi';

/**
 * @deprecated Use useWalletContext() from '@/contexts/WalletContext' instead.
 * WalletContext is the single source of truth for wallet balance across the app.
 * It auto-refreshes on socket events and prevents redundant API calls.
 *
 * Migration:
 *   // Before
 *   const { data } = useWalletBalance();
 *
 *   // After
 *   const { rezBalance, totalBalance, walletData, refreshWallet } = useWalletContext();
 */
export function useWalletBalance() {
  // This hook is deprecated. Consumers should use useWalletContext() instead.
  // Kept for backwards compatibility during migration period.
  return useQuery({
    queryKey: queryKeys.wallet.balance(),
    queryFn: () => walletApi.getBalance(),
    staleTime: 30_000,
  });
}

/**
 * Get paginated wallet transactions.
 * WalletContext does not provide transaction history, so this hook makes independent API calls.
 */
export function useWalletTransactions(filters?: { page?: number; limit?: number; type?: string; source?: string }) {
  return useQuery({
    queryKey: queryKeys.wallet.transactions(filters),
    queryFn: () => walletApi.getTransactions(filters as unknown),
  });
}

/**
 * Get details for a specific transaction by ID.
 */
export function useWalletTransactionById(id: string) {
  return useQuery({
    queryKey: queryKeys.wallet.transactionDetail(id),
    queryFn: () => walletApi.getTransactionById(id),
    enabled: !!id,
  });
}

/**
 * Get wallet summary with analytics (spending insights, etc.).
 */
export function useWalletSummary(period?: string) {
  return useQuery({
    queryKey: queryKeys.wallet.summary(period),
    queryFn: () => walletApi.getSummary(period as unknown),
  });
}

/**
 * Get coins that are about to expire.
 */
export function useExpiringCoins() {
  return useQuery({
    queryKey: queryKeys.wallet.expiring(),
    queryFn: () => walletApi.getExpiringCoins(),
  });
}
