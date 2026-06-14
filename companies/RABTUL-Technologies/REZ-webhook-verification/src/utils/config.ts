/**
 * Configuration utilities
 */

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || '4034', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook-verification',

  // Redis
  REDIS_URL: process.env.REDIS_URL,

  // Security
  INTERNAL_SERVICE_TOKEN: process.env.INTERNAL_SERVICE_TOKEN,
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Retry settings
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  RETRY_BASE_DELAY_MS: parseInt(process.env.RETRY_BASE_DELAY_MS || '60000', 10),
  RETRY_MAX_DELAY_MS: parseInt(process.env.RETRY_MAX_DELAY_MS || '3600000', 10),

  // Cleanup
  EVENT_RETENTION_DAYS: parseInt(process.env.EVENT_RETENTION_DAYS || '30', 10),

  // Relay settings
  RELAY_TIMEOUT_MS: parseInt(process.env.RELAY_TIMEOUT_MS || '10000', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

export const isProduction = (): boolean => config.NODE_ENV === 'production';
export const isDevelopment = (): boolean => config.NODE_ENV === 'development';
export const isTest = (): boolean => config.NODE_ENV === 'test';
