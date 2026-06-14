/** @type {import('next').NextConfig} */

// Security headers for production
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
  }
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['recharts', 'lucide-react'],
  // Security: Expose only necessary environment variables to client
  env: {
    NEXT_PUBLIC_API_GATEWAY_URL: process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600',
    NEXT_PUBLIC_RIDE_SERVICE_URL: process.env.NEXT_PUBLIC_RIDE_SERVICE_URL || 'http://localhost:4601',
    NEXT_PUBLIC_FLEET_SERVICE_URL: process.env.NEXT_PUBLIC_FLEET_SERVICE_URL || 'http://localhost:4602',
    NEXT_PUBLIC_DELIVERY_SERVICE_URL: process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || 'http://localhost:4603',
    NEXT_PUBLIC_MAPS_API_KEY: process.env.NEXT_PUBLIC_MAPS_API_KEY || '',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
