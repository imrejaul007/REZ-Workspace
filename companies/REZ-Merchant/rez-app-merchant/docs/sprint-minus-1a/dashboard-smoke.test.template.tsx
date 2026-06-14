/**
 * Dashboard split — smoke test template (Sprint -1a planning artifact).
 *
 * Purpose: a SINGLE "does the dashboard still mount and render every card
 * without throwing" check. This is the only test that must pass before
 * Sprint -1b is allowed to ship. Deeper per-card assertions come later.
 *
 * When Sprint -1b lands:
 *   1. Copy this file to `rez-app-merchant/__tests__/dashboard-smoke.test.tsx`
 *   2. Uncomment the active block.
 *   3. If `@testing-library/react-native` is not yet installed, run:
 *        npm install --save-dev @testing-library/react-native react-test-renderer
 *      (react-test-renderer must match the installed react version)
 *   4. Wire up the context mocks in `__mocks__/` that your auth/store/merchant
 *      providers expect. The names below assume the existing folder layout.
 *
 * This test intentionally does NOT assert on business data — only that the
 * render tree mounts cleanly. Any card that throws on mount with null/empty
 * data is a regression and blocks the PR.
 */

/* eslint-disable */
/* prettier-ignore */

// ---------------------------------------------------------------------------
// COMMENTED BLOCK — uncomment once @testing-library/react-native is installed
// and context mocks are wired up. Until then this file is a template only.
// ---------------------------------------------------------------------------

/*
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '@/app/(dashboard)';

// ---- Mock every network call the shell makes on mount ----
jest.mock('@/services/api/dashboard', () => ({
  dashboardService: {
    getAllDashboardData: jest.fn().mockResolvedValue({
      metrics: {
        totalRevenue: 0, monthlyRevenue: 0, revenueGrowth: 0,
        averageOrderValue: 0, totalOrders: 0, monthlyOrders: 0,
        ordersGrowth: 0, pendingOrders: 0, completedOrders: 0,
        totalProducts: 0, activeProducts: 0, lowStockProducts: 0,
        totalCustomers: 0, monthlyCustomers: 0, customerGrowth: 0,
        totalCashbackPaid: 0, pendingCashback: 0, profitMargin: 0,
      },
      overview: { quickStats: {}, recentActivity: { orders: [], products: [] } },
    }),
    getCustomerPayments:         jest.fn().mockResolvedValue({ payments: [] }),
    getStorePerformance:         jest.fn().mockResolvedValue({ stores: [] }),
    getActionItems:              jest.fn().mockResolvedValue({ actionItems: [] }),
    getTodayRevenueSummary:      jest.fn().mockResolvedValue(null),
    getTopItemsToday:            jest.fn().mockResolvedValue([]),
    getCampaignPerformance:      jest.fn().mockResolvedValue([]),
    getCustomerRetentionMetrics: jest.fn().mockResolvedValue(null),
    getBasketSizeTrend:          jest.fn().mockResolvedValue(null),
    getHealthScore:              jest.fn().mockResolvedValue(null),
    getCampaignRecommendations:  jest.fn().mockResolvedValue([]),
  },
}));

// ---- Mock contexts (minimal shape — grow as needed) ----
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    state: {
      role: 'merchant',
      user: { name: 'Test Merchant' },
      merchant: { businessName: 'Test Biz' },
    },
  }),
}));

jest.mock('@/contexts/MerchantContext', () => ({
  useMerchant: () => ({ state: {}, loadAnalytics: jest.fn() }),
}));

jest.mock('@/contexts/StoreContext', () => ({
  useStore: () => ({
    activeStore: { _id: 'store-1', name: 'Test Store', isActive: true, isSuspended: false },
  }),
}));

jest.mock('@/contexts/NotificationContext', () => ({
  useNotificationContext: () => ({ unreadCount: 0 }),
}));

jest.mock('@/hooks/useRealTimeUpdates', () => ({
  useDashboardRealTime: () => ({ isConnected: true, lastUpdate: null, dashboardData: null }),
}));

jest.mock('@/utils/storeReview', () => ({
  maybeRequestReview: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

describe('DashboardScreen smoke test', () => {
  it('mounts and renders every registered card without throwing', async () => {
    const tree = render(<DashboardScreen />);

    // Wait for the async fetchDashboardData() to resolve and render pass 2 to commit.
    await waitFor(() => {
      expect(tree.toJSON()).not.toBeNull();
    });

    // If any card throws on mount with zeroed data, the render above rejects
    // and Jest fails this assertion. No deeper assertions — this is the
    // config-level "every card in DASHBOARD_CARDS can render with nullish data"
    // guarantee, which is the ONE property we need before Sprint -1b ships.
  });
});
*/

// ---------------------------------------------------------------------------
// TEMPORARY PLACEHOLDER — keep Jest happy if this file is picked up by the
// test runner before the block above is uncommented. Delete once active.
// ---------------------------------------------------------------------------
describe.skip('dashboard-smoke (template — not yet active)', () => {
  it('is a template placeholder; uncomment the real test in Sprint -1b', () => {
    expect(true).toBe(true);
  });
});

export {};
