import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-restaurant-analytics',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '24h',
  },

  internalServiceTokens: JSON.parse(
    process.env.INTERNAL_SERVICE_TOKENS_JSON || '{}'
  ),

  analytics: {
    // Cache durations in seconds
    cacheDurations: {
      revenueSummary: 300,      // 5 minutes
      customerMetrics: 600,     // 10 minutes
      menuAnalytics: 300,       // 5 minutes
      trendData: 900,           // 15 minutes
    },

    // Aggregation settings
    aggregation: {
      defaultTimezone: 'UTC',
      maxDateRangeDays: 365,
      defaultPageSize: 50,
      maxPageSize: 500,
    },
  },

  // Report retention (days)
  reportRetention: {
    daily: 90,
    weekly: 365,
    monthly: 730,
  },
} as const;

export type Config = typeof config;
