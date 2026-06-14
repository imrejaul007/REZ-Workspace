// @ts-nocheck
import { create, SetState, GetState } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSecureWalletStorage } from '@/utils/secureWalletStorage';
import { WalletData, CoinBalance } from '@/types/wallet';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// State types (mirrors WalletContext)
// ---------------------------------------------------------------------------
interface WalletStoreData {
  walletData: WalletData | null;
  rezBalance: number;
  totalBalance: number;
  availableBalance: number;
  brandedCoins: unknown[];
  savingsInsights: { totalSaved: number; thisMonth: number; avgPerVisit: number };
  refreshWallet: () => Promise<void>;
  rawBackendData: unknown | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  /** CD-CRIT-04 FIX: Stack of applied optimistic deltas — each has a matching rollback entry */
  pendingDeltaStack: number[];
}

export interface WalletStoreState extends WalletStoreData {
  _setFromProvider: (data: WalletStoreData) => void;
  /** Optimistic balance adjustment — adds delta to rez/total/available balances */
  adjustBalance: (delta: number) => void;
  /** Roll back the last optimistic adjustBalance delta. Call when API call fails. */
  rollbackAdjustment: () => void;
  /** Reset all wallet data on logout to prevent stale balance showing for next user */
  resetWallet: () => void;
}

