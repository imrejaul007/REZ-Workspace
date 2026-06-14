import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Service Identity
  serviceName: process.env.SERVICE_NAME || 'rez-inventory-alerts',
  serviceVersion: process.env.SERVICE_VERSION || '1.0.0',

  // Server
  port: parseInt(process.env.PORT || '4625', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || '/app/logs',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_inventory_alerts',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'rez_inventory_alerts',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || '',
  redisDb: parseInt(process.env.REDIS_DB || '0', 10),
  redisKeyPrefix: process.env.REDIS_KEY_PREFIX || 'rez:alerts:',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],

  // Rate Limiting
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Internal API
  internalApiKey: process.env.INTERNAL_API_KEY || '',

  // External Services
  sentryDsn: process.env.SENTRY_DSN || '',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',

  // Cache TTL
  cacheTtlShort: parseInt(process.env.CACHE_TTL_SHORT || '60', 10),
  cacheTtlMedium: parseInt(process.env.CACHE_TTL_MEDIUM || '300', 10),
  cacheTtlLong: parseInt(process.env.CACHE_TTL_LONG || '3600', 10),
};
