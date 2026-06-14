import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '5105', 10),
    env: process.env.NODE_ENV || 'development',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/social-competitor-tracker',
  },
  auth: {
    internalToken: process.env.INTERNAL_SERVICE_TOKEN || '',
    jwtSecret: process.env.JWT_SECRET || '',
  },
  api: {
    instagramApiKey: process.env.INSTAGRAM_API_KEY || '',
    facebookApiKey: process.env.FACEBOOK_API_KEY || '',
    twitterApiKey: process.env.TWITTER_API_KEY || '',
    linkedinApiKey: process.env.LINKEDIN_API_KEY || '',
    youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  snapshot: {
    intervalHours: parseInt(process.env.SNAPSHOT_INTERVAL_HOURS || '24', 10),
  },
} as const;

export type Config = typeof config;
