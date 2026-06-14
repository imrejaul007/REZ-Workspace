// @ts-nocheck
/**
 * usePerformanceMonitoring - Performance metrics collection hook
 *
 * PRODUCTION-READY: Tracks rendering performance, memory usage, and network latency
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   usePerformanceMonitoring('MyScreen');
 *   // ...
 * }
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { logger } from '@/utils/logger';
import { Sentry } from '@/config/sentry';

interface PerformanceMetrics {
  /** Time to first render (ms) */
  ttfr: number | null;
  /** Time to interactive (ms) */
  tti: number | null;
  /** Total render count */
  renderCount: number;
  /** Average render duration (ms) */
  avgRenderDuration: number;
  /** Memory usage (bytes) if available */
  memoryUsage: {
    usedJSHeapSize: number | null;
    totalJSHeapSize: number | null;
    jsHeapSizeLimit: number | null;
  };
  /** Network latency (ms) */
  networkLatency: number | null;
}

interface UsePerformanceMonitoringOptions {
  /** Enable memory monitoring (default: true) */
  enableMemoryMonitoring?: boolean;
  /** Memory check interval in ms (default: 30000) */
  memoryCheckInterval?: number;
  /** Enable render count tracking (default: true) */
  enableRenderTracking?: boolean;
  /** Report to Sentry (default: true in production) */
  reportToSentry?: boolean;
  /** Custom threshold for slow render warning (ms) (default: 16.67 for 60fps) */
  slowRenderThreshold?: number;
}

interface UsePerformanceMonitoringReturn {
  /** Record a custom metric */
  recordMetric: (name: string, value: number, unit?: string) => void;
  /** Record a render with duration */
  recordRender: (duration: number) => void;
  /** Start a performance mark */
  startMark: (name: string) => void;
  /** End a performance mark and record duration */
  endMark: (name: string) => number | null;
  /** Get current metrics */
  getMetrics: () => PerformanceMetrics;
  /** Measure an async function's execution time */
  measureAsync: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
  /** Measure a sync function's execution time */
  measureSync: <T>(name: string, fn: () => T) => T;
}

/**
 * Performance monitoring hook for production apps
 */
