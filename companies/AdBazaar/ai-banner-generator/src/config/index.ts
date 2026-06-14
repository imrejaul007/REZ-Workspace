/**
 * Environment Configuration for AI Banner Generator
 */

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4840', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-banner-generator',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_ENABLED: process.env.OPENAI_ENABLED === 'true',

  // Image CDN
  IMAGE_CDN_URL: process.env.IMAGE_CDN_URL || 'https://cdn.adbazaar.com',
  IMAGE_CDN_UPLOAD_PATH: process.env.IMAGE_CDN_UPLOAD_PATH || '/banners',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Generation Settings
  MAX_GENERATION_TIME_MS: parseInt(process.env.MAX_GENERATION_TIME_MS || '60000', 10),
  DEFAULT_FORMAT: 'static',
  DEFAULT_STYLE: 'modern',

  // Banner Sizes (standard IAB sizes)
  BANNER_SIZES: {
    leaderboard: { width: 728, height: 90 },
    mediumRectangle: { width: 300, height: 250 },
    wideSkyscraper: { width: 160, height: 600 },
    halfPage: { width: 300, height: 600 },
    largeRectangle: { width: 336, height: 280 },
    mobileLeaderboard: { width: 320, height: 50 },
    largeMobileBanner: { width: 320, height: 100 },
    billboard: { width: 970, height: 250 },
    portrait: { width: 768, height: 1024 },
    square: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 },
  },

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS ||
    'https://rez.money,https://admin.rez.money,https://ads.rez.money,https://adbazaar.com'
  ).split(','),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;

export default config;
