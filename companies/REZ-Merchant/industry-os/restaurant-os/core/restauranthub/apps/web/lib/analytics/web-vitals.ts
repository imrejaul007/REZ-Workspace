import logger from './utils/logger';

'use client';

import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

// Types for analytics services
interface AnalyticsEvent {
  name: string;
  value: number;
  id: string;
  delta: number;
  navigationType: string;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

interface WebVitalsConfig {
  enabled: boolean;
  debug: boolean;
  reportToConsole: boolean;
  reportToAnalytics: boolean;
  reportToAPI: boolean;
  apiEndpoint?: string;
  thresholds: {
    cls: { good: number; poor: number };
    fid: { good: number; poor: number };
    fcp: { good: number; poor: number };
    lcp: { good: number; poor: number };
    ttfb: { good: number; poor: number };
  };
}

const defaultConfig: WebVitalsConfig = {
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  reportToConsole: true,
  reportToAnalytics: true,
  reportToAPI: false,
  apiEndpoint: '/api/analytics/web-vitals',
  thresholds: {
    cls: { good: 0.1, poor: 0.25 },
    inp: { good: 200, poor: 500 },
    fcp: { good: 1800, poor: 3000 },
    lcp: { good: 2500, poor: 4000 },
    ttfb: { good: 800, poor: 1800 },
  },
};

class WebVitalsTracker {
  private config: WebVitalsConfig;
  private metrics: Map<string, Metric> = new Map();

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  init() {
    if (!this.config.enabled) {
      if (this.config.debug) {
        logger.info('📊 Web Vitals tracking disabled');
      }
      return;
    }

    if (this.config.debug) {
      logger.info('📊 Initializing Web Vitals tracking...');
    }

    // Track all Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Additional performance tracking
    this.trackPageLoadTime();
    this.trackResourceTiming();
    this.trackFirstByte();
  }

  private handleMetric(metric: Metric) {
    this.metrics.set(metric.name, metric);

    const analyticsEvent = this.createAnalyticsEvent(metric);

    // Report to console in debug mode
    if (this.config.reportToConsole) {
      this.reportToConsole(analyticsEvent);
    }

    // Report to analytics service
    if (this.config.reportToAnalytics) {
      this.reportToAnalytics(analyticsEvent);
    }

    // Report to API endpoint
    if (this.config.reportToAPI && this.config.apiEndpoint) {
      this.reportToAPI(analyticsEvent);
    }
  }

  private createAnalyticsEvent(metric: Metric): AnalyticsEvent {
    const rating = this.getRating(metric);

    return {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      navigationType: metric.navigationType || 'navigate',
      rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  private getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
    const metricName = metric.name.toLowerCase();
    const thresholds = this.config.thresholds[metricName as keyof typeof this.config.thresholds];

    if (!thresholds) return 'good';

    if (metric.value <= thresholds.good) return 'good';
    if (metric.value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  }

  private reportToConsole(event: AnalyticsEvent) {
    const emoji = event.rating === 'good' ? '🟢' : event.rating === 'needs-improvement' ? '🟡' : '🔴';

    console.group(`${emoji} ${event.name} - ${event.rating}`);
    logger.info(`Value: ${event.value}ms`);
    logger.info(`Rating: ${event.rating}`);
    logger.info(`URL: ${event.url}`);
    logger.info(`Navigation Type: ${event.navigationType}`);
    console.groupEnd();
  }

  private reportToAnalytics(event: AnalyticsEvent) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.name, {
        custom_parameter_value: event.value,
        custom_parameter_rating: event.rating,
        custom_parameter_id: event.id,
      });
    }

    // Google Tag Manager
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({
        event: 'web_vitals',
        metric_name: event.name,
        metric_value: event.value,
        metric_rating: event.rating,
        metric_id: event.id,
      });
    }

    // Custom analytics
    if (typeof window !== 'undefined' && (window as unknown).customAnalytics) {
      (window as unknown).customAnalytics.track('Web Vitals', event);
    }
  }

  private async reportToAPI(event: AnalyticsEvent) {
    try {
      await fetch(this.config.apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to report Web Vitals to API:', error);
    }
  }

  private trackPageLoadTime() {
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        const loadTime = performance.now();

        if (this.config.debug) {
          logger.info(`📈 Page Load Time: ${loadTime.toFixed(2)}ms`);
        }

        // Report page load time
        if (this.config.reportToAnalytics && typeof gtag !== 'undefined') {
          gtag('event', 'timing_complete', {
            name: 'page_load',
            value: Math.round(loadTime),
          });
        }
      });
    }
  }

  private trackResourceTiming() {
    if (typeof window !== 'undefined' && window.performance && window.performance.getEntriesByType) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;

            // Track slow resources
            if (resourceEntry.duration > 1000) {
              if (this.config.debug) {
                logger.warn(`🐌 Slow resource: ${resourceEntry.name} (${resourceEntry.duration.toFixed(2)}ms)`);
              }
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  private trackFirstByte() {
    if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const ttfb = timing.responseStart - timing.navigationStart;

      if (this.config.debug) {
        logger.info(`📡 Time to First Byte: ${ttfb}ms`);
      }
    }
  }

  // Public methods for manual tracking
  public trackCustomMetric(name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') {
    const event: AnalyticsEvent = {
      name: `custom_${name}`,
      value,
      id: Math.random().toString(36).substr(2, 9),
      delta: value,
      navigationType: 'navigate',
      rating: rating || 'good',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.reportToConsole(event);
    this.reportToAnalytics(event);
  }

  public getMetrics() {
    return Array.from(this.metrics.values());
  }

  public getMetricsSummary() {
    const metrics = this.getMetrics();
    const summary = {
      good: 0,
      needsImprovement: 0,
      poor: 0,
      total: metrics.length,
    };

    metrics.forEach(metric => {
      const rating = this.getRating(metric);
      if (rating === 'good') summary.good++;
      else if (rating === 'needs-improvement') summary.needsImprovement++;
      else summary.poor++;
    });

    return summary;
  }
}

// Global instance
let webVitalsTracker: WebVitalsTracker | null = null;

export function initWebVitals(config?: Partial<WebVitalsConfig>) {
  if (typeof window === 'undefined') return;

  if (!webVitalsTracker) {
    webVitalsTracker = new WebVitalsTracker(config);
  }

  webVitalsTracker.init();
  return webVitalsTracker;
}

export function trackCustomMetric(name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') {
  if (webVitalsTracker) {
    webVitalsTracker.trackCustomMetric(name, value, rating);
  }
}

export function getWebVitalsMetrics() {
  return webVitalsTracker?.getMetrics() || [];
}

export function getWebVitalsSummary() {
  return webVitalsTracker?.getMetricsSummary() || { good: 0, needsImprovement: 0, poor: 0, total: 0 };
}

// Export the tracker class for advanced usage
export { WebVitalsTracker };

// TypeScript declarations for global analytics
declare global {
  function gtag(...args: unknown[]): void;
  var dataLayer: unknown[];
}