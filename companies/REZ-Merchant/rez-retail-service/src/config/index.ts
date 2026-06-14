import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4100', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-retail',
  jwt: {
    secret: process.env.JWT_SECRET || 'rez-retail-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logLevel: process.env.LOG_LEVEL || 'info',

  // Integration URLs
  integrations: {
    shopflow: process.env.SHOPFLOW_URL || 'http://localhost:4830',
    crm: process.env.CRM_SERVICE_URL || 'http://localhost:4101',
    loyalty: process.env.LOYALTY_SERVICE_URL || 'http://localhost:4102',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:4103',
    pos: process.env.POS_SERVICE_URL || 'http://localhost:4104',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4105',
    hojaiBrain: process.env.HOJAI_BRAIN_URL || 'http://localhost:4800',
    webhook: process.env.WEBHOOK_SERVICE_URL || 'http://localhost:4090',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4095',
  },

  // Internal service token
  internalToken: process.env.INTERNAL_SERVICE_TOKEN || 'rez-retail-internal-token',
};
