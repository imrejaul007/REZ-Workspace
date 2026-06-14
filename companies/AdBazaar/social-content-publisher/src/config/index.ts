import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5083', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/social-content-publisher',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  postgresUrl: process.env.POSTGRES_URL || '',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  hojai: {
    apiUrl: process.env.HOJAI_API_URL || 'http://localhost:4800',
    apiKey: process.env.HOJAI_API_KEY || '',
  },
  rabtul: {
    authUrl: process.env.RABTUL_AUTH_URL || 'http://localhost:4002',
  },
  platforms: {
    instagram: {
      accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    },
    facebook: {
      accessToken: process.env.FACEBOOK_ACCESS_TOKEN || '',
    },
    twitter: {
      apiKey: process.env.TWITTER_API_KEY || '',
      apiSecret: process.env.TWITTER_API_SECRET || '',
    },
    linkedin: {
      accessToken: process.env.LINKEDIN_ACCESS_TOKEN || '',
    },
    tiktok: {
      accessToken: process.env.TIKTOK_ACCESS_TOKEN || '',
    },
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY || '',
    },
    pinterest: {
      accessToken: process.env.PINTEREST_ACCESS_TOKEN || '',
    },
  },
};

export default config;