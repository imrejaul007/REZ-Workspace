'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
}

export function WebVitals() {
  useEffect(() => {
    const sendToAnalytics = (metric: WebVitalsMetric) => {
      // In production, you would send this to your analytics service
      if (process.env.NODE_ENV === 'development') {
        console.log('Web Vitals:', metric);
      }

      // Example: Send to Google Analytics
      if (typeof window !== 'undefined' && (window as unknown).gtag) {
        (window as unknown).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          metric_id: metric.id,
          metric_rating: metric.rating,
        });
      }

      // Store in localStorage for debugging
      if (typeof window !== 'undefined') {
        const vitals = JSON.parse(localStorage.getItem('web-vitals') || '[]');
        vitals.push({
          ...metric,
          timestamp: Date.now(),
          url: window.location.href,
        });
        localStorage.setItem('web-vitals', JSON.stringify(vitals.slice(-10))); // Keep last 10
      }
    };

    // Measure Core Web Vitals
    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  }, []);

  return null; // This component doesn't render anything
}

// Hook for accessing stored metrics
export function useWebVitals() {
  const getStoredMetrics = () => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('web-vitals') || '[]');
  };

  const clearMetrics = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('web-vitals');
    }
  };

  return { getStoredMetrics, clearMetrics };
}

// Performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(name: string): void {
    this.metrics.set(name, performance.now());
  }

  endTiming(name: string): number {
    const startTime = this.metrics.get(name);
    if (startTime === undefined) {
      console.warn(`No start time found for ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.delete(name);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(name);
    return fn().finally(() => {
      this.endTiming(name);
    });
  }

  measureSync<T>(name: string, fn: () => T): T {
    this.startTiming(name);
    try {
      return fn();
    } finally {
      this.endTiming(name);
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();