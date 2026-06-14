import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4701', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ssai-service',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: '24h',
  },
  cdn: {
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.adbazaar.com',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;