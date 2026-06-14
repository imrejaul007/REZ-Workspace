/**
 * Dashboard card registry types — Sprint -1a scaffold.
 *
 * The pattern: app/(dashboard)/index.tsx's return tree becomes a
 * `DASHBOARD_CARDS.filter(isVisible).map(render)` loop. Every card is a
 * small component in `components/dashboard/cards/` that receives its slice
 * of dashboard state via props.
 *
 * Data ownership stays in the shell (DashboardScreen) — cards are pure
 * presentation + local interactions. The shell fetches once and passes
 * slices down.
 */

import type { ComponentType } from 'react';

/** Current merchant mode — controls which cards are visible. */
export type MerchantMode = 'simple' | 'growth' | 'advanced';

/** Business vertical — some cards only apply to restaurants, salons, etc. */
export type BusinessVertical = 'restaurant' | 'salon' | 'hotel' | 'grocery' | 'general';

/**
 * Shared props every card accepts. Cards destructure only what they need;
 * most will ignore most of these. Centralising the interface keeps the
 * registry loop type-safe.
 *
 * NB: this is a *convenience*, not a contract — cards are free to declare
 * their own narrower prop type and cast in the registry entry. See
 * ErrorBannerCard for the narrow pattern and AnalyticsOverviewCard (future)
 * for the wide pattern.
 */
export interface DashboardCardProps {
  /** Loading state — the dashboard's initial fetch hasn't completed yet. */
  isLoading?: boolean;
  /** Fetch error — pass-through for banner cards to surface. */
  error?: string | null;
  /** Fired by pull-to-refresh — cards that own data refetch here. */
  onRefresh?: () => void;
}

/**
 * Registry entry. `component` renders unconditionally if visibility passes;
 * use the `isVisible` predicate for data-dependent gating (e.g. suspension
 * banners that only show when the store is suspended).
 */
export interface DashboardCardConfig {
  /** Stable ID for analytics + testing. Snake_case. */
  id: string;
  /** The React component to render. */
  component: ComponentType<DashboardCardProps>;
  /**
   * Modes in which this card appears. Absence = all modes.
   * Simple mode should include ~6-8 revenue-critical cards;
   * Growth adds retention/analytics; Advanced adds ops/compliance.
   */
  modes?: MerchantMode[];
  /** Verticals — absence = all verticals. */
  verticals?: BusinessVertical[];
  /**
   * Optional runtime predicate. Runs on every render — keep it fast.
   * Return false to skip rendering (e.g. suspension banners that only
   * render when the suspension flag is actually set).
   */
  isVisible?: (ctx: DashboardCardVisibilityContext) => boolean;
}

/** Context available to `isVisible` predicates. */
export interface DashboardCardVisibilityContext {
  mode: MerchantMode;
  vertical: BusinessVertical;
  merchantStatus?: string;
  storeActive?: boolean;
  storeSuspended?: boolean;
  hasError?: boolean;
}
