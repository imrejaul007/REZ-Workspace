/**
 * dashboardCards.ts — Registry of all dashboard card components.
 *
 * Each card declares its visibility rules (vertical + mode + feature flag).
 * The dashboard loops over DASHBOARD_CARDS.filter(c => c.isVisible(merchantCtx))
 * to render only applicable cards.
 *
 * To add a new card:
 * 1. Create the component in @/components/dashboard/
 * 2. Add an entry here with visibility criteria
 * 3. Import and render it in app/(dashboard)/index.tsx using the registry
 */

import { BusinessVertical, MerchantMode } from '@/utils/verticalFeatures';

export interface DashboardCardContext {
  vertical: BusinessVertical;
  mode: MerchantMode;
  storeId?: string;
  isOnboarding?: boolean;
  /** True once the merchant has completed their first sale */
  hasFirstSale?: boolean;
}

export interface DashboardCard {
  /** Unique identifier — used as React key */
  id: string;
  /** Human-readable label for dev tools / debug UI */
  label: string;
  /**
   * Whether this card should be rendered for the given merchant context.
   * Return true to show, false to hide.
   */
  isVisible: (ctx: DashboardCardContext) => boolean;
  /**
   * Relative import path to the card component.
   * Must be a default export React component.
   */
  componentPath: string;
  /**
   * Cards with higher priority render first (top of dashboard).
   * Core revenue cards = 100, marketing = 80, analytics = 60, misc = 40.
   */
  priority: number;
}

export const DASHBOARD_CARDS: DashboardCard[] = [
  // ── Core Revenue ─────────────────────────────────────────────────────────────
  {
    id: 'today-revenue',
    label: 'Today Revenue',
    priority: 100,
    componentPath: '@/components/dashboard/TodayRevenueWidget',
    isVisible: () => true,
  },
  {
    id: 'rez-attribution',
    label: 'REZ Attribution',
    priority: 95,
    componentPath: '@/components/dashboard/REZAttributionCard',
    isVisible: (ctx) => ctx.hasFirstSale !== false,
  },

  // ── Growth Actions (Tier 1 feature) ────────────────────────────────────────
  {
    id: 'growth-actions',
    label: 'Daily Growth Actions',
    priority: 90,
    componentPath: '@/components/dashboard/GrowthActionsCard',
    isVisible: (ctx) =>
      (ctx.mode === 'growth' || ctx.mode === 'advanced') && ctx.vertical !== 'hotel',
  },

  // ── Reservations ────────────────────────────────────────────────────────────
  {
    id: 'rendez-bookings',
    label: 'Rendez Bookings',
    priority: 85,
    componentPath: '@/components/dashboard/RendezBookingsCard',
    isVisible: (ctx) => ctx.vertical === 'restaurant' || ctx.vertical === 'salon',
  },

  // ── REZ Now / QR ───────────────────────────────────────────────────────────
  {
    id: 'reznow-analytics',
    label: 'REZ Now Analytics',
    priority: 80,
    componentPath: '@/components/dashboard/RezNowAnalyticsCard',
    isVisible: (ctx) => ctx.vertical === 'restaurant' || ctx.vertical === 'grocery',
  },

  // ── Marketing & Campaigns ───────────────────────────────────────────────────
  {
    id: 'campaign-performance',
    label: 'Campaign Performance',
    priority: 75,
    componentPath: '@/components/dashboard/CampaignPerformanceCard',
    isVisible: (ctx) => ctx.mode === 'growth' || ctx.mode === 'advanced',
  },

  // ── Intelligence ────────────────────────────────────────────────────────────
  {
    id: 'demand-intelligence',
    label: 'Demand Intelligence',
    priority: 70,
    componentPath: '@/components/dashboard/DemandIntelligenceCard',
    isVisible: (ctx) =>
      (ctx.mode === 'growth' || ctx.mode === 'advanced') && ctx.vertical !== 'hotel',
  },
  {
    id: 'health-score',
    label: 'Merchant Health Score',
    priority: 65,
    componentPath: '@/components/dashboard/HealthScoreCard',
    isVisible: (ctx) => ctx.mode === 'advanced' && ctx.hasFirstSale === true,
  },

  // ── Budget / Cashflow ─────────────────────────────────────────────────────
  {
    id: 'budget-gauge',
    label: 'Budget Gauge',
    priority: 60,
    componentPath: '@/components/dashboard/BudgetGauge',
    isVisible: (ctx) => ctx.mode === 'advanced',
  },
  {
    id: 'cashback',
    label: 'Cashback Overview',
    priority: 55,
    componentPath: '@/components/dashboard/CashbackOverviewCard',
    isVisible: (ctx) =>
      (ctx.mode === 'growth' || ctx.mode === 'advanced') && ctx.vertical !== 'hotel',
  },
];

/**
 * Return cards sorted by priority (highest first) that are visible
 * for the given merchant context.
 */
export function getVisibleCards(ctx: DashboardCardContext): DashboardCard[] {
  return DASHBOARD_CARDS.filter((card) => {
    try {
      return card.isVisible(ctx);
    } catch {
      return false;
    }
  }).sort((a, b) => b.priority - a.priority);
}
