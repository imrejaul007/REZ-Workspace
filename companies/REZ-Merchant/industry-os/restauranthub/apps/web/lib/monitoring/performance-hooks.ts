import { useEffect, useCallback, useRef, useState } from 'react';
import { getPerformanceMonitor } from './performance-monitor';

/**
 * Hook to track component render performance
 */
export function useRenderTracking(componentName: string) {
  const renderStartTime = useRef<number>(performance.now());
  const performanceMonitor = getPerformanceMonitor();

  useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;

    performanceMonitor?.trackEvent('component-render', renderDuration, {
      component: componentName,
      timestamp: Date.now(),
    });

    // Track slow renders
    if (renderDuration > 16) { // More than one frame (60fps)
      performanceMonitor?.trackEvent('slow-render', renderDuration, {
        component: componentName,
        threshold: 16,
        timestamp: Date.now(),
      });
    }
  });

  // Update start time for re-renders
  useEffect(() => {
    renderStartTime.current = performance.now();
  });
}

/**
 * Hook to track API call performance
 */
export function useApiCallTracking() {
  const performanceMonitor = getPerformanceMonitor();

  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    metadata?: Record<string, unknown>
  ): Promise<T> => {
    const startTime = performance.now();
    const startTracking = performanceMonitor?.startTracking(`api-call-${endpoint}`);

    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;

      performanceMonitor?.trackEvent('api-call-success', duration, {
        endpoint,
        status: 'success',
        ...metadata,
      });

      startTracking?.();
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      performanceMonitor?.trackEvent('api-call-error', duration, {
        endpoint,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        ...metadata,
      });

      startTracking?.();
      throw error;
    }
  }, [performanceMonitor]);

  return trackApiCall;
}

/**
 * Hook to track user interactions
 */
export function useInteractionTracking() {
  const performanceMonitor = getPerformanceMonitor();

  const trackClick = useCallback((element: string, metadata?: Record<string, unknown>) => {
    performanceMonitor?.trackEvent('user-click', undefined, {
      element,
      timestamp: Date.now(),
      ...metadata,
    });
  }, [performanceMonitor]);

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, unknown>) => {
    performanceMonitor?.trackEvent('form-submit', undefined, {
      form: formName,
      timestamp: Date.now(),
      ...metadata,
    });
  }, [performanceMonitor]);

  const trackSearch = useCallback((query: string, results: number, duration?: number) => {
    performanceMonitor?.trackEvent('search', duration, {
      query: query.substring(0, 50), // Limit query length for privacy
      resultsCount: results,
      timestamp: Date.now(),
    });
  }, [performanceMonitor]);

  const trackPageView = useCallback((page: string, metadata?: Record<string, unknown>) => {
    performanceMonitor?.trackEvent('page-view', undefined, {
      page,
      timestamp: Date.now(),
      ...metadata,
    });
  }, [performanceMonitor]);

  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackPageView,
  };
}

/**
 * Hook to track resource loading performance
 */
export function useResourceTracking() {
  const performanceMonitor = getPerformanceMonitor();
  const trackedResources = useRef(new Set<string>());

  const trackResourceLoad = useCallback((resourceUrl: string, resourceType: string) => {
    if (trackedResources.current.has(resourceUrl)) return;
    trackedResources.current.add(resourceUrl);

    const startTime = performance.now();
    const img = new Image();

    img.onload = () => {
      const duration = performance.now() - startTime;
      performanceMonitor?.trackEvent('resource-load-success', duration, {
        url: resourceUrl,
        type: resourceType,
        timestamp: Date.now(),
      });
    };

    img.onerror = () => {
      const duration = performance.now() - startTime;
      performanceMonitor?.trackEvent('resource-load-error', duration, {
        url: resourceUrl,
        type: resourceType,
        timestamp: Date.now(),
      });
    };

    img.src = resourceUrl;
  }, [performanceMonitor]);

  const trackImageLoad = useCallback((imageUrl: string) => {
    trackResourceLoad(imageUrl, 'image');
  }, [trackResourceLoad]);

  return {
    trackResourceLoad,
    trackImageLoad,
  };
}

/**
 * Hook to track custom performance metrics
 */
export function useCustomMetrics() {
  const performanceMonitor = getPerformanceMonitor();

  const startTimer = useCallback((operationName: string) => {
    return performanceMonitor?.startTracking(operationName) || (() => {});
  }, [performanceMonitor]);

  const trackMetric = useCallback((name: string, value: number, metadata?: Record<string, unknown>) => {
    performanceMonitor?.trackEvent(name, value, metadata);
  }, [performanceMonitor]);

  const trackBusinessMetric = useCallback((metricName: string, value: number, context?: Record<string, unknown>) => {
    performanceMonitor?.trackEvent(`business-${metricName}`, value, {
      type: 'business',
      timestamp: Date.now(),
      ...context,
    });
  }, [performanceMonitor]);

  return {
    startTimer,
    trackMetric,
    trackBusinessMetric,
  };
}

