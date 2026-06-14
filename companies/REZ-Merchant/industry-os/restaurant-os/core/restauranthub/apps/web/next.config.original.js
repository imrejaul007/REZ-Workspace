/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // CDN and asset prefix configuration
  assetPrefix: process.env.CDN_URL || '',

  // Image optimization with enhanced settings
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: [
      'localhost',
      'restopapa-assets.s3.amazonaws.com',
      'images.unsplash.com',
      'cdn.restopapa.com',
      'assets.restopapa.com',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800, // 7 days for better caching
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    loader: 'default',
    unoptimized: false,
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Bundle analyzer in development
    if (dev && !isServer) {
      config.resolve.fallback = { fs: false, net: false, tls: false };
    }

    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxSize: 244000, // 244KB chunks for better caching
        cacheGroups: {
          // Core framework libraries
          framework: {
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            name: 'framework',
            chunks: 'all',
            priority: 40,
            enforce: true,
          },
          // UI libraries (shadcn, radix, etc.)
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|@headlessui|lucide-react|framer-motion)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 30,
            enforce: true,
          },
          // Jobs-specific components
          jobs: {
            test: /[\\/](components|lib)[\\/].*jobs.*[\\/]/,
            name: 'jobs',
            chunks: 'all',
            priority: 25,
            minSize: 20000,
          },
          // Form libraries
          forms: {
            test: /[\\/]node_modules[\\/](react-hook-form|zod|@hookform)[\\/]/,
            name: 'forms',
            chunks: 'all',
            priority: 20,
          },
          // Vendor libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            minSize: 30000,
          },
          // Common shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            minSize: 20000,
            enforce: true,
          },
        },
      };

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    // Alias optimizations for smaller bundles
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use lighter lodash imports
      'lodash': 'lodash-es',
    };

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'RestoPapa',
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // Security and performance headers with CDN optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000', // 30 days
          },
          {
            key: 'Vary',
            value: 'Accept',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000', // 1 year
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;