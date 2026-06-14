/**
 * Dashboard Card Registry — Sprint -1b / Phase F.
 *
 * The single source of truth for "which cards render on the dashboard,
 * in what order, for which merchant modes + verticals". Consumed by the
 * registry-driven DashboardScreen:
 *
 *   const visible = filterVisibleCards(DASHBOARD_CARDS, ctx);
 *   return <>{visible.map(c => <c.component {...props} />)}</>
 *
 * Why a registry, not inline JSX
 * ──────────────────────────────
 *  - DashboardScreen currently lives in app/(dashboard)/index.tsx at
 *    3,300+ lines; most of that is JSX for 26 different cards. A
 *    registry lets us move the visibility rules OUT of the return tree
 *    and into declarative entries, which makes Simple / Growth /
 *    Advanced mode + vertical filtering trivially testable.
 *  - Adding a new card is a 3-line diff here (import + entry) rather
 *    than a needle-in-haystack edit to a 3k-line file.
 *  - The `isVisible` predicate lets data-dependent cards (suspension
 *    banners, error banners, inactive-store banners) declare their
 *    conditions next to their component, not inside a sprawling shell.
 *
 * Extraction status
 * ─────────────────
 * Not every card in the dashboard is extracted yet — see
 * components/dashboard/cards/README.md for the current state. This
 * registry registers both:
 *   (a) Extracted cards from components/dashboard/cards/
 *   (b) Already-external cards from components/dashboard/*
 * Cards still inline in app/(dashboard)/index.tsx are NOT yet in the
 * registry; they'll be added as each extraction lands.
 *
 * Mode + vertical contract
 * ────────────────────────
 *   - `modes` undefined → every mode
 *   - `verticals` undefined → every vertical
 *   - Both arrays use enum values from `./types.ts`.
 *   - `isVisible` is the runtime predicate for data-dependent gating;
 *     it's evaluated on every render so keep it cheap.
 */

import type { ComponentType } from 'react';

import type {
  DashboardCardConfig,
  DashboardCardVisibilityContext,
  MerchantMode,
  BusinessVertical,
} from './types';

// Extracted cards (live in this directory).
import ErrorBannerCard from './ErrorBannerCard';
import StoreSuspensionBanner from './StoreSuspensionBanner';
import StoreInactiveBanner from './StoreInactiveBanner';
import StoreHealthScoreCard from './StoreHealthScoreCard';
import TopItemsTodayCard from './TopItemsTodayCard';
import CustomerReturnRateCard from './CustomerReturnRateCard';
import BasketSizeTrendCard from './BasketSizeTrendCard';
import DailyActionsCard from './DailyActionsCard';
import QuickActionGridCard from './QuickActionGridCard';
import RoiSummaryCard from './RoiSummaryCard';
import GrowthScoreCard from './GrowthScoreCard';
import CpaBillingCard from './CpaBillingCard';

// Already-external cards (live in components/dashboard/).
import GrowthActionsCard from '../GrowthActionsCard';
import DemandIntelligenceCard from '../DemandIntelligenceCard';
import REZAttributionCard from '../REZAttributionCard';
import RendezBookingsCard from '../RendezBookingsCard';
import RezNowAnalyticsCard from '../RezNowAnalyticsCard';
import TodayRevenueWidget from '../TodayRevenueWidget';
import DailyCommandBar from '../DailyCommandBar';
import BudgetGauge from '../BudgetGauge';

// ─── Canonical mode buckets ──────────────────────────────────────────────────

const SIMPLE_ONLY: MerchantMode[] = ['simple'];
const GROWTH_AND_UP: MerchantMode[] = ['growth', 'advanced'];
const ADVANCED_ONLY: MerchantMode[] = ['advanced'];
const ALL_MODES: MerchantMode[] = ['simple', 'growth', 'advanced'];

// ─── Registry ────────────────────────────────────────────────────────────────
//
// Order here = vertical order on the dashboard. Keep high-priority
// attention surfaces (error / suspension banners) at the top, then
// the "what should I do today" row, then metrics + analytics.
// Changing order changes the visual order — code review accordingly.

