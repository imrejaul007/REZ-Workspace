import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4815', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ledgerai',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'ledgerai-dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  ai: {
    model: process.env.AI_MODEL || 'together/mistral-7b',
    apiKey: process.env.AI_API_KEY || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  integrations: {
    webhookServiceUrl: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',
    hojaiUrl: process.env.HOJAI_URL || 'http://localhost:4800',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095',
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'hojai-dev-token',
  },
};

export default config;