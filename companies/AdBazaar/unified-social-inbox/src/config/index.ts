import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5102', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/unified_social_inbox',
  },

  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    appSecret: process.env.INSTAGRAM_APP_SECRET,
    apiUrl: 'https://graph.instagram.com',
  },

  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
    apiUrl: 'https://api.twitter.com/2',
  },

  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
    apiUrl: 'https://api.linkedin.com/v2',
  },

  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    apiUrl: 'https://graph.facebook.com/v18.0',
  },

  facebook: {
    accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    apiUrl: 'https://graph.facebook.com/v18.0',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  socket: {
    port: parseInt(process.env.SOCKET_PORT || '5103', 10),
  },

  auth: {
    serviceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4002',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