export const DASHBOARD_CARDS: readonly DashboardCardConfig[] = [
  // 1. Error banner — always top, data-gated.
  {
    id: 'error-banner',
    component: ErrorBannerCard as ComponentType,
    modes: ALL_MODES,
    isVisible: (ctx) => !!ctx.hasError,
  },
  // 2. Store suspension banner — compliance surface, always top.
  {
    id: 'store-suspension-banner',
    component: StoreSuspensionBanner as ComponentType,
    modes: ALL_MODES,
    isVisible: (ctx) => !!ctx.storeSuspended,
  },
  // 3. Store inactive banner — self-heal prompt.
  {
    id: 'store-inactive-banner',
    component: StoreInactiveBanner as ComponentType,
    modes: ALL_MODES,
    isVisible: (ctx) => ctx.storeActive === false,
  },

  // 4. Daily Actions — Phase E. The "what should I do today" hero card.
  //    Hidden in Simple mode until Growth-Engine rollout is fully baked;
  //    at that point move to ALL_MODES.
  {
    id: 'daily-actions',
    component: DailyActionsCard as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 5. Growth Actions — already-external card.
  {
    id: 'growth-actions',
    component: GrowthActionsCard as unknown as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 6. Today's revenue widget — all modes; cheap top-of-fold metric.
  {
    id: 'today-revenue',
    component: TodayRevenueWidget as unknown as ComponentType,
    modes: ALL_MODES,
  },

  // 6b. Phase G — ROI summary (last 30 days). Growth + advanced.
  //     Compares ₹ spent on the platform vs ₹ earned attributable to it.
  {
    id: 'roi-summary',
    component: RoiSummaryCard as unknown as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 6c. Phase H — Growth score (0-100 daily snapshot). Growth + advanced.
  //     Single-number health; sub-scores in the card expand on tap.
  {
    id: 'growth-score',
    component: GrowthScoreCard as unknown as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 6d. Phase J — CPA (performance-pricing) monthly summary. Advanced
  //     only for now — while the pricing model is opt-in we don't want
  //     to surface it to simple/growth merchants who aren't on it.
  {
    id: 'cpa-billing',
    component: CpaBillingCard as unknown as ComponentType,
    modes: ADVANCED_ONLY,
  },

  // 7. Store health score — surfaced in Growth and Advanced.
  {
    id: 'store-health-score',
    component: StoreHealthScoreCard as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 8. Quick action grid — pastel tiles to common actions. All modes;
  //    the inner items array can be overridden per-mode by the shell.
  {
    id: 'quick-action-grid',
    component: QuickActionGridCard as unknown as ComponentType,
    modes: ALL_MODES,
  },

  // 9. Command bar — external card. Advanced only to keep the Simple
  //    mode view clean.
  {
    id: 'daily-command-bar',
    component: DailyCommandBar as unknown as ComponentType,
    modes: ADVANCED_ONLY,
  },

  // 10. Top items today — small; growth + advanced.
  {
    id: 'top-items-today',
    component: TopItemsTodayCard as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 11. Customer return rate — retention insight. Growth + advanced.
  {
    id: 'customer-return-rate',
    component: CustomerReturnRateCard as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 12. Basket-size trend — AOV insight. Growth + advanced.
  {
    id: 'basket-size-trend',
    component: BasketSizeTrendCard as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 13. Demand intelligence — advanced ops view. Advanced only.
  {
    id: 'demand-intelligence',
    component: DemandIntelligenceCard as unknown as ComponentType,
    modes: ADVANCED_ONLY,
  },

  // 14. Budget gauge — ad-spend health. Growth + advanced.
  {
    id: 'budget-gauge',
    component: BudgetGauge as unknown as ComponentType,
    modes: GROWTH_AND_UP,
  },

  // 15. REZ attribution card — advanced reporting.
  {
    id: 'rez-attribution',
    component: REZAttributionCard as unknown as ComponentType,
    modes: ADVANCED_ONLY,
  },

  // 16. Rendez bookings card — hotel + restaurant vertical only.
  {
    id: 'rendez-bookings',
    component: RendezBookingsCard as unknown as ComponentType,
    modes: GROWTH_AND_UP,
    verticals: ['hotel', 'restaurant'] as BusinessVertical[],
  },

  // 17. RezNow analytics — all verticals; advanced mode only.
  {
    id: 'reznow-analytics',
    component: RezNowAnalyticsCard as unknown as ComponentType,
    modes: ADVANCED_ONLY,
  },

  // Cards 18-26 still inline in app/(dashboard)/index.tsx — registered
  // as they land (see README for current state + the extraction plan).
] as const;

// ─── Visibility filter ──────────────────────────────────────────────────────

/**
 * Return the subset of the registry visible for a given context.
 * Pure function — no side effects, no component instantiation.
 */
export function filterVisibleCards(
  cards: readonly DashboardCardConfig[],
  ctx: DashboardCardVisibilityContext,
): readonly DashboardCardConfig[] {
  return cards.filter((card) => {
    if (card.modes && !card.modes.includes(ctx.mode)) return false;
    if (card.verticals && !card.verticals.includes(ctx.vertical)) return false;
    if (card.isVisible && !card.isVisible(ctx)) return false;
    return true;
  });
}

/**
 * Convenience lookup — returns the registry entry with the given id,
 * or undefined. Used by tests + analytics hooks that want to attach
 * impression tracking to specific cards.
 */
export function findCardById(id: string): DashboardCardConfig | undefined {
  return DASHBOARD_CARDS.find((c) => c.id === id);
}
