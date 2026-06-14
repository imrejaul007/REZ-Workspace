/**
 * useZustandSelector - Memory-optimized Zustand selector hook
 *
 * PRODUCTION-READY: Prevents unnecessary re-renders with shallow comparison
 *
 * @example
 * ```tsx
 * // BAD: Re-renders on ANY store change
 * const { user, cart } = useAuthStore();
 *
 * // GOOD: Only re-renders when user or cart changes
 * const user = useZustandSelector(useAuthStore, state => state.user);
 * const cart = useZustandSelector(useAuthStore, state => state.cart);
 * ```
 */

import { useSelector, UseSelectorOptions } from '../utils/shallowEqual';

/**
 * Type-safe selector hook for Zustand stores
 * Uses shallow equality check to prevent unnecessary re-renders
 *
 * @param store - The Zustand store to select from
 * @param selector - Function that returns the selected value
 * @param equalityFn - Optional custom equality function
 */
export function useZustandSelector<TState, TSelected>(
  store: { getState: () => TState; subscribe: (listener: (state: TState, prevState: TState) => void) => () => void },
  selector: (state: TState) => TSelected,
  equalityFn?: (a: TSelected, b: TSelected) => boolean
): TSelected {
  return useSelector(store, selector, equalityFn);
}

/**
 * Hook to get multiple values from a store with minimal re-renders
 *
 * @example
 * ```tsx
 * const { user, token, isAuthenticated } = useMultiSelector(useAuthStore, [
 *   state => state.user,
 *   state => state.token,
 *   state => state.isAuthenticated,
 * ]);
 * ```
 */
export function useMultiZustandSelector<TState, TSelected>(
  store: { getState: () => TState; subscribe: (listener: (state: TState, prevState: TState) => void) => () => void },
  selectors: Array<(state: TState) => TSelected>
): TSelected[] {
  return selectors.map((selector) => useZustandSelector(store, selector));
}

/**
 * Hook for actions-only access (never causes re-renders)
 *
 * @example
 * ```tsx
 * const { login, logout } = useAuthActions(useAuthStore);
 * ```
 */
export function useZustandActions<TState, TActions>(
  store: { getState: () => TState; actions: TActions },
  actionsSelector?: (state: TState & { actions: TActions }) => TActions
): TActions {
  const state = store.getState();
  if (actionsSelector) {
    return actionsSelector({ ...state, actions: store.actions } as TState & { actions: TActions });
  }
  return store.actions;
}

/**
 * Create a typed selector hook for a specific store
 *
 * @example
 * ```tsx
 * // Create once at module level
 * const useUser = createSelectorHook(useAuthStore);
 * const useCart = createSelectorHook(useCartStore);
 *
 * // Use in components
 * const user = useUser(state => state.user);
 * const items = useCart(state => state.items);
 * ```
 */
export function createSelectorHook<
  TState,
  TActions,
  TStore extends { getState: () => TState; subscribe: (listener: (state: TState, prevState: TState) => void) => () => void }
>(
  store: TStore & { actions: TActions }
) {
  return <TSelected>(
    selector: (state: TState) => TSelected,
    equalityFn?: (a: TSelected, b: TSelected) => boolean
  ): TSelected => {
    return useZustandSelector(store, selector, equalityFn);
  };
}

/**
 * Hook for accessing store state without subscribing to changes
 * Use for one-time reads in event handlers
 *
 * @example
 * ```tsx
 * const handlePress = () => {
 *   const user = getStoreState(useAuthStore, state => state.user);
 *   // Do something with user
 * };
 * ```
 */
export function getStoreState<TState, TSelected>(
  store: { getState: () => TState },
  selector: (state: TState) => TSelected
): TSelected {
  return selector(store.getState());
}

/**
 * Hook for batch selectors - updates only when unknown selected value changes
 *
 * @example
 * ```tsx
 * const { user, cart, wishlist } = useBatchSelector(useAuthStore, {
 *   user: state => state.user,
 *   cart: state => state.cart,
 *   wishlist: state => state.wishlist,
 * });
 * ```
 */
export function useBatchSelector<TState, TSelectors extends Record<string, (state: TState) => unknown>>(
  store: { getState: () => TState; subscribe: (listener: (state: TState, prevState: TState) => void) => () => void },
  selectors: TSelectors
): { [K in keyof TSelectors]: ReturnType<TSelectors[K]> } {
  const keys = Object.keys(selectors) as Array<keyof TSelectors>;
  const selectedValues = keys.map((key) =>
    useZustandSelector(store, selectors[key] as (state: TState) => unknown)
  );

  return Object.fromEntries(
    keys.map((key, index) => [key, selectedValues[index]])
  ) as { [K in keyof TSelectors]: ReturnType<TSelectors[K]> };
}