// ---------------------------------------------------------------------------
// Default refreshWallet implementation
// ---------------------------------------------------------------------------
// NA-HIGH-12 FIX: Previously `refreshWallet` was a noop (`async () => {}`),
// so any code calling `useWalletStore.getState().refreshWallet()` silently
// did nothing when the WalletProvider wasn't mounted above the caller. That
// broke reward-popup, post-payment, and socket-event refresh paths whenever
// the zustand fallback path was taken. This default now actually hits the
// API and writes the balances back into the store.
//
// Dynamic import avoids a circular dependency: walletApi → apiClient → auth
// store → walletStore (persisted). A dynamic import defers resolution until
// the first call, by which time the module graph is fully initialised.
async function defaultRefreshWallet(
  set: (partial: Partial<WalletStoreData>) => void,
  get: () => WalletStoreState,
): Promise<void> {
  if (get().isRefreshing) return;
  try {
    set({ isRefreshing: true, error: null, pendingDeltaStack: [] });
    const { default: walletApi } = await import('@/services/walletApi');
    const response = await walletApi.getBalance();
    if (response.success && response.data) {
      const data = response.data;
      const rezCoin = Array.isArray(data.coins)
        ? data.coins.find((c: { type?: string }) => c?.type === 'rez')
        : undefined;
      const rezBalance =
        rezCoin?.amount ?? data.breakdown?.rezCoins?.amount ?? 0;
      const totalBalance =
        typeof data.totalValue === 'number' && data.totalValue > 0
          ? data.totalValue
          : (data.balance?.total ?? 0);
      const availableBalance = data.balance?.available ?? totalBalance;
      set({
        rezBalance,
        totalBalance,
        availableBalance,
        brandedCoins: Array.isArray(data.brandedCoins) ? data.brandedCoins : [],
        savingsInsights:
          data.savingsInsights ?? { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
        rawBackendData: data,
        error: null,
      });
    } else {
      set({ error: response.message || 'Failed to refresh wallet' });
    }
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger.error('[walletStore] refreshWallet failed', errorObj);
    set({ error: errorObj.message });
  } finally {
    set({ isRefreshing: false });
  }
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
// Placeholder — the real defaults (including a working refreshWallet bound to
// `set`/`get`) are built inside the create() callback below so the function
// can write back into the store.
const baseDefaults: Omit<WalletStoreData, 'refreshWallet'> = {
  walletData: null,
  rezBalance: 0,
  totalBalance: 0,
  availableBalance: 0,
  brandedCoins: [],
  savingsInsights: { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
  rawBackendData: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  pendingDeltaStack: [],
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
// CA-PAY-059 FIX: Wallet balance data is now persisted using an encrypted storage
// adapter.  On native: expo-secure-store (hardware-backed keychain/keystore).
// On native devices without SecureStore availability: XOR+base64 obfuscation in
// AsyncStorage as a fallback rather than plaintext.  On web: XOR+base64 obfuscation.
// Old plain-AsyncStorage data is migrated on first read.
type StoreSet = SetState<WalletStoreState>;
type StoreGet = GetState<WalletStoreState>;

export const useWalletStore = create<WalletStoreState>()(
  persist(
    (set: StoreSet, get: StoreGet) => ({
      ...baseDefaults,
      refreshWallet: () => defaultRefreshWallet(set, get),

      // Called by WalletProvider on every render to keep store in sync
      _setFromProvider: (data: WalletStoreData) => {
        set(data);
      },

      // Clears all persisted wallet data on logout.
      // Restores the default refreshWallet so a logged-out store still has
      // a working implementation when the next user logs in.
      resetWallet: () => set({
        ...baseDefaults,
        refreshWallet: () => defaultRefreshWallet(set, get),
        pendingDeltaStack: [],
      }),

      // Optimistic balance adjustment for instant UI feedback after earning coins.
      // CD-CRIT-SEC-04 FIX: Now tracks pendingDelta so callers can call rollbackAdjustment()
      // when the API call fails. Server truth is restored by refreshWallet() which overwrites
      // the optimistic value. Rollback is only needed if refreshWallet() fails or is never called.
      // CA-PAY-004 FIX: Already uses functional setState: set((state) => ...)
      adjustBalance: (delta: number) => {
        set((state: WalletStoreState): Partial<WalletStoreState> => {
          if (!state.walletData) return {};
          // NA-HIGH-04 FIX: floor balances at 0 to prevent negative display from race conditions
          const updatedCoins: CoinBalance[] = state.walletData.coins.map((c: CoinBalance) =>
            c.type === 'rez' ? { ...c, amount: Math.max(0, c.amount + delta) } : c
          );
          return {
            rezBalance: Math.max(0, state.rezBalance + delta),
            totalBalance: Math.max(0, state.totalBalance + delta),
            availableBalance: Math.max(0, state.availableBalance + delta),
            walletData: {
              ...state.walletData,
              totalBalance: Math.max(0, state.walletData.totalBalance + delta),
              availableBalance: Math.max(0, state.walletData.availableBalance + delta),
              coins: updatedCoins,
            },
            pendingDeltaStack: [...state.pendingDeltaStack, delta],
          };
        });
      },

      // Roll back the last optimistic adjustBalance call.
      // CD-CRIT-04 FIX: Pop from the stack so concurrent adjustBalance calls don't
      // incorrectly undo each other's deltas. Each adjustBalance has its own stack slot.
      rollbackAdjustment: () => {
        set((state: WalletStoreState): Partial<WalletStoreState> => {
          const stack = state.pendingDeltaStack;
          if (stack.length === 0 || !state.walletData) return { pendingDeltaStack: [] };
          const delta = stack[stack.length - 1];

          const updatedCoins: CoinBalance[] = state.walletData.coins.map((c: CoinBalance) =>
            c.type === 'rez' ? { ...c, amount: Math.max(0, c.amount - delta) } : c
          );
          return {
            rezBalance: Math.max(0, state.rezBalance - delta),
            totalBalance: Math.max(0, state.totalBalance - delta),
            availableBalance: Math.max(0, state.availableBalance - delta),
            walletData: {
              ...state.walletData,
              totalBalance: Math.max(0, state.walletData.totalBalance - delta),
              availableBalance: Math.max(0, state.walletData.availableBalance - delta),
              coins: updatedCoins,
            },
            pendingDeltaStack: stack.slice(0, -1),
          };
        });
      },

      // Fixed CA-AUT-024: Reset wallet store on logout to prevent cache poisoning
      reset: () => {
        set({
          walletData: null,
          rezBalance: 0,
          totalBalance: 0,
          availableBalance: 0,
          brandedCoins: [],
          savingsInsights: { totalSaved: 0, thisMonth: 0, avgPerVisit: 0 },
          refreshWallet: async () => {},
          rawBackendData: null,
          isLoading: false,
          isRefreshing: false,
          error: null,
          pendingDeltaStack: [],
        });
      },
    }),
    {
      name: 'rez-wallet-store', // Must match LEGACY_ASYNC_KEY in secureWalletStorage.ts
      storage: createJSONStorage(createSecureWalletStorage),
      partialize: (state: WalletStoreState) => ({
        // Only persist user data, not loading states or functions
        walletData: state.walletData,
        rezBalance: state.rezBalance,
        totalBalance: state.totalBalance,
        availableBalance: state.availableBalance,
        brandedCoins: state.brandedCoins,
        savingsInsights: state.savingsInsights,
        rawBackendData: state.rawBackendData,
      }),
    }
  )
);
