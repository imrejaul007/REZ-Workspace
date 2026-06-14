import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5110', 10),
  env: process.env.NODE_ENV || 'development',

  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    redirectUri: process.env.REDDIT_REDIRECT_URI || 'http://localhost:5110/api/auth/callback',
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    baseUrl: 'https://oauth.reddit.com',
    userAgent: 'AdBazaar/1.0.0 (Marketing Platform)',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/reddit-integration',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'internal-service-token',
  },

  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export const isProduction = config.env === 'production';
export const isDevelopment = config.env === 'development';