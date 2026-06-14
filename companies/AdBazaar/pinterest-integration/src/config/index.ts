import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
  // Pinterest API Configuration
  pinterest: {
    appId: process.env.PINTEREST_APP_ID || '',
    appSecret: process.env.PINTEREST_APP_SECRET || '',
    accessToken: process.env.PINTEREST_ACCESS_TOKEN || '',
    redirectUri: process.env.PINTEREST_REDIRECT_URI || 'http://localhost:5095/api/auth/callback',
    apiUrl: process.env.PINTEREST_API_URL || 'https://api.pinterest.com/v5',
    oauthUrl: 'https://www.pinterest.com/oauth',
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '5095', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pinterest-integration',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
  },

  // Service Configuration
  service: {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
  },
};

export default config;
