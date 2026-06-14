/**
 * Responsive Design Hooks
 *
 * Provides responsive utilities for React Native apps.
 * Supports breakpoints, window size tracking, and adaptive layouts.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

// Breakpoint definitions
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// Current window dimensions
interface WindowSize {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

/**
 * Hook to track window size changes
 *
 * @example
 * const { width, height } = useWindowSize();
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      isLandscape: width > height,
      isPortrait: height >= width,
    };
  });

  useEffect(() => {
    const handleChange = ({ window }: { window: ScaledSize }) => {
      setWindowSize({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        isPortrait: window.height >= window.width,
      });
    };

    const subscription = Dimensions.addEventListener('change', handleChange);
    return () => subscription?.remove();
  }, []);

  return windowSize;
}

/**
 * Hook to get current breakpoint
 *
 * @example
 * const breakpoint = useBreakpoint(); // 'md', 'lg', etc.
 */
export function useBreakpoint(): BreakpointKey {
  const { width } = useWindowSize();

  if (width >= BREAKPOINTS.xxl) return 'xxl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

/**
 * Hook to check if current breakpoint matches or is above a threshold
 *
 * @example
 * const isMobile = useIsBelowBreakpoint('md'); // true on mobile
 * const isDesktop = useIsAboveBreakpoint('lg'); // true on desktop
 */
export function useIsBelowBreakpoint(breakpoint: BreakpointKey): boolean {
  const { width } = useWindowSize();
  return width < BREAKPOINTS[breakpoint];
}

export function useIsAboveBreakpoint(breakpoint: BreakpointKey): boolean {
  const { width } = useWindowSize();
  return width >= BREAKPOINTS[breakpoint];
}

/**
 * Hook to check if device is a specific type
 *
 * @example
 * const isMobile = useIsDevice('mobile');
 * const isTablet = useIsDevice('tablet');
 */
export function useIsDevice(type: 'mobile' | 'tablet' | 'desktop' | 'tv'): boolean {
  const breakpoint = useBreakpoint();

  switch (type) {
    case 'mobile':
      return breakpoint === 'xs' || breakpoint === 'sm';
    case 'tablet':
      return breakpoint === 'md' || breakpoint === 'lg';
    case 'desktop':
      return breakpoint === 'xl' || breakpoint === 'xxl';
    case 'tv':
      return false; // TV detection requires additional logic
    default:
      return false;
  }
}

/**
 * Hook to get responsive value based on current breakpoint
 *
 * @example
 * const padding = useResponsive({
 *   xs: 8,
 *   sm: 12,
 *   md: 16,
 *   lg: 24,
 *   xl: 32,
 * });
 */
export function useResponsive<T>(values: Partial<Record<BreakpointKey, T>>): T | undefined {
  const breakpoint = useBreakpoint();
  const breakpointOrder: BreakpointKey[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  // Find the first defined value at or below current breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const key = breakpointOrder[i];
    if (values[key] !== undefined) {
      return values[key];
    }
  }

  // Return the first defined value if none found below
  return values[breakpointOrder[0]];
}

/**
 * Hook to check if screen is currently in loading state (for SSR hydration)
 *
 * @example
 * const isReady = useIsHydrated();
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook to get responsive grid columns based on screen size
 *
 * @example
 * const columns = useResponsiveGridColumns(); // 1 on mobile, 2 on tablet, 3 on desktop
 */
export function useResponsiveGridColumns(maxColumns: number = 3): number {
  const breakpoint = useBreakpoint();

  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return 1;
    case 'md':
      return Math.min(2, maxColumns);
    case 'lg':
      return Math.min(3, maxColumns);
    case 'xl':
    case 'xxl':
      return maxColumns;
    default:
      return 1;
  }
}

/**
 * Hook to get responsive spacing multiplier
 *
 * @example
 * const spacingMultiplier = useResponsiveSpacing(); // 1 on mobile, 1.5 on tablet
 */
export function useResponsiveSpacing(): number {
  const breakpoint = useBreakpoint();

  switch (breakpoint) {
    case 'xs':
    case 'sm':
      return 1;
    case 'md':
      return 1.25;
    case 'lg':
      return 1.5;
    case 'xl':
    case 'xxl':
      return 2;
    default:
      return 1;
  }
}

/**
 * Hook to debounce window size changes
 *
 * @example
 * const debouncedSize = useDebouncedWindowSize(300);
 */
export function useDebouncedWindowSize(delayMs: number = 100): WindowSize {
  const [debouncedSize, setDebouncedSize] = useState<WindowSize>({
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    isLandscape: Dimensions.get('window').width > Dimensions.get('window').height,
    isPortrait: Dimensions.get('window').height >= Dimensions.get('window').width,
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const { width, height } = Dimensions.get('window');
      setDebouncedSize({
        width,
        height,
        isLandscape: width > height,
        isPortrait: height >= width,
      });
    }, delayMs);

    const subscription = Dimensions.addEventListener('change', () => {
      // Immediate update for debounce
    });

    return () => {
      clearTimeout(timeoutId);
      subscription?.remove();
    };
  }, [delayMs]);

  return debouncedSize;
}

// Export all hooks as a named export for convenience
export const responsiveHooks = {
  useWindowSize,
  useBreakpoint,
  useIsBelowBreakpoint,
  useIsAboveBreakpoint,
  useIsDevice,
  useResponsive,
  useIsHydrated,
  useResponsiveGridColumns,
  useResponsiveSpacing,
  useDebouncedWindowSize,
};

export default responsiveHooks;
