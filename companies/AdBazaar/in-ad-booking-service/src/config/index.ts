/**
 * Configuration for in-ad-booking-service
 */

export const config = {
  port: parseInt(process.env.PORT || '4810', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/in-ad-booking',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  },
  rabtul: {
    walletUrl: process.env.RABTUL_WALLET_URL || 'http://localhost:4004',
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
};

export default config;
