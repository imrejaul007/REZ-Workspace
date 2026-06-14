import dotenv from 'dotenv';
dotenv.config();
export const config = {
  server: { port: parseInt(process.env.PORT || '4505', 10), host: process.env.HOST || '0.0.0.0', env: process.env.NODE_ENV || 'development' },
  mongodb: { uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/airzy-ai', options: { maxPoolSize: 10, minPoolSize: 2, serverSelectionTimeoutMS: 5000, socketTimeoutMS: 45000 } },
  redis: { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379', 10), password: process.env.REDIS_PASSWORD, db: parseInt(process.env.REDIS_DB || '0', 10), keyPrefix: 'airzy:ai:' },
  rateLimit: { windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10) },
  cors: { origin: process.env.CORS_ORIGIN?.split(',') || ['*'], credentials: process.env.CORS_CREDENTIALS === 'true' },
  logging: { level: process.env.LOG_LEVEL || 'info' },
  version: '1.0.0'
};
export default config;