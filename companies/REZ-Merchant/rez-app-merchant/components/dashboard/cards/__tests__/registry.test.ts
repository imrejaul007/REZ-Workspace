/**
 * Unit tests for the dashboard card registry.
 *
 * We mock every card import to a stub so the registry module loads
 * without dragging in React Native internals. What we're verifying is
 * the filtering logic, the mode/vertical predicates, and the
 * registry's stability — NOT the cards themselves.
 */

// Stub every card component so the registry can import them without
// bringing in RN / expo-router transitive deps in unit-test land.
const stub = () => null;
jest.mock('../ErrorBannerCard', () => ({ __esModule: true, default: stub }));
jest.mock('../StoreSuspensionBanner', () => ({ __esModule: true, default: stub }));
jest.mock('../StoreInactiveBanner', () => ({ __esModule: true, default: stub }));
jest.mock('../StoreHealthScoreCard', () => ({ __esModule: true, default: stub }));
jest.mock('../TopItemsTodayCard', () => ({ __esModule: true, default: stub }));
jest.mock('../CustomerReturnRateCard', () => ({ __esModule: true, default: stub }));
jest.mock('../BasketSizeTrendCard', () => ({ __esModule: true, default: stub }));
jest.mock('../DailyActionsCard', () => ({ __esModule: true, default: stub }));
jest.mock('../QuickActionGridCard', () => ({ __esModule: true, default: stub }));
jest.mock('../RoiSummaryCard', () => ({ __esModule: true, default: stub }));
jest.mock('../GrowthScoreCard', () => ({ __esModule: true, default: stub }));
jest.mock('../CpaBillingCard', () => ({ __esModule: true, default: stub }));

jest.mock('../../GrowthActionsCard', () => ({ __esModule: true, default: stub }));
jest.mock('../../DemandIntelligenceCard', () => ({ __esModule: true, default: stub }));
jest.mock('../../REZAttributionCard', () => ({ __esModule: true, default: stub }));
jest.mock('../../RendezBookingsCard', () => ({ __esModule: true, default: stub }));
jest.mock('../../RezNowAnalyticsCard', () => ({ __esModule: true, default: stub }));
jest.mock('../../TodayRevenueWidget', () => ({ __esModule: true, default: stub }));
jest.mock('../../DailyCommandBar', () => ({ __esModule: true, default: stub }));
jest.mock('../../BudgetGauge', () => ({ __esModule: true, default: stub }));

import { DASHBOARD_CARDS, filterVisibleCards, findCardById } from '../registry';
import type { DashboardCardVisibilityContext } from '../types';

// Baseline context — clean run with no errors, active store.
const BASE_CTX = (overrides: Partial<DashboardCardVisibilityContext> = {}): DashboardCardVisibilityContext => ({
  mode: 'simple',
  vertical: 'restaurant',
  hasError: false,
  storeActive: true,
  storeSuspended: false,
  ...overrides,
});

describe('DASHBOARD_CARDS', () => {
  it('has a stable set of registered cards', () => {
    expect(DASHBOARD_CARDS.length).toBeGreaterThan(10);
  });

  it('every entry has a unique id', () => {
    const ids = DASHBOARD_CARDS.map((c) => c.id);
    const set = new Set(ids);
    expect(set.size).toBe(ids.length);
  });

  it('every entry has a component', () => {
    for (const c of DASHBOARD_CARDS) {
      expect(c.component).toBeDefined();
    }
  });
});

