// @ts-nocheck
/**
 * Memoization utilities for performance optimization
 * Wraps components with React.memo and provides stable callbacks
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Create a memoized component with custom comparison
 */
export function createMemoComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual);
}

/**
 * Stable callback hook - returns a memoized callback that only changes when deps change
 * Similar to useCallback but with automatic dependency tracking
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Debounced callback - delays execution until after wait time
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  wait: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, wait);
    },
    [wait]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Throttled callback - limits execution to once per wait time
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  wait: number = 300
): T {
  const lastCallRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= wait) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      } else {
        // Schedule a trailing call
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callbackRef.current(...args);
        }, wait - timeSinceLastCall);
      }
    },
    [wait]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * Memoized value with dependency tracking
 */
export function useStableMemo<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Expensive computation hook - memoizes heavy calculations
 */
export function useMemoizedCalculation<T>(
  compute: () => T,
  deps: React.DependencyList,
  options?: {
    maxDuration?: number; // If computation takes longer, cache anyway
  }
): T {
  const lastResultRef = useRef<T | null>(null);
  const lastDepsRef = useRef<React.DependencyList | null>(null);
  const startTimeRef = useRef<number>(0);

  const depsChanged = !lastDepsRef.current ||
    deps.length !== lastDepsRef.current.length ||
    deps.some((dep, i) => dep !== lastDepsRef.current?.[i]);

  if (depsChanged) {
    startTimeRef.current = Date.now();
    lastResultRef.current = compute();
    lastDepsRef.current = deps;
  }

  return lastResultRef.current as T;
}

/**
 * Stable ref - always returns the same reference unless value changes
 */
export function useStableRef<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);

  if (ref.current !== value) {
    ref.current = value;
  }

  return ref;
}

/**
 * List item memoization helper
 * Use this for FlatList/FlashList renderItem to prevent unnecessary re-renders
 */
export function createListItemMemo<P extends { id?: string; _id?: string; key?: string }>(
  Component: React.ComponentType<P>
) {
  return React.memo<Omit<P, 'id' | '_id' | 'key'>>(
    (props) => <Component {...props} />,
    (prevProps, nextProps) => {
      // Compare all props except id fields
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);

      if (prevKeys.length !== nextKeys.length) return false;

      for (const key of prevKeys) {
        if (key !== 'id' && key !== '_id' && key !== 'key') {
          if (prevProps[key as keyof typeof prevProps] !== nextProps[key as keyof typeof nextProps]) {
            return false;
          }
        }
      }
      return true;
    }
  );
}
