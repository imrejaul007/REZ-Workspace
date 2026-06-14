import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5104', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/snapchat_integration',
  },

  snapchat: {
    apiUrl: process.env.SNAPCHAT_API_URL || 'https://adsapi.snapchat.com/v1',
    oauthUrl: process.env.SNAPCHAT_OAUTH_URL || 'https://accounts.snapchat.com/login/oauth2',
    clientId: process.env.SNAPCHAT_CLIENT_ID || '',
    clientSecret: process.env.SNAPCHAT_CLIENT_SECRET || '',
    accessToken: process.env.SNAPCHAT_ACCESS_TOKEN || '',
    redirectUrl: process.env.OAUTH_REDIRECT_URL || 'http://localhost:5104/api/auth/callback',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'snapchat-integration-secret',
  },

  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
};
