/**
 * Region store selectors — 426 imports (most used).
 */

import { useRegionStore } from '../regionStore';

/** Only re-renders when region ID changes */
export const useCurrentRegionId = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.currentRegion);

/** Only re-renders when currency changes */
export const useCurrency = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.currency);

/** Stable function — never re-renders */
export const useGetCurrencySymbol = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.getCurrencySymbol);

/** Stable function — never re-renders */
export const useFormatPrice = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.formatPrice);

/** Stable function — never re-renders */
export const useGetLocale = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.getLocale);

/** Stable function — never re-renders */
export const useGetCurrency = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.getCurrency);

/** Stable function — never re-renders */
export const useSetRegion = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.setRegion);

/** Only re-renders when region state changes */
export const useRegionState = () => useRegionStore((s: ReturnType<typeof useRegionStore.getState>) => s.state);
