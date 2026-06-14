// @ts-nocheck
/**
 * HomeTabContext
 *
 * Thin re-export layer over homeTabStore (Zustand).
 * HomeTabProvider was removed from the provider tree — all state now lives in Zustand.
 * This file preserves the `useHomeTab()` export for backward compatibility.
 *
 * Tab configurations:
 * - near-u (default): Rewards Near You - local offers, everyday savings
 * - mall: REZ Mall - curated brands, premium shopping
 * - cash: Cash Store - cashback focus, money-back deals
 * - prive: Privé - exclusive, reputation-based access (6-pillar system)
 */

import React from 'react';
import { useHomeTabStore } from '@/stores/homeTabStore';

// Legacy type alias for backward compatibility
export type HomeTabId = 'rez' | 'rez-mall' | 'cash-store';

/**
 * Hook to access tab state.
 * Delegates directly to Zustand homeTabStore.
 */
export const useHomeTab = () => {
  return useHomeTabStore();
};

/**
 * @deprecated HomeTabProvider is no longer used — state lives in homeTabStore.
 * Kept as a passthrough for test compatibility.
 * H-9 FIX: Replaced unknown implicit throw-on-use pattern with an explicit DEV warning
 * so callers are informed during development without crashing production.
 */
export const HomeTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (__DEV__) {
    logger.warn(
      '[HomeTabProvider] This component is deprecated and will be removed in a future release. ' +
      'Remove <HomeTabProvider> from your tree — state is now managed by homeTabStore (Zustand).'
    );
  }
  return <>{children}</>;
};
