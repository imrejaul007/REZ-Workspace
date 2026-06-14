import logger from './utils/logger';

// CDN optimization utilities for RestoPapa

export interface CDNConfig {
  baseUrl: string;
  regions: string[];
  cacheTTL: number;
  compressionEnabled: boolean;
  imageOptimization: boolean;
}

export interface AssetOptimization {
  minify: boolean;
  compress: boolean;
  version: string;
  format?: 'webp' | 'avif' | 'auto';
  quality?: number;
}

export class CDNOptimizer {
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
  }

  /**
   * Generate optimized asset URL with CDN parameters
   */
  getAssetUrl(
    path: string,
    optimization: AssetOptimization = { minify: true, compress: true, version: 'latest' }
  ): string {
    const { baseUrl } = this.config;
    const params = new URLSearchParams();

    // Add optimization parameters
    if (optimization.minify) params.append('min', '1');
    if (optimization.compress) params.append('compress', '1');
    if (optimization.version) params.append('v', optimization.version);
    if (optimization.format) params.append('format', optimization.format);
    if (optimization.quality) params.append('q', optimization.quality.toString());

    const queryString = params.toString();
    return `${baseUrl}${path}${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Generate responsive image URLs for different screen sizes
   */
  getResponsiveImageUrls(imagePath: string, sizes: number[] = [320, 640, 1024, 1920]): Array<{
    src: string;
    width: number;
    media?: string;
  }> {
    return sizes.map((width, index) => ({
      src: this.getAssetUrl(imagePath, {
        minify: true,
        compress: true,
        version: 'latest',
        format: 'auto',
        quality: width > 1024 ? 85 : 75, // Higher quality for larger images
      }) + `&w=${width}`,
      width,
      media: index < sizes.length - 1 ? `(max-width: ${sizes[index + 1] - 1}px)` : undefined,
    }));
  }

  /**
   * Preload critical assets
   */
  preloadAssets(assets: string[]): void {
    if (typeof window === 'undefined') return;

    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = this.getAssetUrl(asset);

      // Determine asset type
      if (asset.match(/\.(js|mjs)$/)) {
        link.as = 'script';
      } else if (asset.match(/\.css$/)) {
        link.as = 'style';
      } else if (asset.match(/\.(woff2|woff|ttf)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      } else if (asset.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
        link.as = 'image';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch resources for faster navigation
   */
  prefetchResources(resources: string[]): void {
    if (typeof window === 'undefined') return;

    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = this.getAssetUrl(resource);
      document.head.appendChild(link);
    });
  }

  /**
   * Generate service worker cache strategies
   */
  generateCacheStrategies(): unknown {
    return {
      // Cache static assets with long TTL
      staticAssets: {
        urlPattern: new RegExp(`^${this.config.baseUrl}/static/`),
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets-v1',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          cacheKeyWillBeUsed: async ({ request }) => {
            // Remove query parameters for consistent caching
            const url = new URL(request.url);
            const cacheKey = `${url.origin}${url.pathname}`;
            return cacheKey;
          },
        },
      },

      // Cache images with stale-while-revalidate
      images: {
        urlPattern: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images-v1',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },

      // Cache API responses with network first strategy
      api: {
        urlPattern: /\/api\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-responses-v1',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
        },
      },

      // Cache CSS and JS with stale-while-revalidate
      assets: {
        urlPattern: /\.(css|js|mjs)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'assets-v1',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60, // 1 day
          },
        },
      },
    };
  }

  /**
   * Generate critical resource hints
   */
  generateResourceHints(): Array<{
    rel: string;
    href: string;
    as?: string;
    crossOrigin?: string;
  }> {
    const hints = [];

    // DNS prefetch for CDN
    hints.push({
      rel: 'dns-prefetch',
      href: new URL(this.config.baseUrl).origin,
    });

    // Preconnect to CDN
    hints.push({
      rel: 'preconnect',
      href: new URL(this.config.baseUrl).origin,
      crossOrigin: 'anonymous',
    });

    return hints;
  }
}

/**
 * Performance monitoring for CDN assets
 */
export class CDNPerformanceMonitor {
  private loadTimes: Map<string, number> = new Map();
  private failedRequests: Set<string> = new Set();

  /**
   * Track asset load performance
   */
  trackAssetLoad(url: string, loadTime: number): void {
    this.loadTimes.set(url, loadTime);

    // Report to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cdn_asset_load', {
        event_category: 'Performance',
        event_label: url,
        value: Math.round(loadTime),
      });
    }
  }

  /**
   * Track failed requests
   */
  trackFailedRequest(url: string): void {
    this.failedRequests.add(url);

    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cdn_asset_error', {
        event_category: 'Error',
        event_label: url,
      });
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    averageLoadTime: number;
    totalRequests: number;
    failedRequests: number;
    successRate: number;
  } {
    const totalRequests = this.loadTimes.size + this.failedRequests.size;
    const successfulRequests = this.loadTimes.size;
    const averageLoadTime = successfulRequests > 0
      ? Array.from(this.loadTimes.values()).reduce((a, b) => a + b, 0) / successfulRequests
      : 0;

    return {
      averageLoadTime,
      totalRequests,
      failedRequests: this.failedRequests.size,
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    };
  }
}

/**
 * Image optimization utilities
 */
export class ImageOptimizer {
  private cdnOptimizer: CDNOptimizer;

  constructor(cdnOptimizer: CDNOptimizer) {
    this.cdnOptimizer = cdnOptimizer;
  }

  /**
   * Generate optimized image with multiple formats and sizes
   */
  generateOptimizedImage(src: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}): {
    src: string;
    srcSet: string;
    sizes: string;
  } {
    const { width = 800, height, quality = 75, format = 'auto', fit = 'cover' } = options;

    // Generate different sizes for responsive images
    const sizes = [width * 0.5, width, width * 1.5, width * 2].map(w => Math.round(w));

    const srcSet = sizes.map(w => {
      const h = height ? Math.round((height * w) / width) : undefined;
      const params = new URLSearchParams({
        w: w.toString(),
        ...(h && { h: h.toString() }),
        q: quality.toString(),
        f: format,
        fit,
      });

      return `${this.cdnOptimizer.getAssetUrl(src)}?${params.toString()} ${w}w`;
    }).join(', ');

    return {
      src: this.cdnOptimizer.getAssetUrl(src, {
        minify: true,
        compress: true,
        version: 'latest',
        format,
        quality,
      }),
      srcSet,
      sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    };
  }

  /**
   * Generate placeholder for lazy loading
   */
  generatePlaceholder(src: string, width: number = 40, height: number = 30): string {
    const params = new URLSearchParams({
      w: width.toString(),
      h: height.toString(),
      q: '10',
      blur: '5',
      f: 'webp',
    });

    return `${this.cdnOptimizer.getAssetUrl(src)}?${params.toString()}`;
  }
}

// Default CDN configuration
export const defaultCDNConfig: CDNConfig = {
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.restopapa.com',
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  cacheTTL: 86400, // 24 hours
  compressionEnabled: true,
  imageOptimization: true,
};

// Initialize CDN optimizer
export const cdnOptimizer = new CDNOptimizer(defaultCDNConfig);

// Initialize performance monitor
export const cdnPerformanceMonitor = new CDNPerformanceMonitor();

// Initialize image optimizer
export const imageOptimizer = new ImageOptimizer(cdnOptimizer);

// Utility functions
export const preloadCriticalAssets = () => {
  const criticalAssets = [
    '/css/critical.css',
    '/js/runtime.js',
    '/js/vendor.js',
    '/fonts/inter-var.woff2',
  ];

  cdnOptimizer.preloadAssets(criticalAssets);
};

export const prefetchRouteAssets = (route: string) => {
  const routeAssets = [
    `/js/pages${route}.js`,
    `/css/pages${route}.css`,
  ];

  cdnOptimizer.prefetchResources(routeAssets);
};

// Performance monitoring hook for React components
export const useCDNPerformance = () => {
  const trackAssetLoad = (url: string, loadTime: number) => {
    cdnPerformanceMonitor.trackAssetLoad(url, loadTime);
  };

  const trackFailedRequest = (url: string) => {
    cdnPerformanceMonitor.trackFailedRequest(url);
  };

  const getMetrics = () => {
    return cdnPerformanceMonitor.getMetrics();
  };

  return { trackAssetLoad, trackFailedRequest, getMetrics };
};

// Service Worker registration helper
export const registerServiceWorkerWithCDN = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Update cache strategies with CDN configuration
      const strategies = cdnOptimizer.generateCacheStrategies();

      // Send cache strategies to service worker
      registration.active?.postMessage({
        type: 'CACHE_STRATEGIES',
        strategies,
      });

      logger.info('Service Worker registered with CDN optimization');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};