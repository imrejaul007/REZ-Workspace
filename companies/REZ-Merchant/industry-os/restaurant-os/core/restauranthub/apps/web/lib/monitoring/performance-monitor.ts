import logger from './utils/logger';

import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

export interface PerformanceMetrics {
  // Core Web Vitals
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  lcp: number | null; // Largest Contentful Paint

  // Other Important Metrics
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom Metrics
  pageLoadTime: number;
  domContentLoadedTime: number;
  timeToInteractive: number | null;
  resourceLoadTimes: ResourceTiming[];

  // User Context
  userId?: string;
  sessionId: string;
  userAgent: string;
  connection?: ConnectionInfo;
  deviceInfo: DeviceInfo;

  // Page Context
  url: string;
  pathname: string;
  referrer: string;
  timestamp: number;
}

export interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
}

export interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface DeviceInfo {
  deviceMemory?: number;
  hardwareConcurrency: number;
  platform: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  screen: {
    width: number;
    height: number;
  };
}

export interface PerformanceEvent {
  type: 'page-load' | 'navigation' | 'interaction' | 'error' | 'custom';
  name: string;
  duration?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private sessionId: string;
  private events: PerformanceEvent[] = [];
  private observers: PerformanceObserver[] = [];
  private apiEndpoint: string;
  private isInitialized = false;
  private userId?: string;

  constructor(options: {
    apiEndpoint?: string;
    userId?: string;
    enableAutoReporting?: boolean;
  } = {}) {
    this.apiEndpoint = options.apiEndpoint || '/api/v1/metrics/frontend';
    this.userId = options.userId;
    this.sessionId = this.generateSessionId();

    if (typeof window !== 'undefined') {
      this.initialize();

      if (options.enableAutoReporting !== false) {
        this.enableAutoReporting();
      }
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Initialize basic metrics
    this.metrics = {
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      pathname: window.location.pathname,
      referrer: document.referrer,
      timestamp: Date.now(),
      pageLoadTime: 0,
      domContentLoadedTime: 0,
      cls: null,
      fid: null,
      lcp: null,
      fcp: null,
      ttfb: null,
      timeToInteractive: null,
      resourceLoadTimes: [],
      deviceInfo: this.getDeviceInfo(),
      connection: this.getConnectionInfo(),
    };

    // Setup Core Web Vitals tracking
    this.setupCoreWebVitals();

    // Setup custom performance tracking
    this.setupCustomTracking();

    // Setup error tracking
    this.setupErrorTracking();

    // Setup user interaction tracking
    this.setupUserInteractionTracking();

    this.isInitialized = true;
    logger.info('🚀 Performance monitoring initialized');
  }

  /**
   * Setup Core Web Vitals tracking
   */
  private setupCoreWebVitals(): void {
    getCLS((metric: Metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('cls', metric.value, {
        rating: this.getCLSRating(metric.value),
        entries: metric.entries.length,
      });
    });

    getFID((metric: Metric) => {
      this.metrics.fid = metric.value;
      this.reportMetric('fid', metric.value, {
        rating: this.getFIDRating(metric.value),
        entries: metric.entries.length,
      });
    });

    getLCP((metric: Metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('lcp', metric.value, {
        rating: this.getLCPRating(metric.value),
        entries: metric.entries.length,
      });
    });

    getFCP((metric: Metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('fcp', metric.value, {
        rating: this.getFCPRating(metric.value),
      });
    });

    getTTFB((metric: Metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('ttfb', metric.value, {
        rating: this.getTTFBRating(metric.value),
      });
    });
  }

  /**
   * Setup custom performance tracking
   */
  private setupCustomTracking(): void {
    // Page load timing
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.domContentLoadedTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;

      this.recordEvent({
        type: 'page-load',
        name: 'page-load-complete',
        duration: this.metrics.pageLoadTime,
        timestamp: Date.now(),
        metadata: {
          domContentLoaded: this.metrics.domContentLoadedTime,
          domInteractive: navigation.domInteractive - navigation.fetchStart,
          firstByte: navigation.responseStart - navigation.fetchStart,
        },
      });

      // Track resource load times
      this.trackResourceTiming();
    });

    // Track Time to Interactive (TTI)
    this.trackTimeToInteractive();

    // Track Long Tasks
    this.trackLongTasks();

