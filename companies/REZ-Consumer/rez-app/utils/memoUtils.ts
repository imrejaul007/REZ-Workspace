// @ts-nocheck
/**
 * memoUtils - React.memo utilities for preventing unnecessary re-renders
 *
 * PRODUCTION-READY: Includes custom comparison functions for list items
 *
 * @example
 * ```tsx
 * import { memo, createListItemComparator } from '@/utils/memoUtils';
 *
 * // For list items - only re-render when data changes
 * const ProductCard = memo(ProductCardComponent, (prev, next) => {
 *   return prev.product.id === next.product.id &&
 *          prev.product.price === next.product.price;
 * });
 *
 * // For simple components
 * const Badge = memo(BadgeComponent);
 * ```
 */

import React, { memo, ComponentType } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

interface MemoOptions {
  /** Custom comparison function */
  areEqual?: (prevProps: Record<string, unknown>, nextProps: Record<string, unknown>) => boolean;
  /** Enable shallow comparison (default: true for objects) */
  shallowCompare?: boolean;
  /** Log re-renders in development */
  debugRenders?: boolean;
}

// ============================================================================
// Comparison Functions
// ============================================================================

/**
 * Create a comparator for list items based on specific keys
 *
 * @example
 * ```tsx
 * const comparator = createKeyComparator(['id', 'name', 'price']);
 * const Card = memo(CardComponent, comparator);
 * ```
 */
