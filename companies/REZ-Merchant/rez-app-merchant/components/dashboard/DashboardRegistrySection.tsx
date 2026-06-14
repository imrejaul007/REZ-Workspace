/**
 * DashboardRegistrySection — the bridge between the registry (Phase F)
 * and the actual merchant dashboard shell.
 *
 * Reads the registry, filters by current merchant mode + vertical +
 * runtime state, fetches the data each card needs via TanStack Query,
 * and renders the visible cards in registry order.
 *
 * Placement
 * ─────────
 * Mount this at the TOP of the existing `app/(dashboard)/index.tsx`
 * return tree. Nothing in the inline tree is removed — this is
 * additive. A full shell rewrite to the registry loop is a follow-up
 * (Phase F stretch goal) and intentionally out of scope here.
 *
 * Feature flag
 * ────────────
 * `EXPO_PUBLIC_DASHBOARD_REGISTRY_ENABLED` — set to anything truthy
 * in EAS secrets / Vercel env to turn this section on. Default is off
 * so merchants don't suddenly see new cards without an explicit rollout.
 *
 * Per-card data
 * ─────────────
 * Each new phase card needs its own fetch. Those fetches live inline
 * here rather than being hoisted to the shell because:
 *   - We don't want to modify the shell in this commit.
 *   - Every card's fetch is independently gated by `enabled:` so
 *     merchants in Simple mode don't hit GrowthScore / CPA APIs they
 *     can't see.
 */

import React from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useMerchantMode } from '@/hooks/useMerchantMode';
import {
  DASHBOARD_CARDS,
  filterVisibleCards,
} from './cards/registry';
import type {
  BusinessVertical,
  DashboardCardVisibilityContext,
  MerchantMode,
} from './cards/types';

// Card-specific fetches.
import { fetchDailyActions } from '@/services/api/dailyActions';
import { fetchRoiSummary } from '@/services/api/roiSummary';
import { fetchGrowthScore } from '@/services/api/growthScore';
import { fetchCpaBilling } from '@/services/api/cpaBilling';

export interface DashboardRegistrySectionProps {
  /** Merchant's business vertical — resolved in the shell. Default
   *  'general' keeps vertical-only cards from showing. */
  vertical?: BusinessVertical;
  /** True when the shell's top-level fetch surfaced an error banner. */
  hasError?: boolean;
  /** True when the merchant's primary store is active. Undefined →
   *  treat as unknown; the registry's isVisible predicate falls back
   *  safely. */
  storeActive?: boolean;
  /** True when the store is in suspended state (compliance hold). */
  storeSuspended?: boolean;
}

/**
 * Registry-driven card rail. Additive — renders nothing when the
 * feature flag is off so legacy merchants see no change.
 */
export const DashboardRegistrySection: React.FC<DashboardRegistrySectionProps> = ({
  vertical = 'general',
  hasError = false,
  storeActive,
  storeSuspended = false,
}) => {
  const { mode } = useMerchantMode();

  // Master feature flag. Set EXPO_PUBLIC_DASHBOARD_REGISTRY_ENABLED=1
  // in the env to surface this section; off by default so ops owns
  // the rollout.
  const enabled = process.env.EXPO_PUBLIC_DASHBOARD_REGISTRY_ENABLED === '1';
  if (!enabled) return null;

  // Per-card data queries. `enabled` on each query skips the network
  // call when the card wouldn't be visible anyway — saves a round
  // trip per excluded card.
  const dailyActions = useQuery({
    queryKey: ['dashboard', 'daily-actions'],
    queryFn: fetchDailyActions,
    enabled: mode === 'growth' || mode === 'advanced',
    staleTime: 5 * 60 * 1000,
  });

  const roiSummary = useQuery({
    queryKey: ['dashboard', 'roi-summary'],
    queryFn: () => fetchRoiSummary(30),
    enabled: mode === 'growth' || mode === 'advanced',
    staleTime: 10 * 60 * 1000,
  });

  const growthScore = useQuery({
    queryKey: ['dashboard', 'growth-score'],
    queryFn: fetchGrowthScore,
    enabled: mode === 'growth' || mode === 'advanced',
    staleTime: 30 * 60 * 1000,
  });

  const cpaBilling = useQuery({
    queryKey: ['dashboard', 'cpa-billing'],
    queryFn: fetchCpaBilling,
    enabled: mode === 'advanced',
    staleTime: 5 * 60 * 1000,
  });

  const ctx: DashboardCardVisibilityContext = {
    mode: mode as MerchantMode,
    vertical,
    hasError,
    storeActive,
    storeSuspended,
  };

  const visible = filterVisibleCards(DASHBOARD_CARDS, ctx);

  return (
    <View testID="dashboard-registry-section">
      {visible.map((entry) => {
        const Component = entry.component as React.ComponentType<unknown>;

        // Route phase-card props to the right data source. Cards this
        // section doesn't own (already-external cards, banners) render
        // with no props — they'll fall back to their own data hooks or
        // show nothing if they need props we aren't passing.
        switch (entry.id) {
          case 'daily-actions':
            return (
              <Component
                key={entry.id}
                actions={dailyActions.data?.actions ?? []}
                day={dailyActions.data?.day ?? ''}
                stale={dailyActions.data?.stale ?? false}
              />
            );
          case 'roi-summary':
            return (
              <Component
                key={entry.id}
                summary={roiSummary.data?.data ?? null}
                isShadow={roiSummary.data?.mode === 'shadow'}
              />
            );
          case 'growth-score':
            return (
              <Component
                key={entry.id}
                total={growthScore.data?.total ?? null}
                breakdown={growthScore.data?.breakdown ?? null}
                stale={growthScore.data?.stale ?? false}
                isShadow={growthScore.data?.mode === 'shadow'}
              />
            );
          case 'cpa-billing':
            return (
              <Component
                key={entry.id}
                summary={cpaBilling.data?.data ?? null}
                isShadow={cpaBilling.data?.mode === 'shadow'}
              />
            );
          case 'quick-action-grid':
            return <Component key={entry.id} />;
          default:
            // Already-external cards + banners: let the registry render
            // them with default props. If a card needs data it'll pull
            // via its own hook or render null.
            return <Component key={entry.id} />;
        }
      })}
    </View>
  );
};

export default DashboardRegistrySection;
