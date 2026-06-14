import { z } from 'zod';

// Environment config schema
const envSchema = z.object({
  PORT: z.string().default('5001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // MongoDB
  MONGODB_URI: z.string().default('mongodb://localhost:27017/publisher_dashboard'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),

  // Services
  INTERNAL_SERVICE_TOKEN: z.string().default('internal-service-token'),

  // Cache TTL (seconds)
  CACHE_TTL_SHORT: z.string().default('60'),
  CACHE_TTL_MEDIUM: z.string().default('300'),
  CACHE_TTL_LONG: z.string().default('3600'),

  // Rate limiting
  RATE_LIMIT_WINDOW: z.string().default('60000'),
  RATE_LIMIT_MAX: z.string().default('100'),
});

// Parse environment variables
const env = {
  PORT: process.env.PORT || '5001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/publisher_dashboard',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || '6379',
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token',
  CACHE_TTL_SHORT: process.env.CACHE_TTL_SHORT || '60',
  CACHE_TTL_MEDIUM: process.env.CACHE_TTL_MEDIUM || '300',
  CACHE_TTL_LONG: process.env.CACHE_TTL_LONG || '3600',
  RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '60000',
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '100',
};

export const config = {
  app: {
    port: parseInt(env.PORT, 10),
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  database: {
    mongo: {
      uri: env.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
  },
  redis: {
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    password: env.REDIS_PASSWORD,
  },
  cache: {
    ttl: {
      short: parseInt(env.CACHE_TTL_SHORT, 10),
      medium: parseInt(env.CACHE_TTL_MEDIUM, 10),
      long: parseInt(env.CACHE_TTL_LONG, 10),
    },
  },
  security: {
    internalServiceToken: env.INTERNAL_SERVICE_TOKEN,
  },
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW, 10),
    max: parseInt(env.RATE_LIMIT_MAX, 10),
  },
};

export type Config = typeof config;
export default config;