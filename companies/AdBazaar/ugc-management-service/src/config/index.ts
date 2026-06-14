import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5101', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ugc_management'
  },

  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  },

  twitter: {
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET
  },

  facebook: {
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
    pageId: process.env.FACEBOOK_PAGE_ID
  },

  tiktok: {
    accessToken: process.env.TTIKTOK_ACCESS_TOKEN,
    appKey: process.env.TIKTOK_APP_KEY
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-token',

  externalServices: {
    auth: process.env.REZ_AUTH_SERVICE_URL || 'http://localhost:4002',
    notification: process.env.REZ_NOTIFICATION_SERVICE_URL || 'http://localhost:4011'
  }
};