/**
 * Aggregated store selector index.
 *
 * Each per-store selector file lives next to this one. Splitting the original
 * monolithic `stores/selectors.ts` into one file per store (NA-HIGH-24) means a
 * circular import in unknown single store only breaks that store's selectors, not
 * every screen that uses unknown selector.
 *
 * Back-compat: `stores/selectors.ts` re-exports everything from this index so
 * the 200+ existing call sites (`from '@/stores/selectors'`) continue to work
 * unchanged.
 */

export * from './auth';
export * from './wallet';
export * from './cart';
export * from './region';
export * from './homeTab';
export * from './theme';
export * from './gamification';
export * from './subscription';
export * from './wishlist';
export * from './profile';
