/**
 * Configuration for AI Front Desk Service
 */

export const config = {
  port: parseInt(process.env.PORT || '3800', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-front-desk',
  },
  hojai: {
    staybotUrl: process.env.HOJAI_STAYBOT_URL || 'http://localhost:4840',
  },
  rez: {
    authUrl: process.env.REZ_AUTH_URL || 'http://localhost:4002',
    stayownUrl: process.env.REZ_STAYOWN_URL || 'http://localhost:4015',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

export default config;