// @ts-nocheck
/**
 * Unit Tests for useHomepage hook
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHomepage } from '@/hooks/useHomepage';

// ── Mock dependencies ──────────────────────────────────────────────────────────

// Mock the batch query hook — useHomepage delegates to useHomepageBatch internally
jest.mock('@/hooks/queries/useHomepageData', () => ({
  useHomepageBatch: jest.fn(() => ({
    data: {
      events: { id: 'events', items: [], loading: false, error: null },
      justForYou: { id: 'just_for_you', items: [], loading: false, error: null },
      trendingStores: { id: 'trending_stores', items: [], loading: false, error: null },
      offers: { id: 'offers', items: [], loading: false, error: null },
      flashSales: { id: 'flash_sales', items: [], loading: false, error: null },
      newArrivals: { id: 'new_arrivals', items: [], loading: false, error: null },
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
}));

// Mock store selectors — useHomepageNavigation uses useCartActions
jest.mock('@/stores/selectors', () => ({
  useCartActions: jest.fn(() => ({
    addItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    updateQuantity: jest.fn(),
    clearCart: jest.fn(),
  })),
  useCurrentRegionId: jest.fn(() => 'in'),
  useAuthUser: jest.fn(() => ({ id: 'user-1', name: 'Test' })),
  useIsAuthenticated: jest.fn(() => true),
  useAuthLoading: jest.fn(() => false),
  useRefreshWallet: jest.fn(() => jest.fn()),
  useWalletData: jest.fn(() => null),
  useCartState: jest.fn(() => ({ items: [], totalPrice: 0 })),
  useCartItemCount: jest.fn(() => 0),
  useCurrency: jest.fn(() => 'inr'),
}));

// Mock ToastManager
jest.mock('@/components/common/ToastManager', () => ({
  showToast: jest.fn(),
}));

// Mock platformAlert
jest.mock('@/utils/platformAlert', () => ({
  platformAlertSimple: jest.fn(),
}));

// Mock haptics
jest.mock('@/utils/haptics', () => ({
  triggerImpact: jest.fn(),
}));

// Mock analytics service
jest.mock('@/services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn(),
    trackScreen: jest.fn(),
  },
}));

// Mock homepageDataService
jest.mock('@/services/homepageDataService', () => ({
  __esModule: true,
  default: {
    fetchAllSectionsWithBatch: jest.fn(() => Promise.resolve({})),
    getLastUserContext: jest.fn(() => ({ userId: 'user-1' })),
  },
  HomepageUserContext: {},
}));

// Mock queryClient
jest.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  },
}));

// Mock queryKeys
jest.mock('@/lib/queryKeys', () => ({
  queryKeys: {
    homepage: {
      all: ['homepage', 'all'],
      batch: (regionId: string) => ['homepage', 'batch', regionId],
    },
  },
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

describe('useHomepage', () => {
  it('should load homepage data', async () => {
    const { result } = renderHook(() => useHomepage(), { wrapper: createWrapper() });

    // state is loaded immediately because useHomepageBatch mock returns isLoading: false
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state).toBeDefined();
    expect(result.current.actions).toBeDefined();
    expect(result.current.getUserContext).toBeDefined();
  });

  it('should have refreshAllSections action', async () => {
    const { result } = renderHook(() => useHomepage(), { wrapper: createWrapper() });

    // refreshAllSections is available in actions
    expect(typeof result.current.actions.refreshAllSections).toBe('function');
  });

  it('should have refreshSection action', async () => {
    const { result } = renderHook(() => useHomepage(), { wrapper: createWrapper() });

    expect(typeof result.current.actions.refreshSection).toBe('function');
  });

  it('should return state with sections', async () => {
    const { result } = renderHook(() => useHomepage(), { wrapper: createWrapper() });

    expect(Array.isArray(result.current.state.sections)).toBe(true);
  });
});
