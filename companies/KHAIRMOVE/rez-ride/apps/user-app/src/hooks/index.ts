import { logger } from '../../shared/logger';
/**
 * Custom Hooks for Performance Optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

// ============ useOnlineStatus ============

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleConnectivityChange = (state: any) => {
      setIsOnline(state.isConnected ?? false);
    };

    // Simple polling for connectivity
    const checkConnectivity = async () => {
      try {
        const response = await fetch('https://api.rezride.com/health', {
          method: 'HEAD',
          cache: 'no-cache',
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000);

    return () => clearInterval(interval);
  }, []);

  return isOnline;
}

// ============ useDebounce ============

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============ usePrevious ============

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============ usePerformance ============

const SLOW_RENDER_THRESHOLD = 16;

export function usePerformance(componentName: string) {
  const startRef = useRef(Date.now());

  useEffect(() => {
    const duration = Date.now() - startRef.current;
    if (duration > SLOW_RENDER_THRESHOLD) {
      logger.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
    }
  });

  return { mark: () => {}, measure: () => null };
}

// ============ useThrottle ============

export function useThrottle<T>(value: T, interval: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setInterval(() => {
      if (Date.now() - lastRan.current >= interval) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, Math.min(interval, 100));

    return () => clearInterval(handler);
  }, [value, interval]);

  return throttledValue;
}

// ============ useAppState ============

export function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>('active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}

// ============ useRenderCount ============

export function useRenderCount(): number {
  const countRef = useRef(0);
  countRef.current += 1;
  return countRef.current;
}

// ============ useEffectOnce ============

export function useEffectOnce(callback: () => void): void {
  const called = useRef(false);

  useEffect(() => {
    if (!called.current) {
      called.current = true;
      callback();
    }
  }, [callback]);
}
