import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5090', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hashtag-research-engine',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  auth: {
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    apiGatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:4605',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cache: {
    trendingTtl: parseInt(process.env.CACHE_TTL_TRENDING || '300', 10),
    searchTtl: parseInt(process.env.CACHE_TTL_SEARCH || '60', 10),
  },

  externalApis: {
    instagramApiKey: process.env.INSTAGRAM_API_KEY || '',
    googleTrendsApiKey: process.env.GOOGLE_TRENDS_API_KEY || '',
  },
};