/**
 * CDN and asset optimization utilities
 * Handles dynamic asset URLs, preloading, and performance optimizations
 */

interface CDNConfig {
  baseUrl: string;
  imageUrl: string;
  staticUrl: string;
  apiUrl: string;
}

const CDN_CONFIG: CDNConfig = {
  baseUrl: process.env.CDN_URL || '',
  imageUrl: process.env.CDN_IMAGE_URL || process.env.CDN_URL || '',
  staticUrl: process.env.CDN_STATIC_URL || process.env.CDN_URL || '',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '',
};

/**
 * Get optimized asset URL with CDN support
 */
export function getAssetUrl(path: string, type: 'image' | 'static' | 'api' = 'static'): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  switch (type) {
    case 'image':
      return CDN_CONFIG.imageUrl ? `${CDN_CONFIG.imageUrl}/${cleanPath}` : `/${cleanPath}`;
    case 'api':
      return CDN_CONFIG.apiUrl ? `${CDN_CONFIG.apiUrl}/${cleanPath}` : `/${cleanPath}`;
    default:
      return CDN_CONFIG.staticUrl ? `${CDN_CONFIG.staticUrl}/${cleanPath}` : `/${cleanPath}`;
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getImageUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
    fit?: 'cover' | 'contain' | 'fill';
  } = {}
): string {
  if (!src) return '';

  // If it's already a full URL, return as is
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  const baseUrl = getAssetUrl(src, 'image');

  // For development or when no CDN transformations are available
  if (!CDN_CONFIG.imageUrl || process.env.NODE_ENV === 'development') {
    return baseUrl;
  }

  // Build query parameters for image transformations
  const params = new URLSearchParams();

  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('f', options.format);
  if (options.fit) params.append('fit', options.fit);

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Preload critical assets
 */
export function preloadAssets(assets: Array<{
  href: string;
  as: 'image' | 'script' | 'style' | 'font';
  type?: string;
  crossorigin?: boolean;
}>) {
  if (typeof window === 'undefined') return;

  assets.forEach((asset) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset.href;
    link.as = asset.as;

    if (asset.type) link.type = asset.type;
    if (asset.crossorigin) link.crossOrigin = 'anonymous';

    document.head.appendChild(link);
  });
}

/**
 * Prefetch resources for future navigation
 */
export function prefetchAssets(urls: string[]) {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Generate responsive image srcSet
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920],
  format: 'webp' | 'avif' | 'jpeg' = 'webp'
): string {
  return widths
    .map((width) => {
      const url = getImageUrl(src, { width, format, quality: 85 });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizes(breakpoints: Array<{
  condition: string;
  size: string;
}>): string {
  return breakpoints
    .map(({ condition, size }) => `${condition} ${size}`)
    .join(', ');
}

/**
 * Critical resource hints for performance
 */
export function addResourceHints() {
  if (typeof window === 'undefined') return;

  const hints = [
    // DNS prefetch for external domains
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },

    // Preconnect to critical origins
    { rel: 'preconnect', href: CDN_CONFIG.apiUrl, crossOrigin: true },
    { rel: 'preconnect', href: CDN_CONFIG.imageUrl, crossOrigin: true },
  ];

  hints.forEach(({ rel, href, crossOrigin }) => {
    if (!href) return;

    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Optimize asset loading strategy
 */
export class AssetLoadingStrategy {
  private loadedAssets = new Set<string>();
  private criticalAssets: string[] = [];

  constructor(criticalAssets: string[] = []) {
    this.criticalAssets = criticalAssets;
  }

  /**
   * Load critical assets immediately
   */
  loadCritical() {
    const criticalUrls = this.criticalAssets.map(asset => getAssetUrl(asset));
    preloadAssets(
      criticalUrls.map(href => ({
        href,
        as: this.getAssetType(href),
      }))
    );
  }

  /**
   * Load assets when they come into view
   */
  loadOnIntersection(elements: Element[], callback?: () => void) {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.getAttribute('data-src');

            if (src && !this.loadedAssets.has(src)) {
              element.setAttribute('src', src);
              element.removeAttribute('data-src');
              this.loadedAssets.add(src);
              observer.unobserve(element);
            }
          }
        });

        callback?.();
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /**
   * Preload assets for next page
   */
  preloadForRoute(route: string) {
    // Define route-specific assets
    const routeAssets: Record<string, string[]> = {
      '/jobs': ['/images/jobs-banner.jpg', '/scripts/jobs.js'],
      '/restaurants': ['/images/restaurant-banner.jpg', '/scripts/restaurants.js'],
      '/marketplace': ['/images/marketplace-banner.jpg', '/scripts/marketplace.js'],
    };

    const assets = routeAssets[route] || [];
    if (assets.length > 0) {
      prefetchAssets(assets.map(asset => getAssetUrl(asset)));
    }
  }

  private getAssetType(url: string): 'image' | 'script' | 'style' | 'font' {
    if (url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i)) return 'image';
    if (url.match(/\.(js)$/i)) return 'script';
    if (url.match(/\.(css)$/i)) return 'style';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'script';
  }
}

/**
 * Service Worker cache strategies
 */
export const CACHE_STRATEGIES = {
  CACHE_FIRST: 'CacheFirst',
  NETWORK_FIRST: 'NetworkFirst',
  STALE_WHILE_REVALIDATE: 'StaleWhileRevalidate',
  NETWORK_ONLY: 'NetworkOnly',
  CACHE_ONLY: 'CacheOnly',
} as const;

/**
 * Cache configuration for different asset types
 */
export const ASSET_CACHE_CONFIG = {
  images: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxEntries: 50,
    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
  },
  api: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  fonts: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxEntries: 10,
    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
  },
};

// Initialize resource hints
if (typeof window !== 'undefined') {
  addResourceHints();
}

export default {
  getAssetUrl,
  getImageUrl,
  preloadAssets,
  prefetchAssets,
  generateSrcSet,
  generateSizes,
  AssetLoadingStrategy,
  CACHE_STRATEGIES,
  ASSET_CACHE_CONFIG,
};