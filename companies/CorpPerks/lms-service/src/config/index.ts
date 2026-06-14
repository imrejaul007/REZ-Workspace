import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4734', 10),

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lms_service',

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
};

export default config;
