import { useRef, useEffect, useCallback } from 'react';

/**
 * `useIsMounted` — returns a stable callback that reports whether the component
 * is still mounted when called.
 *
 * Use this to guard async state updates (setState calls after `await`) so they
 * don't fire on unmounted components and produce React "Can't perform a state
 * update on an unmounted component" warnings.
 *
 * @returns `isMounted` — a stable function reference. Call it inside async
 *   callbacks to check mounting status before updating state.
 *
 * @example
 * ```ts
 * const isMounted = useIsMounted();
 *
 * useEffect(() => {
 *   fetchData().then(data => {
 *     if (!isMounted()) return; // bail if unmounted
 *     setData(data);
 *   });
 * }, []);
 * ```
 *
 * @remarks
 * The returned function has a stable identity (empty `useCallback` deps),
 * so it is safe to include in dependency arrays without causing re-renders.
 */
export function useIsMounted(): () => boolean {
  const ref = useRef(true);
  useEffect(() => {
    ref.current = true;
    return () => { ref.current = false; };
  }, []);
  return useCallback(() => ref.current, []);
}
