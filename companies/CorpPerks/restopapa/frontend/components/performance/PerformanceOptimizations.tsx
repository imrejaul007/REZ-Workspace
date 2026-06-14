import { logger } from ;
'use client'

import { useEffect } from 'react'

// Performance optimization component
export function PerformanceOptimizations() {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload key routes
      const criticalRoutes = [
        '/dashboard/admin',
        '/dashboard/restaurant', 
        '/dashboard/employee',
        '/marketplace',
        '/jobs',
        '/community'
      ]
      
      criticalRoutes.forEach(route => {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.href = route
        document.head.appendChild(link)
      })
    }

    // Optimize images loading
    const optimizeImages = () => {
      const images = document.querySelectorAll('img[data-src]')
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            img.removeAttribute('data-src')
            imageObserver.unobserve(img)
          }
        })
      })
      
      images.forEach(img => imageObserver.observe(img))
    }

    // Defer non-critical JavaScript
    const deferNonCriticalJS = () => {
      const scripts = document.querySelectorAll('script[data-defer]')
      scripts.forEach(script => {
        setTimeout(() => {
          const newScript = document.createElement('script')
          newScript.src = script.getAttribute('src') || ''
          newScript.async = true
          document.head.appendChild(newScript)
        }, 100)
      })
    }

    // Run optimizations after initial render
    requestIdleCallback(() => {
      preloadCriticalResources()
      optimizeImages()
      deferNonCriticalJS()
    })

    // Cleanup function
    return () => {
      // Remove preload links to prevent memory leaks
      const preloadLinks = document.querySelectorAll('link[rel="prefetch"]')
      preloadLinks.forEach(link => link.remove())
    }
  }, [])

  return null // This component doesn't render anything
}

// Web Vitals monitoring
export function WebVitalsMonitor() {
  useEffect(() => {
    // Only load in production
    if (process.env.NODE_ENV !== 'production') return

    const reportWebVitals = (metric: any) => {
      // Log to console in development, send to analytics in production
      logger.info(metric)
      
      // Send to analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
        })
      }
    }

    // Dynamic import for web-vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals)
      getFID(reportWebVitals)
      getFCP(reportWebVitals)
      getLCP(reportWebVitals)
      getTTFB(reportWebVitals)
    }).catch(console.error)
  }, [])

  return null
}

// Service Worker registration
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            logger.info('SW registered: ', registration)
          })
          .catch((registrationError) => {
            logger.info('SW registration failed: ', registrationError)
          })
      })
    }
  }, [])

  return null
}