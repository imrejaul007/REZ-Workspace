/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_REFERRAL_API_URL: process.env.NEXT_PUBLIC_REFERRAL_API_URL || 'http://localhost:4019',
  },
};

module.exports = nextConfig;
