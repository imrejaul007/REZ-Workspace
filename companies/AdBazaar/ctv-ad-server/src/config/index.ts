import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4702', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ctv-ad-server',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
    expiresIn: '24h',
  },
  vast: {
    version: process.env.VAST_VERSION || '4.2',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  adDecision: {
    timeout: 100, // ms
    maxRetries: 3,
 defaultSkipOffset: 5, // seconds
  },
  pacing: {
    checkInterval: 60000, // 1 minute
    defaultDailyPacingPercent: 100,
  },
  frequency: {
    defaultWindowHours: 24,
    defaultMaxImpressions: 4,
  },
  metrics: {
    enabled: true,
    prefix: 'ctv_ad_server_',
  },
} as const;

export type Config = typeof config;
