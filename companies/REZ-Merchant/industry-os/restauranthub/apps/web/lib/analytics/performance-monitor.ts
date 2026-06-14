/**
 * Performance monitoring and analytics for the web application
 * Tracks Core Web Vitals, user interactions, and performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  connectionType?: string;
}

interface WebVitalsMetric extends PerformanceMetric {
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

interface CustomMetric extends PerformanceMetric {
  category: 'navigation' | 'interaction' | 'resource' | 'custom';
  labels?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;
  private endpoint: string;
  private batchSize: number = 10;
  private flushInterval: number = 30000; // 30 seconds
  private sessionId: string;

  constructor(config: {
    enabled?: boolean;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
  } = {}) {
    this.isEnabled = config.enabled ?? process.env.NODE_ENV === 'production';
    this.endpoint = config.endpoint ?? '/api/v1/analytics/performance';
    this.batchSize = config.batchSize ?? 10;
    this.flushInterval = config.flushInterval ?? 30000;
    this.sessionId = this.generateSessionId();

    if (this.isEnabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    this.setupWebVitalsTracking();
    this.setupNavigationTracking();
    this.setupResourceTracking();
    this.setupErrorTracking();
    this.setupUserInteractionTracking();

    // Start periodic flushing
    setInterval(() => this.flush(), this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush(true));
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
  }

  /**
   * Track Core Web Vitals (CLS, FID, LCP, FCP, TTFB)
   */
  private setupWebVitalsTracking(): void {
    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.handleWebVital.bind(this));
      getFID(this.handleWebVital.bind(this));
      getFCP(this.handleWebVital.bind(this));
      getLCP(this.handleWebVital.bind(this));
      getTTFB(this.handleWebVital.bind(this));
    }).catch(console.warn);
  }

  /**
   * Handle Web Vitals metrics
   */
  private handleWebVital(metric): void {
    const webVitalMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
    };

    this.addMetric(webVitalMetric);
  }

  /**
   * Track navigation performance
   */
  private setupNavigationTracking(): void {
    window.addEventListener('load', () => {
      // Wait for navigation timing to be available
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (!navigation) return;

        const metrics: CustomMetric[] = [
          {
            name: 'dns-lookup',
            value: navigation.domainLookupEnd - navigation.domainLookupStart,
            timestamp: Date.now(),
            url: window.location.href,
            category: 'navigation',
          },
          {
            name: 'tcp-connect',
            value: navigation.connectEnd - navigation.connectStart,
            timestamp: Date.now(),
            url: window.location.href,
            category: 'navigation',
          },
          {
            name: 'request-response',
            value: navigation.responseEnd - navigation.requestStart,
            timestamp: Date.now(),
            url: window.location.href,
            category: 'navigation',
          },
          {
            name: 'dom-interactive',
            value: navigation.domInteractive - navigation.navigationStart,
            timestamp: Date.now(),
            url: window.location.href,
            category: 'navigation',
          },
          {
            name: 'dom-complete',
            value: navigation.domComplete - navigation.navigationStart,
            timestamp: Date.now(),
            url: window.location.href,
            category: 'navigation',
          },
        ];

        metrics.forEach(metric => this.addMetric(metric));
      }, 1000);
    });
  }

  /**
   * Track resource loading performance
   */
  private setupResourceTracking(): void {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;

          // Only track significant resources
          if (resource.duration > 100 || this.isImportantResource(resource.name)) {
            const metric: CustomMetric = {
              name: 'resource-load',
              value: resource.duration,
              timestamp: Date.now(),
              url: window.location.href,
              category: 'resource',
              labels: {
                resourceUrl: resource.name,
                resourceType: this.getResourceType(resource.name),
                transferSize: resource.transferSize?.toString() || '0',
              },
            };

            this.addMetric(metric);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Track JavaScript errors and performance issues
   */
  private setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      const metric: CustomMetric = {
        name: 'javascript-error',
        value: 1,
        timestamp: Date.now(),
        url: window.location.href,
        category: 'custom',
        labels: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno?.toString(),
          colno: event.colno?.toString(),
        },
      };

      this.addMetric(metric);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const metric: CustomMetric = {
        name: 'unhandled-promise-rejection',
        value: 1,
        timestamp: Date.now(),
        url: window.location.href,
        category: 'custom',
        labels: {
          reason: event.reason?.toString() || 'Unknown',
        },
      };

      this.addMetric(metric);
    });
  }

  /**
   * Track user interactions
   */
  private setupUserInteractionTracking(): void {
    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (this.isImportantElement(target)) {
        const metric: CustomMetric = {
          name: 'user-interaction',
          value: 1,
          timestamp: Date.now(),
          url: window.location.href,
          category: 'interaction',
          labels: {
            elementType: target.tagName.toLowerCase(),
            elementId: target.id || '',
            elementClass: target.className || '',
            interactionType: 'click',
          },
        };

        this.addMetric(metric);
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const metric: CustomMetric = {
        name: 'form-submission',
        value: 1,
        timestamp: Date.now(),
        url: window.location.href,
        category: 'interaction',
        labels: {
          formId: form.id || '',
          formAction: form.action || '',
        },
      };

      this.addMetric(metric);
    });
  }

  /**
   * Add a custom metric
   */
  public trackCustomMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.isEnabled) return;

    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      category: 'custom',
      labels,
    };

    this.addMetric(metric);
  }

  /**
   * Track API call performance
   */
  public trackAPICall(url: string, duration: number, status: number): void {
    if (!this.isEnabled) return;

    const metric: CustomMetric = {
      name: 'api-call',
      value: duration,
      timestamp: Date.now(),
      url: window.location.href,
      category: 'custom',
      labels: {
        apiUrl: url,
        status: status.toString(),
        statusCategory: this.getStatusCategory(status),
      },
    };

    this.addMetric(metric);
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(feature: string, action: string, metadata?: Record<string, string>): void {
    if (!this.isEnabled) return;

    const metric: CustomMetric = {
      name: 'feature-usage',
      value: 1,
      timestamp: Date.now(),
      url: window.location.href,
      category: 'interaction',
      labels: {
        feature,
        action,
        ...metadata,
      },
    };

    this.addMetric(metric);
  }

  /**
   * Add metric to queue
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      sessionId: this.sessionId,
    } as unknown);

    // Auto-flush if batch size reached
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush metrics to server
   */
  private async flush(immediate: boolean = false): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      const payload = {
        sessionId: this.sessionId,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metrics: metricsToSend,
      };

      if (immediate && 'navigator' in window && 'sendBeacon' in navigator) {
        // Use sendBeacon for reliable delivery during page unload
        navigator.sendBeacon(this.endpoint, JSON.stringify(payload));
      } else {
        // Use fetch for normal cases
        await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
      // Re-add metrics to queue for next flush attempt
      this.metrics.unshift(...metricsToSend);
    }
  }

  /**
   * Get connection type
   */
  private getConnectionType(): string {
    const connection = (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  /**
   * Check if resource is important to track
   */
  private isImportantResource(url: string): boolean {
    return /\.(js|css|woff|woff2|jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url) ||
           url.includes('/api/') ||
           url.includes('cdn');
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('/api/')) return 'api';
    if (/\.(js)$/i.test(url)) return 'script';
    if (/\.(css)$/i.test(url)) return 'stylesheet';
    if (/\.(jpg|jpeg|png|gif|svg|webp|avif)$/i.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|eot)$/i.test(url)) return 'font';
    return 'other';
  }

  /**
   * Check if element is important to track
   */
  private isImportantElement(element: HTMLElement): boolean {
    return element.tagName === 'BUTTON' ||
           element.tagName === 'A' ||
           element.hasAttribute('data-track') ||
           element.classList.contains('track-click');
  }

  /**
   * Get status category for HTTP status codes
   */
  private getStatusCategory(status: number): string {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 300 && status < 400) return 'redirect';
    if (status >= 400 && status < 500) return 'client-error';
    if (status >= 500) return 'server-error';
    return 'unknown';
  }

  /**
   * Generate unique session ID
   * FIX (security): Replaced Math.random() with crypto
   */
  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${Date.now().toString(36)}-${crypto.randomUUID().replace(/-/g, '')}`;
    }
    // Fallback
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get current performance summary
   */
  public getPerformanceSummary(): Record<string, unknown> {
    if (typeof window === 'undefined') return {};

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: Date.now(),
      navigation: navigation ? {
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        domInteractive: navigation.domInteractive - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.navigationStart,
      } : null,
      paint: paint.reduce((acc, entry) => {
        acc[entry.name.replace('first-', '')] = entry.startTime;
        return acc;
      }, {} as Record<string, number>),
      memory: (performance as unknown).memory ? {
        used: (performance as unknown).memory.usedJSHeapSize,
        total: (performance as unknown).memory.totalJSHeapSize,
        limit: (performance as unknown).memory.jsHeapSizeLimit,
      } : null,
      connection: this.getConnectionType(),
      metricsQueued: this.metrics.length,
    };
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor({
  enabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'production',
});

// React hook for performance tracking
export function usePerformanceTracking() {
  const trackFeature = (feature: string, action: string, metadata?: Record<string, string>) => {
    performanceMonitor.trackFeatureUsage(feature, action, metadata);
  };

  const trackCustomMetric = (name: string, value: number, labels?: Record<string, string>) => {
    performanceMonitor.trackCustomMetric(name, value, labels);
  };

  const trackAPICall = (url: string, duration: number, status: number) => {
    performanceMonitor.trackAPICall(url, duration, status);
  };

  return {
    trackFeature,
    trackCustomMetric,
    trackAPICall,
    getPerformanceSummary: () => performanceMonitor.getPerformanceSummary(),
  };
}

export default performanceMonitor;