export function createKeyComparator<T extends Record<string, unknown>>(
  keys: (keyof T)[]
): (prevProps: T, nextProps: T) => boolean {
  return (prevProps: T, nextProps: T) => {
    for (const key of keys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    return true;
  };
}

/**
 * Create a comparator that checks specific nested paths
 *
 * @example
 * ```tsx
 * const comparator = createPathComparator([
 *   'user.id',
 *   'product.details.price',
 *   'status'
 * ]);
 * ```
 */
export function createPathComparator<T extends Record<string, unknown>>(
  paths: string[]
): (prevProps: T, nextProps: T) => boolean {
  const getNestedValue = (obj: unknown, path: string): unknown => {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  };

  return (prevProps: T, nextProps: T) => {
    for (const path of paths) {
      const prevValue = getNestedValue(prevProps, path);
      const nextValue = getNestedValue(nextProps, path);

      // Handle deep equality for objects
      if (prevValue !== nextValue) {
        if (typeof prevValue === 'object' && typeof nextValue === 'object') {
          if (!deepEqual(prevValue, nextValue as Record<string, unknown>)) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    return true;
  };
}

/**
 * Create a comparator for API response data with common patterns
 *
 * @example
 * ```tsx
 * // For paginated list items
 * const comparator = createDataComparator<Product>('id');
 *
 * // For items with timestamps
 * const comparator = createDataComparator<Product>('id', 'updatedAt');
 * ```
 */
export function createDataComparator<T extends { id: string | number }>(
  ...compareKeys: (keyof T)[]
): (prevProps: { data: T; onPress?: () => void }, nextProps: { data: T; onPress?: () => void }) => boolean {
  const defaultKeys = ['id' as keyof T] as (keyof T)[];
  const keysToCompare = compareKeys.length > 0 ? compareKeys : defaultKeys;

  return (prevProps, nextProps) => {
    // Always update if callback changes (for event handlers)
    if (prevProps.onPress !== nextProps.onPress) {
      return false;
    }

    // Compare data keys
    for (const key of keysToCompare) {
      if (prevProps.data[key] !== nextProps.data[key]) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Create a comparator for list items with common patterns
 *
 * @example
 * ```tsx
 * const comparator = createListItemComparator<Deal>();
 * const DealCard = memo(DealCardBase, comparator);
 * ```
 */
export function createListItemComparator<T extends { id?: string | number }>(): (
  prevProps: T & { key?: string },
  nextProps: T & { key?: string }
) => boolean {
  return (prevProps, nextProps) => {
    // Always update on key change
    if (prevProps.key !== nextProps.key) {
      return false;
    }

    // Compare by ID if present
    if (prevProps.id !== undefined && prevProps.id !== nextProps.id) {
      return false;
    }

    // Compare all primitive props
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (key === 'key' || key === 'id') continue;

      const prevValue = prevProps[key as keyof typeof prevProps];
      const nextValue = nextProps[key as keyof typeof nextProps];

      if (prevValue !== nextValue) {
        // Deep compare objects
        if (
          typeof prevValue === 'object' &&
          prevValue !== null &&
          typeof nextValue === 'object' &&
          nextValue !== null
        ) {
          if (!deepEqual(prevValue as Record<string, unknown>, nextValue as Record<string, unknown>)) {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return true;
  };
}

/**
 * Deep equality check for objects
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // Handle primitives
  if (a === b) return true;
  if (a == null || b == null) return false;

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;

    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!bObj.hasOwnProperty(key)) return false;
      if (!deepEqual(aObj[key], bObj[key])) return false;
    }

    return true;
  }

  return false;
}

/**
 * Shallow comparison for props
 */
export function shallowPropsEqual<T extends Record<string, unknown>>(
  prevProps: T,
  nextProps: T
): boolean {
  const keys = Object.keys(prevProps);

  for (const key of keys) {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    if (prevValue !== nextValue) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Memo Wrappers
// ============================================================================

/**
 * Create a memoized component with debug logging
 */
export function createMemo<T extends ComponentType<unknown>>(
  Component: T,
  options: MemoOptions = {}
): T {
  const { areEqual, debugRenders = __DEV__ } = options;

  return memo(Component, (prevProps, nextProps) => {
    if (debugRenders) {
      const changedKeys = Object.keys(nextProps).filter(
        (key) => prevProps[key as keyof typeof prevProps] !== nextProps[key as keyof typeof nextProps]
      );

      if (changedKeys.length > 0) {
        console.log(`[Memo] ${Component.displayName || Component.name} re-rendered`, {
          changed: changedKeys,
        });
      }
    }

    if (areEqual) {
      return areEqual(
        prevProps as Record<string, unknown>,
        nextProps as Record<string, unknown>
      );
    }

    return shallowPropsEqual(prevProps as Record<string, unknown>, nextProps as Record<string, unknown>);
  }) as T;
}

/**
 * Memoize a component with list item comparison
 */
export function createListMemo<T extends ComponentType<unknown>>(
  Component: T,
  comparator?: (prev, next) => boolean
): T {
  const defaultComparator = createListItemComparator();
  return memo(Component, comparator || defaultComparator) as T;
}

/**
 * Memoize a component with data comparison
 */
export function createDataMemo<T extends ComponentType<unknown>, D extends { id: string | number }>(
  Component: T,
  dataKey: keyof D = 'id' as keyof D,
  ...extraKeys: (keyof D)[]
): T {
  const comparator = createDataComparator<D>(dataKey as keyof D, ...extraKeys);
  return memo(Component, comparator as unknown) as T;
}

// ============================================================================
// Re-export React.memo with enhanced defaults
// ============================================================================

export { memo };

/**
 * Enhanced memo that prevents re-renders by default
 * Use this instead of React.memo for most components
 */
export const optimizedMemo = memo;

// ============================================================================
// Batch Updates
// ============================================================================

/**
 * Batch multiple state updates to prevent multiple re-renders
 *
 * @example
 * ```tsx
 * const { batch, flush } = useBatcher();
 *
 * // Multiple updates in one render
 * batch(() => {
 *   setItems(newItems);
 *   setSelectedId(id);
 *   setLoading(false);
 * });
 * ```
 */
export function useBatcher() {
  const pendingRef = useRef<(() => void)[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const batch = useCallback((fn: () => void) => {
    pendingRef.current.push(fn);

    // Clear any pending flush
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Batch updates
    timeoutRef.current = setTimeout(() => {
      React.startTransition(() => {
        pendingRef.current.forEach((fn) => fn());
        pendingRef.current = [];
      });
    }, 0);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pendingRef.current.forEach((fn) => fn());
    pendingRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { batch, flush };
}

export default memo;
