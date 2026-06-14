'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initWebVitals, getWebVitalsSummary, trackCustomMetric } from '@/lib/analytics/web-vitals';

interface WebVitalsContextType {
  isEnabled: boolean;
  summary: {
    good: number;
    needsImprovement: number;
    poor: number;
    total: number;
  };
  trackCustomMetric: (name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') => void;
}

const WebVitalsContext = createContext<WebVitalsContextType | null>(null);

interface WebVitalsProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  debug?: boolean;
}

export function WebVitalsProvider({
  children,
  enabled = process.env.NODE_ENV === 'production',
  debug = process.env.NODE_ENV === 'development'
}: WebVitalsProviderProps) {
  const [summary, setSummary] = useState({ good: 0, needsImprovement: 0, poor: 0, total: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize Web Vitals tracking
    const tracker = initWebVitals({
      enabled,
      debug,
      reportToConsole: debug,
      reportToAnalytics: enabled,
      reportToAPI: false, // Enable if you have an API endpoint
    });

    // Update summary periodically
    const updateSummary = () => {
      setSummary(getWebVitalsSummary());
    };

    // Initial update
    updateSummary();

    // Update summary every 5 seconds
    const interval = setInterval(updateSummary, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [enabled, debug]);

  const contextValue: WebVitalsContextType = {
    isEnabled: enabled,
    summary,
    trackCustomMetric,
  };

  return (
    <WebVitalsContext.Provider value={contextValue}>
      {children}
    </WebVitalsContext.Provider>
  );
}

export function useWebVitals() {
  const context = useContext(WebVitalsContext);
  if (!context) {
    throw new Error('useWebVitals must be used within a WebVitalsProvider');
  }
  return context;
}

// HOC for tracking component performance
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const { trackCustomMetric } = useWebVitals();

    useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        // Track component render time
        trackCustomMetric(
          `component_render_${componentName}`,
          renderTime,
          renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor'
        );
      };
    }, [trackCustomMetric]);

    return <WrappedComponent {...props} />;
  };
}

// Hook for tracking user interactions
export function useInteractionTracking() {
  const { trackCustomMetric } = useWebVitals();

  const trackClick = (element: string, startTime?: number) => {
    const responseTime = startTime ? performance.now() - startTime : 0;
    trackCustomMetric(
      `interaction_click_${element}`,
      responseTime,
      responseTime < 100 ? 'good' : responseTime < 300 ? 'needs-improvement' : 'poor'
    );
  };

  const trackFormSubmission = (formName: string, startTime: number) => {
    const submissionTime = performance.now() - startTime;
    trackCustomMetric(
      `form_submission_${formName}`,
      submissionTime,
      submissionTime < 1000 ? 'good' : submissionTime < 3000 ? 'needs-improvement' : 'poor'
    );
  };

  const trackPageTransition = (fromPage: string, toPage: string, startTime: number) => {
    const transitionTime = performance.now() - startTime;
    trackCustomMetric(
      `page_transition_${fromPage}_to_${toPage}`,
      transitionTime,
      transitionTime < 500 ? 'good' : transitionTime < 1000 ? 'needs-improvement' : 'poor'
    );
  };

  return {
    trackClick,
    trackFormSubmission,
    trackPageTransition,
  };
}