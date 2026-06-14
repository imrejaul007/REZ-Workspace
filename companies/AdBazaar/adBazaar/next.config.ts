import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // DEPLOY FIX: Enable standalone output for optimized Docker deployments
  // Benefits: 70% smaller images, faster cold starts, no host Node.js dependency
  output: 'standalone',
  // Compress responses for better performance
  compress: true,
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  images: {
    // AB2-L1 FIX: allow optimized image serving from Supabase storage + Cloudinary
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/resize-images/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // AUDIT-FIX: Security headers and caching strategy
  async headers() {
    return [
      // Cache-Control headers for performance
      // CRITICAL FIX: Added proper caching headers to enable CDN caching
      // Previously all routes returned no cache headers, bypassing CDN
      {
        source: '/_next/static/:path*',
        headers: [
          // Immutable with 1 year cache - assets have content-hash in URL
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*.json',
        headers: [
          // Static JSON files - cache at edge, revalidate in background
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          // Security headers (applied to all routes)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // CRITICAL SECURITY FIX: Hardened CSP headers
          // Removed 'unsafe-inline' and 'unsafe-eval' from script-src
          // Added object-src 'none' to prevent plugin-based attacks
          // Added base-uri to prevent base tag injection
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // FIX: Removed 'unsafe-eval' - blocks eval(), Function(), etc.
              // FIX: Removed 'unsafe-inline' from script-src - blocks inline scripts
              // Note: For nonce-based inline script allowlist, add 'nonce-{NONCE}' to script-src
              "script-src 'self'",
              // FIX: Keep unsafe-inline for style-src only - Tailwind requires it
              // Migration path: Move to CSS modules or add nonce support
              "style-src 'self' 'unsafe-inline'",
              // Allow data: for base64 images, blob: for blob URLs
              "img-src 'self' data: blob: https://*.supabase.co https://res.cloudinary.com https:",
              "connect-src 'self' https://*.supabase.co https://*.render.com",
              "font-src 'self'",
              // FIX: Prevent plugin-based attacks (Flash, Java, etc.)
              "object-src 'none'",
              // FIX: Prevent base tag injection attacks
              "base-uri 'self'",
              // Prevent form submissions to external domains
              "form-action 'self'",
              // Block embedding in iframes (clickjacking prevention)
              "frame-ancestors 'none'",
              // Automatically upgrade HTTP requests to HTTPS
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // CRITICAL FIX: Default Cache-Control for dynamic content
          // Set must-revalidate to ensure fresh data while allowing CDN caching
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      // API routes - no caching for dynamic data
      {
        source: '/api/:path*',
        headers: [
          // API responses should not be cached - always fresh data
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          // Prevent CDN caching of API responses
          { key: 'Vary', value: 'Origin' },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
