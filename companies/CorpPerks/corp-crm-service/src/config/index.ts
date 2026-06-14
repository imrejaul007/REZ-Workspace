import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4725', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corp_crm',

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  services: {
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    rabtulPayment: process.env.RABTUL_PAYMENT_SERVICE_URL || 'http://localhost:4001',
    rabtulAuth: process.env.RABTUL_AUTH_SERVICE_URL || 'http://localhost:4002',
    corpIntel: process.env.CORP_INTEL_SERVICE_URL || 'http://localhost:4005',
    projectOS: process.env.PROJECT_OS_SERVICE_URL || 'http://localhost:4015',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};
