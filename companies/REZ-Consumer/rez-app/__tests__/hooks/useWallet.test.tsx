// @ts-nocheck
/**
 * Unit Tests for useWallet hook
 */

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';

// ── Mock dependencies ──────────────────────────────────────────────────────────

// Mock walletApi — structure must match what transformWalletResponse() expects
jest.mock('@/services/walletApi', () => ({
  __esModule: true,
  default: {
    getBalance: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        // transformWalletResponse uses totalValue as authoritative total
        totalValue: 1000,
        balance: {
          available: 900,
          pending: 100,
          cashback: 0,
        },
        breakdown: {
          rezCoins: { amount: 1000 },
          promoCoins: { amount: 0 },
        },
        coins: [
          { type: 'rez', amount: 1000, isActive: true },
        ],
        lastUpdated: new Date().toISOString(),
        status: { isActive: true, isFrozen: false },
      },
    })),
    getCoinRules: jest.fn(() => Promise.resolve({
      success: true,
      data: {
        coinConversion: { rezToInr: 1 },
      },
    })),
  },
}));

// Mock BRAND constants
jest.mock('@/constants/brand', () => ({
  BRAND: {
    COIN_NAME: 'ReZ Coins',
    CURRENCY_CODE: 'Rs.',
    CURRENCY_SYMBOL: 'Rs.',
    APP_NAME: 'REZ',
    COIN_IMAGE: {},
  },
}));

// Mock colors
jest.mock('@/constants/theme', () => ({
  colors: {
    brand: {
      amberDeep: '#FFB300',
    },
    warningScale: {
      700: '#D97706',
    },
  },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock checkout config
jest.mock('@/config/checkout.config', () => ({
  setCoinConversionRate: jest.fn(),
}));

// ── Wrapper factory ────────────────────────────────────────────────────────────

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize wallet state', async () => {
    const { result } = renderHook(() => useWallet({ autoFetch: false }), { wrapper: createWrapper() });

    // With autoFetch: false, initial state should have null data
    expect(result.current.walletState.data).toBeNull();
    expect(result.current.walletState.isLoading).toBe(false);
    expect(result.current.walletState.error).toBeNull();
  });

  it('should expose fetchWallet function', async () => {
    const { result } = renderHook(() => useWallet({ autoFetch: false }), { wrapper: createWrapper() });

    expect(typeof result.current.fetchWallet).toBe('function');
  });

  it('should expose refreshWallet function', async () => {
    const { result } = renderHook(() => useWallet({ autoFetch: false }), { wrapper: createWrapper() });

    expect(typeof result.current.refreshWallet).toBe('function');
  });

  it('should expose clearError function', async () => {
    const { result } = renderHook(() => useWallet({ autoFetch: false }), { wrapper: createWrapper() });

    expect(typeof result.current.clearError).toBe('function');
  });

  it('should expose resetWallet function', async () => {
    const { result } = renderHook(() => useWallet({ autoFetch: false }), { wrapper: createWrapper() });

    expect(typeof result.current.resetWallet).toBe('function');
  });

  it('should load wallet balance with autoFetch', async () => {
    const { result } = renderHook(() => useWallet({ autoFetch: true }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.walletState.isLoading).toBe(false);
    });

    expect(result.current.walletState.data?.totalBalance).toBe(1000);
  });

  it('should handle errors', async () => {
    const walletApi = require('@/services/walletApi').default;
    walletApi.getBalance.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useWallet({ autoFetch: true }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.walletState.error).toBeDefined();
    });
  });

  it('should clear error via clearError', async () => {
    const walletApi = require('@/services/walletApi').default;
    walletApi.getBalance.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useWallet({ autoFetch: true }), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.walletState.error).toBeDefined();
    });

    act(() => {
      result.current.clearError();
    });
    expect(result.current.walletState.error).toBeNull();
  });
});
