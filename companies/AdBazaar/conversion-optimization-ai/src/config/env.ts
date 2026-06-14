/**
 * Environment configuration
 */

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4820', 10),

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/conversion-optimization-ai',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_KEY_PREFIX: 'conversion-ai:',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
  JWT_EXPIRES_IN: '24h',

  // REZ Services
  REZ_ADS_SERVICE_URL: process.env.REZ_ADS_SERVICE_URL || 'http://localhost:4007',

  // CORS
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'https://rez.money,https://admin.rez.money,https://ads.rez.money').split(','),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

  // AI Optimization Settings
  OPTIMIZATION: {
    MIN_CONFIDENCE_THRESHOLD: 0.7,
    MAX_BID_INCREASE_PERCENT: 25,
    MAX_BID_DECREASE_PERCENT: 30,
    OPTIMIZATION_INTERVAL_MS: parseInt(process.env.OPTIMIZATION_INTERVAL_MS || '300000', 10), // 5 minutes
    HISTORICAL_DATA_DAYS: parseInt(process.env.HISTORICAL_DATA_DAYS || '30', 10),
    MIN_SAMPLE_SIZE: 100,
    BID_ADJUSTMENT_COOLDOWN_MS: parseInt(process.env.BID_ADJUSTMENT_COOLDOWN_MS || '3600000', 10), // 1 hour
  },

  // Cache TTL (seconds)
  CACHE_TTL: {
    RECOMMENDATIONS: 300,      // 5 minutes
    BID_RECOMMENDATIONS: 60,   // 1 minute
    INSIGHTS: 600,            // 10 minutes
    CAMPAIGN_METRICS: 120,     // 2 minutes
  },

  // Prometheus metrics
  METRICS_ENABLED: process.env.METRICS_ENABLED !== 'false',
  METRICS_PATH: '/metrics',
};

export type Config = typeof config;