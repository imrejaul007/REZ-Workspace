/**
 * DPA Engine Configuration
 * Environment variables and app settings
 */

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4841', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/dynamic-product-ad',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dpa-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // CDN
  IMAGE_CDN_URL: process.env.IMAGE_CDN_URL || 'https://cdn.adbazaar.com',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ||
    'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),

  // DPA Settings
  DPA: {
    DEFAULT_AD_WIDTH: 1200,
    DEFAULT_AD_HEIGHT: 628,
    MAX_PRODUCTS_PER_FEED: parseInt(process.env.MAX_PRODUCTS_PER_FEED || '50000', 10),
    MAX_CAMPAIGNS_PER_ADVERTISER: parseInt(process.env.MAX_CAMPAIGNS_PER_ADVERTISER || '100', 10),
    PREVIEW_CACHE_TTL: parseInt(process.env.PREVIEW_CACHE_TTL || '3600', 10), // 1 hour
    RENDER_CACHE_TTL: parseInt(process.env.RENDER_CACHE_TTL || '300', 10), // 5 min
    SYNC_INTERVAL_HOURS: parseInt(process.env.SYNC_INTERVAL_HOURS || '24', 10),
  },

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

export type Config = typeof config;

export default config;