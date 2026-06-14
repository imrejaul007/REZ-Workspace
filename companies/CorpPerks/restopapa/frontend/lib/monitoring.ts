// Production monitoring and analytics utilities

// Generate a unique session ID using crypto
function generateSessionId(): string {
  return crypto.randomUUID();
}

export interface PerformanceMetrics {
  page: string
  loadTime: number
  renderTime: number
  firstContentfulPaint?: number
  largestContentfulPaint?: number
  firstInputDelay?: number
  cumulativeLayoutShift?: number
  timestamp: number
}

export interface ErrorLog {
  message: string
  stack?: string
  url: string
  line?: number
  column?: number
  userAgent: string
  userId?: string
  timestamp: number
  level: 'error' | 'warning' | 'info'
}

export interface UserEvent {
  event: string
  page: string
  userId?: string
  properties?: Record<string, any>
  timestamp: number
}

class MonitoringService {
  private isProduction = process.env.NODE_ENV === 'production'
  private apiEndpoint = process.env.NEXT_PUBLIC_MONITORING_ENDPOINT

  // Web Vitals tracking
  public trackWebVitals(metrics: PerformanceMetrics): void {
    if (!this.isProduction) {
      logger.info('📊 Web Vitals:', metrics)
      return
    }

    // Send to analytics service
    this.sendToAnalytics('performance', metrics)
  }

  // Error tracking
  public trackError(error: Error, context?: Record<string, any>): void {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      line: context?.line,
      column: context?.column,
      userAgent: navigator.userAgent,
      userId: context?.userId,
      timestamp: Date.now(),
      level: 'error'
    }

    if (!this.isProduction) {
      logger.error('🚨 Error tracked:', errorLog)
      return
    }

    // Send to error tracking service
    this.sendToAnalytics('error', errorLog)
  }

  // User event tracking
  public trackEvent(event: string, properties?: Record<string, any>): void {
    const userEvent: UserEvent = {
      event,
      page: window.location.pathname,
      properties,
      timestamp: Date.now()
    }

    if (!this.isProduction) {
      logger.info('📈 Event tracked:', userEvent)
      return
    }

    // Send to analytics service
    this.sendToAnalytics('event', userEvent)
  }

  // Page view tracking
  public trackPageView(page: string): void {
    this.trackEvent('page_view', { page })
  }

  // Performance monitoring
  public measurePerformance(name: string, fn: () => Promise<any>): Promise<any> {
    const start = performance.now()
    
    return fn().then(result => {
      const end = performance.now()
      const duration = end - start

      this.trackEvent('performance_measure', {
        name,
        duration: Math.round(duration),
        timestamp: Date.now()
      })

      return result
    }).catch(error => {
      const end = performance.now()
      const duration = end - start

      this.trackError(error, {
        context: 'performance_measure',
        operation: name,
        duration: Math.round(duration)
      })

      throw error
    })
  }

  // API call monitoring
  public trackApiCall(endpoint: string, method: string, status: number, duration: number): void {
    this.trackEvent('api_call', {
      endpoint,
      method,
      status,
      duration: Math.round(duration),
      success: status >= 200 && status < 300
    })
  }

  // User session tracking
  public startSession(userId?: string): void {
    const sessionId = this.generateSessionId()
    sessionStorage.setItem('sessionId', sessionId)
    
    this.trackEvent('session_start', {
      sessionId,
      userId,
      timestamp: Date.now()
    })
  }

  public endSession(): void {
    const sessionId = sessionStorage.getItem('sessionId')
    
    this.trackEvent('session_end', {
      sessionId,
      timestamp: Date.now()
    })
    
    sessionStorage.removeItem('sessionId')
  }

  // Feature usage tracking
  public trackFeatureUsage(feature: string, action: string, userId?: string): void {
    this.trackEvent('feature_usage', {
      feature,
      action,
      userId,
      sessionId: sessionStorage.getItem('sessionId')
    })
  }

  // Business metrics tracking
  public trackBusinessEvent(event: string, value?: number, properties?: Record<string, any>): void {
    this.trackEvent('business_event', {
      event,
      value,
      ...properties
    })
  }

  // Private methods
  private async sendToAnalytics(type: string, data: any): Promise<void> {
    if (!this.apiEndpoint) return

    try {
      await fetch(`${this.apiEndpoint}/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    } catch (error) {
      logger.error('Failed to send analytics data:', error)
    }
  }

  private generateSessionId(): string {
    return generateSessionId();
  }
}

// Singleton instance
export const monitoring = new MonitoringService()

// React hook for monitoring
export function useMonitoring() {
  const trackPageView = (page: string) => monitoring.trackPageView(page)
  const trackEvent = (event: string, properties?: Record<string, any>) => monitoring.trackEvent(event, properties)
  const trackError = (error: Error, context?: Record<string, any>) => monitoring.trackError(error, context)
  const trackFeatureUsage = (feature: string, action: string) => monitoring.trackFeatureUsage(feature, action)
  const trackBusinessEvent = (event: string, value?: number, properties?: Record<string, any>) => 
    monitoring.trackBusinessEvent(event, value, properties)

  return {
    trackPageView,
    trackEvent,
    trackError,
    trackFeatureUsage,
    trackBusinessEvent,
  }
}

// Web Vitals helper
export function setupWebVitalsTracking(): void {
  if (typeof window === 'undefined') return

  // Track Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS((metric) => {
      monitoring.trackWebVitals({
        page: window.location.pathname,
        loadTime: 0,
        renderTime: 0,
        cumulativeLayoutShift: metric.value,
        timestamp: Date.now()
      })
    })

    getFID((metric) => {
      monitoring.trackWebVitals({
        page: window.location.pathname,
        loadTime: 0,
        renderTime: 0,
        firstInputDelay: metric.value,
        timestamp: Date.now()
      })
    })

    getFCP((metric) => {
      monitoring.trackWebVitals({
        page: window.location.pathname,
        loadTime: 0,
        renderTime: 0,
        firstContentfulPaint: metric.value,
        timestamp: Date.now()
      })
    })

    getLCP((metric) => {
      monitoring.trackWebVitals({
        page: window.location.pathname,
        loadTime: 0,
        renderTime: 0,
        largestContentfulPaint: metric.value,
        timestamp: Date.now()
      })
    })

    getTTFB((metric) => {
      monitoring.trackWebVitals({
        page: window.location.pathname,
        loadTime: metric.value,
        renderTime: 0,
        timestamp: Date.now()
      })
    })
  })
}

// Global error handler
export function setupGlobalErrorHandling(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    monitoring.trackError(new Error(event.message), {
      line: event.lineno,
      column: event.colno,
      filename: event.filename
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    monitoring.trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`))
  })
}

// Performance observer for navigation timing
export function setupNavigationTiming(): void {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        const navigationEntry = entry as PerformanceNavigationTiming
        
        monitoring.trackWebVitals({
          page: window.location.pathname,
          loadTime: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
          renderTime: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
          timestamp: Date.now()
        })
      }
    }
  })

  observer.observe({ entryTypes: ['navigation'] })
}