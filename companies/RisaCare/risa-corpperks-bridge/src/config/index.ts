import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '4761', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/risa-corpperks-bridge',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'default-internal-token',
  corpPerksUrl: process.env.CORPPERKS_API_URL || 'http://localhost:4002',
  risaCareUrl: process.env.RISACARE_API_URL || 'http://localhost:4700',
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};
