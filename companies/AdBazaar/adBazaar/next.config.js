/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ADS_SERVICE_URL: process.env.ADS_SERVICE_URL || 'http://localhost:4000',
  },
}

module.exports = nextConfig
