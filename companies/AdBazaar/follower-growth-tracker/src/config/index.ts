import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5093', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/follower_growth_tracker',
  },
  instagram: {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
    businessAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '',
    apiUrl: 'https://graph.facebook.com/v18.0',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || '',
};
