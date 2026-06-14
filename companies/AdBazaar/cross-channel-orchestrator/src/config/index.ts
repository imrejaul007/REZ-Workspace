import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment configuration
export const config = {
  // Application
  port: parseInt(process.env.PORT || '4812', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  serviceName: 'cross-channel-orchestrator',

  // MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cross-channel-orchestrator',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'cco:',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    algorithm: 'HS256',
  },

  // Channel Services
  channels: {
    whatsapp: {
      url: process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4071',
      apiKey: process.env.WHATSAPP_API_KEY || '',
      rateLimit: 100, // requests per second
      dailyLimit: 100000,
      costPerMessage: 0.05, // INR
    },
    sms: {
      url: process.env.SMS_SERVICE_URL || 'http://localhost:4072',
      apiKey: process.env.SMS_API_KEY || '',
      rateLimit: 200,
      dailyLimit: 500000,
      costPerMessage: 0.15, // INR
    },
    email: {
      url: process.env.EMAIL_SERVICE_URL || 'http://localhost:4073',
      apiKey: process.env.EMAIL_API_KEY || '',
      rateLimit: 50,
      dailyLimit: 50000,
      costPerMessage: 0.01, // INR
    },
    push: {
      url: process.env.PUSH_SERVICE_URL || 'http://localhost:4074',
      apiKey: process.env.PUSH_API_KEY || '',
      rateLimit: 500,
      dailyLimit: 1000000,
      costPerMessage: 0.02, // INR
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Campaign Settings
  campaign: {
    maxBudget: parseFloat(process.env.MAX_CAMPAIGN_BUDGET || '1000000'),
    defaultBudget: parseFloat(process.env.DEFAULT_CAMPAIGN_BUDGET || '10000'),
    maxChannels: 4,
    maxRecipientsPerBatch: 1000,
    metricsRetentionDays: 90,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },

  // Prometheus Metrics
  metrics: {
    enabled: true,
    prefix: 'cross_channel_orchestrator',
  },
};

// Validation helper
export function validateConfig(): void {
  const required = ['port', 'mongodb.uri', 'jwt.secret'];
  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config as Record<string, unknown>);
    if (value === undefined || value === '') {
      throw new Error(`Missing required config: ${key}`);
    }
  }
}

// Export channel configuration helper
export function getChannelConfig(channel: 'whatsapp' | 'sms' | 'email' | 'push') {
  return config.channels[channel];
}

export default config;