/**
 * Hook to track form performance
 */
export function useFormTracking(formName: string) {
  const performanceMonitor = getPerformanceMonitor();
  const [formStartTime] = useState(() => performance.now());
  const [errors, setErrors] = useState<string[]>([]);

  const trackFieldFocus = useCallback((fieldName: string) => {
    performanceMonitor?.trackEvent('form-field-focus', undefined, {
      form: formName,
      field: fieldName,
      timestamp: Date.now(),
    });
  }, [performanceMonitor, formName]);

  const trackFieldBlur = useCallback((fieldName: string, value) => {
    performanceMonitor?.trackEvent('form-field-blur', undefined, {
      form: formName,
      field: fieldName,
      hasValue: !!value,
      timestamp: Date.now(),
    });
  }, [performanceMonitor, formName]);

  const trackFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => [...prev, error]);
    performanceMonitor?.trackEvent('form-field-error', undefined, {
      form: formName,
      field: fieldName,
      error,
      timestamp: Date.now(),
    });
  }, [performanceMonitor, formName]);

  const trackFormSubmit = useCallback((success: boolean, metadata?: Record<string, unknown>) => {
    const formDuration = performance.now() - formStartTime;

    performanceMonitor?.trackEvent('form-submit', formDuration, {
      form: formName,
      success,
      errorCount: errors.length,
      timestamp: Date.now(),
      ...metadata,
    });

    // Reset errors after submission
    if (success) {
      setErrors([]);
    }
  }, [performanceMonitor, formName, formStartTime, errors.length]);

  return {
    trackFieldFocus,
    trackFieldBlur,
    trackFieldError,
    trackFormSubmit,
  };
}

/**
 * Hook to track scroll performance
 */
export function useScrollTracking(elementName?: string) {
  const performanceMonitor = getPerformanceMonitor();
  const scrollData = useRef({
    startTime: 0,
    lastScrollTime: 0,
    scrollCount: 0,
    maxScrollSpeed: 0,
  });

  const trackScrollStart = useCallback(() => {
    scrollData.current.startTime = performance.now();
    scrollData.current.lastScrollTime = scrollData.current.startTime;
    scrollData.current.scrollCount = 0;
    scrollData.current.maxScrollSpeed = 0;
  }, []);

  const trackScroll = useCallback((scrollTop: number, scrollHeight: number) => {
    const now = performance.now();
    const timeDiff = now - scrollData.current.lastScrollTime;

    if (timeDiff > 0) {
      const scrollSpeed = Math.abs(scrollTop) / timeDiff;
      scrollData.current.maxScrollSpeed = Math.max(scrollData.current.maxScrollSpeed, scrollSpeed);
    }

    scrollData.current.lastScrollTime = now;
    scrollData.current.scrollCount++;

    // Track scroll depth
    const scrollPercentage = (scrollTop / (scrollHeight - window.innerHeight)) * 100;

    if (scrollPercentage > 50 && scrollData.current.scrollCount === 1) {
      performanceMonitor?.trackEvent('scroll-depth-50', undefined, {
        element: elementName || 'page',
        percentage: 50,
        timestamp: Date.now(),
      });
    }

    if (scrollPercentage > 90 && scrollData.current.scrollCount === 1) {
      performanceMonitor?.trackEvent('scroll-depth-90', undefined, {
        element: elementName || 'page',
        percentage: 90,
        timestamp: Date.now(),
      });
    }
  }, [performanceMonitor, elementName]);

  const trackScrollEnd = useCallback(() => {
    const scrollDuration = performance.now() - scrollData.current.startTime;

    performanceMonitor?.trackEvent('scroll-session', scrollDuration, {
      element: elementName || 'page',
      scrollCount: scrollData.current.scrollCount,
      maxScrollSpeed: scrollData.current.maxScrollSpeed,
      timestamp: Date.now(),
    });
  }, [performanceMonitor, elementName]);

  return {
    trackScrollStart,
    trackScroll,
    trackScrollEnd,
  };
}

/**
 * Hook to monitor component error boundaries
 */
export function useErrorTracking(componentName: string) {
  const performanceMonitor = getPerformanceMonitor();

  const trackError = useCallback((error: Error, errorInfo?) => {
    performanceMonitor?.trackEvent('component-error', undefined, {
      component: componentName,
      error: error.message,
      stack: error.stack?.substring(0, 500), // Limit stack trace
      errorInfo: errorInfo?.componentStack?.substring(0, 300),
      timestamp: Date.now(),
    });
  }, [performanceMonitor, componentName]);

  const trackWarning = useCallback((warning: string, metadata?: Record<string, unknown>) => {
    performanceMonitor?.trackEvent('component-warning', undefined, {
      component: componentName,
      warning,
      timestamp: Date.now(),
      ...metadata,
    });
  }, [performanceMonitor, componentName]);

  return {
    trackError,
    trackWarning,
  };
}