    // Track Layout Shifts in detail
    this.trackLayoutShifts();
  }

  /**
   * Track resource loading performance
   */
  private trackResourceTiming(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    this.metrics.resourceLoadTimes = resources.map(resource => ({
      name: resource.name,
      type: this.getResourceType(resource.name),
      duration: resource.responseEnd - resource.startTime,
      size: resource.transferSize || 0,
      startTime: resource.startTime,
    }));

    // Report slow resources
    const slowResources = resources.filter(r => r.duration > 1000);
    slowResources.forEach(resource => {
      this.recordEvent({
        type: 'custom',
        name: 'slow-resource',
        duration: resource.responseEnd - resource.startTime,
        timestamp: Date.now(),
        metadata: {
          url: resource.name,
          type: this.getResourceType(resource.name),
          size: resource.transferSize,
        },
      });
    });
  }

  /**
   * Track Time to Interactive
   */
  private trackTimeToInteractive(): void {
    // Simplified TTI calculation
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastLongTask = entries[entries.length - 1];

        if (lastLongTask) {
          this.metrics.timeToInteractive = lastLongTask.startTime + lastLongTask.duration;
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  /**
   * Track Long Tasks
   */
  private trackLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordEvent({
            type: 'custom',
            name: 'long-task',
            duration: entry.duration,
            timestamp: Date.now(),
            metadata: {
              startTime: entry.startTime,
              attribution: (entry as unknown).attribution,
            },
          });
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    }
  }

  /**
   * Track Layout Shifts in detail
   */
  private trackLayoutShifts(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.value > 0.1) { // Only report significant layout shifts
            this.recordEvent({
              type: 'custom',
              name: 'layout-shift',
              duration: entry.value,
              timestamp: Date.now(),
              metadata: {
                value: entry.value,
                sources: entry.sources?.map((source) => ({
                  node: source.node?.tagName || 'unknown',
                  currentRect: source.currentRect,
                  previousRect: source.previousRect,
                })),
              },
            });
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    }
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordEvent({
        type: 'error',
        name: 'javascript-error',
        timestamp: Date.now(),
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordEvent({
        type: 'error',
        name: 'unhandled-rejection',
        timestamp: Date.now(),
        metadata: {
          reason: event.reason?.toString(),
          stack: event.reason?.stack,
        },
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.recordEvent({
          type: 'error',
          name: 'resource-error',
          timestamp: Date.now(),
          metadata: {
            element: (event.target as Element)?.tagName,
            source: (event.target as unknown)?.src || (event.target as unknown)?.href,
          },
        });
      }
    }, true);
  }

  /**
   * Setup user interaction tracking
   */
  private setupUserInteractionTracking(): void {
    // Track first input delay in detail
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordEvent({
            type: 'interaction',
            name: 'first-input',
            duration: entry.processingStart - entry.startTime,
            timestamp: Date.now(),
            metadata: {
              delay: entry.processingStart - entry.startTime,
              type: entry.name,
              target: entry.target?.tagName,
            },
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }

    // Track click response times
    let clickStartTime: number;

    document.addEventListener('mousedown', () => {
      clickStartTime = performance.now();
    });

    document.addEventListener('click', (event) => {
      if (clickStartTime) {
        const responseTime = performance.now() - clickStartTime;

        if (responseTime > 100) { // Only track slow responses
          this.recordEvent({
            type: 'interaction',
            name: 'slow-click-response',
            duration: responseTime,
            timestamp: Date.now(),
            metadata: {
              target: (event.target as Element)?.tagName,
              className: (event.target as Element)?.className,
            },
          });
        }
      }
    });
  }

  /**
   * Record a performance event
   */
  private recordEvent(event: PerformanceEvent): void {
    this.events.push(event);

    // Limit events array size
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  /**
   * Report metric to backend
   */
  private async reportMetric(name: string, value: number, metadata?: Record<string, unknown>): Promise<void> {
    try {
      const payload = {
        metric: name,
        value,
        metadata,
        context: {
          sessionId: this.sessionId,
          userId: this.userId,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        },
      };

      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Failed to report metric:', error);
    }
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    return {
      deviceMemory: (navigator as unknown).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      screen: {
        width: screen.width,
        height: screen.height,
      },
    };
  }

  /**
   * Get connection information
   */
  private getConnectionInfo(): ConnectionInfo | undefined {
    const connection = (navigator as unknown).connection || (navigator as unknown).mozConnection || (navigator as unknown).webkitConnection;

    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      };
    }

    return undefined;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Rating functions for Core Web Vitals
   */
  private getCLSRating(value: number): string {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  private getFIDRating(value: number): string {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private getLCPRating(value: number): string {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private getFCPRating(value: number): string {
    if (value <= 1800) return 'good';
    if (value <= 3000) return 'needs-improvement';
    return 'poor';
  }

  private getTTFBRating(value: number): string {
    if (value <= 800) return 'good';
    if (value <= 1800) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Enable automatic reporting
   */
  private enableAutoReporting(): void {
    // Report metrics periodically
    setInterval(() => {
      this.sendMetrics();
    }, 30000); // Every 30 seconds

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics(true);
    });

    // Report on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.sendMetrics(true);
      }
    });
  }

  /**
   * Send metrics to backend
   */
  public async sendMetrics(useBeacon = false): Promise<void> {
    if (!this.isInitialized) return;

    const payload = {
      ...this.metrics,
      events: this.events,
      timestamp: Date.now(),
    };

    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(this.apiEndpoint, JSON.stringify(payload));
      } else {
        await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: useBeacon,
        });
      }

      // Clear events after sending
      this.events = [];
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  /**
   * Get current metrics
   */
  public getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics;
  }

  /**
   * Get recent events
   */
  public getEvents(): PerformanceEvent[] {
    return [...this.events];
  }

  /**
   * Track custom event
   */
  public trackEvent(name: string, duration?: number, metadata?: Record<string, unknown>): void {
    this.recordEvent({
      type: 'custom',
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Start tracking a custom operation
   */
  public startTracking(operationName: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.trackEvent(operationName, duration);
    };
  }

  /**
   * Update user ID
   */
  public setUserId(userId: string): void {
    this.userId = userId;
    this.metrics.userId = userId;
  }

  /**
   * Cleanup and disconnect observers
   */
  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    logger.info('🛑 Performance monitoring disconnected');
  }
}

// Create global instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring(options?: {
  apiEndpoint?: string;
  userId?: string;
  enableAutoReporting?: boolean;
}): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor(options);
  }
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

export { PerformanceMonitor };