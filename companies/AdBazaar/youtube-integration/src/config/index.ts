import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5094', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  youtube: {
    clientId: process.env.YOUTUBE_CLIENT_ID || '',
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET || '',
    apiKey: process.env.YOUTUBE_API_KEY || '',
    redirectUri: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5094/api/auth/callback',
  },

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-integration',
  },

  internal: {
    serviceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
  },

  log: {
    level: process.env.LOG_LEVEL || 'info',
  },

  youtubeScopes: [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtubepartner',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
};

export type Config = typeof config;