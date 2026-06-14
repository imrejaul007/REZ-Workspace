import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram-shop',
  },

  instagram: {
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    catalogId: process.env.INSTAGRAM_CATALOG_ID || '',
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    appId: process.env.FACEBOOK_APP_ID || '',
    appSecret: process.env.FACEBOOK_APP_SECRET || '',
    apiVersion: process.env.INSTAGRAM_API_VERSION || 'v18.0',
  },

  webhook: {
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN || '',
    callbackUrl: process.env.WEBHOOK_CALLBACK_URL || '',
  },

  internal: {
    serviceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export type Config = typeof config;
