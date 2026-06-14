/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip ESLint during production builds (style-only issues, not real bugs)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Skip TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  // Move to top-level — required by Next.js 14+
  serverExternalPackages: ['@prisma/client'],

  // SWC minification is the default in Next.js 14; no config needed

  // Experimental features for performance
  experimental: {
    // Optimize bundle splitting
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Optimize CSS
    optimizeCss: true,
  },

  // Enhanced image configuration
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: [
      'localhost',
      'restopapa-assets.s3.amazonaws.com',
      'images.unsplash.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    minimumCacheTTL: 86400, // 24 hours
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Build optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
        usedExports: true,
        // Optimize chunks
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Bundle analyzer (optional)
      if (process.env.ANALYZE === 'true') {
        const BundleAnalyzerPlugin = require('@next/bundle-analyzer')();
        config.plugins.push(new BundleAnalyzerPlugin.webpack.BundleAnalyzerPlugin());
      }
    }

    // Performance optimizations
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
    };

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    NEXT_PUBLIC_APP_NAME: 'RestoPapa',
  },

  // Optimized redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // Enhanced headers for performance and security
  async headers() {
    return [
      // Static assets caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Image optimization headers
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      // API routes headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      // General security headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Rewrites for API proxy (optional)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  // Compiler options
  compiler: {
    // Remove console statements in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // React optimization
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;