export function usePerformanceMonitoring(
  componentName: string,
  options: UsePerformanceMonitoringOptions = {}
): UsePerformanceMonitoringReturn {
  const {
    enableMemoryMonitoring = true,
    memoryCheckInterval = 30000,
    enableRenderTracking = true,
    reportToSentry = !__DEV__,
    slowRenderThreshold = 16.67, // 60fps = 16.67ms per frame
  } = options;

  // Metrics storage
  const metricsRef = useRef<PerformanceMetrics>({
    ttfr: null,
    tti: null,
    renderCount: 0,
    avgRenderDuration: 0,
    memoryUsage: {
      usedJSHeapSize: null,
      totalJSHeapSize: null,
      jsHeapSizeLimit: null,
    },
    networkLatency: null,
  });

  // Performance marks for timing
  const marksRef = useRef<Map<string, number>>(new Map());

  // Render durations for averaging
  const renderDurationsRef = useRef<number[]>([]);
  const MAX_RENDER_SAMPLES = 100;

  // Memory monitoring interval
  const memoryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mark start time for TTFR
  const startTimeRef = useRef(Date.now());

  // App state ref for background/foreground handling
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Record render
  const recordRender = useCallback(
    (duration: number) => {
      if (!enableRenderTracking) return;

      metricsRef.current.renderCount += 1;

      // Track render durations for averaging
      renderDurationsRef.current.push(duration);
      if (renderDurationsRef.current.length > MAX_RENDER_SAMPLES) {
        renderDurationsRef.current.shift();
      }

      // Calculate average
      const sum = renderDurationsRef.current.reduce((a, b) => a + b, 0);
      metricsRef.current.avgRenderDuration =
        sum / renderDurationsRef.current.length;

      // Warn about slow renders
      if (duration > slowRenderThreshold) {
        logger.warn(`[Performance] Slow render in ${componentName}`, {
          duration: Math.round(duration * 100) / 100,
          threshold: slowRenderThreshold,
        });

        if (reportToSentry) {
          Sentry.addBreadcrumb({
            category: 'performance',
            message: `Slow render: ${componentName}`,
            data: { duration, threshold: slowRenderThreshold },
          });
        }
      }
    },
    [componentName, enableRenderTracking, reportToSentry, slowRenderThreshold]
  );

  // Record custom metric
  const recordMetric = useCallback(
    (name: string, value: number, unit: string = 'ms') => {
      logger.debug(`[Performance] ${name}`, { value, unit });

      if (reportToSentry) {
        Sentry.addBreadcrumb({
          category: 'performance.metric',
          message: name,
          data: { value, unit },
        });
      }
    },
    [reportToSentry]
  );

  // Start a performance mark
  const startMark = useCallback((name: string) => {
    marksRef.current.set(name, performance.now());
  }, []);

  // End a performance mark
  const endMark = useCallback((name: string): number | null => {
    const startTime = marksRef.current.get(name);
    if (startTime === undefined) {
      logger.warn(`[Performance] No start mark found for: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    marksRef.current.delete(name);

    recordMetric(name, duration);
    return duration;
  }, [recordMetric]);

  // Get current metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Measure async function
  const measureAsync = useCallback(
    async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
      startMark(name);
      try {
        const result = await fn();
        const duration = endMark(name);
        if (duration !== null) {
          logger.debug(`[Performance] ${name} async completed`, { duration });
        }
        return result;
      } catch (error) {
        endMark(name);
        throw error;
      }
    },
    [startMark, endMark]
  );

  // Measure sync function
  const measureSync = useCallback(
    <T,>(name: string, fn: () => T): T => {
      startMark(name);
      try {
        const result = fn();
        const duration = endMark(name);
        if (duration !== null) {
          logger.debug(`[Performance] ${name} sync completed`, { duration });
        }
        return result;
      } finally {
        // endMark is called in the try block
      }
    },
    [startMark, endMark]
  );

  // Setup memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring) return;

    const checkMemory = () => {
      // React Native doesn't expose performance.memory like web
      // Use native modules if needed, or skip on unsupported platforms
      if (Platform.OS === 'web' && 'memory' in performance) {
        const memory = (performance as unknown as { memory: PerformanceMemory }).memory;
        metricsRef.current.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };

        // Warn if memory usage is high (> 80%)
        const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usageRatio > 0.8) {
          logger.warn(`[Performance] High memory usage`, {
            usage: `${Math.round(usageRatio * 100)}%`,
            used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          });
        }
      }
    };

    // Initial check
    checkMemory();

    // Periodic checks
    memoryIntervalRef.current = setInterval(checkMemory, memoryCheckInterval);

    return () => {
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
    };
  }, [enableMemoryMonitoring, memoryCheckInterval]);

  // Track app state for background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // App came to foreground - record metrics
        logger.debug(`[Performance] ${componentName} resumed`, getMetrics());
      }
      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => subscription.remove();
  }, [componentName, getMetrics]);

  // Record TTFR on first render
  useEffect(() => {
    if (metricsRef.current.ttfr === null) {
      metricsRef.current.ttfr = Date.now() - startTimeRef.current;
      logger.debug(`[Performance] Time to first render: ${metricsRef.current.ttfr}ms`);
    }
  }, []);

  return {
    recordMetric,
    recordRender,
    startMark,
    endMark,
    getMetrics,
    measureAsync,
    measureSync,
  };
}

/**
 * Measure network latency
 */
export function measureNetworkLatency(): Promise<number> {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.rezapp.com';

    // Use a lightweight endpoint if available, otherwise use the base URL
    fetch(`${url}/health`, { method: 'HEAD' })
      .then(() => {
        resolve(Date.now() - start);
      })
      .catch(() => {
        // Fallback to any response
        fetch(url)
          .then(() => {
            resolve(Date.now() - start);
          })
          .catch(() => {
            resolve(-1); // Indicate failure
          });
      });
  });
}

/**
 * Performance monitoring provider for global metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private listeners: Set<(metrics: Map<string, PerformanceMetrics>) => void> = new Set();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordComponentMetrics(name: string, metrics: PerformanceMetrics) {
    this.metrics.set(name, metrics);
    this.notifyListeners();
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  subscribe(listener: (metrics: Map<string, PerformanceMetrics>) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getAllMetrics()));
  }
}

export default usePerformanceMonitoring;
