import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4601', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/adbazzaar_pmp',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'pmp-invite-service-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'adbazzaar',
    audience: 'pmp-service',
  },

  invite: {
    defaultExpiryDays: parseInt(process.env.INVITE_EXPIRY_DAYS || '7', 10),
    maxExpiryDays: parseInt(process.env.INVITE_MAX_EXPIRY_DAYS || '30', 10),
  },

  metrics: {
    enabled: process.env.METRICS_ENABLED !== 'false',
    prefix: 'pmp_invite_',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    credentials: true,
  },
} as const;

export type Config = typeof config;