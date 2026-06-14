export { connectMongoDB, disconnectMongoDB } from './mongodb.js';
export {
  getRedisClient,
  connectRedis,
  disconnectRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheClearPattern
} from './redis.js';
export { logger, logStream } from './logger.js';

// Environment configuration
export const config = {
  port: parseInt(process.env.PORT || '4128', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  agreementPrefix: process.env.AGREEMENT_PREFIX || 'AGREEMENT',
  pdfStoragePath: process.env.PDF_STORAGE_PATH || './storage/pdfs',
  company: {
    name: process.env.COMPANY_NAME || 'RisnaEstate',
    address: process.env.COMPANY_ADDRESS || 'India',
    phone: process.env.COMPANY_PHONE || '',
    email: process.env.COMPANY_EMAIL || '',
    website: process.env.COMPANY_WEBSITE || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
};
