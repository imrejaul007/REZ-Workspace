import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4007', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/rez-healthcare',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '24h',
  },

  internalServiceTokens: JSON.parse(
    process.env.INTERNAL_SERVICE_TOKENS_JSON || '{"intent-service":"token"}'
  ),

  rezMind: {
    apiUrl: process.env.REZ_MIND_API_URL || 'http://localhost:4005',
    apiKey: process.env.REZ_MIND_API_KEY || '',
  },

  telemedicine: {
    videoProvider: process.env.TELEMEDICINE_VIDEO_PROVIDER || 'default',
    apiKey: process.env.TELEMEDICINE_API_KEY || '',
    apiSecret: process.env.TELEMEDICINE_API_SECRET || '',
  },

  pharmacy: {
    inventorySyncEnabled: process.env.PHARMACY_INVENTORY_SYNC_ENABLED === 'true',
  },

  medicalRecords: {
    encryptionKey: process.env.MEDICAL_RECORDS_ENCRYPTION_KEY || '',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  },
};
