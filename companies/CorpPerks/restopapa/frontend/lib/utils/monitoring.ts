import logger from './utils/logger';

// Production monitoring and error tracking utilities

export interface ErrorEvent {
  message: string
  stack?: string
  url: string
  line?: number
  column?: number
  timestamp: number
  userAgent: string
  userId?: string
  sessionId?: string
}

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  url: string
  userId?: string
}

class ErrorTracker {
  private errorQueue: ErrorEvent[] = []
  private performanceQueue: PerformanceMetric[] = []
  private maxQueueSize = 100
  private flushInterval = 30000 // 30 seconds

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers()
      this.setupPerformanceMonitoring()
      this.startAutoFlush()
    }
  }

  private setupGlobalErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    })

    // React error boundary integration
    if (typeof window !== 'undefined') {
      (window as any).__REACT_ERROR_TRACKER__ = this.trackError.bind(this)
    }
  }

  private setupPerformanceMonitoring() {
    // Page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing
          const loadTime = timing.loadEventEnd - timing.navigationStart
          
          this.trackPerformance('page_load_time', loadTime)
          this.trackPerformance('dom_ready_time', timing.domContentLoadedEventEnd - timing.navigationStart)
          this.trackPerformance('first_paint_time', timing.responseStart - timing.navigationStart)
        }
      }, 0)
    })

    // Long task observer
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) { // Long task threshold
              this.trackPerformance('long_task', entry.duration)
            }
          })
        })
        observer.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        logger.warn('Long task observer not supported')
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.trackPerformance('largest_contentful_paint', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        logger.warn('LCP observer not supported')
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.trackPerformance('first_input_delay', (entry as any).processingStart - entry.startTime)
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        logger.warn('FID observer not supported')
      }
    }
  }

  trackError(error: Partial<ErrorEvent>) {
    const errorEvent: ErrorEvent = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      url: error.url || window.location.href,
      line: error.line,
      column: error.column,
      timestamp: error.timestamp || Date.now(),
      userAgent: error.userAgent || navigator.userAgent,
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    }

    this.errorQueue.push(errorEvent)
    
    // Flush immediately for critical errors
    if (this.isCriticalError(errorEvent)) {
      this.flushErrors()
    }

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Tracked error:', errorEvent)
    }
  }

  trackPerformance(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value),
      timestamp: Date.now(),
      url: window.location.href,
      userId: this.getUserId()
    }

    this.performanceQueue.push(metric)

    // Keep queue size manageable
    if (this.performanceQueue.length > this.maxQueueSize) {
      this.performanceQueue.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.info(Performance metric [${name}]:`, value)
    }
  }

  private isCriticalError(error: ErrorEvent): boolean {
    const criticalKeywords = [
      'chunk load error',
      'network error',
      'script error',
      'out of memory',
      'maximum call stack'
    ]

    return criticalKeywords.some(keyword =>
      error.message.toLowerCase().includes(keyword)
    )
  }

  private getUserId(): string | undefined {
    // Get user ID from localStorage, cookie, or auth context
    try {
      const userStr = localStorage.getItem('user_profile')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.id
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return undefined
  }

  private getSessionId(): string {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `session_${crypto.randomUUID()}`
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  private startAutoFlush() {
    setInterval(() => {
      if (this.errorQueue.length > 0 || this.performanceQueue.length > 0) {
        this.flush()
      }
    }, this.flushInterval)
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      // Send to your error tracking service
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      })
    } catch (e) {
      // Re-queue errors if sending fails
      this.errorQueue.unshift(...errors)
      logger.warn('Failed to send error reports')
    }
  }

  private async flushPerformance() {
    if (this.performanceQueue.length === 0) return

    const metrics = [...this.performanceQueue]
    this.performanceQueue = []

    try {
      // Send to your analytics service
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics })
      })
    } catch (e) {
      // Re-queue metrics if sending fails
      this.performanceQueue.unshift(...metrics)
      logger.warn('Failed to send performance metrics')
    }
  }

  async flush() {
    await Promise.all([
      this.flushErrors(),
      this.flushPerformance()
    ])
  }

  // Manual tracking methods
  trackUserAction(action: string, data?: any) {
    this.trackPerformance(`user_action_${action}`, Date.now())
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(User action: ${action}`, data)
    }
  }

  trackAPICall(endpoint: string, duration: number, success: boolean) {
    this.trackPerformance(`api_${endpoint.replace(/\//g, '_')}_duration`, duration)
    
    if (!success) {
      this.trackError({
        message: `API call failed: ${endpoint}`,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      })
    }
  }

  trackPageView(path: string) {
    this.trackPerformance('page_view', Date.now())
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`Page view: ${path}`)
    }
  }
}

// Global instance
export const errorTracker = new ErrorTracker()

// Health check utilities
export const healthCheck = {
  // Check if all critical services are working
  async checkHealth(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', checks: any[] }> {
    const checks = []
    
    try {
      // Check API connectivity
      const apiCheck = await fetch('/api/health', { 
        method: 'GET',
        timeout: 5000 as any
      }).then(res => ({ api: res.ok })).catch(() => ({ api: false }))
      
      checks.push(apiCheck)
    } catch (e) {
      checks.push({ api: false })
    }

    // Check local storage
    try {
      localStorage.setItem('health_check', 'test')
      localStorage.removeItem('health_check')
      checks.push({ localStorage: true })
    } catch (e) {
      checks.push({ localStorage: false })
    }

    // Check session storage
    try {
      sessionStorage.setItem('health_check', 'test')
      sessionStorage.removeItem('health_check')
      checks.push({ sessionStorage: true })
    } catch (e) {
      checks.push({ sessionStorage: false })
    }

    // Determine overall health
    const allHealthy = checks.every(check => Object.values(check)[0] === true)
    const someHealthy = checks.some(check => Object.values(check)[0] === true)
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (allHealthy) status = 'healthy'
    else if (someHealthy) status = 'degraded'
    else status = 'unhealthy'

    return { status, checks }
  },

  // Monitor memory usage
  getMemoryUsage() {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      const memory = (window as any).performance.memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      }
    }
    return null
  },

  // Check network status
  getNetworkStatus() {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      }
    }
    return { online: navigator?.onLine || true }
  }
}

// Export for manual initialization
export default errorTracker