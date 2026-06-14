import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4006', 10),

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/corpperks',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Admin initial setup
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@corpperks.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
    company: process.env.ADMIN_COMPANY || 'CorpPerks',
  },

  // CorpID Integration (v2.0)
  corpId: {
    url: process.env.CORPID_SERVICE_URL || 'http://localhost:4702',
    internalToken: process.env.CORPID_INTERNAL_TOKEN || 'corpid-internal-token',
    timeout: parseInt(process.env.CORPID_TIMEOUT || '10000', 10),
    syncOnCreate: process.env.CORPID_SYNC_ON_CREATE !== 'false', // Default true
    syncOnUpdate: process.env.CORPID_SYNC_ON_UPDATE !== 'false', // Default true
    syncOnDelete: process.env.CORPID_SYNC_ON_DELETE !== 'false', // Default true
  },
};

export default config;
