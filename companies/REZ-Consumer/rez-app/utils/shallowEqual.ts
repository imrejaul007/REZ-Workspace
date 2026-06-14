// @ts-nocheck
/**
 * shallowEqual - Optimized shallow equality comparison for React selectors
 *
 * PRODUCTION-READY: Used by useZustandSelector to prevent unnecessary re-renders
 */

/**
 * Check if two values are shallowly equal
 */
export function shallowEqual<T extends object>(objA: T, objB: T): boolean {
  // Handle identical references
  if (objA === objB) {
    return true;
  }

  // Handle null/undefined
  if (objA == null || objB == null) {
    return false;
  }

  // Get own keys for both objects
  const keysA = Object.keys(objA) as Array<keyof T>;
  const keysB = Object.keys(objB) as Array<keyof T>;

  // Different number of keys means not equal
  if (keysA.length !== keysB.length) {
    return false;
  }

  // Check each key
  for (const key of keysA) {
    const valA = objA[key];
    const valB = objB[key];

    // Check reference equality first (fast path)
    if (valA === valB) {
      continue;
    }

    // Handle NaN
    if (typeof valA === 'number' && typeof valB === 'number' && isNaN(valA) && isNaN(valB)) {
      continue;
    }

    // Values are not equal
    return false;
  }

  return true;
}

/**
 * Create a useSelector-like hook with custom equality function
 */
import { useSyncExternalStore, useRef, useCallback } from 'react';

export interface UseSelectorOptions<TSelected> {
  equalityFn?: (a: TSelected, b: TSelected) => boolean;
  fireImmediately?: boolean;
}

/**
 * Optimized selector hook for external stores
 * Uses shallow equality by default to prevent unnecessary re-renders
 */
export function useSelector<TState, TSelected>(
  store: {
    getState: () => TState;
    subscribe: (listener: (state: TState, prevState: TState) => void) => () => void;
  },
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean = shallowEqual
): TSelected {
  const latestSelectedState = useRef<TSelected>();
  const latestStoreState = useRef<TState>();

  // Get the store state
  const storeState = useSyncExternalStore(
    useCallback(
      (callback: () => void) => {
        return store.subscribe((state, prevState) => {
          // Only notify if selected values might have changed
          const newSelected = selector(state);
          const prevSelected = latestSelectedState.current;

          if (!equalityFn(prevSelected, newSelected)) {
            latestSelectedState.current = newSelected;
            callback();
          }

          latestStoreState.current = state;
        });
      },
      [store, selector, equalityFn]
    ),
    () => store.getState()
  );

  // Get the selected value
  const newSelectedState = selector(storeState);

  // Update ref if changed
  if (!equalityFn(latestSelectedState.current, newSelectedState)) {
    latestSelectedState.current = newSelectedState;
  }

  return latestSelectedState.current as TSelected;
}

/**
 * useStore - Hook to access store without selector (subscribes to entire store)
 * Use sparingly - prefer useSelector for performance
 */
export function useStore<TState>(
  store: {
    getState: () => TState;
    subscribe: (listener: (state: TState, prevState: TState) => void) => () => void;
  }
): TState {
  return useSyncExternalStore(
    (callback) => store.subscribe(callback),
    () => store.getState()
  );
}

export default shallowEqual;