describe('filterVisibleCards — mode filter', () => {
  it('Simple mode excludes Growth+Advanced-only cards', () => {
    const simple = filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ mode: 'simple' }));
    const ids = simple.map((c) => c.id);
    // Growth+ card that should NOT appear in Simple:
    expect(ids).not.toContain('daily-actions');
    expect(ids).not.toContain('top-items-today');
    expect(ids).not.toContain('demand-intelligence');
  });

  it('Growth mode includes the growth-tier cards but not advanced-only', () => {
    const growth = filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ mode: 'growth' }));
    const ids = growth.map((c) => c.id);
    expect(ids).toContain('daily-actions');
    expect(ids).toContain('top-items-today');
    expect(ids).toContain('customer-return-rate');
    expect(ids).not.toContain('demand-intelligence');
    expect(ids).not.toContain('rez-attribution');
    expect(ids).not.toContain('daily-command-bar');
  });

  it('Advanced mode includes everything Growth has + advanced-only cards', () => {
    const advanced = filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ mode: 'advanced' }));
    const ids = advanced.map((c) => c.id);
    expect(ids).toContain('daily-actions');
    expect(ids).toContain('demand-intelligence');
    expect(ids).toContain('rez-attribution');
    expect(ids).toContain('daily-command-bar');
    expect(ids).toContain('reznow-analytics');
    expect(ids).toContain('cpa-billing'); // Phase J
  });

  it('CPA billing is hidden from Growth mode', () => {
    const growth = filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ mode: 'growth' }));
    expect(growth.map((c) => c.id)).not.toContain('cpa-billing');
  });
});

describe('filterVisibleCards — vertical filter', () => {
  it('excludes rendez-bookings for grocery verticals', () => {
    const grocery = filterVisibleCards(
      DASHBOARD_CARDS,
      BASE_CTX({ mode: 'growth', vertical: 'grocery' }),
    );
    expect(grocery.map((c) => c.id)).not.toContain('rendez-bookings');
  });

  it('includes rendez-bookings for hotel vertical in growth mode', () => {
    const hotel = filterVisibleCards(
      DASHBOARD_CARDS,
      BASE_CTX({ mode: 'growth', vertical: 'hotel' }),
    );
    expect(hotel.map((c) => c.id)).toContain('rendez-bookings');
  });

  it('includes rendez-bookings for restaurant vertical', () => {
    const r = filterVisibleCards(
      DASHBOARD_CARDS,
      BASE_CTX({ mode: 'growth', vertical: 'restaurant' }),
    );
    expect(r.map((c) => c.id)).toContain('rendez-bookings');
  });
});

describe('filterVisibleCards — isVisible predicates', () => {
  it('hides error banner when hasError=false', () => {
    const ids = filterVisibleCards(DASHBOARD_CARDS, BASE_CTX()).map((c) => c.id);
    expect(ids).not.toContain('error-banner');
  });

  it('shows error banner when hasError=true', () => {
    const ids = filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ hasError: true })).map((c) => c.id);
    expect(ids).toContain('error-banner');
  });

  it('shows store-suspension-banner only when storeSuspended=true', () => {
    expect(
      filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ storeSuspended: false })).map((c) => c.id),
    ).not.toContain('store-suspension-banner');
    expect(
      filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ storeSuspended: true })).map((c) => c.id),
    ).toContain('store-suspension-banner');
  });

  it('shows store-inactive-banner only when storeActive is explicitly false', () => {
    expect(
      filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ storeActive: true })).map((c) => c.id),
    ).not.toContain('store-inactive-banner');
    expect(
      filterVisibleCards(DASHBOARD_CARDS, BASE_CTX({ storeActive: false })).map((c) => c.id),
    ).toContain('store-inactive-banner');
  });
});

describe('filterVisibleCards — ordering', () => {
  it('preserves registry order in the output', () => {
    const ctx = BASE_CTX({ mode: 'advanced', hasError: true, storeSuspended: true });
    const visible = filterVisibleCards(DASHBOARD_CARDS, ctx);
    const visibleIds = visible.map((c) => c.id);
    const registryIds = DASHBOARD_CARDS.map((c) => c.id);
    // Check visible is a subsequence of the registry.
    let regIdx = 0;
    for (const id of visibleIds) {
      const found = registryIds.indexOf(id, regIdx);
      expect(found).toBeGreaterThanOrEqual(regIdx);
      regIdx = found + 1;
    }
  });
});

describe('findCardById', () => {
  it('returns the entry for a known id', () => {
    const entry = findCardById('daily-actions');
    expect(entry).toBeDefined();
    expect(entry?.id).toBe('daily-actions');
  });

  it('returns undefined for an unknown id', () => {
    expect(findCardById('not-a-real-card')).toBeUndefined();
  });
});
